import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createResourceSubmission } from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const result = await createResourceSubmission(event, event.locals.user);

		if (!result.ok) {
			const messages: Record<string, string> = {
				invalid_input: 'Enter a title, subject, and valid resource type.',
				license_required: 'Confirm that the resource is allowed to be shared.',
				invalid_url: 'Enter a valid URL.',
				rate_limited: 'Please wait before submitting another resource.',
				missing_content: 'Add either an external link or a file.',
				invalid_file_type: 'Use PDF, PNG, JPEG, WebP, or plain text.',
				file_too_large: 'File must be 10 MB or smaller.'
			};

			return fail(400, { error: messages[result.reason] ?? 'Could not submit resource.' });
		}

		throw redirect(303, `/resources/${result.id}`);
	}
};
