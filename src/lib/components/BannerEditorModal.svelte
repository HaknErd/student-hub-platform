<script lang="ts">
	import ImageEditorModal from '$lib/components/ImageEditorModal.svelte';
	import type { AvatarShape } from '$lib/components/ImageEditorModal.svelte';

	type Props = {
		currentImageUrl?: string | null;
		onclose: () => void;
		onremove?: () => void | Promise<void>;
		onsave: (blob: Blob, shape: AvatarShape) => void | Promise<void>;
	};

	let { currentImageUrl = null, onclose, onremove, onsave }: Props = $props();
</script>

<ImageEditorModal
	kind="banner"
	title="Banner image"
	currentShape="rounded-xl"
	{currentImageUrl}
	aspectRatio={3}
	outputWidth={1500}
	outputHeight={500}
	allowShape={false}
	{onclose}
	{onremove}
	{onsave}
/>
