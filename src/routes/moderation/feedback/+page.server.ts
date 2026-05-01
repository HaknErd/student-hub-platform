import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { FeedbackItem } from '$lib/server/resources';
import {
	isModerator,
	listFeedbackForModeration,
	updateFeedbackStatus
} from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

function matchesQuery(item: FeedbackItem, query: string) {
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
	const category = url.searchParams.get('category')?.trim() ?? 'any';
	const visibility = url.searchParams.get('visibility')?.trim() ?? 'any';

	const feedbackItems = await listFeedbackForModeration(locals.user, true);
	const categories = [...new Set(feedbackItems.map((item) => item.category))].sort((a, b) =>
		a.localeCompare(b)
	);

	const filteredFeedbackItems = feedbackItems.filter((item) => {
		if (status !== 'any' && item.status !== status) return false;
		if (category !== 'any' && item.category !== category) return false;
		if (visibility === 'anonymous' && item.createdBy !== null) return false;
		if (visibility === 'identified' && item.createdBy === null) return false;
		return matchesQuery(item, q);
	});

	return {
		feedbackItems: filteredFeedbackItems,
		totalFeedbackItems: feedbackItems.length,
		categories,
		filters: {
			q,
			status,
			category,
			visibility
		}
	};
};

export const actions: Actions = {
	feedbackStatus: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user || !isModerator(event.locals.user)) throw redirect(303, '/');

		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const status = String(form.get('status') ?? '');

		if (status !== 'triaged' && status !== 'resolved' && status !== 'closed') {
			return fail(400, { error: 'Invalid feedback status.' });
		}

		const result = await updateFeedbackStatus(id, status, event.locals.user);
		if (!result.ok) return fail(400, { error: 'Could not update feedback.' });

		return { success: true };
	}
};
