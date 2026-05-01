import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { getResourceFileForDownload } from '$lib/server/resources';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw redirect(303, '/login');

	if (!params.fileId) throw error(404, 'File not found');

	const file = await getResourceFileForDownload(params.fileId, locals.user);
	if (!file) throw error(404, 'File not found');

	return new Response(new Uint8Array(file.data), {
		headers: {
			'Content-Type': file.mimeType,
			'Content-Disposition': 'inline',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
