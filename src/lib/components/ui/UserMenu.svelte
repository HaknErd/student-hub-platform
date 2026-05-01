<script lang="ts">
	import type { User } from '$lib/auth';
	import Avatar from '$lib/components/Avatar.svelte';

	type Props = {
		user: User;
		onLogout: () => void;
	};

	let { user, onLogout }: Props = $props();
	let menuRoot: HTMLDivElement | null = null;
	let menuDetails: HTMLDetailsElement | null = null;

	function closeMenu() {
		if (menuDetails) menuDetails.open = false;
	}

	function handleDocumentPointerDown(event: PointerEvent) {
		if (!menuDetails?.open || !menuRoot) return;
		const target = event.target as Node | null;
		if (target && !menuRoot.contains(target)) closeMenu();
	}

	function handleDocumentKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeMenu();
	}

	$effect(() => {
		document.addEventListener('pointerdown', handleDocumentPointerDown);
		document.addEventListener('keydown', handleDocumentKeyDown);
		return () => {
			document.removeEventListener('pointerdown', handleDocumentPointerDown);
			document.removeEventListener('keydown', handleDocumentKeyDown);
		};
	});
</script>

<div class="relative flex h-10 items-center rounded-md border border-border bg-bg px-1" bind:this={menuRoot}>
	<details class="static" bind:this={menuDetails}>
		<summary
			class="flex h-8 cursor-pointer list-none items-center rounded-md px-2 text-sm text-text transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
		>
			<span class="block max-w-32 truncate">{user.displayName}</span>
		</summary>
		<div class="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-52 rounded-lg border border-border bg-surface p-1 shadow-xl">
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
	<a
		href={`/profile/${user.id}`}
		class="ml-1 rounded-full p-0 no-underline transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
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
</div>
