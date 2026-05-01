import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

async function loadDotenv() {
	try {
		const text = await readFile('.env', 'utf8');
		for (const line of text.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const index = trimmed.indexOf('=');
			if (index === -1) continue;
			const key = trimmed.slice(0, index).trim();
			let value = trimmed.slice(index + 1).trim();
			if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1);
			}
			if (!process.env[key]) process.env[key] = value;
		}
	} catch {}
}

await loadDotenv();

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const db = new Pool({ connectionString: process.env.DATABASE_URL });

try {
	await db.query(`
		alter table resources
		add column if not exists format text;

		alter table resources
		drop constraint if exists resources_format_check;

		alter table resources
		add constraint resources_format_check
		check (
			format in (
				'pdf',
				'docx',
				'odt',
				'txt',
				'rtf',
				'pptx',
				'odp',
				'xlsx',
				'ods',
				'image',
				'video',
				'website',
				'youtube',
				'other'
			) or format is null
		);
	`);

	console.log('resources.format column ready.');
} finally {
	await db.end();
}
