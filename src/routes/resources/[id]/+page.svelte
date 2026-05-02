<script lang="ts">
	import {
		RESOURCE_COURSE_OPTIONS,
		RESOURCE_FORMAT_OPTIONS_WITH_AUTO,
		RESOURCE_LEVEL_OPTIONS,
		RESOURCE_SUBJECTS,
		RESOURCE_TYPE_OPTIONS,
		RESOURCE_YEAR_GROUPS
	} from '$lib/constants/resources';

	let { data, form } = $props();

	const resource = $derived(data.resource);

	let editing = $state(false);
	let showPermanentDelete = $state(false);
	let permanentDeleteConfirm = $state('');

	const humanize = (value: string) => value.replaceAll('_', ' ');
	const showStatus = $derived(data.canModerate || resource.status !== 'verified');
	const ownerEditsVerifiedResource = $derived(!data.canModerate && resource.status === 'verified');

	const file = $derived(resource.file);
	const filePreviewType = $derived(
		file
			? file.mimeType === 'application/pdf'
				? 'pdf'
				: file.mimeType.startsWith('image/')
					? 'image'
					: file.mimeType === 'text/plain'
						? 'text'
						: null
			: null
	);
	const previewUrl = $derived(file ? `/resources/file/${file.id}/preview` : null);
	let textPreviewContent = $state('');
	let textPreviewLoading = $state(false);

	async function loadTextPreview() {
		if (!previewUrl || filePreviewType !== 'text') return;
		textPreviewLoading = true;
		const res = await fetch(previewUrl);
		textPreviewContent = await res.text();
		textPreviewLoading = false;
	}

	$effect(() => {
		if (filePreviewType === 'text') loadTextPreview();
	});
</script>

