import type { RequestHandler } from './$types';
import { readBannerFile } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params, request }) => {
	const banner = await readBannerFile(params.id);

	if (!banner) {
		return new Response(null, { status: 404 });
	}

	const etag = `"${banner.hash}"`;
	const ifNoneMatch = request.headers.get('if-none-match');

	if (ifNoneMatch === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				'Cache-Control': 'private, max-age=3600'
			}
		});
	}

	const buf = banner.data;
	const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

	return new Response(arrayBuffer, {
		headers: {
			'Content-Type': banner.mimeType,
			ETag: etag,
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
