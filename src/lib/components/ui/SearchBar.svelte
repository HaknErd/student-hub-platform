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
		class="field-control w-full"
	/>
	{#if children}
		{@render children()}
	{/if}
	<button type="submit" class="btn shrink-0">Search</button>
</form>
