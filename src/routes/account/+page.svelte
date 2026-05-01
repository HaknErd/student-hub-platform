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
			if (res.ok) setTimeout(() => (themeStatus = 'idle'), 1500);
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

<section class="settings-page">
	<header class="settings-header">
		<div>
			<p class="settings-header-label">Settings</p>
			<h1 class="settings-header-title">{data.user.displayName}</h1>
		</div>
		<a href={`/profile/${data.user.id}`} class="btn-ghost">View profile</a>
	</header>

	<div class="settings-layout">
		<section class="settings-card settings-card-danger">
			<header class="settings-card-header settings-card-header-danger">
				<h2>Security</h2>
				<p>Change your password and manage active sessions.</p>
			</header>

			<form class="settings-form" method="POST" action="?/password">
				<label class="settings-field">
					<span class="settings-field-label">Current password</span>
					<input
						name="currentPassword"
						type="password"
						autocomplete="current-password"
						required
					/>
				</label>
				<label class="settings-field">
					<span class="settings-field-label">New password</span>
					<input
						name="newPassword"
						type="password"
						autocomplete="new-password"
						minlength="12"
						required
					/>
				</label>
				<label class="check-field">
					<input name="signOutOtherSessions" type="checkbox" checked />
					<span>Sign out other sessions</span>
				</label>

				{#if form?.type === 'password'}
					<p class={form.message === 'Password updated.' ? 'form-success' : 'form-error'}>
						{form.message}
					</p>
				{/if}

				<div class="settings-warning">
					Changing your password will not sign you out of this session unless you check the box above.
				</div>

				<button type="submit" class="btn btn-danger">Update password</button>
			</form>
		</section>

		<section class="settings-card">
			<header class="settings-card-header">
				<h2>Preferences</h2>
				<p>Configure your Student Hub experience.</p>
			</header>

			<div class="settings-form">
				<label class="settings-field">
					<span class="settings-field-label">Theme</span>
					<div class="settings-field-with-status">
						<select name="theme" onchange={handleThemeChange}>
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
				</label>

				<label class="check-field">
					<input
						name="compactMode"
						type="checkbox"
						checked={String(settings.compactMode) === 'true'}
						onchange={handleCompactModeChange}
					/>
					<span>Compact layout</span>
				</label>
			</div>
		</section>
	</div>
</section>
