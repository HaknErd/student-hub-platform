import type { Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';

const ALLOWED_PAGES = new Set<string>(['/', '/about', '/login', '/resources', '/resources/new', '/feedback', '/reports', '/moderation']);
const AUTHENTICATED_PAGES = new Set<string>(['/account', '/search']);
const ALLOWED_API_PATHS = new Set<string>(['/api/auth/login', '/api/auth/logout', '/api/search']);
const ALLOWED_PAGE_PREFIXES: string[] = ['/profile/', '/resources/', '/moderation/', '/admin/'];

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const user = await getUserFromSession(event.cookies);
	event.locals.user = user;

	if (pathname.startsWith('/api/') && !ALLOWED_API_PATHS.has(pathname) && !((pathname.startsWith('/api/avatar/') ||
		pathname.startsWith('/api/banner/')))) {
		return withSecurityHeaders(new Response('Not found', { status: 404 }));
	}

	if (
		pathname.startsWith('/_app/') ||
		ALLOWED_API_PATHS.has(pathname) ||
		pathname.startsWith('/api/avatar/') ||
		pathname.startsWith('/api/banner/') ||
		pathname === '/favicon.svg' ||
		pathname === '/robots.txt'
	) {
		return withSecurityHeaders(await resolve(event));
	}

	if (AUTHENTICATED_PAGES.has(pathname) && !user) {
		return withSecurityHeaders(Response.redirect(new URL('/login', event.url), 303));
	}

	if (ALLOWED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return withSecurityHeaders(await resolve(event));
	}

	// Page whitelist (for now).
	if (!ALLOWED_PAGES.has(pathname) && !AUTHENTICATED_PAGES.has(pathname)) {
		return withSecurityHeaders(Response.redirect(new URL('/', event.url), 303));
	}

	return withSecurityHeaders(await resolve(event));
};

function withSecurityHeaders(response: Response) {
	try {
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
		response.headers.set('X-Frame-Options', 'DENY');
	} catch {
		// redirect responses have immutable headers
	}
	return response;
}
