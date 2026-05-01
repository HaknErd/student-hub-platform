<script lang="ts">
	import ResourceCard from '$lib/components/resources/ResourceCard.svelte';

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

<section class="resources-page search-page">
	<header class="resources-top">
		<div>
			<p class="settings-eyebrow">Resources</p>
			<h1>Academic resources</h1>
			<p>Verified notes, guides, links, and student-submitted resources.</p>
		</div>

		<a class="btn" href="/resources/new">Submit resource</a>
	</header>

	<aside class="search-filter-rail" aria-label="Resource filters">
		<div class="rail-card">
			<h2>Filters</h2>

			<label>
				<span>Subject</span>
				<select name="subject" form="resource-search-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each subjects as [value, label]}
						<option value={value} selected={data.subject === value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Course</span>
				<select name="curriculum" form="resource-search-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each courses as [value, label]}
						<option value={value} selected={data.curriculum === value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Level</span>
				<select name="level" form="resource-search-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each levels as [value, label]}
						<option value={value} selected={data.level === value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Purpose</span>
				<select name="type" form="resource-search-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each resourceTypes as [value, label]}
						<option value={value} selected={data.type === value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Format group</span>
				<select name="formatGroup" form="resource-search-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each formatGroups as [value, label]}
						<option value={value} selected={data.formatGroup === value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Exact format</span>
				<select name="format" form="resource-search-form" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
					{#each formats as [value, label]}
						<option value={value} selected={data.format === value}>{label}</option>
					{/each}
				</select>
			</label>
		</div>
	</aside>

	<form id="resource-search-form" class="search-bar-full search-bar-main" method="GET" action="/resources">
		<input type="search" name="q" value={data.query} placeholder="Search resources..." />
		<button class="btn" type="submit">Search</button>
	</form>

	{#if data.resources.length === 0}
		<p class="search-empty">No resources found.</p>
	{:else}
		<div class="resource-grid">
			{#each data.resources as resource}
				<ResourceCard {resource} />
			{/each}
		</div>
	{/if}
</section>
