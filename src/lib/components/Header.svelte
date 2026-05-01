<script lang="ts">
	import type { User } from '$lib/auth';
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
		<button
			type="button"
			class="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-bg text-text md:hidden"
			aria-label="Toggle navigation menu"
			aria-expanded={mobileMenuOpen}
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
		>
			☰
		</button>
	</div>

	<MobileNav {user} open={mobileMenuOpen} onClose={closeMobileMenu} onLogout={logout} />
</header>
