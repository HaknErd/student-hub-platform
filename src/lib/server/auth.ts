import { dev } from '$app/environment';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { randomBytes, createHash } from 'node:crypto';
import { unlink, mkdir, writeFile, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { PublicProfile, User } from '$lib/auth';
import { writeAudit } from '$lib/server/audit';
import { db } from '$lib/server/db';
import { enforceUserActionRateLimit } from '$lib/server/rate-limit';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { detectUploadSignature } from '$lib/server/upload-types';

export type LoginResult =
	| { ok: true; user: User }
	| { ok: false; reason: 'invalid_credentials' | 'disabled' | 'rate_limited' };

const SESSION_COOKIE = 'student_hub_session';
const SESSION_DAYS = 14;
const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;
const SESSION_IDLE_DAYS = 7;
const LOGIN_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS_PER_EMAIL_AND_IP = 5;
const MAX_FAILED_ATTEMPTS_PER_IP = 20;
const AVATAR_MAX_BYTES = 4_194_304;
const BANNER_MAX_BYTES = 4_194_304;
const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const storageRoot = process.env.STORAGE_DIR ?? join(process.cwd(), 'data');
const avatarsDir = join(storageRoot, 'avatars');
const bannersDir = join(storageRoot, 'banners');
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const ALLOWED_USER_SETTING_KEYS = new Set(['theme', 'compactMode', 'avatarShape', 'bio']);

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

function getRequestIp(event: RequestEvent) {
	// CF-Connecting-IP is trusted only when the origin is behind Cloudflare.
	// If the origin is directly reachable, a client could spoof this header.
	// Ensure your server firewall only accepts connections from Cloudflare IPs
	// (or your trusted reverse proxy) when relying on this value.
	const cfConnectingIp = event.request.headers.get('cf-connecting-ip')?.trim() || null;
	if (cfConnectingIp) return cfConnectingIp;

	const forwardedFor = event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
	const xRealIp = event.request.headers.get('x-real-ip')?.trim() || null;
	if (xRealIp) return xRealIp;
	if (forwardedFor) return forwardedFor;

	try {
		return event.getClientAddress();
	} catch {
		return null;
	}
}

function getSessionCookieName() {
	return dev ? SESSION_COOKIE : `__Host-${SESSION_COOKIE}`;
}

function setSessionCookie(cookies: Cookies, token: string) {
	cookies.set(getSessionCookieName(), token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: SESSION_MAX_AGE
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(getSessionCookieName(), { path: '/' });
}

function resolveAvatarShape(settings: Record<string, unknown>): 'rounded-xl' | 'rounded-full' {
	const v = (settings as Record<string, unknown> | null)?.avatarShape;
	return v === 'rounded-full' ? 'rounded-full' : 'rounded-xl';
}

function mapUser(row: Record<string, unknown>): User {
	const settings = (row.settings as Record<string, unknown>) ?? {};
	return {
		id: String(row.id),
		email: String(row.email),
		firstName: String(row.first_name),
		lastName: String(row.last_name),
		displayName: String(row.display_name),
		role: String(row.role),
		profilePictureUrl: row.profile_picture_url ? String(row.profile_picture_url) : null,
		bannerPictureUrl: row.banner_picture_url ? String(row.banner_picture_url) : null,
		accentColor: row.accent_color ? String(row.accent_color) : null,
		avatarBackgroundColor: row.avatar_background_color ? String(row.avatar_background_color) : null,
		avatarShape: resolveAvatarShape(settings),
		settings
	};
}

function mapProfile(row: Record<string, unknown>): PublicProfile {
	const settings = (row.settings as Record<string, unknown>) ?? {};
	return {
		id: String(row.id),
		firstName: String(row.first_name),
		lastName: String(row.last_name),
		displayName: String(row.display_name),
		role: String(row.role),
		profilePictureUrl: row.profile_picture_url ? String(row.profile_picture_url) : null,
		bannerPictureUrl: row.banner_picture_url ? String(row.banner_picture_url) : null,
		accentColor: row.accent_color ? String(row.accent_color) : null,
		avatarBackgroundColor: row.avatar_background_color ? String(row.avatar_background_color) : null,
		avatarShape: resolveAvatarShape(settings),
		settings
	};
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
	const result = await db.query(
		`
			select id, first_name, last_name, display_name, role,
				profile_picture_url, banner_picture_url, accent_color, avatar_background_color, settings
			from users
			where id = $1
				and disabled_at is null
			limit 1
		`,
		[id]
	);

	if (result.rowCount !== 1) return null;
	return mapProfile(result.rows[0]);
}

export async function updateUserProfile(
	userId: string,
	input: { email: string; firstName: string; lastName: string }
): Promise<{ ok: true; user: User } | { ok: false; reason: 'invalid_input' | 'email_taken' }> {
	const email = normalizeEmail(input.email);
	const firstName = input.firstName.trim();
	const lastName = input.lastName.trim();
	const displayName = `${firstName} ${lastName}`;

	if (!email || !firstName || !lastName || !email.includes('@')) {
		return { ok: false, reason: 'invalid_input' };
	}

	try {
		const result = await db.query(
			`
				update users
				set email = $2,
					first_name = $3,
					last_name = $4,
					display_name = $5,
					updated_at = now()
				where id = $1
					and disabled_at is null
				returning id, email, first_name, last_name, display_name, role,
					profile_picture_url, banner_picture_url, accent_color, avatar_background_color, settings
			`,
			[userId, email, firstName, lastName, displayName]
		);

		if (result.rowCount !== 1) return { ok: false, reason: 'invalid_input' };
		await writeAudit(userId, 'profile.update', 'user', userId, {
			changed: ['email', 'first_name', 'last_name']
		});
		return { ok: true, user: mapUser(result.rows[0]) };
	} catch (error) {
		if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
			return { ok: false, reason: 'email_taken' };
		}

		throw error;
	}
}

export async function getUserFromSession(cookies: Cookies): Promise<User | null> {
	const token = cookies.get(getSessionCookieName());
	if (!token) return null;

	const tokenHash = hashToken(token);
	const result = await db.query(
			`
				select u.id, u.email, u.first_name, u.last_name, u.display_name, u.role,
					u.profile_picture_url, u.banner_picture_url, u.accent_color, u.avatar_background_color, u.settings
			from sessions s
			join users u on u.id = s.user_id
			where s.token_hash = $1
				and s.expires_at > now()
				and s.last_seen_at > now() - ($2::text)::interval
				and u.disabled_at is null
			limit 1
		`,
		[tokenHash, `${SESSION_IDLE_DAYS} days`]
	);

	if (result.rowCount !== 1) {
		await db.query('delete from sessions where token_hash = $1', [tokenHash]);
		clearSessionCookie(cookies);
		return null;
	}

	await db.query('update sessions set last_seen_at = now() where token_hash = $1', [tokenHash]);
	return mapUser(result.rows[0]);
}

export async function changeUserPassword(
	userId: string,
	input: { currentPassword: string; newPassword: string; signOutOtherSessions: boolean },
	cookies: Cookies
): Promise<{ ok: true } | { ok: false; reason: 'invalid_current_password' | 'weak_password' }> {
	if (input.newPassword.length < 12) {
		return { ok: false, reason: 'weak_password' };
	}

	const result = await db.query(
		'select password_hash from users where id = $1 and disabled_at is null limit 1',
		[userId]
	);

	if (result.rowCount !== 1) return { ok: false, reason: 'invalid_current_password' };

	const valid = await verifyPassword(input.currentPassword, result.rows[0].password_hash);
	if (!valid) return { ok: false, reason: 'invalid_current_password' };

	await db.query('update users set password_hash = $2, updated_at = now() where id = $1', [
		userId,
		await hashPassword(input.newPassword)
	]);
	await writeAudit(userId, 'password.change', 'user', userId, {
		signOutOtherSessions: input.signOutOtherSessions
	});

	if (input.signOutOtherSessions) {
		const token = cookies.get(getSessionCookieName());
		const tokenHash = token ? hashToken(token) : null;
		await db.query(
			`
				delete from sessions
				where user_id = $1
					and ($2::text is null or token_hash <> $2)
			`,
			[userId, tokenHash]
		);
	}

	return { ok: true };
}

export async function loginWithPassword(event: RequestEvent, email: string, password: string): Promise<LoginResult> {
	const normalizedEmail = normalizeEmail(email);
	const ipAddress = getRequestIp(event);

	await pruneExpiredSessions();
	await pruneOldLoginAttempts();

	const attempts = await db.query(
		`
			select
				count(*) filter (
					where email = $1 and coalesce(ip_address, '') = coalesce($2, '')
				)::int as email_ip_count,
				count(*) filter (
					where coalesce(ip_address, '') = coalesce($2, '')
				)::int as ip_count
			from login_attempts
			where success = false
				and created_at > now() - ($3::text)::interval
		`,
		[normalizedEmail, ipAddress, `${LOGIN_WINDOW_MINUTES} minutes`]
	);

	const emailIpCount = attempts.rows[0]?.email_ip_count ?? 0;
	const ipCount = attempts.rows[0]?.ip_count ?? 0;
	if (
		emailIpCount >= MAX_FAILED_ATTEMPTS_PER_EMAIL_AND_IP ||
		ipCount >= MAX_FAILED_ATTEMPTS_PER_IP
	) {
		return { ok: false, reason: 'rate_limited' };
	}

	const result = await db.query(
			`
				select id, email, first_name, last_name, display_name, role,
					profile_picture_url, banner_picture_url, accent_color, avatar_background_color, settings,
					password_hash, disabled_at
			from users
			where email = $1
			limit 1
		`,
		[normalizedEmail]
	);

	if (result.rowCount !== 1) {
		await recordLoginAttempt(normalizedEmail, ipAddress, false);
		return { ok: false, reason: 'invalid_credentials' };
	}

	const row = result.rows[0];
	if (row.disabled_at) {
		await recordLoginAttempt(normalizedEmail, ipAddress, false);
		return { ok: false, reason: 'disabled' };
	}

	const valid = await verifyPassword(password, row.password_hash);
	if (!valid) {
		await recordLoginAttempt(normalizedEmail, ipAddress, false);
		return { ok: false, reason: 'invalid_credentials' };
	}

	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

	await db.query(
		`
			insert into sessions (user_id, token_hash, expires_at, user_agent, ip_address)
			values ($1, $2, $3, $4, $5)
		`,
		[
			row.id,
			hashToken(token),
			expiresAt,
			event.request.headers.get('user-agent'),
			ipAddress
		]
	);

	await recordLoginAttempt(normalizedEmail, ipAddress, true);
	setSessionCookie(event.cookies, token);
	return { ok: true, user: mapUser(row) };
}

async function recordLoginAttempt(email: string, ipAddress: string | null, success: boolean) {
	await db.query(
		'insert into login_attempts (email, ip_address, success) values ($1, $2, $3)',
		[email, ipAddress, success]
	);
}

export async function logout(cookies: Cookies) {
	const token = cookies.get(getSessionCookieName());
	if (token) {
		await db.query('delete from sessions where token_hash = $1', [hashToken(token)]);
	}
	clearSessionCookie(cookies);
}

export async function pruneExpiredSessions() {
	await db.query(
		`
			delete from sessions
			where expires_at <= now()
				or last_seen_at <= now() - ($1::text)::interval
		`,
		[`${SESSION_IDLE_DAYS} days`]
	);
}

async function pruneOldLoginAttempts() {
	await db.query("delete from login_attempts where created_at <= now() - interval '30 days'");
}

export function getAvatarPath(filename: string | null): string | null {
	if (!filename) return null;
	return join(avatarsDir, filename);
}

export async function readAvatarFile(userId: string): Promise<{ data: Buffer; mimeType: string; hash: string } | null> {
	const result = await db.query(
		'select profile_picture_url, profile_picture_hash from users where id = $1 and disabled_at is null',
		[userId]
	);

	if (result.rowCount !== 1 || !result.rows[0].profile_picture_url) return null;

	const filename = String(result.rows[0].profile_picture_url);
	if (basename(filename) !== filename) return null;
	const filepath = join(avatarsDir, filename);

	try {
		const data = await readFile(filepath);
		const ext = filename.split('.').pop()?.toLowerCase();
		const mimeTypes: Record<string, string> = {
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			webp: 'image/webp'
		};
		return {
			data,
			mimeType: mimeTypes[ext ?? ''] ?? 'image/png',
			hash: result.rows[0].profile_picture_hash ? String(result.rows[0].profile_picture_hash) : ''
		};
	} catch {
		return null;
	}
}

export async function saveAvatar(
	userId: string,
	fileBuffer: Buffer,
	mimeType: string
): Promise<{ ok: true; filename: string } | { ok: false; reason: 'invalid_type' | 'too_large' | 'not_found' | 'rate_limited' }> {
	if (!(await enforceUserActionRateLimit('profile.avatar.upload', userId, 6, 60))) {
		return { ok: false, reason: 'rate_limited' };
	}

	const detected = detectUploadSignature(fileBuffer);
	const expectedByMime: Record<string, string> = {
		'image/png': 'png',
		'image/jpeg': 'jpeg',
		'image/webp': 'webp'
	};
	if (!ALLOWED_AVATAR_TYPES.has(mimeType) || expectedByMime[mimeType] !== detected) {
		return { ok: false, reason: 'invalid_type' };
	}

	if (fileBuffer.byteLength > AVATAR_MAX_BYTES) {
		return { ok: false, reason: 'too_large' };
	}

	const existing = await db.query(
		'select profile_picture_url from users where id = $1 and disabled_at is null',
		[userId]
	);

	if (existing.rows[0].profile_picture_url) {
		try {
			await unlink(join(avatarsDir, String(existing.rows[0].profile_picture_url)));
		} catch {
			// old file may already be gone
		}
	}

	await mkdir(avatarsDir, { recursive: true });

	const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
	const filename = `${randomBytes(16).toString('hex')}.${ext}`;
	const filepath = join(avatarsDir, filename);
	await writeFile(filepath, fileBuffer);

	const hash = createHash('sha256').update(fileBuffer).digest('hex');

	await db.query(
		`update users set profile_picture_url = $2, profile_picture_hash = $3, updated_at = now()
		 where id = $1 and disabled_at is null`,
		[userId, filename, hash]
	);
	await writeAudit(userId, 'profile.avatar.update', 'user', userId, { filename });

	return { ok: true, filename };
}

export async function removeAvatar(
	userId: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
	const existing = await db.query(
		'select profile_picture_url from users where id = $1 and disabled_at is null',
		[userId]
	);

	if (existing.rowCount !== 1) return { ok: false, reason: 'not_found' };

	if (existing.rows[0].profile_picture_url) {
		try {
			await unlink(join(avatarsDir, String(existing.rows[0].profile_picture_url)));
		} catch {
			// file already gone
		}
	}

	await db.query(
		`update users set profile_picture_url = null, profile_picture_hash = null, updated_at = now()
		 where id = $1 and disabled_at is null`,
		[userId]
	);
	await writeAudit(userId, 'profile.avatar.remove', 'user', userId, {});

	return { ok: true };
}

export async function readBannerFile(userId: string): Promise<{ data: Buffer; mimeType: string; hash: string } | null> {
	const result = await db.query(
		'select banner_picture_url, banner_picture_hash from users where id = $1 and disabled_at is null',
		[userId]
	);

	if (result.rowCount !== 1 || !result.rows[0].banner_picture_url) return null;

	const filename = String(result.rows[0].banner_picture_url);
	if (basename(filename) !== filename) return null;
	const filepath = join(bannersDir, filename);

	try {
		const data = await readFile(filepath);
		const ext = filename.split('.').pop()?.toLowerCase();
		const mimeTypes: Record<string, string> = {
			png: 'image/png',
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			webp: 'image/webp'
		};

		return {
			data,
			mimeType: mimeTypes[ext ?? ''] ?? 'image/webp',
			hash: result.rows[0].banner_picture_hash ? String(result.rows[0].banner_picture_hash) : ''
		};
	} catch {
		return null;
	}
}

export async function saveBanner(
	userId: string,
	fileBuffer: Buffer,
	mimeType: string
): Promise<{ ok: true; filename: string } | { ok: false; reason: 'invalid_type' | 'too_large' | 'not_found' | 'rate_limited' }> {
	if (!(await enforceUserActionRateLimit('profile.banner.upload', userId, 4, 60))) {
		return { ok: false, reason: 'rate_limited' };
	}

	const detected = detectUploadSignature(fileBuffer);
	const expectedByMime: Record<string, string> = {
		'image/png': 'png',
		'image/jpeg': 'jpeg',
		'image/webp': 'webp'
	};
	if (!ALLOWED_AVATAR_TYPES.has(mimeType) || expectedByMime[mimeType] !== detected) {
		return { ok: false, reason: 'invalid_type' };
	}
	if (fileBuffer.byteLength > BANNER_MAX_BYTES) return { ok: false, reason: 'too_large' };

	const existing = await db.query(
		'select banner_picture_url from users where id = $1 and disabled_at is null',
		[userId]
	);

	if (existing.rowCount !== 1) return { ok: false, reason: 'not_found' };

	if (existing.rows[0].banner_picture_url) {
		try {
			await unlink(join(bannersDir, String(existing.rows[0].banner_picture_url)));
		} catch {
			// old file may already be gone
		}
	}

	await mkdir(bannersDir, { recursive: true });

	const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
	const filename = `${randomBytes(16).toString('hex')}.${ext}`;
	const filepath = join(bannersDir, filename);

	await writeFile(filepath, fileBuffer);

	const hash = createHash('sha256').update(fileBuffer).digest('hex');

	await db.query(
		`update users set banner_picture_url = $2, banner_picture_hash = $3, updated_at = now()
		 where id = $1 and disabled_at is null`,
		[userId, filename, hash]
	);
	await writeAudit(userId, 'profile.banner.update', 'user', userId, { filename });

	return { ok: true, filename };
}

export async function removeBanner(
	userId: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
	const existing = await db.query(
		'select banner_picture_url from users where id = $1 and disabled_at is null',
		[userId]
	);

	if (existing.rowCount !== 1) return { ok: false, reason: 'not_found' };

	if (existing.rows[0].banner_picture_url) {
		try {
			await unlink(join(bannersDir, String(existing.rows[0].banner_picture_url)));
		} catch {
			// file already gone
		}
	}

	await db.query(
		`update users set banner_picture_url = null, banner_picture_hash = null, updated_at = now()
		 where id = $1 and disabled_at is null`,
		[userId]
	);
	await writeAudit(userId, 'profile.banner.remove', 'user', userId, {});

	return { ok: true };
}


export async function updateUserColors(
	userId: string,
	input: { accentColor: string; avatarBackgroundColor: string }
): Promise<{ ok: true } | { ok: false; reason: 'invalid_input' | 'not_found' }> {
	const accentColor = input.accentColor.trim();
	const avatarBackgroundColor = input.avatarBackgroundColor.trim();

	if (!HEX_COLOR_RE.test(accentColor) || !HEX_COLOR_RE.test(avatarBackgroundColor)) {
		return { ok: false, reason: 'invalid_input' };
	}

	const result = await db.query(
		`update users set accent_color = $2, avatar_background_color = $3, updated_at = now()
		 where id = $1 and disabled_at is null
		 returning id`,
		[userId, accentColor || null, avatarBackgroundColor || null]
	);

	if (result.rowCount !== 1) return { ok: false, reason: 'not_found' };
	await writeAudit(userId, 'profile.colors.update', 'user', userId, {
		accentColor,
		avatarBackgroundColor
	});
	return { ok: true };
}

export function sanitizeUserSettings(input: Record<string, unknown>) {
	const settings: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(input)) {
		if (!ALLOWED_USER_SETTING_KEYS.has(key)) continue;

		if (key === 'theme') {
			if (value === 'system' || value === 'light' || value === 'dark') settings.theme = value;
			continue;
		}

		if (key === 'compactMode') {
			if (value === 'true' || value === 'false' || typeof value === 'boolean') {
				settings.compactMode = value === true || value === 'true';
			}
			continue;
		}

		if (key === 'avatarShape') {
			if (value === 'rounded-xl' || value === 'rounded-full') settings.avatarShape = value;
			continue;
		}

		if (key === 'bio' && typeof value === 'string') {
			settings.bio = value.trim().slice(0, 1000);
		}
	}

	return settings;
}

