<script lang="ts">
	type Props = {
		className?: string;
		children?: import('svelte').Snippet;
	};

	let { className = '', children }: Props = $props();
</script>

<section class={`card ${className}`}>
	{@render children?.()}
</section>
