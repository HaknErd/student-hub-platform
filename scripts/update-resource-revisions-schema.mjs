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
		alter table resources
		add column if not exists revision_of uuid references resources(id) on delete set null;

		create index if not exists resources_revision_of_idx on resources(revision_of);
	`);

	console.log('Resource revision schema is up to date.');
} finally {
	await db.end();
}
