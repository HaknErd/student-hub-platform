<script lang="ts">
	import type { Snippet } from 'svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';

	type Props = {
		formId: string;
		action: string;
		query: string;
		placeholder: string;
		hasActiveFilters?: boolean;
		clearHref?: string;
		children?: Snippet;
	};

	let {
		formId,
		action,
		query,
		placeholder,
		hasActiveFilters = false,
		clearHref,
		children
	}: Props = $props();
</script>

<div class="moderation-search-bar">
<SearchBar id={formId} {action} query={query} {placeholder}>
	{#snippet children()}
		{#if hasActiveFilters && clearHref}
			<a class="btn-secondary" href={clearHref}>Clear</a>
		{/if}
	{/snippet}
</SearchBar>
	{#if children}
		{@render children()}
	{/if}
</div>