export async function updateUserSettings(
	userId: string,
	input: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; reason: 'invalid_input' | 'not_found' }> {
	const settings = sanitizeUserSettings(input);
	if (!Object.keys(settings).length) return { ok: false, reason: 'invalid_input' };
	if ('bio' in settings) {
		const bio = String(settings.bio ?? '').trim();
		settings.bio = bio.slice(0, 1000);
	}

	const result = await db.query(
		`update users set settings = coalesce(settings, '{}'::jsonb) || $2::jsonb, updated_at = now()
		 where id = $1 and disabled_at is null
		 returning id`,
		[userId, JSON.stringify(settings)]
	);

	if (result.rowCount !== 1) return { ok: false, reason: 'not_found' };
	await writeAudit(userId, 'profile.settings.update', 'user', userId, {
		keys: Object.keys(settings)
	});
	return { ok: true };
}

export type SearchResult = {
	id: string;
	firstName: string;
	lastName: string;
	displayName: string;
	role: string;
	profilePictureUrl: string | null;
	accentColor: string | null;
	avatarBackgroundColor: string | null;
	avatarShape: 'rounded-xl' | 'rounded-full';
	similarity: number;
};

export async function searchProfiles(query: string, limit = 20): Promise<SearchResult[]> {
	const normalized = query.trim();
	const safeLimit = Math.min(Math.max(limit, 1), 50);
	if (!normalized) return [];

	const terms = normalized.split(/\s+/).filter(Boolean).slice(0, 5);
	const likeQuery = `%${normalized}%`;

	const conditions = terms
		.map((_, i) => `
			(
				similarity(first_name, $${i + 1}) > 0.15
				or similarity(last_name, $${i + 1}) > 0.15
				or similarity(display_name, $${i + 1}) > 0.15
				or first_name ilike $${terms.length + 1}
				or last_name ilike $${terms.length + 1}
				or display_name ilike $${terms.length + 1}
			)
		`)
		.join(' or ');

	const args = [...terms, likeQuery, normalized];

	const result = await db.query(
		`
			select
				id, first_name, last_name, display_name, role,
				profile_picture_url, accent_color, avatar_background_color, settings,
				greatest(
					similarity(first_name, $${terms.length + 2}),
					similarity(last_name, $${terms.length + 2}),
					similarity(display_name, $${terms.length + 2})
				) as similarity
			from users
			where disabled_at is null
				and (${conditions})
			order by similarity desc
			limit $${terms.length + 3}
		`,
		[...args, safeLimit]
	);

	return result.rows.map((row) => ({
		id: String(row.id),
		firstName: String(row.first_name),
		lastName: String(row.last_name),
		displayName: String(row.display_name),
		role: String(row.role),
		profilePictureUrl: row.profile_picture_url ? String(row.profile_picture_url) : null,
		accentColor: row.accent_color ? String(row.accent_color) : null,
		avatarBackgroundColor: row.avatar_background_color ? String(row.avatar_background_color) : null,
		avatarShape: resolveAvatarShape((row.settings as Record<string, unknown>) ?? {}),
		similarity: Number(row.similarity)
	}));
}

