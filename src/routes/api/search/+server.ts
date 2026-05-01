import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProfiles } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50);

	const results = await searchProfiles(q, limit);
	return json(results);
};
