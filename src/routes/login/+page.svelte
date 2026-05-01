<script lang="ts">
	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state('');

	async function login() {
		busy = true;
		error = '';

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

		if (!response.ok) {
			error = response.status === 429
				? 'Too many login attempts. Try again later.'
				: 'Invalid email or password.';
			return;
		}

			location.href = '/';
		} finally {
			busy = false;
		}
	}
</script>

<section class="auth-page">
	<h1>Login</h1>

	<form class="form" onsubmit={(e) => (e.preventDefault(), login())}>
		<label>
			<span>Email</span>
			<input bind:value={email} type="email" autocomplete="email" placeholder="student@sgsc-students.com" />
		</label>
		<label>
			<span>Password</span>
			<input bind:value={password} type="password" autocomplete="current-password" />
		</label>
		{#if error}
			<p class="form-error">{error}</p>
		{/if}
		<button class="btn" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
	</form>
</section>
