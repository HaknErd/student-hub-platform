<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		filteredCount: number;
		totalCount: number;
		hasActiveFilters?: boolean;
		emptyText: string;
		filteredEmptyText?: string;
		children: Snippet;
	};

	let {
		title,
		filteredCount,
		totalCount,
		hasActiveFilters = false,
		emptyText,
		filteredEmptyText = emptyText,
		children
	}: Props = $props();
</script>

<section class="search-group moderation-results-group">
	<header class="search-group-header">
		<h2>{title}</h2>
		<span>{filteredCount} of {totalCount}</span>
	</header>

	{#if filteredCount === 0}
		<p class="search-group-empty">
			{hasActiveFilters ? filteredEmptyText : emptyText}
		</p>
	{:else}
		{@render children()}
	{/if}
</section>
