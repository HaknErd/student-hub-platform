import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getPublicProfile,
	updateUserProfile,
	saveAvatar,
	removeAvatar,
	updateUserColors,
	updateUserSettings
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, locals }) => {
	const profile = await getPublicProfile(params.id);

	if (!profile) {
		throw error(404, 'Profile not found');
	}

	return {
		profile,
		isOwnProfile: locals.user?.id === profile.id,
		ownEmail: locals.user?.id === profile.id ? locals.user.email : null
	};
};

export const actions: Actions = {
	updateField: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.id !== params.id) throw redirect(303, '/login');

		const form = await request.formData();
		const field = String(form.get('field') ?? '');

		if (field === 'email') {
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

	updateColor: async ({ request, locals, params }) => {
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

	updateAvatar: async ({ request, locals, params }) => {
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
				too_large: 'Image must be under 2 MB.'
			};
			return fail(400, { error: messages[result.reason] ?? 'Could not upload.' });
		}

		if (avatarShape === 'rounded-xl' || avatarShape === 'rounded-full') {
			await updateUserSettings(locals.user.id, { avatarShape });
		}

		locals.user = { ...locals.user, profilePictureUrl: params.id };
		return { avatarUpdated: true };
	},

	updateAvatarShape: async ({ request, locals, params }) => {
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
	}
};
