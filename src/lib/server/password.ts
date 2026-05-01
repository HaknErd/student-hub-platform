import { scrypt, timingSafeEqual, randomBytes, type ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_PARAMS = {
	N: 16_384,
	r: 8,
	p: 1
} as const;

function scryptAsync(password: string, salt: Buffer, keyLength: number, options: ScryptOptions) {
	return new Promise<Buffer>((resolve, reject) => {
		scrypt(password, salt, keyLength, options, (error, derivedKey) => {
			if (error) reject(error);
			else resolve(derivedKey);
		});
	});
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const derived = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);

	return [
		'scrypt',
		'v1',
		SCRYPT_PARAMS.N,
		SCRYPT_PARAMS.r,
		SCRYPT_PARAMS.p,
		salt.toString('base64url'),
		derived.toString('base64url')
	].join('$');
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
	const [algorithm, version, n, r, p, salt, hash] = passwordHash.split('$');
	if (algorithm !== 'scrypt' || version !== 'v1' || !n || !r || !p || !salt || !hash) {
		return false;
	}

	const expected = Buffer.from(hash, 'base64url');
	const actual = await scryptAsync(password, Buffer.from(salt, 'base64url'), expected.length, {
		N: Number(n),
		r: Number(r),
		p: Number(p)
	});

	return expected.length === actual.length && timingSafeEqual(expected, actual);
}
