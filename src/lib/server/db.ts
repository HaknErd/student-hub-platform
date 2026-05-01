import { env } from '$env/dynamic/private';
import pg from 'pg';

const { Pool } = pg;

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required');
}

export const db = new Pool({
	connectionString: env.DATABASE_URL,
	max: 10,
	idleTimeoutMillis: 30_000
});
