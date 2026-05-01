import type { RequestHandler } from './$types';
import { loginWithPassword } from '$lib/server/auth';
import { isTrustedPost } from '$lib/server/request';

export const POST: RequestHandler = async (event) => {
	if (!isTrustedPost(event)) {
		return Response.json({ error: 'Invalid request origin' }, { status: 403 });
	}

	let body: unknown = null;
	try {
		body = await event.request.json();
	} catch {
		return Response.json({ error: 'Invalid request body' }, { status: 400 });
	}

	const input = body as { email?: unknown; password?: unknown };
	if (typeof input.email !== 'string' || typeof input.password !== 'string') {
		return Response.json({ error: 'Email and password are required' }, { status: 400 });
	}

	const result = await loginWithPassword(event, input.email, input.password);
	if (!result.ok) {
		if (result.reason === 'rate_limited') {
			return Response.json({ error: 'Too many login attempts' }, { status: 429 });
		}

		return Response.json({ error: 'Invalid email or password' }, { status: 401 });
	}

	return Response.json({ user: result.user });
};
