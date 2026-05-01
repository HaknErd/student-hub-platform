import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ReportItem } from '$lib/server/resources';
import {
	isModerator,
	listReportsForModeration,
	updateReportStatus
} from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

function matchesQuery(item: ReportItem, query: string) {
	if (!query) return true;

	const haystack = [
		item.category,
		item.message,
		item.status,
		item.createdBy?.displayName ?? '',
		item.createdBy?.email ?? ''
	]
		.join(' ')
		.toLowerCase();

	return haystack.includes(query);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!isModerator(locals.user)) throw redirect(303, '/');

	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	const status = url.searchParams.get('status')?.trim() ?? 'any';
	const visibility = url.searchParams.get('visibility')?.trim() ?? 'any';

	const reportItems = await listReportsForModeration(locals.user, true);

	const filteredReportItems = reportItems.filter((item) => {
		if (status !== 'any' && item.status !== status) return false;
		if (visibility === 'anonymous' && item.createdBy !== null) return false;
		if (visibility === 'identified' && item.createdBy === null) return false;
		return matchesQuery(item, q);
	});

	return {
		reports: filteredReportItems,
		totalReports: reportItems.length,
		filters: {
			q,
			status,
			visibility
		}
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
