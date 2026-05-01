<script lang="ts">
	type Tab = { id: string; label: string };
	type Props = {
		tabs: Tab[];
		activeTab: string;
		basePath?: string;
		children?: import('svelte').Snippet;
	};

	let { tabs, activeTab, basePath = '/account', children }: Props = $props();
</script>

<div class="grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
	<nav class="md:sticky md:top-20" aria-label="Settings sections">
		<div class="hidden space-y-1 md:block">
			{#each tabs as tab}
				<a
					href={`${basePath}?tab=${tab.id}`}
					class={`block rounded-md px-3 py-2 text-sm no-underline transition ${activeTab === tab.id ? 'bg-bg text-text border border-border' : 'text-text-muted hover:bg-surface hover:text-text'}`}
				>
					{tab.label}
				</a>
			{/each}
		</div>
		<select
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text md:hidden"
			onchange={(e) => (location.href = `${basePath}?tab=${(e.currentTarget as HTMLSelectElement).value}`)}
			value={activeTab}
			aria-label="Settings section"
		>
			{#each tabs as tab}
				<option value={tab.id}>{tab.label}</option>
			{/each}
		</select>
	</nav>
	<div>
		{@render children?.()}
	</div>
</div>
