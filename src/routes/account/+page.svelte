<script lang="ts">
	let { data, form } = $props();

	const settings = $derived((data.user.settings as Record<string, unknown>) || {});
	const currentTheme = $derived(String(settings.theme ?? 'system'));

	let themeStatus = $state<'idle' | 'saving' | 'saved'>('idle');

	async function handleThemeChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const theme = select.value;
		themeStatus = 'saving';

		const formData = new FormData();
		formData.append('theme', theme);

		try {
			const res = await fetch('?/settings', {
				method: 'POST',
				body: formData
			});

			themeStatus = res.ok ? 'saved' : 'idle';

			if (res.ok) {
				if (theme === 'light' || theme === 'dark') {
					document.documentElement.dataset.theme = theme;
				} else {
					delete document.documentElement.dataset.theme;
				}

				setTimeout(() => (themeStatus = 'idle'), 1500);
			}
		} catch {
			themeStatus = 'idle';
		}
	}

	async function handleCompactModeChange(e: Event) {
		const checkbox = e.target as HTMLInputElement;
		const formData = new FormData();
		formData.append('compactMode', checkbox.checked ? 'true' : 'false');

		try {
			await fetch('?/settings', {
				method: 'POST',
				body: formData
			});
		} catch {
			checkbox.checked = !checkbox.checked;
		}
	}
</script>

<section class="settings-page-v2">
	<header class="settings-top">
		<div>
			<p class="settings-eyebrow">Settings</p>
			<h1>{data.user.displayName}</h1>
		</div>

		<a href={`/profile/${data.user.id}`} class="btn-ghost">View profile</a>
	</header>

	<div class="settings-shell">
		<aside class="settings-sidebar" aria-label="Settings sections">
			<a href="#account" class="settings-sidebar-link active">Account</a>
			<a href="#preferences" class="settings-sidebar-link">Preferences</a>
			{#if data.user.role === 'admin'}
				<a href="#server" class="settings-sidebar-link">Server</a>
			{/if}
			<a href="#security" class="settings-sidebar-link danger">Security</a>
		</aside>

		<div class="settings-content">
			<section id="account" class="settings-section">
				<div class="settings-section-heading">
					<h2>Account</h2>
					<p>Basic account information and profile access.</p>
				</div>

				<div class="settings-row">
					<div>
						<h3>Profile</h3>
						<p>Your public student profile and visible account details.</p>
					</div>

					<a href={`/profile/${data.user.id}`} class="btn-ghost">Open profile</a>
				</div>

				<div class="settings-row">
					<div>
						<h3>Email</h3>
						<p>{data.user.email}</p>
					</div>
				</div>

				<div class="settings-row">
					<div>
						<h3>Role</h3>
						<p>{data.user.role}</p>
					</div>
				</div>
			</section>

			<section id="preferences" class="settings-section">
				<div class="settings-section-heading">
					<h2>Preferences</h2>
					<p>Configure how Student Hub looks and behaves.</p>
				</div>

				<div class="settings-row">
					<div>
						<h3>Theme</h3>
						<p>Choose light mode, dark mode, or follow your system.</p>
					</div>

					<div class="settings-control">
						<select name="theme" onchange={handleThemeChange} aria-label="Theme">
							<option value="system" selected={currentTheme === 'system'}>System</option>
							<option value="light" selected={currentTheme === 'light'}>Light</option>
							<option value="dark" selected={currentTheme === 'dark'}>Dark</option>
						</select>

						{#if themeStatus === 'saving'}
							<span class="settings-status-muted">Saving...</span>
						{:else if themeStatus === 'saved'}
							<span class="settings-status-success">Saved</span>
						{/if}
					</div>
				</div>

				<div class="settings-row">
					<div>
						<h3>Compact layout</h3>
						<p>Reduce spacing where possible.</p>
					</div>

					<label class="settings-switch">
						<input
							name="compactMode"
							type="checkbox"
							checked={String(settings.compactMode) === 'true'}
							onchange={handleCompactModeChange}
						/>
						<span>Enabled</span>
					</label>
				</div>
			</section>

			{#if data.user.role === 'admin'}
				<section id="server" class="settings-section">
					<div class="settings-section-heading">
						<h2>Server</h2>
						<p>Application-wide admin controls and storage reporting.</p>
					</div>

					<div class="settings-row">
						<div>
							<h3>Server settings</h3>
							<p>Manage auto-verification behavior and inspect file storage by user.</p>
						</div>

						<a href="/admin/server-settings" class="btn-ghost">Open server settings</a>
					</div>
				</section>
			{/if}

			<section id="security" class="settings-section danger-section">
				<div class="settings-section-heading">
					<h2>Security</h2>
					<p>Change your password and control active sessions.</p>
				</div>

				<form class="settings-security-form" method="POST" action="?/password">
					<div class="settings-row stacked">
						<div>
							<h3>Password</h3>
							<p>Use at least 12 characters. Avoid reusing passwords from other sites.</p>
						</div>

						<div class="settings-form-grid">
							<label>
								<span>Current password</span>
								<input
									name="currentPassword"
									type="password"
									autocomplete="current-password"
									required
								/>
							</label>

							<label>
								<span>New password</span>
								<input
									name="newPassword"
									type="password"
									autocomplete="new-password"
									minlength="12"
									required
								/>
							</label>

							<label class="settings-switch inline">
								<input name="signOutOtherSessions" type="checkbox" checked />
								<span>Sign out other sessions</span>
							</label>

							{#if form?.type === 'password'}
								<p class={form.message === 'Password updated.' ? 'form-success' : 'form-error'}>
									{form.message}
								</p>
							{/if}

							<p class="settings-danger-note">
								Changing your password keeps this session active unless you sign out other sessions.
							</p>

							<div>
								<button type="submit" class="btn btn-danger">Update password</button>
							</div>
						</div>
					</div>
				</form>
			</section>
		</div>
	</div>
</section>
