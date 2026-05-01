<script lang="ts">
	type Props = {
		file: File;
		oncancel: () => void;
		onsave: (blob: Blob) => void;
	};

	let { file, oncancel, onsave }: Props = $props();

	const OUTPUT_SIZE = 512;
	const CROP_SIZE = 256;

	let canvas = $state<HTMLCanvasElement>();
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

	const scale = $derived(zoom);
	const canvasSize = CROP_SIZE;

	function loadImage() {
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

		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

		const img = new Image();
		img.src = imageUrl;
		ctx.drawImage(img, offsetX, offsetY, imgW * scale, imgH * scale);

		ctx.restore();

		ctx.strokeStyle = 'rgba(255,255,255,0.8)';
		ctx.lineWidth = 1;
		ctx.strokeRect(0, 0, CROP_SIZE, CROP_SIZE);
	}

	function handlePointerDown(e: PointerEvent) {
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		(e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
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

	async function handleSave() {
		saving = true;
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
			saving = false;
			if (blob) onsave(blob);
			URL.revokeObjectURL(imageUrl);
		}, 'image/webp', 0.85);
	}

	function handleCancel() {
		URL.revokeObjectURL(imageUrl);
		oncancel();
	}

	$effect(() => {
		if (file) loadImage();
		return () => URL.revokeObjectURL(imageUrl);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="crop-modal-backdrop" role="dialog" aria-label="Crop profile picture">
	<div class="crop-modal">
		<header>
			<h3>Crop profile picture</h3>
			<button type="button" onclick={handleCancel} aria-label="Close">&times;</button>
		</header>

		<div
			class="crop-area"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointerleave={handlePointerUp}
			style="touch-action: none"
		>
			<canvas bind:this={canvas} width={canvasSize} height={canvasSize}></canvas>
		</div>

		<div class="crop-controls">
			<label class="crop-slider">
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

		<footer>
			<button type="button" class="btn-ghost" onclick={handleCancel}>Cancel</button>
			<button type="button" class="btn" onclick={handleSave} disabled={saving}>
				{saving ? 'Saving...' : 'Save'}
			</button>
		</footer>
	</div>
</div>
