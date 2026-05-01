import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { submitFeedback } from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const form = await event.request.formData();
		const result = await submitFeedback(event.locals.user, form);

		if (!result.ok) {
			return fail(
				result.reason === 'rate_limited' ? 429 : 400,
				{
					error:
						result.reason === 'rate_limited'
							? 'Please wait before submitting more feedback.'
							: 'Enter a category and message.'
				}
			);
		}

		return { success: true };
	}
};
