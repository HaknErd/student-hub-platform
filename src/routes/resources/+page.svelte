<script lang="ts">
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';

	let { data } = $props();

	const subjects = [
		['', 'Any subject'],
		['Maths', 'Maths'],
		['Math AA', 'Math AA'],
		['Math AI', 'Math AI'],
		['Sciences', 'Sciences'],
		['Biology', 'Biology'],
		['Chemistry', 'Chemistry'],
		['Physics', 'Physics'],
		['English', 'English'],
		['Geography', 'Geography'],
		['History', 'History'],
		['Foreign Languages', 'Foreign Languages'],
		['Business/Economics', 'Business/Economics'],
		['Psychology', 'Psychology'],
		['Computer Science', 'Computer Science'],
		['Art', 'Art'],
		['Other', 'Other']
	];

	const courses = [
		['', 'Any course'],
		['IGCSE', 'IGCSE'],
		['IB', 'IB'],
		['OTHER', 'Other']
	];

	const levels = [
		['', 'Any level'],
		['HL', 'HL'],
		['SL', 'SL'],
		['OTHER', 'Other']
	];

	const resourceTypes = [
		['', 'Any purpose'],
		['study_guide', 'Study guide'],
		['notes', 'Notes'],
		['past_paper_link', 'Past paper link'],
		['mark_scheme_link', 'Mark scheme link'],
		['worksheet', 'Worksheet'],
		['textbook', 'Textbook'],
		['syllabus', 'Syllabus'],
		['external_link', 'External link'],
		['video', 'Video'],
		['other', 'Other']
	];

	const formatGroups = [
		['', 'Any group'],
		['documents', 'Documents'],
		['presentations', 'Presentations'],
		['spreadsheets', 'Spreadsheets'],
		['media', 'Media'],
		['links', 'Links']
	];

	const formats = [
		['', 'Any format'],
		['pdf', 'PDF'],
		['docx', 'DOCX'],
		['odt', 'ODT'],
		['txt', 'Text'],
		['rtf', 'RTF'],
		['pptx', 'PowerPoint'],
		['odp', 'OpenDocument presentation'],
		['xlsx', 'Excel'],
		['ods', 'OpenDocument spreadsheet'],
		['image', 'Image'],
		['video', 'Video'],
		['website', 'Website'],
		['youtube', 'YouTube'],
		['other', 'Other']
	];
</script>

<PageShell wide={true}>
	<PageHeader title="Academic resources" description="Verified notes, guides, and student-submitted resources.">
		{#snippet actions()}
			<a class="btn mt-0" href="/resources/new">Submit resource</a>
		{/snippet}
	</PageHeader>

	<Card>
		<form id="resource-search-form" method="GET" action="/resources" class="space-y-3">
			<div class="flex flex-col gap-3 sm:flex-row">
				<input
					type="search"
					name="q"
					value={data.query}
					placeholder="Search resources..."
					class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
				/>
				<button class="btn mt-0 shrink-0" type="submit">Search</button>
			</div>

			<div class="grid gap-3 md:grid-cols-2">
				<label class="grid gap-1 text-sm text-text-muted">
					<span>Subject</span>
					<select class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text" name="subject">
						{#each subjects as [value, label]}
							<option value={value} selected={data.subject === value}>{label}</option>
						{/each}
					</select>
				</label>

				<label class="grid gap-1 text-sm text-text-muted">
					<span>Course</span>
					<select class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text" name="curriculum">
						{#each courses as [value, label]}
							<option value={value} selected={data.curriculum === value}>{label}</option>
						{/each}
					</select>
				</label>
			</div>

			<details>
				<summary class="cursor-pointer text-sm font-medium text-text-muted">More filters</summary>
				<div class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
					<label class="grid gap-1 text-sm text-text-muted">
						<span>Level</span>
						<select class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text" name="level">
							{#each levels as [value, label]}
								<option value={value} selected={data.level === value}>{label}</option>
							{/each}
						</select>
					</label>
					<label class="grid gap-1 text-sm text-text-muted">
						<span>Purpose</span>
						<select class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text" name="type">
							{#each resourceTypes as [value, label]}
								<option value={value} selected={data.type === value}>{label}</option>
							{/each}
						</select>
					</label>
					<label class="grid gap-1 text-sm text-text-muted">
						<span>Format group</span>
						<select class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text" name="formatGroup">
							{#each formatGroups as [value, label]}
								<option value={value} selected={data.formatGroup === value}>{label}</option>
							{/each}
						</select>
					</label>
					<label class="grid gap-1 text-sm text-text-muted">
						<span>Exact format</span>
						<select class="h-10 rounded-md border border-border bg-bg px-3 text-sm text-text" name="format">
							{#each formats as [value, label]}
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
