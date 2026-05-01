<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	type Props = {
		currentShape?: 'rounded-xl' | 'rounded-full';
		onclose: () => void;
		onsave: (blob: Blob, shape: 'rounded-xl' | 'rounded-full') => void;
	};

	let { currentShape = 'rounded-xl', onclose, onsave }: Props = $props();

	const OUTPUT_SIZE = 512;
	const CROP_SIZE = 300;

	let canvas = $state<HTMLCanvasElement>();
	let fileInput = $state<HTMLInputElement>();
	let imageUrl = $state('');
	let imageLoaded = $state(false);
	let imgW = $state(0);
	let imgH = $state(0);
	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let dragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragStartOffsetX = $state(0);
	let dragStartOffsetY = $state(0);
	let saving = $state(false);
	let error = $state('');
	let shape = $state<'rounded-xl' | 'rounded-full'>(currentShape);

	const scale = $derived(zoom);
	const canvasSize = CROP_SIZE;

	let dragCtx = $state<{
		startX: number;
		startY: number;
		startOffsetX: number;
		startOffsetY: number;
		canvas: HTMLCanvasElement | null;
	} | null>(null);

	const UPLOAD = 'upload' as const;
	const CROP = 'crop' as const;
	const PREVIEW = 'preview' as const;
	const CONFIRM = 'confirm' as const;
	type Step = typeof UPLOAD | typeof CROP | typeof PREVIEW | typeof CONFIRM;

	let step = $state<Step>(UPLOAD);
	let previewBlob = $state<Blob | null>(null);

	function loadImage(file: File) {
		error = '';
		const url = URL.createObjectURL(file);
		imageUrl = url;
		const img = new Image();
		img.onload = () => {
			imgW = img.naturalWidth;
			imgH = img.naturalHeight;
			const minDim = Math.min(imgW, imgH);
			zoom = CROP_SIZE / minDim;
			offsetX = (imgW * zoom - CROP_SIZE) / -2;
			offsetY = (imgH * zoom - CROP_SIZE) / -2;
			imageLoaded = true;
			tick();
		};
		img.src = url;
	}

	function tick() {
		if (!canvas || !imageLoaded) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, CROP_SIZE, CROP_SIZE);
		ctx.clip();
		ctx.fillStyle = '#18181b';
		ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
		const img = new Image();
		img.src = imageUrl;
		ctx.drawImage(img, offsetX, offsetY, imgW * scale, imgH * scale);
		ctx.restore();
		ctx.strokeStyle = 'rgba(255,255,255,0.6)';
		ctx.lineWidth = 1;
		ctx.strokeRect(0, 0, CROP_SIZE, CROP_SIZE);
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			error = 'Use a PNG, JPEG, or WebP image.';
			return;
		}
		if (file.size > 2_097_152) {
			error = 'Image must be under 2 MB.';
			return;
		}

		loadImage(file);
		step = CROP;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;

		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			error = 'Use a PNG, JPEG, or WebP image.';
			return;
		}
		if (file.size > 2_097_152) {
			error = 'Image must be under 2 MB.';
			return;
		}

		loadImage(file);
		step = CROP;
	}

	function handlePointerDown(e: PointerEvent) {
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragging) return;
		offsetX = dragStartOffsetX + (e.clientX - dragStartX);
		offsetY = dragStartOffsetY + (e.clientY - dragStartY);
		tick();
	}

	function handlePointerUp() {
		dragging = false;
	}

	function handleZoomInput(e: Event) {
		const input = e.target as HTMLInputElement;
		zoom = parseFloat(input.value);
		tick();
	}

	async function handleCropDone() {
		const outCanvas = document.createElement('canvas');
		outCanvas.width = OUTPUT_SIZE;
		outCanvas.height = OUTPUT_SIZE;
		const ctx = outCanvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		await new Promise<void>((resolve) => {
			img.onload = () => resolve();
			img.src = imageUrl;
		});

		const sx = (-offsetX / scale);
		const sy = (-offsetY / scale);
		const sw = CROP_SIZE / scale;
		const sh = CROP_SIZE / scale;

		ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

		outCanvas.toBlob((blob) => {
			if (blob) {
				previewBlob = blob;
				step = PREVIEW;
			}
		}, 'image/webp', 0.85);
	}

	function handleBackToUpload() {
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		imageUrl = '';
		imageLoaded = false;
		previewBlob = null;
		error = '';
		step = UPLOAD;
	}

	function handleConfirm() {
		step = CONFIRM;
	}

	async function handleApply() {
		if (!previewBlob) return;
		saving = true;
		onsave(previewBlob, shape);
	}

	function handleCancel() {
		if (imageUrl) URL.revokeObjectURL(imageUrl);
		onclose();
	}

	$effect(() => {
		if (canvas && imageLoaded) tick();
	});

	$effect(() => {
		return () => {
			if (imageUrl) URL.revokeObjectURL(imageUrl);
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_interactive_supports_focus -->
<div class="avatar-modal-backdrop" role="dialog" aria-label="Edit profile picture" tabindex="-1"
	onkeydown={(e: KeyboardEvent) => e.key === 'Escape' && handleCancel()}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="avatar-modal-backdrop-scrim" onclick={handleCancel}></div>

	<div class="avatar-modal" in:fly={{ y: 24, duration: 200 }} out:fly={{ y: 24, duration: 150 }}>
		<header class="avatar-modal-header">
			<h3>
				{#if step === UPLOAD}
					Upload a photo
				{:else if step === CROP}
					Crop picture
				{:else if step === PREVIEW || step === CONFIRM}
					Preview
				{/if}
			</h3>
			<button type="button" class="avatar-modal-close" onclick={handleCancel} aria-label="Close">
				&times;
			</button>
		</header>

		{#if step === UPLOAD}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="avatar-modal-upload"
				ondragover={handleDragOver}
				ondrop={handleDrop}
				role="button"
				tabindex="0"
				onclick={() => fileInput?.click()}
				onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && fileInput?.click()}
			>
				<div class="avatar-modal-upload-icon">
					<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<circle cx="8.5" cy="8.5" r="1.5" />
						<polyline points="21 15 16 10 5 21" />
					</svg>
				</div>
				<p class="avatar-modal-upload-text">Click to browse or drag and drop</p>
				<p class="avatar-modal-upload-hint">PNG, JPEG, or WebP. Max 2 MB.</p>
				<input
					type="file"
					accept="image/png,image/jpeg,image/webp"
					class="hidden"
					bind:this={fileInput}
					onchange={handleFileSelect}
				/>
			</div>

		{:else if step === CROP}
			<div class="avatar-modal-crop">
				<div
					class="avatar-modal-crop-area"
					onpointerdown={handlePointerDown}
					onpointermove={handlePointerMove}
					onpointerup={handlePointerUp}
					onpointerleave={handlePointerUp}
					style="touch-action: none"
					role="img"
					aria-label="Crop area - drag to reposition, use slider to zoom"
				>
					<canvas bind:this={canvas} width={canvasSize} height={canvasSize}></canvas>
				</div>
				<div class="avatar-modal-crop-controls">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<label class="avatar-modal-zoom-slider">
						<input
							type="range"
							min={zoom * 0.5}
							max={zoom * 2.5}
							step="0.01"
							value={zoom}
							oninput={handleZoomInput}
						/>
					</label>
					<span class="text-xs text-text-muted">{Math.round(zoom * 100)}%</span>
				</div>
			</div>

		{:else if step === PREVIEW || step === CONFIRM}
			<div class="avatar-modal-preview">
				<div class="avatar-modal-preview-image-wrap">
					{#if previewBlob}
						<img
							class="avatar-modal-preview-image"
							class:rounded-xl={shape === 'rounded-xl'}
							class:rounded-full={shape === 'rounded-full'}
							src={URL.createObjectURL(previewBlob)}
							alt=""
						/>
					{/if}
				</div>

				{#if step === PREVIEW}
					<div class="avatar-modal-shape-select">
						<p class="text-xs font-semibold uppercase text-text-muted mb-2">Avatar shape</p>
						<div class="avatar-modal-shape-options">
							<button
								type="button"
								class="avatar-modal-shape-btn"
								class:active={shape === 'rounded-xl'}
								onclick={() => (shape = 'rounded-xl')}
								aria-label="Square avatar"
							>
								<div class="avatar-modal-shape-sample rounded-xl"></div>
								<span>Square</span>
							</button>
							<button
								type="button"
								class="avatar-modal-shape-btn"
								class:active={shape === 'rounded-full'}
								onclick={() => (shape = 'rounded-full')}
								aria-label="Circle avatar"
							>
								<div class="avatar-modal-shape-sample rounded-full"></div>
								<span>Circle</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if error}
			<div class="avatar-modal-error">{error}</div>
		{/if}

		<footer class="avatar-modal-footer">
			{#if step === UPLOAD}
				<button type="button" class="btn-ghost" onclick={handleCancel}>Cancel</button>

			{:else if step === CROP}
				<button type="button" class="btn-ghost" onclick={handleBackToUpload}>Back</button>
				<div class="avatar-modal-footer-right">
					<button type="button" class="btn-ghost" onclick={handleCancel}>Cancel</button>
					<button type="button" class="btn" onclick={handleCropDone}>Apply crop</button>
				</div>

			{:else if step === PREVIEW}
				<button type="button" class="btn-ghost" onclick={handleBackToUpload}>Back</button>
				<div class="avatar-modal-footer-right">
					<button type="button" class="btn-ghost" onclick={handleCancel}>Cancel</button>
					<button type="button" class="btn" onclick={handleConfirm}>Use this picture</button>
				</div>

			{:else if step === CONFIRM}
				<button type="button" class="btn-ghost" onclick={() => (step = PREVIEW)}>Back</button>
				<div class="avatar-modal-footer-right">
					<p class="avatar-modal-confirm-text">Apply this image?</p>
					<button type="button" class="btn-ghost" onclick={handleCancel}>No</button>
					<button type="button" class="btn" onclick={handleApply} disabled={saving}>
						{saving ? 'Saving...' : 'Yes, apply'}
					</button>
				</div>
			{/if}
		</footer>
	</div>
</div>
