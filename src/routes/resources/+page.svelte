<script lang="ts">
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';
	import {
		RESOURCE_COURSE_OPTIONS,
		RESOURCE_FORMAT_GROUP_OPTIONS,
		RESOURCE_FORMAT_OPTIONS_WITH_ANY,
		RESOURCE_LEVEL_OPTIONS,
		RESOURCE_SUBJECTS,
		RESOURCE_TYPE_OPTIONS_WITH_ANY
	} from '$lib/constants/resources';

	let { data } = $props();
</script>

<PageShell wide={true}>
	<PageHeader title="Academic resources" description="Verified notes, guides, and student-submitted resources.">
		{#snippet actions()}
			<a class="btn" href="/resources/new">Submit resource</a>
		{/snippet}
	</PageHeader>

	<Card>
		<form id="resource-search-form" method="GET" action="/resources" class="form-stack">
			<div class="flex flex-col gap-3 sm:flex-row">
				<input
					type="search"
					name="q"
					value={data.query}
					placeholder="Search resources..."
					class="field-control w-full"
				/>
				<button class="btn shrink-0" type="submit">Search</button>
			</div>

			<div class="grid gap-3 md:grid-cols-2">
				<label class="form-row">
					<span>Subject</span>
					<select class="field-control" name="subject">
						<option value="" selected={data.subject === ''}>Any subject</option>
						{#each RESOURCE_SUBJECTS as subject}
							<option value={subject} selected={data.subject === subject}>{subject}</option>
						{/each}
					</select>
				</label>

				<label class="form-row">
					<span>Course</span>
					<select class="field-control" name="curriculum">
						{#each RESOURCE_COURSE_OPTIONS as [value, label]}
							<option value={value} selected={data.curriculum === value}>{label}</option>
						{/each}
					</select>
				</label>
			</div>

			<details>
				<summary class="cursor-pointer text-sm font-medium text-text-muted">More filters</summary>
				<div class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
					<label class="form-row">
						<span>Level</span>
						<select class="field-control" name="level">
							{#each RESOURCE_LEVEL_OPTIONS as [value, label]}
								<option value={value} selected={data.level === value}>{label}</option>
							{/each}
						</select>
					</label>
					<label class="form-row">
						<span>Purpose</span>
						<select class="field-control" name="type">
							{#each RESOURCE_TYPE_OPTIONS_WITH_ANY as [value, label]}
								<option value={value} selected={data.type === value}>{label}</option>
							{/each}
						</select>
					</label>
					<label class="form-row">
						<span>Format group</span>
						<select class="field-control" name="formatGroup">
							{#each RESOURCE_FORMAT_GROUP_OPTIONS as [value, label]}
								<option value={value} selected={data.formatGroup === value}>{label}</option>
							{/each}
						</select>
					</label>
					<label class="form-row">
						<span>Exact format</span>
						<select class="field-control" name="format">
							{#each RESOURCE_FORMAT_OPTIONS_WITH_ANY as [value, label]}
								<option value={value} selected={data.format === value}>{label}</option>
							{/each}
						</select>
					</label>
				</div>
			</details>
		</form>
	</Card>

	{#if data.resources.length === 0}
		<EmptyState message="No resources found." />
	{:else}
		<div class="grid gap-3 md:grid-cols-2">
			{#each data.resources as resource}
				<ResourceCard {resource} />
			{/each}
		</div>
	{/if}
</PageShell>
