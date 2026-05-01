<script lang="ts">
	import type { User } from '$lib/auth';
	import Avatar from '$lib/components/Avatar.svelte';

	type Props = {
		user: User;
		onLogout: () => void;
	};

	let { user, onLogout }: Props = $props();
</script>

<div class="relative flex items-center gap-2">
	<a
		href={`/profile/${user.id}`}
		class="rounded-md border border-border bg-bg p-1 no-underline transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
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
	<details class="relative">
		<summary
			class="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-text transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
		>
			<span class="hidden max-w-32 truncate sm:block">{user.displayName}</span>
			<span aria-hidden="true">▾</span>
		</summary>
		<div class="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-surface p-1 shadow-xl">
			<a class="block rounded-md px-3 py-2 text-sm text-text no-underline hover:bg-bg" href={`/profile/${user.id}`}>Profile</a>
			<a class="block rounded-md px-3 py-2 text-sm text-text no-underline hover:bg-bg" href="/account">Account</a>
			{#if ['prefect', 'teacher', 'admin'].includes(user.role)}
				<a class="block rounded-md px-3 py-2 text-sm text-text no-underline hover:bg-bg" href="/moderation">Moderation</a>
			{/if}
			{#if user.role === 'admin'}
				<a class="block rounded-md px-3 py-2 text-sm text-text no-underline hover:bg-bg" href="/admin/server-settings">Server</a>
			{/if}
			<button type="button" class="mt-1 block w-full rounded-md px-3 py-2 text-left text-sm text-text-muted hover:bg-bg hover:text-text" onclick={onLogout}>Logout</button>
		</div>
	</details>
</div>
