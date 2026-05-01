<script lang="ts">
	type Resource = {
		id: string;
		title: string;
		description: string;
		subject: string;
		type: string;
		format?: string | null;
		curriculum?: string | null;
		level?: string | null;
		yearGroup?: number | null;
		createdBy: {
			displayName: string;
		};
	};

	type Props = {
		resource: Resource;
		showActions?: boolean;
	};

	let { resource, showActions = true }: Props = $props();
</script>

<article class="moderation-card">
	<div>
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

		<h3><a href={`/resources/${resource.id}`}>{resource.title}</a></h3>
		<p>{resource.description || 'No description provided.'}</p>
		<small>Submitted by {resource.createdBy.displayName}</small>
	</div>

	{#if showActions}
		<div class="moderation-actions">
			<form method="POST" action="?/approveResource">
				<input type="hidden" name="id" value={resource.id} />
				<button class="btn" type="submit">Approve</button>
			</form>

			<form method="POST" action="?/rejectResource" class="moderation-reject">
				<input type="hidden" name="id" value={resource.id} />
				<input name="reason" placeholder="Reason" />
				<button class="btn-ghost danger-text" type="submit">Reject</button>
			</form>
		</div>
	{/if}
</article>
