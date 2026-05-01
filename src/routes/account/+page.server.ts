import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { changeUserPassword, sanitizeUserSettings, updateUserSettings } from '$lib/server/auth';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	settings: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { type: 'settings', message: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const form = await event.request.formData();
		const rawSettings: Record<string, unknown> = {};

		for (const [key, value] of form.entries()) {
			if (key === 'type') continue;
			if (typeof value === 'string') {
				rawSettings[key] = value;
			}
		}

		const settings = sanitizeUserSettings(rawSettings);
		if (!Object.keys(settings).length) {
			return fail(400, { type: 'settings', message: 'Could not update settings.' });
		}

		const result = await updateUserSettings(event.locals.user.id, settings);
		if (!result.ok) {
			return fail(400, { type: 'settings', message: 'Could not update settings.' });
		}

		event.locals.user = { ...event.locals.user, settings: { ...event.locals.user.settings, ...settings } as Record<string, unknown> };
		return { type: 'settings', message: 'Settings updated.' };
	},

	password: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { type: 'password', message: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const form = await event.request.formData();
		const result = await changeUserPassword(
			event.locals.user.id,
			{
				currentPassword: String(form.get('currentPassword') ?? ''),
				newPassword: String(form.get('newPassword') ?? ''),
				signOutOtherSessions: form.get('signOutOtherSessions') === 'on'
			},
			event.cookies
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
