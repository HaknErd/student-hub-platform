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

			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}

			if (!process.env[key]) process.env[key] = value;
		}
	} catch {
		// no .env file
	}
}

await loadDotenv();

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is required. Put it in .env or run DATABASE_URL="..." node scripts/apply-p0-schema.mjs');
	process.exit(1);
}

const sql = await readFile('sql/p0_student_hub.sql', 'utf8');

const db = new Pool({
	connectionString: process.env.DATABASE_URL
});

try {
	await db.query(sql);
	console.log('P0 schema applied.');

	const result = await db.query(
		"update users set role = 'admin' where email = $1 returning id, email, role",
		['hakan.erdogan@sgsc-students.com']
	);

	if (result.rowCount === 0) {
		console.log('No matching user found for admin update.');
	} else {
		console.log('Admin role applied:', result.rows[0]);
	}
} finally {
	await db.end();
}
