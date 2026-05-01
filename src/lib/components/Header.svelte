<script lang="ts">
	import type { User } from '$lib/auth';
	import Avatar from '$lib/components/Avatar.svelte';

	type Props = {
		user?: User | null;
	};

	let { user = null }: Props = $props();

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		location.href = '/';
	}
</script>

<header class="site-header">
	<div class="site-header__inner">
		<a class="site-brand" href="/">Student Hub</a>

		<div class="site-header__right">
			<nav class="site-nav" aria-label="Primary">
				<a href="/">Home</a>
				<a href="/about">About</a>
				{#if user}
					<a href={`/profile/${user.id}`}>Profile</a>
					<a href="/account">Settings</a>
				{/if}
			</nav>

			<form class="header-search" method="GET" action="/search" onsubmit={(e) => {
				const form = e.currentTarget;
				setTimeout(() => form.reset(), 10);
			}}>
				<input
					type="search"
					name="q"
					placeholder="Search..."
					autocomplete="off"
					aria-label="Search people and resources"
				/>
			</form>

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
</header>
