<script lang="ts">
	import ModerationPageHeader from '$lib/components/moderation/ModerationPageHeader.svelte';
	import ModerationStatCard from '$lib/components/moderation/ModerationStatCard.svelte';
	import PendingResourceCard from '$lib/components/moderation/PendingResourceCard.svelte';
	import ModerationMessageCard from '$lib/components/moderation/ModerationMessageCard.svelte';

	let { data } = $props();

	const recentResources = $derived(data.pendingResources.slice(0, 3));
	const recentFeedback = $derived(data.feedbackItems.slice(0, 3));
	const recentReports = $derived(data.reports.slice(0, 3));
</script>

<section class="moderation-page">
	<ModerationPageHeader
		title="Moderation overview"
		description="Overview of currently open moderation work."
	/>

	<div class="moderation-stat-grid">
		<ModerationStatCard
			title="Pending resources"
			count={data.counts.resources}
			description="Student-submitted resources waiting for approval or rejection."
			href="/moderation/resources"
		/>

		<ModerationStatCard
			title="Feedback"
			count={data.counts.feedback}
			description="Website issues, resource requests, and general suggestions."
			href="/moderation/feedback"
		/>

		<ModerationStatCard
			title="Reports"
			count={data.counts.reports}
			description="Safety issues, inappropriate content, and serious concerns."
			href="/moderation/reports"
			danger
		/>
	</div>

	<section class="moderation-section">
		<div class="moderation-section-heading">
			<h2>Recent pending resources</h2>
			<a href="/moderation/resources">View all</a>
		</div>

		{#if recentResources.length === 0}
			<p class="search-group-empty">No pending resources.</p>
		{:else}
			<div class="moderation-list">
				{#each recentResources as resource}
					<PendingResourceCard {resource} showActions={false} />
				{/each}
			</div>
		{/if}
	</section>

	<section class="moderation-section">
		<div class="moderation-section-heading">
			<h2>Recent open feedback</h2>
			<a href="/moderation/feedback">View all</a>
		</div>

		{#if recentFeedback.length === 0}
			<p class="search-group-empty">No feedback items.</p>
		{:else}
			<div class="moderation-list">
				{#each recentFeedback as item}
					<ModerationMessageCard {item} kind="feedback" />
				{/each}
			</div>
		{/if}
	</section>

	<section class="moderation-section">
		<div class="moderation-section-heading">
			<h2>Recent open reports</h2>
			<a href="/moderation/reports">View all</a>
		</div>

		{#if recentReports.length === 0}
			<p class="search-group-empty">No reports.</p>
		{:else}
			<div class="moderation-list">
				{#each recentReports as item}
					<ModerationMessageCard {item} kind="report" />
				{/each}
			</div>
		{/if}
	</section>
</section>
