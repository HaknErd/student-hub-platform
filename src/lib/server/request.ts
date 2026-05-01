import type { RequestEvent } from '@sveltejs/kit';

export function isSameOrigin(event: RequestEvent) {
	const origin = event.request.headers.get('origin');
	if (!origin) return true;

	try {
		return new URL(origin).origin === event.url.origin;
	} catch {
		return false;
	}
}

export function hasTrustedFetchMetadata(event: RequestEvent) {
	const site = event.request.headers.get('sec-fetch-site');
	return !site || site === 'same-origin' || site === 'none';
}

export function isTrustedPost(event: RequestEvent) {
	return isSameOrigin(event) && hasTrustedFetchMetadata(event);
}
