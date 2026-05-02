import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { loginWithPassword } from '$lib/server/auth';
import { isTrustedPost } from '$lib/server/request';

export const actions: Actions = {
	default: async (event) => {
		if (!isTrustedPost(event)) {
			return fail(403, { error: 'Invalid request origin.' });
		}

		const form = await event.request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.' });
		}

		const result = await loginWithPassword(event, email, password);
		if (!result.ok) {
			if (result.reason === 'rate_limited') {
				return fail(429, { error: 'Too many login attempts. Try again later.' });
			}
			return fail(401, { error: 'Invalid email or password.' });
		}

		throw redirect(303, '/');
	}
};
