<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';

	let { data } = $props();

	const hasQuery = $derived(Boolean(data.query.trim()));
	const showUsers = $derived(data.type === 'any' || data.type === 'users');
	const showContent = $derived(data.type === 'any' || data.type === 'content');
	const previousPage = $derived(Math.max(data.page - 1, 1));
	const nextPage = $derived(Math.min(data.page + 1, data.totalPages));

	function pageHref(page: number) {
		const params = new URLSearchParams();
		params.set('q', data.query);
		params.set('type', data.type);
		params.set('page', String(page));
		return `/search?${params.toString()}`;
	}
</script>

<section class="stack-page search-page">
	<header class="page-header search-page-header">
		<div class="search-page-title">
			<h1>
				{#if hasQuery}
					Results for &ldquo;{data.query}&rdquo;
				{:else}
					Search
				{/if}
			</h1>

			{#if hasQuery}
				<p class="search-meta">
					Found {data.total} {data.total === 1 ? 'result' : 'results'} in {data.tookMs} ms
				</p>
			{/if}
		</div>
	</header>

	<aside class="search-filter-rail" aria-label="Search filters">
		<div class="rail-card">
			<h2>Filters</h2>

			<label>
				<span>Type</span>
				<select name="type" form="search-form" aria-label="Search type">
					<option value="any" selected={data.type === 'any'}>Any</option>
					<option value="users" selected={data.type === 'users'}>Users</option>
					<option value="content" selected={data.type === 'content'}>Content</option>
				</select>
			</label>
		</div>
	</aside>

	<form id="search-form" class="search-bar-full search-bar-main" method="GET" action="/search">
		<input
			type="search"
			name="q"
			placeholder="Search users and content..."
			value={data.query}
			autocomplete="off"
		/>

		<button type="submit" class="btn">Search</button>
	</form>

	{#if hasQuery && data.total === 0}
		<p class="search-empty">No results found for &ldquo;{data.query}&rdquo;.</p>
	{/if}

	{#if hasQuery && data.total > 0}
		<div class="search-groups">
			{#if showUsers}
				<section class="search-group">
					<header class="search-group-header">
						<h2>Users</h2>
						<span>{data.usersTotal}</span>
					</header>

					{#if data.users.length > 0}
						<ul class="search-results">
							{#each data.users as user}
								<li>
									<a href={`/profile/${user.id}`} class="search-result-item">
										<Avatar
											userId={user.id}
											firstName={user.firstName}
											lastName={user.lastName}
											profilePictureUrl={user.profilePictureUrl}
											accentColor={user.accentColor}
											avatarBackgroundColor={user.avatarBackgroundColor}
											avatarShape={user.avatarShape}
											size="md"
										/>

										<div class="search-result-info">
											<span class="search-result-name">{user.displayName}</span>
											<span class="search-result-role">{user.role}</span>
										</div>
									</a>
								</li>
							{/each}
						</ul>

						{#if data.totalPages > 1 && (data.type === 'any' || data.type === 'users')}
							<nav class="search-pagination" aria-label="User search pagination">
								<a
									class="btn-ghost"
									class:disabled-link={data.page <= 1}
									href={data.page <= 1 ? undefined : pageHref(previousPage)}
								>
									Previous
								</a>

								<span class="search-pagination-status">
									Page {data.page} of {data.totalPages}
								</span>

								<a
									class="btn-ghost"
									class:disabled-link={data.page >= data.totalPages}
									href={data.page >= data.totalPages ? undefined : pageHref(nextPage)}
								>
									Next
								</a>
							</nav>
						{/if}
					{:else}
						<p class="search-group-empty">No user results.</p>
					{/if}
				</section>
			{/if}

			{#if showContent}
				<section class="search-group">
					<header class="search-group-header">
						<h2>Content</h2>
						<span>TBA</span>
					</header>

					<p class="search-group-empty">
						Content search is not implemented yet.
					</p>
				</section>
			{/if}
		</div>
	{/if}
</section>
