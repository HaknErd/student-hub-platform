<script lang="ts">
	import type { User } from '$lib/auth';
	type Props = {
		user?: User | null;
		open: boolean;
		onClose: () => void;
		onLogout: () => void;
	};
	let { user = null, open, onClose, onLogout }: Props = $props();
</script>

{#if open}
	<div class="border-t border-border bg-surface px-4 py-3 md:hidden">
		<nav class="grid gap-1" aria-label="Mobile navigation">
			<a class="rounded-md px-3 py-2 text-sm no-underline text-text hover:bg-bg" href="/" onclick={onClose}>Home</a>
			<a class="rounded-md px-3 py-2 text-sm no-underline text-text hover:bg-bg" href="/resources" onclick={onClose}>Resources</a>
			{#if user}
				<a class="rounded-md px-3 py-2 text-sm no-underline text-text hover:bg-bg" href="/search" onclick={onClose}>Search</a>
				<a class="rounded-md px-3 py-2 text-sm no-underline text-text hover:bg-bg" href={`/profile/${user.id}`} onclick={onClose}>Profile</a>
				<a class="rounded-md px-3 py-2 text-sm no-underline text-text hover:bg-bg" href="/account" onclick={onClose}>Account</a>
				<button type="button" class="rounded-md px-3 py-2 text-left text-sm text-text-muted hover:bg-bg hover:text-text" onclick={onLogout}>Logout</button>
			{:else}
				<a class="rounded-md px-3 py-2 text-sm no-underline text-text hover:bg-bg" href="/login" onclick={onClose}>Login</a>
			{/if}
		</nav>
	</div>
{/if}
