import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listResources } from '$lib/server/resources';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');

	const q = url.searchParams.get('q') ?? '';
	const subject = url.searchParams.get('subject') ?? '';
	const curriculum = url.searchParams.get('curriculum') ?? '';
	const level = url.searchParams.get('level') ?? '';
	const type = url.searchParams.get('type') ?? '';
	const format = url.searchParams.get('format') ?? '';
	const formatGroup = url.searchParams.get('formatGroup') ?? '';

	const resources = await listResources({
		query: q,
		subject,
		curriculum,
		level,
		type,
		format,
		formatGroup,
		limit: 50
	});

	return {
		resources,
		query: q,
		subject,
		curriculum,
		level,
		type,
		format,
		formatGroup
	};
};
