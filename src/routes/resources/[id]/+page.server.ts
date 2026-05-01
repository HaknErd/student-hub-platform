import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	binResource,
	getResourceById,
	isModerator,
	permanentlyDeleteResource,
	submitResourceRevision,
	updateOwnSubmission,
	updateResourceByModerator
} from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	const resource = await getResourceById(params.id, locals.user);
	if (!resource) throw error(404, 'Resource not found');

	return {
		resource,
		canModerate: isModerator(locals.user),
		canEditResource: isModerator(locals.user) || locals.user.id === resource.createdBy.id,
		canBinResource: isModerator(locals.user) || locals.user.id === resource.createdBy.id,
		canPermanentDeleteResource: locals.user.role === 'admin'
	};
};

export const actions: Actions = {
	binResource: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const result = await binResource(event.params.id, event.locals.user);

		if (!result.ok) {
			return fail(result.reason === 'forbidden' ? 403 : 400, {
				error:
					result.reason === 'forbidden'
						? 'You are not allowed to bin this resource.'
						: 'Resource not found.'
			});
		}

		throw redirect(303, '/resources');
	},

	permanentDeleteResource: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const form = await event.request.formData();
		const confirm = String(form.get('confirm') ?? '');

		if (confirm !== 'DELETE') {
			return fail(400, { error: 'Type DELETE to permanently delete this resource.' });
		}

		const result = await permanentlyDeleteResource(event.params.id, event.locals.user);

		if (!result.ok) {
			return fail(result.reason === 'forbidden' ? 403 : 400, {
				error:
					result.reason === 'forbidden'
						? 'Only admins can permanently delete resources.'
						: 'Resource not found.'
			});
		}

		throw redirect(303, '/resources');
	},

	updateResource: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user) throw redirect(303, '/login');

		const resource = await getResourceById(event.params.id, event.locals.user);
		if (!resource) throw error(404, 'Resource not found');

		const result = isModerator(event.locals.user)
			? await updateResourceByModerator(event, event.locals.user, event.params.id)
			: resource.status === 'verified'
				? await submitResourceRevision(event, event.locals.user, event.params.id)
				: await updateOwnSubmission(event, event.locals.user, event.params.id);

		if (!result.ok) {
			const messages: Record<string, string> = {
				forbidden: 'You are not allowed to edit this resource.',
				invalid_input: 'Enter a title, subject, and valid purpose.',
				license_required: 'Confirm that the resource is allowed to be shared.',
				invalid_url: 'Enter a valid URL.',
				missing_content: 'This revision needs either an external link or the existing file.',
				not_found: 'Resource not found.'
			};

			return fail(400, {
				error: messages[result.reason] ?? 'Could not update resource.'
			});
		}

		return {
			success: true,
			message: isModerator(event.locals.user)
				? 'Resource updated.'
				: resource.status === 'verified'
					? 'Revision submitted for re-verification. The current verified version remains live until approval.'
					: 'Submission updated.'
		};
	}
};
