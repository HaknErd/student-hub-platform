<script lang="ts">
	type Props = {
		className?: string;
		children?: import('svelte').Snippet;
	};

	let { className = '', children }: Props = $props();
</script>

<section class={`rounded-xl border border-border bg-surface p-4 sm:p-5 ${className}`}>
	{@render children?.()}
</section>
