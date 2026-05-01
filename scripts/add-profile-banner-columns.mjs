import { readFileSync, existsSync } from 'node:fs';
import pg from 'pg';

function loadEnvFile() {
	for (const file of ['.env', '.env.local']) {
		if (!existsSync(file)) continue;
		const text = readFileSync(file, 'utf8');
		for (const line of text.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
			const index = trimmed.indexOf('=');
			const key = trimmed.slice(0, index).trim();
			const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
			if (!process.env[key]) process.env[key] = value;
		}
	}
}

loadEnvFile();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required. Put it in .env or export it before running this script.');
}

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await db.query(`
	alter table users
		add column if not exists banner_picture_url text,
		add column if not exists banner_picture_hash text;
`);

await db.end();
console.log('Profile banner columns are ready.');
