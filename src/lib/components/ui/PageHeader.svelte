<script lang="ts">
	type Props = {
		title: string;
		description?: string;
		actions?: import('svelte').Snippet;
	};

	let { title, description = '', actions }: Props = $props();
</script>

<header class="flex items-start justify-between gap-4">
	<div class="space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight text-text sm:text-3xl">{title}</h1>
		{#if description}
			<p class="text-sm text-text-muted">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="shrink-0">{@render actions()}</div>
	{/if}
</header>
