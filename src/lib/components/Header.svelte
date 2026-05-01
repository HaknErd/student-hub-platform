<script lang="ts">
	import type { User } from '$lib/auth';
	import Avatar from '$lib/components/Avatar.svelte';

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
	<div class="site-header__inner">
		<a class="site-brand" href="/">Student Hub</a>

		<div class="site-header__right">
			<nav class="site-nav" aria-label="Primary">
				<a href="/">Home</a>
				<a href="/resources">Resources</a>
				{#if user}
					<a href="/search">Search</a>
					<a href="/account">Settings</a>
				{/if}
			</nav>

			{#if user}
				<form class="header-search" method="GET" action="/search">
					<input
						type="search"
						name="q"
						placeholder="Search..."
						autocomplete="off"
						aria-label="Search people and resources"
					/>
				</form>
			{/if}

			<button
				type="button"
				class="mobile-menu-toggle"
				aria-label="Toggle navigation menu"
				aria-expanded={mobileMenuOpen}
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			>
				<span></span>
				<span></span>
				<span></span>
			</button>

			{#if user}
				<div class="auth-chip" aria-label="Logged in as">
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
					<a class="auth-chip__value" href={`/profile/${user.id}`}>{user.displayName}</a>
					<button type="button" class="auth-chip__action" onclick={logout}>Logout</button>
				</div>
			{:else}
				<a class="auth-login" href="/login">Login</a>
			{/if}
		</div>
	</div>

	{#if mobileMenuOpen}
		<nav class="mobile-nav" aria-label="Mobile navigation">
			<a href="/" onclick={closeMobileMenu}>Home</a>
			<a href="/resources" onclick={closeMobileMenu}>Resources</a>

			{#if user}
				<a href="/search" onclick={closeMobileMenu}>Search</a>
				<a href={`/profile/${user.id}`} onclick={closeMobileMenu}>Profile</a>
				<a href="/account" onclick={closeMobileMenu}>Settings</a>

				{#if ['prefect', 'teacher', 'admin'].includes(user.role)}
					<a href="/moderation" onclick={closeMobileMenu}>Moderation</a>
				{/if}

				{#if user.role === 'admin'}
					<a href="/admin/server-settings" onclick={closeMobileMenu}>Server</a>
				{/if}

				<button type="button" onclick={logout}>Logout</button>
			{:else}
				<a href="/login" onclick={closeMobileMenu}>Login</a>
			{/if}
		</nav>
	{/if}
</header>
