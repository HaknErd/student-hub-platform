<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		title?: string;
		children: Snippet;
	};

	let { label, title = 'Filters', children }: Props = $props();
</script>

<aside class="search-filter-rail moderation-filter-rail" aria-label={label}>
	<div class="rail-card">
		<h2>{title}</h2>
		{@render children()}
	</div>
</aside>
