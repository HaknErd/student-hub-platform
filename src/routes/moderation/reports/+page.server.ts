import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	isModerator,
	listReportsForModeration,
	updateReportStatus
} from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!isModerator(locals.user)) throw redirect(303, '/');

	return {
		reports: await listReportsForModeration(locals.user, true)
	};
};

export const actions: Actions = {
	reportStatus: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user || !isModerator(event.locals.user)) throw redirect(303, '/');

		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const status = String(form.get('status') ?? '');

		if (status !== 'triaged' && status !== 'escalated' && status !== 'resolved' && status !== 'closed') {
			return fail(400, { error: 'Invalid report status.' });
		}

		const result = await updateReportStatus(id, status, event.locals.user);
		if (!result.ok) return fail(400, { error: 'Could not update report.' });

		return { success: true };
	}
};
