<script lang="ts">
	import type { User } from '$lib/auth';
	import Avatar from '$lib/components/Avatar.svelte';
	import UserMenu from '$lib/components/ui/UserMenu.svelte';
	import MobileNav from '$lib/components/ui/MobileNav.svelte';

	type Props = {
		user?: User | null;
	};

	let { user = null }: Props = $props();

	let mobileMenuOpen = $state(false);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	async function logout() {
		const res = await fetch('/api/auth/logout', { method: 'POST' });
		if (res.ok) location.href = '/';
	}
</script>

<header class="site-header">
	<div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
		<a class="site-brand shrink-0" href="/">Student Hub</a>
		<nav class="hidden items-center gap-1 md:flex" aria-label="Primary">
			<a class="rounded-md px-3 py-2 text-sm text-text-muted no-underline hover:bg-bg hover:text-text" href="/">Home</a>
			<a class="rounded-md px-3 py-2 text-sm text-text-muted no-underline hover:bg-bg hover:text-text" href="/resources">Resources</a>
			{#if user}
				<a class="rounded-md px-3 py-2 text-sm text-text-muted no-underline hover:bg-bg hover:text-text" href="/search">Search</a>
			{/if}
		</nav>
		{#if user}
			<form class="ml-auto hidden w-full max-w-sm md:block" method="GET" action="/search">
				<input
					type="search"
					name="q"
					placeholder="Search users or resources"
					autocomplete="off"
					aria-label="Global search"
					class="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
				/>
			</form>
			<div class="ml-auto hidden md:block">
				<UserMenu {user} onLogout={logout} />
			</div>
		{:else}
			<a class="ml-auto hidden rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text-muted no-underline hover:bg-surface hover:text-text md:inline-flex" href="/login">Login</a>
		{/if}
		<div class="ml-auto flex items-center gap-2 md:hidden">
			<button
				type="button"
				class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-bg text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
				aria-label="Toggle navigation menu"
				aria-expanded={mobileMenuOpen}
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			>
				<span class="flex flex-col items-center justify-center gap-1">
					<span class="block h-0.5 w-4 rounded-full bg-current"></span>
					<span class="block h-0.5 w-4 rounded-full bg-current"></span>
					<span class="block h-0.5 w-4 rounded-full bg-current"></span>
				</span>
			</button>
			{#if user}
				<a
					href={`/profile/${user.id}`}
					class="inline-flex h-10 w-10 items-center justify-center rounded-full no-underline transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
					aria-label={`${user.displayName} profile`}
				>
					<Avatar
						userId={user.id}
						firstName={user.firstName}
						lastName={user.lastName}
						profilePictureUrl={user.profilePictureUrl}
						accentColor={user.accentColor}
						avatarBackgroundColor={user.avatarBackgroundColor}
						avatarShape={user.avatarShape}
						size="sm"
					/>
				</a>
			{/if}
		</div>
	</div>

	<MobileNav {user} open={mobileMenuOpen} onClose={closeMobileMenu} onLogout={logout} />
</header>
