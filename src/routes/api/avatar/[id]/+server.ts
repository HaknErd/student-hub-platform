import type { RequestHandler } from './$types';
import { readAvatarFile } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params, request }) => {
	const avatar = await readAvatarFile(params.id);

	if (!avatar) {
		return new Response(null, { status: 404 });
	}

	const etag = `"${avatar.hash}"`;
	const ifNoneMatch = request.headers.get('if-none-match');

	if (ifNoneMatch === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				'ETag': etag,
				'Cache-Control': 'private, max-age=3600'
			}
		});
	}

	const buf = avatar.data;
	const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

	return new Response(arrayBuffer, {
		headers: {
			'Content-Type': avatar.mimeType,
			'ETag': etag,
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
