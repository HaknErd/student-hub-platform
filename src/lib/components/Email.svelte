<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		email: string;
		children?: Snippet;
	};

	let { email, children }: Props = $props();
</script>

<a
	href={`mailto:${email}`}
	class="text-primary underline hover:opacity-80"
>
	{#if children}
		{@render children()}
	{:else}
		{email}
	{/if}
</a>
