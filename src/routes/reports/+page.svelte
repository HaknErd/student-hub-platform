<script lang="ts">
	let { form } = $props();
</script>

<section class="resource-form-page">
	<header class="resources-top">
		<div>
			<p class="settings-eyebrow">Reports</p>
			<h1>Report a concern</h1>
			<p>Use this for inappropriate content, safety issues, or serious concerns.</p>
		</div>
	</header>

	{#if form?.success}
		<p class="form-success">Report submitted.</p>
	{/if}

	<form class="resource-form" method="POST">
		<label>
			<span>Category</span>
			<select name="category" required>
				<option value="website_safety">Website safety issue</option>
				<option value="inappropriate_content">Inappropriate content</option>
				<option value="bullying_harassment">Bullying/harassment</option>
				<option value="safeguarding">Safeguarding concern</option>
				<option value="other">Other</option>
			</select>
		</label>

		<label>
			<span>Message</span>
			<textarea name="message" rows="6" maxlength="3000" required></textarea>
		</label>

		<label class="settings-switch inline">
			<input name="anonymousToPrefects" type="checkbox" checked />
			<span>Hide my name from prefect moderators</span>
		</label>

		<p class="settings-danger-note">
			Serious safety concerns may be escalated to a teacher or admin.
		</p>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<button class="btn btn-danger" type="submit">Submit report</button>
	</form>
</section>
