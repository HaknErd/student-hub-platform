import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { searchProfilesPaged } from '$lib/server/auth';
import { countResources, listResources } from '$lib/server/resources';

const PAGE_SIZE = 10;
const VALID_TYPES = new Set(['any', 'users', 'content']);

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	const q = url.searchParams.get('q') ?? '';
	const rawType = url.searchParams.get('type') ?? 'any';
	const type = VALID_TYPES.has(rawType) ? rawType : 'any';
	const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);

	const startedAt = performance.now();

	let users: Awaited<ReturnType<typeof searchProfilesPaged>>['results'] = [];
	let usersTotal = 0;

	// "any" currently searches all implemented groups. For now that means users.
	if (q.trim() && (type === 'any' || type === 'users')) {
		const search = await searchProfilesPaged(q.trim(), PAGE_SIZE, (page - 1) * PAGE_SIZE);
		users = search.results;
		usersTotal = search.total;
	}

	let content: Awaited<ReturnType<typeof listResources>> = [];
	let contentTotal = 0;

	if (q.trim() && (type === 'any' || type === 'content')) {
		content = await listResources({
			query: q.trim(),
			limit: PAGE_SIZE,
			offset: (page - 1) * PAGE_SIZE
		});
		contentTotal = await countResources({
			query: q.trim()
		});
	}

	const total = usersTotal + contentTotal;
	const tookMs = Math.max(0, Math.round(performance.now() - startedAt));
	const usersTotalPages = Math.max(1, Math.ceil(usersTotal / PAGE_SIZE));
	const contentTotalPages = Math.max(1, Math.ceil(contentTotal / PAGE_SIZE));
	const totalPages = Math.max(usersTotalPages, contentTotalPages, 1);

	return {
		query: q,
		type,
		users,
		usersTotal,
		content,
		contentTotal,
		contentTotalPages,
		total,
		page,
		pageSize: PAGE_SIZE,
		totalPages,
		tookMs
	};
};
