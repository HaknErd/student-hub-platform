<script lang="ts">
	import ModerationFilterRail from '$lib/components/moderation/ModerationFilterRail.svelte';
	import ModerationPageHeader from '$lib/components/moderation/ModerationPageHeader.svelte';
	import ModerationResultsSection from '$lib/components/moderation/ModerationResultsSection.svelte';
	import ModerationSearchBar from '$lib/components/moderation/ModerationSearchBar.svelte';
	import PendingResourceCard from '$lib/components/moderation/PendingResourceCard.svelte';

	let { data, form } = $props();

	const hasActiveFilters = $derived(
		Boolean(
			data.filters.q ||
				data.filters.subject !== 'any' ||
				data.filters.curriculum !== 'any' ||
				data.filters.level !== 'any' ||
				data.filters.type !== 'any' ||
				data.filters.format !== 'any'
		)
	);
</script>

<section class="moderation-page moderation-resource-page">
	<ModerationPageHeader
		title="Pending resources"
		description="Approve or reject student-submitted resources."
		backHref="/moderation"
		backLabel="Overview"
	/>

	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}

	<ModerationFilterRail label="Resource filters">
		<label>
			<span>Subject</span>
			<select name="subject" form="resource-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.subject === 'any'}>Any subject</option>
				{#each data.subjects as subject}
					<option value={subject} selected={data.filters.subject === subject}>{subject}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Course</span>
			<select name="curriculum" form="resource-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.curriculum === 'any'}>Any course</option>
				{#each data.curricula as curriculum}
					<option value={curriculum} selected={data.filters.curriculum === curriculum}>{curriculum}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Level</span>
			<select name="level" form="resource-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.level === 'any'}>Any level</option>
				{#each data.levels as level}
					<option value={level} selected={data.filters.level === level}>{level}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Type</span>
			<select name="type" form="resource-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.type === 'any'}>Any type</option>
				{#each data.types as type}
					<option value={type} selected={data.filters.type === type}>{type.replaceAll('_', ' ')}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Format</span>
			<select name="format" form="resource-filter-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
				<option value="any" selected={data.filters.format === 'any'}>Any format</option>
				{#each data.formats as format}
					<option value={format} selected={data.filters.format === format}>{format.toUpperCase()}</option>
				{/each}
			</select>
		</label>
	</ModerationFilterRail>

	<div class="moderation-results-shell">
		<ModerationSearchBar
			formId="resource-filter-form"
			action="/moderation/resources"
			query={data.filters.q}
			placeholder="Search title, description, subject, type, or submitter..."
			{hasActiveFilters}
			clearHref="/moderation/resources"
		/>

		<ModerationResultsSection
			title="Pending resources"
			filteredCount={data.pendingResources.length}
			totalCount={data.totalPendingResources}
			{hasActiveFilters}
			emptyText="No pending resources."
			filteredEmptyText="No pending resources match the current filters."
		>
			<div class="moderation-list">
				{#each data.pendingResources as resource}
					<PendingResourceCard {resource} />
				{/each}
			</div>
		</ModerationResultsSection>
	</div>
</section>
