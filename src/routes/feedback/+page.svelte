<script lang="ts">
	let { form } = $props();
</script>

<section class="resource-form-page">
	<header class="resources-top">
		<div>
			<p class="settings-eyebrow">Feedback</p>
			<h1>Suggestions and website feedback</h1>
			<p>Use this for resource requests, website issues, and general suggestions.</p>
		</div>
	</header>

	{#if form?.success}
		<p class="form-success">Feedback submitted.</p>
	{/if}

	<form class="resource-form" method="POST">
		<label>
			<span>Category</span>
			<select name="category" required>
				<option value="website_issue">Website issue</option>
				<option value="resource_request">Resource request</option>
				<option value="school_suggestion">School suggestion</option>
				<option value="club_event_idea">Club/event idea</option>
				<option value="other">Other</option>
			</select>
		</label>

		<label>
			<span>Message</span>
			<textarea name="message" rows="6" maxlength="3000" required></textarea>
		</label>

		<label class="settings-switch inline">
			<input name="anonymousToPrefects" type="checkbox" />
			<span>Hide my name from prefect moderators</span>
		</label>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<button class="btn" type="submit">Submit feedback</button>
	</form>
</section>