export type SearchProfilesPage = {
	results: SearchResult[];
	total: number;
	limit: number;
	offset: number;
};

export async function searchProfilesPaged(
	query: string,
	limit = 10,
	offset = 0
): Promise<SearchProfilesPage> {
	const normalized = query.trim();
	const safeLimit = Math.min(Math.max(limit, 1), 50);
	const safeOffset = Math.max(offset, 0);

	if (!normalized) {
		return {
			results: [],
			total: 0,
			limit: safeLimit,
			offset: safeOffset
		};
	}

	const likeQuery = `%${normalized}%`;

	const whereSql = `
		disabled_at is null
		and (
			first_name ilike $1
			or last_name ilike $1
			or display_name ilike $1
			or similarity(first_name, $2) > 0.15
			or similarity(last_name, $2) > 0.15
			or similarity(display_name, $2) > 0.15
		)
	`;

	const [countResult, result] = await Promise.all([
		db.query(
			`
				select count(*)::int as total
				from users
				where ${whereSql}
			`,
			[likeQuery, normalized]
		),
		db.query(
			`
				select
					id,
					first_name,
					last_name,
					display_name,
					role,
					profile_picture_url,
					accent_color,
					avatar_background_color,
					settings,
					greatest(
					similarity(first_name, $2),
					similarity(last_name, $2),
					similarity(display_name, $2)
				) as similarity
				from users
				where ${whereSql}
				order by
					case
						when display_name ilike $1 then 0
						else 1
					end,
					similarity desc,
					display_name asc
				limit $3
				offset $4
			`,
			[likeQuery, normalized, safeLimit, safeOffset]
		)
	]);

	return {
		total: Number(countResult.rows[0]?.total ?? 0),
		limit: safeLimit,
		offset: safeOffset,
		results: result.rows.map((row) => ({
			id: String(row.id),
			firstName: String(row.first_name),
			lastName: String(row.last_name),
			displayName: String(row.display_name),
			role: String(row.role),
			profilePictureUrl: row.profile_picture_url ? String(row.profile_picture_url) : null,
			accentColor: row.accent_color ? String(row.accent_color) : null,
			avatarBackgroundColor: row.avatar_background_color ? String(row.avatar_background_color) : null,
			avatarShape: resolveAvatarShape((row.settings as Record<string, unknown>) ?? {}),
			similarity: Number(row.similarity)
		}))
	};
}
