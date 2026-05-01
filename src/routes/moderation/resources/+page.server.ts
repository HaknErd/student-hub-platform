import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	RESOURCE_FORMATS,
	RESOURCE_TYPES,
	approveResource,
	isModerator,
	listPendingResources,
	rejectResource
} from '$lib/server/resources';
import { isTrustedPost } from '$lib/server/request';

function matchesQuery(resource: Awaited<ReturnType<typeof listPendingResources>>[number], query: string) {
	if (!query) return true;

	const haystack = [
		resource.title,
		resource.description,
		resource.subject,
		resource.curriculum ?? '',
		resource.level ?? '',
		resource.type,
		resource.format ?? '',
		resource.createdBy.displayName
	]
		.join(' ')
		.toLowerCase();

	return haystack.includes(query);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!isModerator(locals.user)) throw redirect(303, '/');

	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	const subject = url.searchParams.get('subject')?.trim() ?? 'any';
	const curriculum = url.searchParams.get('curriculum')?.trim() ?? 'any';
	const level = url.searchParams.get('level')?.trim() ?? 'any';
	const type = url.searchParams.get('type')?.trim() ?? 'any';
	const format = url.searchParams.get('format')?.trim() ?? 'any';

	const pendingResources = await listPendingResources();
	const subjects = [...new Set(pendingResources.map((resource) => resource.subject))].sort((a, b) =>
		a.localeCompare(b)
	);
	const curricula = [...new Set(pendingResources.map((resource) => resource.curriculum).filter(Boolean))].sort(
		(a, b) => String(a).localeCompare(String(b))
	);
	const levels = [...new Set(pendingResources.map((resource) => resource.level).filter(Boolean))].sort((a, b) =>
		String(a).localeCompare(String(b))
	);

	const filteredPendingResources = pendingResources.filter((resource) => {
		if (subject !== 'any' && resource.subject !== subject) return false;
		if (curriculum !== 'any' && (resource.curriculum ?? '') !== curriculum) return false;
		if (level !== 'any' && (resource.level ?? '') !== level) return false;
		if (type !== 'any' && resource.type !== type) return false;
		if (format !== 'any' && (resource.format ?? '') !== format) return false;
		return matchesQuery(resource, q);
	});

	return {
		pendingResources: filteredPendingResources,
		totalPendingResources: pendingResources.length,
		subjects,
		curricula,
		levels,
		types: [...RESOURCE_TYPES],
		formats: [...RESOURCE_FORMATS],
		filters: {
			q,
			subject,
			curriculum,
			level,
			type,
			format
		}
	};
};

export const actions: Actions = {
	approveResource: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user || !isModerator(event.locals.user)) throw redirect(303, '/');

		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');

		const result = await approveResource(id, event.locals.user);
		if (!result.ok) return fail(400, { error: 'Could not approve resource.' });

		return { success: true };
	},

	rejectResource: async (event) => {
		if (!isTrustedPost(event)) return fail(403, { error: 'Invalid request origin.' });
		if (!event.locals.user || !isModerator(event.locals.user)) throw redirect(303, '/');

		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const reason = String(form.get('reason') ?? '');

		const result = await rejectResource(id, event.locals.user, reason);
		if (!result.ok) return fail(400, { error: 'Could not reject resource.' });

		return { success: true };
	}
};
