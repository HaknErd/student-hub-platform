<script lang="ts">
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';
	import ResultCard from '$lib/components/ui/ResultCard.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';

	let { data } = $props();

	const hasQuery = $derived(Boolean(data.query.trim()));
	const showUsers = $derived(data.type === 'any' || data.type === 'users');
	const showContent = $derived(data.type === 'any' || data.type === 'content');
	const previousPage = $derived(Math.max(data.page - 1, 1));
	const nextPage = $derived(Math.min(data.page + 1, data.totalPages));
	const contentNextPage = $derived(Math.min(data.page + 1, data.contentTotalPages));

	function pageHref(page: number) {
		const params = new URLSearchParams();
		params.set('q', data.query);
		params.set('type', data.type);
		params.set('page', String(page));
		return `/search?${params.toString()}`;
	}
</script>

<PageShell wide={true}>
	<PageHeader
		title={hasQuery ? `Results for "${data.query}"` : 'Search'}
		description={hasQuery
			? `Found ${data.total} ${data.total === 1 ? 'result' : 'results'} in ${data.tookMs} ms`
			: 'Find students and resources.'}
	/>

	<section class="border-b border-border pb-5">
		<SearchBar id="search-form" action="/search" query={data.query} placeholder="Search users and content...">
			<select
				name="type"
				aria-label="Search type"
				class="field-control"
			>
				<option value="any" selected={data.type === 'any'}>Any</option>
				<option value="users" selected={data.type === 'users'}>Users</option>
				<option value="content" selected={data.type === 'content'}>Content</option>
			</select>
		</SearchBar>
	</section>

	{#if hasQuery && data.total === 0}
		<EmptyState message={`No results found for "${data.query}".`} />
	{/if}

	{#if hasQuery && data.total > 0}
		<div class="space-y-7">
			{#if showUsers}
				<section class="pb-6">
					<SectionHeader title="Users" count={data.usersTotal} />

					{#if data.users.length > 0}
						<ul class="grid gap-2">
							{#each data.users as user}
								<li><ResultCard href={`/profile/${user.id}`} id={user.id} firstName={user.firstName} lastName={user.lastName} displayName={user.displayName} role={user.role} profilePictureUrl={user.profilePictureUrl} accentColor={user.accentColor} avatarBackgroundColor={user.avatarBackgroundColor} avatarShape={user.avatarShape} /></li>
							{/each}
						</ul>

						{#if data.totalPages > 1 && (data.type === 'any' || data.type === 'users')}
							<nav class="mt-3 flex items-center justify-between gap-2" aria-label="User search pagination">
								<a
									class="btn-secondary"
									class:disabled-link={data.page <= 1}
									href={data.page <= 1 ? undefined : pageHref(previousPage)}
								>
									Previous
								</a>

								<span class="text-xs text-text-muted">
									Page {data.page} of {data.totalPages}
								</span>

								<a
									class="btn-secondary"
									class:disabled-link={data.page >= data.totalPages}
									href={data.page >= data.totalPages ? undefined : pageHref(nextPage)}
								>
									Next
								</a>
							</nav>
						{/if}
					{:else}
						<EmptyState message="No user results." />
					{/if}
				</section>
			{/if}

			{#if showContent}
				<section class="pb-2">
					<SectionHeader title="Content" count={data.contentTotal} />

					{#if data.content.length > 0}
						<div class="grid gap-3 md:grid-cols-2">
							{#each data.content as resource}
								<ResourceCard {resource} />
							{/each}
						</div>

						{#if data.contentTotalPages > 1 && (data.type === 'any' || data.type === 'content')}
							<nav class="mt-3 flex items-center justify-between gap-2" aria-label="Content search pagination">
								<a
									class="btn-secondary"
									class:disabled-link={data.page <= 1}
									href={data.page <= 1 ? undefined : pageHref(previousPage)}
								>
									Previous
								</a>

								<span class="text-xs text-text-muted">
									Page {data.page} of {data.contentTotalPages}
								</span>

								<a
									class="btn-secondary"
									class:disabled-link={data.page >= data.contentTotalPages}
									href={data.page >= data.contentTotalPages ? undefined : pageHref(contentNextPage)}
								>
									Next
								</a>
							</nav>
						{/if}
					{:else}
						<EmptyState message="No content results." />
					{/if}
				</section>
			{/if}
		</div>
	{/if}
</PageShell>