<section class="resource-detail">
	<div class="resource-detail-nav">
		<a class="btn-secondary" href="/resources">Back to resources</a>
	</div>

	<header class="resource-detail-header">
		<div class="resource-card-meta">
			<span>{resource.subject}</span>

			{#if resource.yearGroup}
				<span>Year {resource.yearGroup}</span>
			{/if}

			{#if resource.curriculum}
				<span>{resource.curriculum}</span>
			{/if}

			{#if resource.level}
				<span>{resource.level}</span>
			{/if}

			{#if resource.format}
				<span>{resource.format.toUpperCase()}</span>
			{/if}

			<span>{resource.type.replaceAll('_', ' ')}</span>
		</div>

		<div class="resource-detail-heading">
			<div>
				<h1>{resource.title}</h1>
				{#if showStatus}
					<p class="resource-detail-status">
						<span
							class:status-pending={resource.status === 'pending_review'}
							class:status-verified={resource.status === 'verified'}
							class:status-rejected={resource.status === 'rejected'}
						>
							{humanize(resource.status)}
						</span>
					</p>
				{/if}
			</div>

			{#if data.canEditResource}
				<button type="button" class="btn-secondary" onclick={() => (editing = !editing)}>
					{editing
						? 'Close editor'
						: data.canModerate
							? 'Edit resource'
							: ownerEditsVerifiedResource
								? 'Submit revision'
								: 'Edit submission'}
				</button>
			{/if}
		</div>
	</header>

	{#if form?.success}
		<p class="form-success">{form.message ?? 'Resource updated.'}</p>
	{/if}

	{#if form?.error}
		<p class="form-error">{form.error}</p>
	{/if}

	{#if editing && data.canEditResource}
		<section class="resource-edit-card">
			<div class="resource-edit-intro">
				<h2>{data.canModerate ? 'Edit resource' : ownerEditsVerifiedResource ? 'Submit a revision' : 'Edit submission'}</h2>
				<p>
					{data.canModerate
						? 'Update the core metadata and link details without leaving the resource page.'
						: ownerEditsVerifiedResource
							? 'Your changes will be submitted for moderation. The current verified version stays live until the revision is approved.'
							: 'Update your current submission at any time before it is approved.'}
				</p>
			</div>

			<form class="resource-form resource-detail-form" method="POST" action="?/updateResource">
				<div class="resource-detail-form-main">
					<label>
						<span>Title</span>
						<input name="title" maxlength="120" value={resource.title} required />
					</label>

					<label>
						<span>Description</span>
						<textarea name="description" rows="4" maxlength="2000">{resource.description}</textarea>
					</label>
				</div>

				<div class="resource-form-grid resource-detail-form-grid">
					<label>
						<span>Subject</span>
						<select name="subject" required>
							{#each RESOURCE_SUBJECTS as subject}
								<option value={subject} selected={resource.subject === subject}>{subject}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Year group</span>
						<select name="yearGroup">
							<option value="" selected={resource.yearGroup === null}>Any</option>
							{#each RESOURCE_YEAR_GROUPS as year}
								<option value={year} selected={resource.yearGroup === year}>Year {year}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Course</span>
						<select name="curriculum">
							{#each RESOURCE_COURSE_OPTIONS as [value, label]}
								<option value={value} selected={(resource.curriculum ?? '') === value}>{label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Level</span>
						<select name="level">
							{#each RESOURCE_LEVEL_OPTIONS as [value, label]}
								<option value={value} selected={(resource.level ?? '') === value}>{value === '' ? 'None' : label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Purpose</span>
						<select name="type" required>
							{#each RESOURCE_TYPE_OPTIONS as [value, label]}
								<option value={value} selected={resource.type === value}>{label}</option>
							{/each}
						</select>
					</label>

					<label>
						<span>Format</span>
						<select name="format">
							{#each RESOURCE_FORMAT_OPTIONS_WITH_AUTO as [value, label]}
								<option value={value} selected={(resource.format ?? '') === value}>{label}</option>
							{/each}
						</select>
					</label>
				</div>

				<label>
					<span>External link</span>
					<input name="externalUrl" type="url" value={resource.externalUrl ?? ''} placeholder="https://..." />
				</label>

				<label class="settings-switch inline resource-license-row">
					<input name="licenseConfirmed" type="checkbox" checked={resource.licenseConfirmed} required />
					<span>This resource is allowed to be shared.</span>
				</label>

				<div class="resource-detail-form-actions">
					<button class="btn" type="submit">Save changes</button>
					<button class="btn-secondary" type="button" onclick={() => (editing = false)}>Cancel</button>
				</div>
			</form>
		</section>
	{/if}

	<div class="resource-detail-body">
		<section class="resource-detail-section">
			<h2>Overview</h2>
			<p>{resource.description || 'No description provided.'}</p>
		</section>

		{#if filePreviewType && file}
			<section class="resource-detail-section">
				<h2>Preview</h2>
				<div class="resource-preview-area">
					{#if filePreviewType === 'pdf'}
						<iframe
							class="resource-preview-iframe"
							src={previewUrl!}
							title="Document preview"
						></iframe>
					{:else if filePreviewType === 'image'}
						<img
							class="resource-preview-image"
							src={previewUrl!}
							alt={file.originalFilename}
						/>
					{:else if filePreviewType === 'text'}
						{#if textPreviewLoading}
							<p class="text-text-muted">Loading preview…</p>
						{:else}
							<pre class="resource-preview-text">{textPreviewContent}</pre>
						{/if}
					{/if}
				</div>
			</section>
		{/if}

		<div class="resource-detail-facts">
			<div>
				<dt>Subject</dt>
				<dd>{resource.subject}</dd>
			</div>
			<div>
				<dt>Course</dt>
				<dd>{resource.curriculum || 'Any'}</dd>
			</div>
			<div>
				<dt>Level</dt>
				<dd>{resource.level || 'None'}</dd>
			</div>
			<div>
				<dt>Year group</dt>
				<dd>{resource.yearGroup ? `Year ${resource.yearGroup}` : 'Any'}</dd>
			</div>
			<div>
				<dt>Purpose</dt>
				<dd>{humanize(resource.type)}</dd>
			</div>
			<div>
				<dt>Format</dt>
				<dd>{resource.format ? resource.format.toUpperCase() : 'Auto/unknown'}</dd>
			</div>
		</div>

		{#if resource.externalUrl || resource.file}
			<section class="resource-detail-section">
				<h2>Access</h2>
				<div class="resource-detail-links">
					{#if resource.externalUrl}
						<a class="btn" href={resource.externalUrl} target="_blank" rel="noreferrer">Open external link</a>
					{/if}

					{#if resource.file}
						<a class="btn resource-download-btn" href={`/resources/file/${resource.file.id}`}>
							Download {resource.file.originalFilename}
						</a>
					{/if}
				</div>
			</section>
		{/if}

		{#if resource.rejectionReason}
			<p class="form-error">{resource.rejectionReason}</p>
		{/if}
	</div>

	<footer class="resource-detail-footer">
		<span>Submitted by {resource.createdBy.displayName}</span>

		{#if resource.verifiedBy}
			<span>Verified by {resource.verifiedBy.displayName}</span>
		{/if}
	</footer>

	{#if data.canBinResource || data.canPermanentDeleteResource}
		<section class="resource-danger-zone">
			<div>
				<p class="settings-eyebrow">Danger zone</p>
				<h2>Remove resource</h2>
				<p>
					Binning hides the resource from normal pages. Permanent deletion removes the database record and uploaded files.
				</p>
			</div>

			<div class="resource-danger-actions">
				{#if data.canBinResource}
					<form method="POST" action="?/binResource">
						<button class="btn-secondary danger-text" type="submit">
							Move to bin
						</button>
					</form>
				{/if}

				{#if data.canPermanentDeleteResource}
					{#if showPermanentDelete}
						<form method="POST" action="?/permanentDeleteResource" class="resource-permanent-delete-form">
							<label>
								<span>Type DELETE to confirm</span>
								<input
									name="confirm"
									autocomplete="off"
									bind:value={permanentDeleteConfirm}
								/>
							</label>

							<div class="resource-detail-form-actions">
								<button
									class="btn btn-danger"
									type="submit"
									disabled={permanentDeleteConfirm !== 'DELETE'}
								>
									Permanently delete
								</button>

								<button
									class="btn-secondary"
									type="button"
									onclick={() => {
										showPermanentDelete = false;
										permanentDeleteConfirm = '';
									}}
								>
									Cancel
								</button>
							</div>
						</form>
					{:else}
						<button
							class="btn btn-danger"
							type="button"
							onclick={() => (showPermanentDelete = true)}
						>
							Permanent delete
						</button>
					{/if}
				{/if}
			</div>
		</section>
	{/if}
</section>
