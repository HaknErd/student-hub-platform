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
const legacyName = args.name?.trim();
const firstName = args.first?.trim() || legacyName?.split(/\s+/)[0];
const lastName = args.last?.trim() || legacyName?.split(/\s+/).slice(1).join(' ');
const displayName = [firstName, lastName].filter(Boolean).join(' ');
const password = args.password;
const role = args.role?.trim() || 'student';

if (!email || !firstName || !lastName || !password) {
	console.error('Usage: pnpm user:create -- --email=user@example.com --first=First --last=Last --password="change-me" [--role=student]');
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
	await pool.query(
			`
				insert into users (email, first_name, last_name, display_name, password_hash, role)
				values ($1, $2, $3, $4, $5, $6)
				on conflict (email) do update
				set first_name = excluded.first_name,
					last_name = excluded.last_name,
					display_name = excluded.display_name,
					password_hash = excluded.password_hash,
					role = excluded.role,
					disabled_at = null,
					updated_at = now()
			`,
			[email, firstName, lastName, displayName, await hashPassword(password), role]
		);

	console.log(`User ready: ${email}`);
} finally {
	await pool.end();
}
