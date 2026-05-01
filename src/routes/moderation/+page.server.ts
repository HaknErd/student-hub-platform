import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	isModerator,
	listFeedbackForModeration,
	listPendingResources,
	listReportsForModeration
} from '$lib/server/resources';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!isModerator(locals.user)) throw redirect(303, '/');

	const [pendingResources, feedbackItems, reports] = await Promise.all([
		listPendingResources(),
		listFeedbackForModeration(locals.user),
		listReportsForModeration(locals.user)
	]);

	return {
		pendingResources,
		feedbackItems,
		reports,
		counts: {
			resources: pendingResources.length,
			feedback: feedbackItems.length,
			reports: reports.length
		}
	};
};
