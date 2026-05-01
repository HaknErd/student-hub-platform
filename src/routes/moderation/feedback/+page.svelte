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
				data.filters.category !== 'any' ||
				data.filters.visibility !== 'any'
		)
	);
</script>

<section class="moderation-page moderation-feedback-page">
	<ModerationPageHeader
		title="All feedback"
		description="View open, resolved, and closed feedback items."
		backHref="/moderation"
		backLabel="Overview"
	/>

	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}

	<ModerationFilterRail label="Feedback filters">
		<label>
			<span>Status</span>
			<select name="status" form="feedback-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.status === 'any'}>Any status</option>
				<option value="submitted" selected={data.filters.status === 'submitted'}>Submitted</option>
				<option value="triaged" selected={data.filters.status === 'triaged'}>Triaged</option>
				<option value="resolved" selected={data.filters.status === 'resolved'}>Resolved</option>
				<option value="closed" selected={data.filters.status === 'closed'}>Closed</option>
			</select>
		</label>

		<label>
			<span>Category</span>
			<select name="category" form="feedback-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.category === 'any'}>Any category</option>
				{#each data.categories as category}
					<option value={category} selected={data.filters.category === category}>
						{category.replaceAll('_', ' ')}
					</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Visibility</span>
			<select name="visibility" form="feedback-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.visibility === 'any'}>All items</option>
				<option value="identified" selected={data.filters.visibility === 'identified'}>Named</option>
				<option value="anonymous" selected={data.filters.visibility === 'anonymous'}>Anonymous</option>
			</select>
		</label>
	</ModerationFilterRail>

	<div class="moderation-results-shell">
		<ModerationSearchBar
			formId="feedback-filter-form"
			action="/moderation/feedback"
			query={data.filters.q}
			placeholder="Search message, category, author, or email..."
			{hasActiveFilters}
			clearHref="/moderation/feedback"
		/>

		<ModerationResultsSection
			title="Feedback queue"
			filteredCount={data.feedbackItems.length}
			totalCount={data.totalFeedbackItems}
			{hasActiveFilters}
			emptyText="No feedback items."
			filteredEmptyText="No feedback items match the current filters."
		>
			<div class="moderation-list">
				{#each data.feedbackItems as item}
					<ModerationMessageCard {item} kind="feedback" />
				{/each}
			</div>
		</ModerationResultsSection>
	</div>
</section>
