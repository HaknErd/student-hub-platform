<script lang="ts">
	import type { Snippet } from 'svelte';

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

<form id={formId} class="search-bar-full search-bar-main moderation-search-bar" method="GET" {action}>
	<input type="search" name="q" {placeholder} value={query} autocomplete="off" />

	<div class="moderation-search-actions">
		<button type="submit" class="btn">Search</button>

		{#if hasActiveFilters && clearHref}
			<a class="btn-ghost" href={clearHref}>Clear</a>
		{/if}
	</div>

	{#if children}
		{@render children()}
	{/if}
</form>
