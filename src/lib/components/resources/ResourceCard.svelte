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
	<div class="resource-card-tags">
		<span>{resource.subject}</span>
		{#if resource.curriculum}<span>{resource.curriculum}</span>{/if}
		{#if resource.level}<span>{resource.level}</span>{/if}
		{#if resource.format}<span>{resource.format.toUpperCase()}</span>{/if}
		<span>{humanize(resource.type)}</span>
	</div>

	<h2>{resource.title}</h2>
	<p>{resource.description || 'No description provided.'}</p>

	<div class="resource-card-footer">
		<span class="resource-card-status">{showStatus ? humanize(resource.status) : 'Open resource'}</span>
		{#if showAuthor}<span class="resource-card-author">By {resource.createdBy.displayName}</span>{/if}
	</div>
</a>
