<script lang="ts">
	type Props = {
		title: string;
		count: number;
		description: string;
		href: string;
		danger?: boolean;
	};

	let { title, count, description, href, danger = false }: Props = $props();
</script>

<a class="moderation-stat-card" class:danger-card={danger} href={href}>
	<div>
		<h2>{title}</h2>
		<p>{description}</p>
	</div>

	<strong>{count}</strong>
</a>
