<script lang="ts">
	type Props = {
		eyebrow?: string;
		title: string;
		description?: string;
		backHref?: string;
		backLabel?: string;
	};

	let {
		eyebrow = 'Moderation',
		title,
		description = '',
		backHref = '',
		backLabel = 'Back'
	}: Props = $props();
</script>

<header class="moderation-page-header">
	<div>
		<p class="settings-eyebrow">{eyebrow}</p>
		<h1>{title}</h1>
		{#if description}
			<p>{description}</p>
		{/if}
	</div>

	{#if backHref}
		<a class="btn-ghost" href={backHref}>{backLabel}</a>
	{/if}
</header>
