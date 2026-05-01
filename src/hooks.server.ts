import type { Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';

// Temporary route whitelist while the app is being built out.
// Keep it strict so unfinished routes don't leak into navigation.
const ALLOWED_PAGES = new Set<string>(['/', '/about', '/login', '/search']);
const AUTHENTICATED_PAGES = new Set<string>(['/account']);
const ALLOWED_API_PATHS = new Set<string>(['/api/auth/login', '/api/auth/logout', '/api/search']);

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	if (pathname.startsWith('/api/') && !ALLOWED_API_PATHS.has(pathname) && !pathname.startsWith('/api/avatar/')) {
		return new Response('Not found', { status: 404 });
	}

	// Allow SvelteKit assets and auth endpoints.
	if (
		pathname.startsWith('/_app/') ||
		ALLOWED_API_PATHS.has(pathname) ||
		pathname.startsWith('/api/avatar/') ||
		pathname === '/favicon.svg' ||
		pathname === '/robots.txt'
	) {
		return withSecurityHeaders(await resolve(event));
	}

	const user = await getUserFromSession(event.cookies);
	event.locals.user = user;

	if (AUTHENTICATED_PAGES.has(pathname) && !user) {
		return Response.redirect(new URL('/login', event.url), 303);
	}

	if (pathname.startsWith('/profile/')) {
		return withSecurityHeaders(await resolve(event));
	}

	// Page whitelist (for now).
	if (!ALLOWED_PAGES.has(pathname) && !AUTHENTICATED_PAGES.has(pathname)) {
		return Response.redirect(new URL('/', event.url), 303);
	}

	return withSecurityHeaders(await resolve(event));
};

function withSecurityHeaders(response: Response) {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('X-Frame-Options', 'DENY');
	return response;
}
