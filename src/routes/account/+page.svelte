<script lang="ts">
	import { page } from '$app/state';
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';
	import SettingsLayout from '$lib/components/ui/SettingsLayout.svelte';
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte';

	let { data, form } = $props();

	const settings = $derived((data.user.settings as Record<string, unknown>) || {});
	const currentTheme = $derived(String(settings.theme ?? 'system'));
	const tabs = $derived([
		{ id: 'account', label: 'Account' },
		{ id: 'preferences', label: 'Preferences' },
		...(data.user.role === 'admin' ? [{ id: 'server', label: 'Server' }] : []),
		{ id: 'security', label: 'Security' }
	]);
	const activeTab = $derived(page.url.searchParams.get('tab') || 'account');

	let themeStatus = $state<'idle' | 'saving' | 'saved'>('idle');

	async function handleThemeChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const theme = select.value;
		themeStatus = 'saving';
		const formData = new FormData();
		formData.append('theme', theme);
		try {
			const res = await fetch('?/settings', { method: 'POST', body: formData });
			themeStatus = res.ok ? 'saved' : 'idle';
			if (res.ok) {
				if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
				else delete document.documentElement.dataset.theme;
				setTimeout(() => (themeStatus = 'idle'), 1200);
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
			await fetch('?/settings', { method: 'POST', body: formData });
		} catch {
			checkbox.checked = !checkbox.checked;
		}
	}
</script>

<PageShell wide={true}>
	<PageHeader title="Settings" description={`${data.user.displayName} account configuration`} />
	<SettingsLayout {tabs} {activeTab}>
		{#if activeTab === 'account'}
			<Card>
				<SettingsRow title="Profile" description="Public student profile and visible account details.">
					<a href={`/profile/${data.user.id}`} class="btn-ghost h-9 px-3">View profile</a>
				</SettingsRow>
				<SettingsRow title="Email" description={data.user.email} />
				<SettingsRow title="Role" description={data.user.role} />
			</Card>
		{:else if activeTab === 'preferences'}
			<Card>
				<SettingsRow title="Theme" description="Choose light mode, dark mode, or system setting.">
					<div class="flex items-center gap-2">
						<select class="h-9 rounded-md border border-border bg-bg px-3 text-sm text-text" name="theme" onchange={handleThemeChange} aria-label="Theme">
							<option value="system" selected={currentTheme === 'system'}>System</option>
							<option value="light" selected={currentTheme === 'light'}>Light</option>
							<option value="dark" selected={currentTheme === 'dark'}>Dark</option>
						</select>
						{#if themeStatus === 'saving'}<span class="text-xs text-text-muted">Saving...</span>{/if}
						{#if themeStatus === 'saved'}<span class="text-xs text-green-600">Saved</span>{/if}
					</div>
				</SettingsRow>
				<SettingsRow title="Compact layout" description="Reduce spacing where possible.">
					<label class="check-field">
						<input
							name="compactMode"
							type="checkbox"
							checked={settings.compactMode === true || settings.compactMode === 'true'}
							onchange={handleCompactModeChange}
						/>
						<span>Enabled</span>
					</label>
				</SettingsRow>
			</Card>
		{:else if activeTab === 'server' && data.user.role === 'admin'}
			<Card>
				<SettingsRow title="Server settings" description="Application-wide admin controls and storage reporting.">
					<a href="/admin/server-settings" class="btn-ghost h-9 px-3">Open server settings</a>
				</SettingsRow>
			</Card>
		{:else if activeTab === 'security'}
			<Card className="max-w-2xl">
				<form class="space-y-4" method="POST" action="?/password">
					<div class="space-y-1">
						<h2 class="text-base font-semibold text-text">Password</h2>
						<p class="text-sm text-text-muted">Use at least 12 characters and avoid reused passwords.</p>
					</div>
					<div class="grid gap-3">
						<label class="grid gap-1 text-sm text-text-muted">
							<span>Current password</span>
							<input class="h-10 rounded-md border border-border bg-bg px-3 text-text" name="currentPassword" type="password" autocomplete="current-password" required />
						</label>
						<label class="grid gap-1 text-sm text-text-muted">
							<span>New password</span>
							<input class="h-10 rounded-md border border-border bg-bg px-3 text-text" name="newPassword" type="password" autocomplete="new-password" minlength="12" required />
						</label>
						<label class="check-field">
							<input name="signOutOtherSessions" type="checkbox" checked />
							<span>Sign out other sessions</span>
						</label>
						{#if form?.type === 'password'}
							<p class={form.message === 'Password updated.' ? 'form-success' : 'form-error'}>{form.message}</p>
						{/if}
						<button type="submit" class="btn mt-0 w-fit">Update password</button>
					</div>
				</form>
			</Card>
		{/if}
	</SettingsLayout>
</PageShell>
