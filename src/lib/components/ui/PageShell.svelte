<script lang="ts">
	type Props = {
		wide?: boolean;
		className?: string;
		children?: import('svelte').Snippet;
	};

	let { wide = false, className = '', children }: Props = $props();
</script>

<section class={`mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-5xl'} space-y-6 ${className}`}>
	{@render children?.()}
</section>
