<script lang="ts">
	type Props = {
		title: string;
		description?: string;
		children?: import('svelte').Snippet;
	};

	let { title, description = '', children }: Props = $props();
</script>

<div class="flex flex-col gap-3 border-t border-border py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
	<div class="min-w-0">
		<h3 class="text-sm font-medium text-text">{title}</h3>
		{#if description}
			<p class="text-sm text-text-muted">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="shrink-0">{@render children()}</div>
	{/if}
</div>
