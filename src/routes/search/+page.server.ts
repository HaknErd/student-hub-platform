import type { PageServerLoad } from './$types';
import { searchProfiles } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';

	let results: Awaited<ReturnType<typeof searchProfiles>> = [];
	if (q.trim()) {
		results = await searchProfiles(q.trim());
	}

	return {
		query: q,
		results
	};
};
