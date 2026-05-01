import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getAppSettings,
	getResourceFileUsageSummary,
	isAdmin,
	updateAppSettings
} from '$lib/server/app-settings';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!isAdmin(locals.user)) throw redirect(303, '/');

	const [settings, fileUsage] = await Promise.all([getAppSettings(), getResourceFileUsageSummary()]);

	return {
		settings,
		fileUsage
	};
};

export const actions: Actions = {
	settings: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');
		if (!isAdmin(event.locals.user)) throw redirect(303, '/');

		const form = await event.request.formData();
		const result = await updateAppSettings({
			autoVerifyPrivilegedResourceSubmissions:
				form.get('autoVerifyPrivilegedResourceSubmissions') === 'on'
		});

		if (!result.ok) {
			return fail(400, { error: 'Could not update server settings.' });
		}

		return { success: true, message: 'Server settings updated.' };
	}
};
