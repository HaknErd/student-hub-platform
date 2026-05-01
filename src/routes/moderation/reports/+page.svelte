<script lang="ts">
	import ModerationPageHeader from '$lib/components/moderation/ModerationPageHeader.svelte';
	import ModerationMessageCard from '$lib/components/moderation/ModerationMessageCard.svelte';
	import ModerationResultsSection from '$lib/components/moderation/ModerationResultsSection.svelte';

	let { data, form } = $props();
</script>

<section class="moderation-page">
	<ModerationPageHeader
		title="All reports"
		description="View open, escalated, resolved, and closed reports."
		backHref="/moderation"
		backLabel="Overview"
	/>

	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}

	<ModerationResultsSection title="Reports" filteredCount={data.reports.length} totalCount={data.reports.length} emptyText="No reports.">
		<div class="moderation-list">
			{#each data.reports as item}
				<ModerationMessageCard {item} kind="report" />
			{/each}
		</div>
	</ModerationResultsSection>
</section>
