import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getPublicProfile,
	updateUserProfile,
	saveAvatar,
	removeAvatar,
	saveBanner,
	removeBanner,
	updateUserColors,
	updateUserSettings
} from '$lib/server/auth';
import { listResources } from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ params, locals }) => {
	const profile = await getPublicProfile(params.id);

	if (!profile) {
		throw error(404, 'Profile not found');
	}

	const submittedResources = await listResources({
		createdByUserId: profile.id,
		limit: 12,
		includePendingForUserId: locals.user?.id === profile.id ? profile.id : null
	});

	return {
		profile,
		isOwnProfile: locals.user?.id === profile.id,
		ownEmail: locals.user?.id === profile.id ? locals.user.email : null,
		canEditEmail: locals.user?.role === 'admin',
		submittedResources
	};
};

export const actions: Actions = {
	updateField: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });

		const { request, locals, params } = event;
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const field = String(form.get('field') ?? '');

		if (field === 'email') {
			if (locals.user.role !== 'admin') {
				return fail(403, { field, error: 'Only admins can change email addresses.' });
			}

			const result = await updateUserProfile(locals.user.id, {
				email: String(form.get('value') ?? ''),
				firstName: locals.user.firstName,
				lastName: locals.user.lastName
			});
			if (!result.ok) {
				return fail(result.reason === 'email_taken' ? 409 : 400, {
					field,
					error: result.reason === 'email_taken'
						? 'Email already taken.'
						: 'Enter a valid email.'
				});
			}
			locals.user = result.user;
			return { field, value: result.user.email };
		}

		if (field === 'firstName' || field === 'lastName') {
			const result = await updateUserProfile(locals.user.id, {
				email: locals.user.email,
				firstName: field === 'firstName' ? String(form.get('value') ?? '') : locals.user.firstName,
				lastName: field === 'lastName' ? String(form.get('value') ?? '') : locals.user.lastName
			});
			if (!result.ok) {
				return fail(400, { field, error: 'Enter a valid name.' });
			}
			locals.user = result.user;
			return { field, value: field === 'firstName' ? result.user.firstName : result.user.lastName };
		}

		return fail(400, { field, error: 'Unknown field.' });
	},

	updateColor: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });

		const { request, locals, params } = event;
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const colorField = String(form.get('colorField') ?? '');
		const value = String(form.get('value') ?? '');

		const accentColor = colorField === 'accentColor' ? value : (locals.user.accentColor ?? '#2563eb');
		const avatarBackgroundColor = colorField === 'avatarBackgroundColor' ? value : (locals.user.avatarBackgroundColor ?? '#2563eb');

		const result = await updateUserColors(locals.user.id, {
			accentColor,
			avatarBackgroundColor
		});

		if (!result.ok) {
			return fail(400, { error: 'Could not update colors.' });
		}

		locals.user = { ...locals.user, accentColor, avatarBackgroundColor };
		return { colorField, value };
	},

	updateAvatar: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });

		const { request, locals, params } = event;
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const remove = form.get('remove');
		const avatarShape = String(form.get('avatarShape') ?? '');

		if (remove === '1') {
			const result = await removeAvatar(locals.user.id);
			if (!result.ok) {
				return fail(400, { error: 'Could not remove picture.' });
			}
			locals.user = { ...locals.user, profilePictureUrl: null };
			return { avatarRemoved: true };
		}

		const file = form.get('avatar');
		if (!(file instanceof File) || !file.size) {
			return fail(400, { error: 'Select an image to upload.' });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
			const result = await saveAvatar(locals.user.id, buffer, file.type);

			if (!result.ok) {
				const messages: Record<string, string> = {
					invalid_type: 'Use a PNG, JPEG, or WebP image.',
					too_large: 'Image must be under 4 MB.',
					rate_limited: 'Please wait before uploading another profile picture.'
				};
				return fail(400, { error: messages[result.reason] ?? 'Could not upload.' });
			}

		if (avatarShape === 'rounded-xl' || avatarShape === 'rounded-full') {
			await updateUserSettings(locals.user.id, { avatarShape });
		}

		return { avatarUpdated: true, newFilename: result.filename };
	},

	updateAvatarShape: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });

		const { request, locals, params } = event;
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const value = String(form.get('value') ?? '') as string;

		if (value !== 'rounded-xl' && value !== 'rounded-full') {
			return fail(400, { error: 'Invalid avatar shape.' });
		}

		const result = await updateUserSettings(locals.user.id, { avatarShape: value });
		if (!result.ok) {
			return fail(400, { error: 'Could not update avatar shape.' });
		}
		
		return { avatarShape: value };
	},


	updateBanner: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });

		const { request, locals, params } = event;
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const remove = form.get('remove');

		if (remove === '1') {
			const result = await removeBanner(locals.user.id);
			if (!result.ok) return fail(400, { error: 'Could not remove banner.' });
			return { bannerRemoved: true };
		}

		const file = form.get('banner');
		if (!(file instanceof File) || !file.size) {
			return fail(400, { error: 'Select an image to upload.' });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const result = await saveBanner(locals.user.id, buffer, file.type);

		if (!result.ok) {
			const messages: Record<string, string> = {
				invalid_type: 'Use a PNG, JPEG, or WebP image.',
				too_large: 'Image must be under 4 MB.',
				rate_limited: 'Please wait before uploading another banner image.'
			};
			return fail(400, { error: messages[result.reason] ?? 'Could not upload banner.' });
		}

		return { bannerUpdated: true, newFilename: result.filename };
	},

	updateSettings: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });

		const { request, locals, params } = event;
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const bio = String(form.get('bio') ?? '').trim();

		const result = await updateUserSettings(locals.user.id, { bio });
		if (!result.ok) {
			return fail(400, { error: 'Could not update bio.' });
		}

		locals.user = { ...locals.user, settings: { ...locals.user.settings, bio } };
		return { success: true };
	}
};
