<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';

	let { data } = $props();
</script>

<section class="stack-page">
	<header class="page-header">
		<div class="search-page-title">
			<h1>
				{#if data.query}
					Results for &ldquo;{data.query}&rdquo;
				{:else}
					Search
				{/if}
			</h1>
		</div>
	</header>

	<form class="search-bar-full" method="GET" action="/search">
		<input
			type="search"
			name="q"
			placeholder="Search by name or email..."
			value={data.query}
			autofocus
			autocomplete="off"
		/>
		<button type="submit" class="btn">Search</button>
	</form>

	{#if data.query && data.results.length === 0}
		<p class="search-empty">No results found for &ldquo;{data.query}&rdquo;.</p>
	{/if}

	{#if data.results.length > 0}
		<ul class="search-results">
			{#each data.results as user}
				<li>
					<a href={`/profile/${user.id}`} class="search-result-item">
						<Avatar
							userId={user.id}
							firstName={user.firstName}
							lastName={user.lastName}
							profilePictureUrl={user.profilePictureUrl}
							accentColor={user.accentColor}
							avatarBackgroundColor={user.avatarBackgroundColor}
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
	{/if}
</section>
