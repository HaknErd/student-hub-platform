import pg from 'pg';
import { loadEnvFile } from './load-env.mjs';

const { Pool } = pg;
await loadEnvFile();

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const db = new Pool({ connectionString: process.env.DATABASE_URL });

try {
	await db.query(`
		create table if not exists app_settings (
			key text primary key,
			value jsonb not null,
			updated_at timestamptz not null default now()
		);
	`);

	console.log('App settings schema is up to date.');
} finally {
	await db.end();
}
