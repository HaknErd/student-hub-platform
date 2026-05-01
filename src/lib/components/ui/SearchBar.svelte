<script lang="ts">
	type Props = {
		id?: string;
		action: string;
		query?: string;
		placeholder?: string;
		children?: import('svelte').Snippet;
	};

	let { id = undefined, action, query = '', placeholder = 'Search...', children }: Props = $props();
</script>

<form {id} method="GET" {action} class="flex flex-col gap-3 sm:flex-row">
	<input
		type="search"
		name="q"
		value={query}
		placeholder={placeholder}
		class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
	/>
	{#if children}
		{@render children()}
	{/if}
	<button type="submit" class="btn mt-0 shrink-0">Search</button>
</form>
