import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { changeUserPassword, updateUserSettings } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	settings: async ({ request, locals }) => {
		if (!locals.user) throw redirect(303, '/login');

		const form = await request.formData();
		const settings: Record<string, unknown> = {};

		for (const [key, value] of form.entries()) {
			if (key === 'type') continue;
			if (typeof value === 'string') {
				settings[key] = value;
			}
		}

		const result = await updateUserSettings(locals.user.id, settings);
		if (!result.ok) {
			return fail(400, { type: 'settings', message: 'Could not update settings.' });
		}

		locals.user = { ...locals.user, settings: { ...locals.user.settings, ...settings } as Record<string, unknown> };
		return { type: 'settings', message: 'Settings updated.' };
	},

	password: async ({ request, locals, cookies }) => {
		if (!locals.user) throw redirect(303, '/login');

		const form = await request.formData();
		const result = await changeUserPassword(
			locals.user.id,
			{
				currentPassword: String(form.get('currentPassword') ?? ''),
				newPassword: String(form.get('newPassword') ?? ''),
				signOutOtherSessions: form.get('signOutOtherSessions') === 'on'
			},
			cookies
		);

		if (!result.ok) {
			return fail(400, {
				type: 'password',
				message:
					result.reason === 'weak_password'
						? 'Use a password with at least 12 characters.'
						: 'The current password is not correct.'
			});
		}

		return { type: 'password', message: 'Password updated.' };
	}
};
