import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProfiles } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) throw error(401, 'Login required.');

	const q = url.searchParams.get('q') ?? '';
	const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50);

	const results = await searchProfiles(q, limit);
	return json(results);
};
