import { Buffer } from 'node:buffer';

export type UploadSignature =
	| 'pdf'
	| 'png'
	| 'jpeg'
	| 'webp'
	| 'rtf'
	| 'text'
	| 'zip'
	| 'ole'
	| 'unknown';

export function detectUploadSignature(buffer: Buffer): UploadSignature {
	if (buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '%PDF') return 'pdf';
	if (
		buffer.length >= 8 &&
		buffer[0] === 0x89 &&
		buffer.subarray(1, 4).toString('utf8') === 'PNG' &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	) {
		return 'png';
	}
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
	if (buffer.length >= 12 && buffer.subarray(0, 4).toString('utf8') === 'RIFF' && buffer.subarray(8, 12).toString('utf8') === 'WEBP') {
		return 'webp';
	}
	if (buffer.length >= 4 && buffer.subarray(0, 4).toString('utf8') === '{\\rt') return 'rtf';
	if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) return 'zip';
	if (
		buffer.length >= 8 &&
		buffer[0] === 0xd0 &&
		buffer[1] === 0xcf &&
		buffer[2] === 0x11 &&
		buffer[3] === 0xe0 &&
		buffer[4] === 0xa1 &&
		buffer[5] === 0xb1 &&
		buffer[6] === 0x1a &&
		buffer[7] === 0xe1
	) {
		return 'ole';
	}

	const sample = buffer.subarray(0, 2048).toString('utf8');
	if (sample && !sample.includes('\u0000') && /^[\t\n\r\x20-\x7e\u00a0-\u00ff]*$/.test(sample)) {
		return 'text';
	}

	return 'unknown';
}

export function isSafeDownloadFilename(filename: string) {
	return filename.replace(/[\r\n"\\\0-\x1f\x7f]/g, '').slice(0, 160) || 'file';
}
