import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { countResources, listResources } from '$lib/server/resources';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(303, '/login');

	const q = url.searchParams.get('q') ?? '';
	const subject = url.searchParams.get('subject') ?? '';
	const curriculum = url.searchParams.get('curriculum') ?? '';
	const level = url.searchParams.get('level') ?? '';
	const type = url.searchParams.get('type') ?? '';
	const format = url.searchParams.get('format') ?? '';
	const formatGroup = url.searchParams.get('formatGroup') ?? '';
	const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
	const limit = 20;
	const offset = (page - 1) * limit;

	const filters = {
		query: q,
		subject,
		curriculum,
		level,
		type,
		format,
		formatGroup
	};

	const [resources, total] = await Promise.all([
		listResources({ ...filters, limit, offset }),
		countResources(filters)
	]);

	const totalPages = Math.max(1, Math.ceil(total / limit));

	return {
		resources,
		total,
		page,
		limit,
		totalPages,
		query: q,
		subject,
		curriculum,
		level,
		type,
		format,
		formatGroup
	};
};
