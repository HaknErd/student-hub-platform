<script lang="ts">
	type Props = {
		title: string;
		count?: number;
		children?: import('svelte').Snippet;
	};

	let { title, count = undefined, children }: Props = $props();
</script>

<header class="mb-3 flex items-center justify-between gap-3">
	<div class="flex items-center gap-2">
		<h2 class="text-base font-semibold text-text">{title}</h2>
		{#if count !== undefined}
			<span class="rounded-md border border-border bg-bg px-2 py-0.5 text-xs text-text-muted">{count}</span>
		{/if}
	</div>
	{#if children}
		<div>{@render children()}</div>
	{/if}
</header>
