import type { RequestEvent } from '@sveltejs/kit';

export function isSameOrigin(event: RequestEvent) {
	const origin = event.request.headers.get('origin');
	if (!origin) return false;

	try {
		return new URL(origin).origin === event.url.origin;
	} catch {
		return false;
	}
}

export function hasTrustedFetchMetadata(event: RequestEvent) {
	const site = event.request.headers.get('sec-fetch-site');
	return site === 'same-origin' || site === 'none';
}

export function isTrustedPost(event: RequestEvent) {
	const originOk = isSameOrigin(event);
	const fetchOk = hasTrustedFetchMetadata(event);

	if (originOk && fetchOk) return true;

	if (originOk && !event.request.headers.get('sec-fetch-site')) return true;

	return false;
}
