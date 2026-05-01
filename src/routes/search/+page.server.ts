import type { PageServerLoad } from './$types';
import { searchProfilesPaged } from '$lib/server/auth';

const PAGE_SIZE = 10;
const VALID_TYPES = new Set(['any', 'users', 'content']);

export const load: PageServerLoad = async ({ url }) => {
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

	const content: unknown[] = [];
	const contentTotal = 0;

	const total = usersTotal + contentTotal;
	const tookMs = Math.max(0, Math.round(performance.now() - startedAt));
	const totalPages = Math.max(1, Math.ceil(usersTotal / PAGE_SIZE));

	return {
		query: q,
		type,
		users,
		usersTotal,
		content,
		contentTotal,
		total,
		page,
		pageSize: PAGE_SIZE,
		totalPages,
		tookMs
	};
};
