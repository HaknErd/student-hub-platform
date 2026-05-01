<script lang="ts">
	import ModerationFilterRail from '$lib/components/moderation/ModerationFilterRail.svelte';
	import ModerationPageHeader from '$lib/components/moderation/ModerationPageHeader.svelte';
	import ModerationMessageCard from '$lib/components/moderation/ModerationMessageCard.svelte';
	import ModerationResultsSection from '$lib/components/moderation/ModerationResultsSection.svelte';
	import ModerationSearchBar from '$lib/components/moderation/ModerationSearchBar.svelte';

	let { data, form } = $props();

	const hasActiveFilters = $derived(
		Boolean(
			data.filters.q ||
				data.filters.status !== 'any' ||
				data.filters.visibility !== 'any'
		)
	);
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

	<ModerationFilterRail label="Report filters">
		<label>
			<span>Status</span>
			<select name="status" form="report-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.status === 'any'}>Any status</option>
				<option value="submitted" selected={data.filters.status === 'submitted'}>Submitted</option>
				<option value="triaged" selected={data.filters.status === 'triaged'}>Triaged</option>
				<option value="escalated" selected={data.filters.status === 'escalated'}>Escalated</option>
				<option value="resolved" selected={data.filters.status === 'resolved'}>Resolved</option>
				<option value="closed" selected={data.filters.status === 'closed'}>Closed</option>
			</select>
		</label>

		<label>
			<span>Visibility</span>
			<select name="visibility" form="report-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.visibility === 'any'}>All items</option>
				<option value="identified" selected={data.filters.visibility === 'identified'}>Named</option>
				<option value="anonymous" selected={data.filters.visibility === 'anonymous'}>Anonymous</option>
			</select>
		</label>
	</ModerationFilterRail>

	<div class="moderation-results-shell">
		<ModerationSearchBar
			formId="report-filter-form"
			action="/moderation/reports"
			query={data.filters.q}
			placeholder="Search message, category, author, or email..."
			{hasActiveFilters}
			clearHref="/moderation/reports"
		/>

		<ModerationResultsSection
			title="Reports"
			filteredCount={data.reports.length}
			totalCount={data.totalReports}
			{hasActiveFilters}
			emptyText="No reports."
			filteredEmptyText="No reports match the current filters."
		>
			<div class="moderation-list">
				{#each data.reports as item}
					<ModerationMessageCard {item} kind="report" />
				{/each}
			</div>
		</ModerationResultsSection>
	</div>
</section>
