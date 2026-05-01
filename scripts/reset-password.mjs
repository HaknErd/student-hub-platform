import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';
import { loadEnvFile } from './load-env.mjs';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

await loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const args = Object.fromEntries(
	process.argv.slice(2).map((arg) => {
		const [key, ...value] = arg.replace(/^--/, '').split('=');
		return [key, value.join('=')];
	})
);

const email = args.email?.trim().toLowerCase();
const password = args.password;

if (!email || !password) {
	console.error('Usage: pnpm user:reset-password -- --email=user@example.com --password="new-min-12-chars"');
	process.exit(1);
}

if (password.length < 12) {
	console.error('Password must be at least 12 characters.');
	process.exit(1);
}

async function hashPassword(input) {
	const salt = randomBytes(16);
	const params = { N: 16_384, r: 8, p: 1 };
	const hash = await scryptAsync(input, salt, 64, params);
	return ['scrypt', 'v1', params.N, params.r, params.p, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

const pool = new Pool({ connectionString: databaseUrl });

try {
	const result = await pool.query(
		`update users
		 set password_hash = $2, updated_at = now()
		 where email = $1
		   and disabled_at is null
		 returning email`,
		[email, await hashPassword(password)]
	);

	if (result.rowCount === 0) {
		console.error(`No active user found with email: ${email}`);
		process.exit(1);
	}

	console.log(`Password updated: ${email}`);
} finally {
	await pool.end();
}
