import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import { loadEnvFile } from './load-env.mjs';

const { Pool } = pg;
await loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sql = await readFile(join(root, 'database/schema.sql'), 'utf8');
const pool = new Pool({ connectionString: databaseUrl });

try {
	await pool.query(sql);
	console.log('Database schema is up to date.');
} finally {
	await pool.end();
}
