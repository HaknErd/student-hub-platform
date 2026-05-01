<script lang="ts">
	let { form } = $props();

	const subjects = [
		'Maths',
		'Math AA',
		'Math AI',
		'Sciences',
		'Biology',
		'Chemistry',
		'Physics',
		'English',
		'Geography',
		'History',
		'Foreign Languages',
		'Business/Economics',
		'Psychology',
		'Computer Science',
		'Art',
		'Other'
	];
</script>

<section class="resource-form-page">
	<header class="resources-top">
		<div>
			<p class="settings-eyebrow">Resources</p>
			<h1>Submit a resource</h1>
			<p>Student submissions stay private until reviewed by a prefect or admin.</p>
		</div>
	</header>

	<form class="resource-form" method="POST" enctype="multipart/form-data">
		<label>
			<span>Title</span>
			<input name="title" maxlength="120" required />
		</label>

		<label>
			<span>Description</span>
			<textarea name="description" rows="4" maxlength="2000" placeholder="Explain what this resource helps with."></textarea>
		</label>

		<div class="resource-form-grid">
			<label>
				<span>Subject</span>
				<select name="subject" required>
					<option value="" disabled selected>Select subject</option>
					{#each subjects as subject}
						<option value={subject}>{subject}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Year group</span>
				<select name="yearGroup">
					<option value="">Any</option>
					{#each [8, 9, 10, 11, 12, 13] as year}
						<option value={year}>Year {year}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Course</span>
				<select name="curriculum">
					<option value="">Any</option>
					<option value="IGCSE">IGCSE</option>
					<option value="IB">IB</option>
					<option value="OTHER">Other</option>
				</select>
			</label>

			<label>
				<span>Level</span>
				<select name="level">
					<option value="">None</option>
					<option value="HL">HL</option>
					<option value="SL">SL</option>
					<option value="OTHER">Other</option>
				</select>
			</label>

			<label>
				<span>Purpose</span>
				<select name="type" required>
					<option value="study_guide">Study guide</option>
					<option value="notes">Notes</option>
					<option value="past_paper_link">Past paper link</option>
					<option value="mark_scheme_link">Mark scheme link</option>
					<option value="worksheet">Worksheet</option>
					<option value="textbook">Textbook</option>
					<option value="syllabus">Syllabus</option>
					<option value="external_link">External link</option>
					<option value="video">Video</option>
					<option value="other">Other</option>
				</select>
			</label>

			<label>
				<span>Format</span>
				<select name="format">
					<option value="">Auto/unknown</option>
					<optgroup label="Documents">
						<option value="pdf">PDF</option>
						<option value="docx">DOCX</option>
						<option value="odt">ODT</option>
						<option value="txt">Text</option>
						<option value="rtf">RTF</option>
					</optgroup>
					<optgroup label="Presentations">
						<option value="pptx">PowerPoint</option>
						<option value="odp">OpenDocument presentation</option>
					</optgroup>
					<optgroup label="Spreadsheets">
						<option value="xlsx">Excel</option>
						<option value="ods">OpenDocument spreadsheet</option>
					</optgroup>
					<optgroup label="Media">
						<option value="image">Image</option>
						<option value="video">Video</option>
					</optgroup>
					<optgroup label="Links">
						<option value="website">Website</option>
						<option value="youtube">YouTube</option>
					</optgroup>
					<option value="other">Other</option>
				</select>
			</label>
		</div>

		<label>
			<span>External link</span>
			<input name="externalUrl" type="url" placeholder="https://..." />
		</label>

		<label>
			<span>File upload</span>
			<input
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

		<div>
			<button class="btn" type="submit">Submit for review</button>
			<a class="btn-ghost" href="/resources">Cancel</a>
		</div>
	</form>
</section>
