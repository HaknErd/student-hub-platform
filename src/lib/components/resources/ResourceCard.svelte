<script lang="ts">
	type Resource = {
		id: string;
		title: string;
		description: string;
		subject: string;
		yearGroup: number | null;
		curriculum: string | null;
		level: string | null;
		format: string | null;
		type: string;
		status: string;
		createdBy: {
			displayName: string;
		};
	};

	type Props = {
		resource: Resource;
		showAuthor?: boolean;
		showStatus?: boolean;
	};

	let { resource, showAuthor = true, showStatus = false }: Props = $props();

	const humanize = (value: string) => value.replaceAll('_', ' ');
</script>

<a class="resource-card" href={`/resources/${resource.id}`}>
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
		<span>{humanize(resource.type)}</span>
	</div>

	<h2>{resource.title}</h2>
	<p>{resource.description || 'No description provided.'}</p>

	<div class="resource-card-footer">
		{#if showStatus}
			<span
				class:status-pending={resource.status === 'pending_review'}
				class:status-verified={resource.status === 'verified'}
				class:status-rejected={resource.status === 'rejected'}
			>
				{humanize(resource.status)}
			</span>
		{:else}
			<span></span>
		{/if}

		{#if showAuthor}
			<span>By {resource.createdBy.displayName}</span>
		{/if}
	</div>
</a>
