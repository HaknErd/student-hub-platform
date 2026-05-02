<script lang="ts">
	import { fly } from 'svelte/transition';
	import { BANNER_ASPECT_RATIO, BANNER_OUTPUT_HEIGHT, BANNER_OUTPUT_WIDTH } from '$lib/constants/media';
	import type { AvatarShape } from '$lib/types/profile';

	export type EditorKind = 'avatar' | 'banner';

	type Props = {
		kind: EditorKind;
		title?: string;
		currentShape?: AvatarShape;
		currentImageUrl?: string | null;
		aspectRatio?: number;
		outputWidth?: number;
		outputHeight?: number;
		allowShape?: boolean;
		onclose: () => void;
		onremove?: () => void | Promise<void>;
		onsave: (blob: Blob, shape: AvatarShape) => void | Promise<void>;
	};

	let {
		kind,
		title,
		currentShape = 'rounded-xl',
		currentImageUrl = null,
		aspectRatio = kind === 'banner' ? BANNER_ASPECT_RATIO : 1,
		outputWidth = kind === 'banner' ? BANNER_OUTPUT_WIDTH : 512,
		outputHeight = kind === 'banner' ? BANNER_OUTPUT_HEIGHT : 512,
		allowShape = kind === 'avatar',
		onclose,
		onremove,
		onsave
	}: Props = $props();

	const CROP_WIDTH = $derived(kind === 'banner' ? 420 : 300);
	const CROP_HEIGHT = $derived(Math.round(CROP_WIDTH / aspectRatio));
	const MIN_ZOOM = 0.05;
	const MAX_ZOOM = 4;

	let canvas = $state<HTMLCanvasElement>();
	let fileInput = $state<HTMLInputElement>();

	let imageUrl = $state('');
	let sourceObjectUrl = $state<string | null>(null);
	let imageElement = $state<HTMLImageElement | null>(null);
	let imageLoaded = $state(false);

	let imageWidth = $state(0);
	let imageHeight = $state(0);
	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);

	let dragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragStartOffsetX = $state(0);
	let dragStartOffsetY = $state(0);

	let shape = $state<AvatarShape>('rounded-xl');
	let saving = $state(false);
	let error = $state('');
	let initialized = $state(false);


	function resetSource() {
		if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
		sourceObjectUrl = null;
		imageUrl = '';
		imageElement = null;
		imageLoaded = false;
	}

	function setInitialCrop(img: HTMLImageElement) {
		imageWidth = img.naturalWidth;
		imageHeight = img.naturalHeight;

		const coverZoom = Math.max(CROP_WIDTH / imageWidth, CROP_HEIGHT / imageHeight);
		zoom = Math.max(coverZoom, MIN_ZOOM);

		offsetX = (CROP_WIDTH - imageWidth * zoom) / 2;
		offsetY = (CROP_HEIGHT - imageHeight * zoom) / 2;

		imageElement = img;
		imageLoaded = true;
		requestAnimationFrame(drawCanvas);
	}

	function loadImage(url: string) {
		error = '';
		imageUrl = url;
		imageLoaded = false;

		const img = new Image();
		img.onload = () => setInitialCrop(img);
		img.onerror = () => {
			error = 'Could not load image.';
			imageLoaded = false;
		};

		img.crossOrigin = 'anonymous';
		img.src = url;
	}

	function loadFile(file: File) {
		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			error = 'Use a PNG, JPEG, or WebP image.';
			return;
		}

		if (file.size > 4_194_304) {
			error = 'Image must be under 4 MB.';
			return;
		}


		if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
		const url = URL.createObjectURL(file);
		sourceObjectUrl = url;
		loadImage(url);
	}

	function handleFileSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) loadFile(file);
		input.value = '';
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (file) loadFile(file);
	}

	function clampOffsets() {
		const drawnWidth = imageWidth * zoom;
		const drawnHeight = imageHeight * zoom;

		if (drawnWidth <= CROP_WIDTH) offsetX = (CROP_WIDTH - drawnWidth) / 2;
		else offsetX = Math.min(0, Math.max(CROP_WIDTH - drawnWidth, offsetX));

		if (drawnHeight <= CROP_HEIGHT) offsetY = (CROP_HEIGHT - drawnHeight) / 2;
		else offsetY = Math.min(0, Math.max(CROP_HEIGHT - drawnHeight, offsetY));
	}

	function drawCanvas() {
		if (!canvas || !imageLoaded || !imageElement) return;

		clampOffsets();

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
		ctx.fillStyle = '#09090b';
		ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
		ctx.drawImage(imageElement, offsetX, offsetY, imageWidth * zoom, imageHeight * zoom);
	}

	function handlePointerDown(event: PointerEvent) {
		if (!imageLoaded) return;

		dragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!dragging) return;

		offsetX = dragStartOffsetX + event.clientX - dragStartX;
		offsetY = dragStartOffsetY + event.clientY - dragStartY;
		drawCanvas();
	}

	function handlePointerUp() {
		dragging = false;
	}

	function setZoom(nextZoom: number) {
		if (!imageLoaded) return;

		const oldZoom = zoom;
		const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));

		const centerX = CROP_WIDTH / 2;
		const centerY = CROP_HEIGHT / 2;
		const imageCenterX = (centerX - offsetX) / oldZoom;
		const imageCenterY = (centerY - offsetY) / oldZoom;

		zoom = next;
		offsetX = centerX - imageCenterX * zoom;
		offsetY = centerY - imageCenterY * zoom;

		drawCanvas();
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		setZoom(zoom + event.deltaY * -0.0015);
	}

	function handleZoomInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		setZoom(Number(input.value));
	}

	function createCropBlob(): Promise<Blob | null> {
		if (!imageElement || !imageLoaded) return Promise.resolve(null);

		const out = document.createElement('canvas');
		out.width = outputWidth;
		out.height = outputHeight;

		const ctx = out.getContext('2d');
		if (!ctx) return Promise.resolve(null);

		clampOffsets();

		const sx = -offsetX / zoom;
		const sy = -offsetY / zoom;
		const sw = CROP_WIDTH / zoom;
		const sh = CROP_HEIGHT / zoom;

		ctx.drawImage(imageElement, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

		return new Promise((resolve) => {
			const quality = kind === 'banner' ? 0.8 : 0.88;
			out.toBlob((blob) => resolve(blob), 'image/webp', quality);
		});
	}

	async function handleSave() {
		error = '';
		saving = true;

		try {
			const blob = await createCropBlob();
			if (!blob) {
				error = 'Could not create cropped image.';
				return;
			}

			await onsave(blob, shape);
		} catch (caught) {
			error = caught instanceof Error && caught.message ? caught.message : 'Could not save image.';
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		resetSource();
		onclose();
	}

	async function handleRemove() {
		error = '';
		saving = true;
		try {
			await onremove?.();
			onclose();
		} catch (caught) {
			error = caught instanceof Error && caught.message ? caught.message : 'Could not remove image.';
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (initialized) return;
		initialized = true;

		shape = currentShape;
		if (currentImageUrl) loadImage(currentImageUrl);
	});

	$effect(() => {
		if (canvas && imageLoaded) drawCanvas();
	});

	$effect(() => {
		return () => {
			resetSource();
		};
	});
</script>

<div
	class="image-editor-backdrop"
	role="dialog"
	aria-modal="true"
	aria-label={title ?? (kind === 'banner' ? 'Edit banner image' : 'Edit profile picture')}
	tabindex="-1"
	onkeydown={(event) => event.key === 'Escape' && handleCancel()}
>
	<button
		type="button"
		class="image-editor-scrim"
		aria-label="Close image editor"
		onclick={handleCancel}
	></button>

	<div class="image-editor-modal" in:fly={{ y: 24, duration: 180 }} out:fly={{ y: 24, duration: 120 }}>
		<header class="image-editor-header">
			<h3>{title ?? (kind === 'banner' ? 'Banner image' : 'Profile picture')}</h3>
			<button type="button" class="image-editor-close" onclick={handleCancel} aria-label="Close">
				{#if saving}
					…
				{:else}
				&times;
				{/if}
			</button>
		</header>

		<div
			class="image-editor-crop"
			role="presentation"
			ondragover={handleDragOver}
			ondrop={handleDrop}
		>
			{#if imageLoaded}
				<div
					class="image-editor-crop-area"
					class:avatar-crop={kind === 'avatar'}
					class:banner-crop={kind === 'banner'}
					class:shape-rounded={kind === 'avatar' && shape === 'rounded-xl'}
					class:shape-circle={kind === 'avatar' && shape === 'rounded-full'}
					role="img"
					aria-label="Crop area. Drag to reposition and use the slider to zoom."
					style:width={`${CROP_WIDTH}px`}
					style:height={`${CROP_HEIGHT}px`}
					onpointerdown={handlePointerDown}
					onpointermove={handlePointerMove}
					onpointerup={handlePointerUp}
					onpointerleave={handlePointerUp}
					onwheel={handleWheel}
				>
					<canvas bind:this={canvas} width={CROP_WIDTH} height={CROP_HEIGHT}></canvas>
				</div>
			{:else}
				<button type="button" class="image-editor-upload-empty" onclick={() => fileInput?.click()} disabled={saving}>
					<span>{kind === 'banner' ? 'Upload a banner image' : 'Upload a profile picture'}</span>
					<small>PNG, JPEG, or WebP. Drag and drop works too.</small>
				</button>
			{/if}

			<input
				bind:this={fileInput}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				class="hidden"
				onchange={handleFileSelect}
			/>
		</div>

		{#if imageLoaded}
			<div class="image-editor-controls">
				<div class="image-editor-zoom-row">
					<span class="text-xs text-text-muted">Zoom</span>
					<label class="image-editor-slider" aria-label="Zoom">
						<input
							type="range"
							min={MIN_ZOOM}
							max={MAX_ZOOM}
							step="0.01"
							value={zoom}
							oninput={handleZoomInput}
						/>
					</label>
					<span class="text-xs text-text-muted">{Math.round(zoom * 100)}%</span>
				</div>

				{#if allowShape}
					<div class="image-editor-shape-row" aria-label="Avatar shape">
						<button
							type="button"
							class="image-editor-shape-icon"
							class:active={shape === 'rounded-xl'}
							onclick={() => {
								shape = 'rounded-xl';
							}}
							aria-label="Rounded square avatar"
						>
							<span class="shape-sample square"></span>
						</button>

						<button
							type="button"
							class="image-editor-shape-icon"
							class:active={shape === 'rounded-full'}
							onclick={() => {
								shape = 'rounded-full';
							}}
							aria-label="Circle avatar"
						>
							<span class="shape-sample circle"></span>
						</button>
					</div>
				{/if}
			</div>
		{/if}

		{#if error}
			<div class="image-editor-error">{error}</div>
		{/if}

		<footer class="image-editor-footer">
			<div class="image-editor-footer-left">
				<button type="button" class="btn-secondary" onclick={() => fileInput?.click()} disabled={saving}>
					{imageLoaded ? 'Choose another image' : 'Choose image'}
				</button>

				{#if currentImageUrl && onremove}
					<button type="button" class="btn-secondary danger-text" onclick={handleRemove} disabled={saving}>
						Remove
					</button>
				{/if}
			</div>

			<div class="image-editor-footer-right">
				<button type="button" class="btn-secondary" onclick={handleCancel} disabled={saving}>Cancel</button>

				<button type="button" class="btn" onclick={handleSave} disabled={!imageLoaded || saving}>
					{saving ? 'Saving...' : 'Save image'}
				</button>
			</div>
		</footer>
	</div>
</div>
