<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import PageShell from '$lib/components/ui/PageShell.svelte';
	import {
		RESOURCE_COURSE_OPTIONS,
		RESOURCE_FORMAT_OPTIONS_WITH_AUTO,
		RESOURCE_LEVEL_OPTIONS,
		RESOURCE_SUBJECTS,
		RESOURCE_TYPE_OPTIONS,
		RESOURCE_YEAR_GROUPS
	} from '$lib/constants/resources';

	let { form } = $props();
</script>

<PageShell>
	<PageHeader
		title="Submit a resource"
		description="Student submissions stay private until reviewed by a prefect or admin."
	/>
	<Card>
	<form class="form-stack" method="POST" enctype="multipart/form-data">
		<label>
			<span>Title</span>
			<input class="field-control" name="title" maxlength="120" required />
		</label>

		<label>
			<span>Description</span>
			<textarea class="field-control" name="description" rows="4" maxlength="2000" placeholder="Explain what this resource helps with."></textarea>
		</label>

		<div class="grid gap-3 md:grid-cols-2">
			<label>
				<span>Subject</span>
				<select class="field-control" name="subject" required>
					<option value="" disabled selected>Select subject</option>
					{#each RESOURCE_SUBJECTS as subject}
						<option value={subject}>{subject}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Year group</span>
				<select class="field-control" name="yearGroup">
					<option value="">Any</option>
					{#each RESOURCE_YEAR_GROUPS as year}
						<option value={year}>Year {year}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Course</span>
				<select class="field-control" name="curriculum">
					{#each RESOURCE_COURSE_OPTIONS as [value, label]}
						<option value={value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Level</span>
				<select class="field-control" name="level">
					{#each RESOURCE_LEVEL_OPTIONS as [value, label]}
						<option value={value}>{value === '' ? 'None' : label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Purpose</span>
				<select class="field-control" name="type" required>
					{#each RESOURCE_TYPE_OPTIONS as [value, label]}
						<option value={value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Format</span>
				<select class="field-control" name="format">
					{#each RESOURCE_FORMAT_OPTIONS_WITH_AUTO as [value, label]}
						<option value={value}>{label}</option>
					{/each}
				</select>
			</label>
		</div>

		<label>
			<span>External link</span>
			<input class="field-control" name="externalUrl" type="url" placeholder="https://..." />
		</label>

		<label>
			<span>File upload</span>
			<input
				class="field-control"
				name="resourceFile"
				type="file"
				accept="application/pdf,.doc,.docx,.odt,.txt,.rtf,.ppt,.pptx,.odp,.xls,.xlsx,.ods,image/png,image/jpeg,image/webp,text/plain"
			/>
			<small>PDF, DOCX, ODT, TXT, RTF, PPTX, ODP, XLSX, ODS, or images. Max 10 MB.</small>
		</label>

		<label class="settings-switch inline">
			<input name="licenseConfirmed" type="checkbox" required />
			<span>I confirm this is my own work, school-created material, or explicitly allowed to be shared.</span>
		</label>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<div class="form-actions">
			<button class="btn" type="submit">Submit for review</button>
			<a class="btn-secondary" href="/resources">Cancel</a>
		</div>
	</form>
	</Card>
</PageShell>
