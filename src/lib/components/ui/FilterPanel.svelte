<script lang="ts">
	type Props = {
		title?: string;
		children?: import('svelte').Snippet;
	};

	let { title = 'Filters', children }: Props = $props();
</script>

<div class="space-y-3">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{@render children?.()}
	</div>
</div>
