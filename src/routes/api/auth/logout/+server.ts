import type { RequestHandler } from './$types';
import { logout } from '$lib/server/auth';
import { isTrustedPost } from '$lib/server/request';

export const POST: RequestHandler = async (event) => {
	if (!isTrustedPost(event)) {
		return Response.json({ error: 'Invalid request origin' }, { status: 403 });
	}

	await logout(event.cookies);
	return new Response(null, { status: 204 });
};
