<script lang="ts">
	import ImageEditorModal from '$lib/components/ImageEditorModal.svelte';
	import type { AvatarShape } from '$lib/components/ImageEditorModal.svelte';

	type Props = {
		currentShape?: AvatarShape;
		currentImageUrl?: string | null;
		onclose: () => void;
		onremove?: () => void | Promise<void>;
		onsave: (blob: Blob, shape: AvatarShape) => void | Promise<void>;
	};

	let { currentShape = 'rounded-xl', currentImageUrl = null, onclose, onremove, onsave }: Props = $props();
</script>

<ImageEditorModal
	kind="avatar"
	title="Profile picture"
	{currentShape}
	{currentImageUrl}
	allowShape={true}
	{onclose}
	{onremove}
	{onsave}
/>
