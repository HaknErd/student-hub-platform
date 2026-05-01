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
const userId = args.id?.trim();
const invalidate = args['invalidate-sessions'] !== 'false';

if (!email && !userId) {
	console.error('Usage: pnpm user:reset-password -- --email=user@example.com [--invalidate-sessions=true]');
	console.error('       pnpm user:reset-password -- --id=<uuid> [--invalidate-sessions=true]');
	process.exit(1);
}

function generatePassword() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
	let password = '';
	const bytes = randomBytes(24);
	for (let i = 0; i < bytes.length; i++) {
		password += chars[bytes[i] % chars.length];
	}
	return password;
}

async function hashPassword(input) {
	const salt = randomBytes(16);
	const params = { N: 16_384, r: 8, p: 1 };
	const hash = await scryptAsync(input, salt, 64, params);
	return ['scrypt', 'v1', params.N, params.r, params.p, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

const pool = new Pool({ connectionString: databaseUrl });

try {
	let lookupResult;
	if (email) {
		lookupResult = await pool.query(
			'select id, email, first_name, last_name, display_name from users where email = $1 limit 1',
			[email]
		);
	} else {
		lookupResult = await pool.query(
			'select id, email, first_name, last_name, display_name from users where id = $1 limit 1',
			[userId]
		);
	}

	if (lookupResult.rowCount !== 1) {
		console.error('User not found.');
		process.exit(1);
	}

	const user = lookupResult.rows[0];
	const newPassword = generatePassword();

	await pool.query(
		'update users set password_hash = $2, updated_at = now(), disabled_at = null where id = $1',
		[user.id, await hashPassword(newPassword)]
	);

	if (invalidate) {
		await pool.query('delete from sessions where user_id = $1', [user.id]);
	}

	console.log(`Password reset for: ${user.email} (${user.display_name})`);
	console.log(`New password: ${newPassword}`);
	if (invalidate) {
		console.log('All existing sessions invalidated.');
	}
} finally {
	await pool.end();
}
