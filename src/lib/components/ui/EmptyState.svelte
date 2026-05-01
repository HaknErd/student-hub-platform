<script lang="ts">
	type Props = {
		message: string;
	};

	let { message }: Props = $props();
</script>

<p class="rounded-lg border border-border/70 bg-bg/50 px-4 py-3 text-sm text-text-muted">{message}</p>
