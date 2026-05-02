<script lang="ts">
	import { onMount } from 'svelte';
	import { GlyphAtlas } from './hero/GlyphAtlas';
	import { GpuGlyphRenderer } from './hero/GpuGlyphRenderer';
	import {
		BLOCK_REBOUND_DURATION,
		BLOCK_REBOUND_HIDE_MAX,
		BLOCK_REBOUND_OVERSHOOT,
		CELL_X,
		CELL_Y,
		CLICK_BLOCK_DURATION,
		CLICK_DENSITY_MAX_COUNT,
		CLICK_DENSITY_MAX_FONT,
		CLICK_DENSITY_MIN_COUNT,
		CLICK_DENSITY_MIN_FONT,
		CLICK_RIPPLE_BLOCK_ALPHA,
		CLICK_RIPPLE_BLOCK_THRESHOLD,
		CLICK_RIPPLE_CENTER_WIDTH,
		CLICK_RIPPLE_DURATION,
		CLICK_RIPPLE_GLOBAL_AFTERWAVE,
		CLICK_RIPPLE_MAX_ACTIVE,
		CLICK_RIPPLE_MAX_AMOUNT,
		CLICK_RIPPLE_SPEED,
		CLICK_RIPPLE_WIDTH,
		CLICK_TRANSITION_WINDOW,
		CLICK_UNBLOCK_DURATION,
		COLOR_LIFE_DISTANCE_DECAY,
		COLOR_LIFE_DURATION,
		COLOR_LIFE_MAX_ORIGINS,
		COLOR_LIFE_MAX_STRENGTH,
		COLOR_LIFE_MIN_ORIGINS,
		COLOR_LIFE_MIN_STRENGTH,
		COLOR_LIFE_WAVE_SPEED,
		COLOR_LIFE_WAVE_WIDTH,
		CURSOR_REBOUND_MOVE_THRESHOLD,
		CURSOR_RADIUS_X,
		CURSOR_RADIUS_Y,
		CURSOR_REBOUND_RADIUS_X,
		CURSOR_REBOUND_RADIUS_Y,
		DENSITY_REBOUND_DURATION,
		EMPTY_HOVER_MEMORY,
		EMPTY_HOVER_REBOUND_AFTER,
		FRAME_MS,
		MOBILE_FRAME_MS,
		HELIX_START_DELAY,
		HOVER_MAX_DENSITY,
		HOVER_MAX_FONT,
		HOVER_MIN_DENSITY,
		HOVER_MIN_FONT,
		LETTER_SWAP_DURATION,
		LETTER_SWAP_HOLD_END,
		LETTER_SWAP_IN_END,
		LETTER_SWAP_MAX_TARGETS,
		LETTER_SWAP_MIN_TARGETS,
		LETTER_SWAP_OUT_END,
		LETTER_SWAP_TRANSITION_BLOCK_CHANCE,
		MOBILE_BREAKPOINT,
		MOBILE_NAME_FONT_SCALE,
		MOBILE_NAME_Y,
		MOBILE_RIGHT_PADDING,
		MOBILE_TEXT_SAMPLE_MAIN_STEP_X,
		MOBILE_TEXT_SAMPLE_MAIN_STEP_Y,
		MOBILE_TEXT_SAMPLE_SIGNATURE_STEP_X,
		MOBILE_TEXT_SAMPLE_SIGNATURE_STEP_Y,
		MOBILE_TITLE_FONT_SCALE,
		MOBILE_TITLE_LINE_GAP_Y,
		MOBILE_TITLE_TOP_Y,
		QUALITY_DROP_AFTER_FRAMES,
		QUALITY_DROP_FRAME_MS,
		QUALITY_RAISE_AFTER_FRAMES,
		QUALITY_RAISE_FRAME_MS,
		SPATIAL_GRID_CELL,
		STATIC_PARTICLE_BOOT_MS,
		TABLET_BREAKPOINT,
		TEXT_SAMPLE_MAIN_STEP_X,
		TEXT_SAMPLE_MAIN_STEP_Y,
		TEXT_SAMPLE_SIGNATURE_STEP_X,
		TEXT_SAMPLE_SIGNATURE_STEP_Y,
		TICKER_BURST_DURATION,
		TICKER_BURST_PERIOD,
		VISUAL_EVENT_KINDS,
		VISUAL_EVENT_MAX_GAP,
		VISUAL_EVENT_MIN_GAP
	} from './hero/constants';
	import type {
		ClickRipple,
		ColorLifeOrigin,
		DensityField,
		Particle,
		Props,
		SamplePoint,
		TickerRow,
		VisualEvent
	} from './hero/types';
	import {
		blockGlyphAt,
		buildColorSteps,
		burstAmount,
		clamp,
		densityGlyphProfile,
		easeOutCubic,
		glyphAt,
		hashNumber,
		isAlphabeticGlyph,
		pointerDensityLevelFromStrength,
		pointerDensityStrengthAt,
		pseudoRandomBool,
		pseudoRandomGlyph,
		randomBetween,
		randomLetterAt,
		scienceGlyphAt,
		stableParticleGlyph
	} from './hero/utils';

	type ProfileBucket = {
		name: string;
		total: number;
		max: number;
		count: number;
		samples: Float32Array;
	};

	type ProfileResult = {
		label: string;
		frames: number;
		durationMs: number;
		fps: number;
		environment: ProfileEnvironment;
		frame: ProfileStats;
		scheduler: {
			avgFrameIntervalMs: number;
			renderUtilization: number;
			targetFrameBudgetMs: number;
			rafCallbacks: number;
			skippedRafCallbacks: number;
			skipRate: number;
		};
		particles: {
			avgTouched: number;
			maxTouched: number;
			staticIdleFrames: number;
			drawAllFrames: number;
		};
		sections: ProfileSectionResult[];
	};

	type ProfileEnvironment = {
		cssWidth: number;
		cssHeight: number;
		canvasWidth: number;
		canvasHeight: number;
		canvasMegapixels: number;
		devicePixelRatio: number;
		effectiveDpr: number;
		configuredDprCap: number | null;
		renderer: string;
		rendererMode: string;
		userAgent: string;
		webglVendor: string;
		webglRenderer: string;
	};

	type ProfileSectionResult = ProfileStats & {
		name: string;
		percent: number;
	};

	type ProfileStats = {
		total: number;
		avg: number;
		median: number;
		max: number;
		p95: number;
	};

	let { text = 'STUDENT HUB', signature = null }: Props = $props();
	
	let root: HTMLElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let measureCtx: CanvasRenderingContext2D | null = null;
	let gpuRenderer: GpuGlyphRenderer | null = null;
	let particles: Particle[] = [];
	let tickerRows: TickerRow[] = [];
	let observer: IntersectionObserver | null = null;
	let raf = 0;
	let resizeRaf = 0;
	let width = 0;
	let height = 0;
	let dpr = 1;
	let bootTime = 0;
	let lastFrame = 0;
	let nextFrameDue = 0;
	let running = false;
	let visible = false;
	let reduceMotion = false;
	let pointerActive = false;
	let pointerX = -9999;
	let pointerY = -9999;
	let previousPointerX = -9999;
	let previousPointerY = -9999;
	let densityExitStart = 0;
	let densityExitX = -9999;
	let densityExitY = -9999;
	let lastTextHoverX = -9999;
	let lastTextHoverY = -9999;
	let lastTextHoverAt = 0;
	let lastAutoReboundAt = 0;
	let blockStart = 0;
	let blockDirection: 1 | -1 = 1;
	let blockAmount = 0;
	let clickRipples: ClickRipple[] = [];
	let activeVisualEvent: VisualEvent | null = null;
	let visualEventTimer: number | null = null;
	let accentColor = '#ff7043';
	let colorSteps = ['#f2f1ec', '#f2f1ec', '#ff7043', '#ff7043', '#ff7043', '#ff7043'];
	let frameBudget = FRAME_MS;
	let configuredTargetFps: number | null = null;
	let configuredDprCap: number | null = null;
	let configuredRendererMode = 'auto';
	let glyphAtlas = new GlyphAtlas();
	let staticBackgroundLayer: HTMLCanvasElement | null = null;
	let staticTickerLayer: HTMLCanvasElement | null = null;
	let staticParticleLayer: HTMLCanvasElement | null = null;
	let particleGrid = new Map<number, number[]>();
	let hoverInfluence = new Float32Array(0);
	let hoverLevelInfluence = new Uint8Array(0);
	let reboundInfluence = new Float32Array(0);
	let reboundLevelInfluence = new Uint8Array(0);
	let rippleInfluence = new Float32Array(0);
	let colorLifeInfluence = new Float32Array(0);
	let dynamicParticleFlags = new Uint8Array(0);
	let dynamicParticleIndexes: number[] = [];
	let qualityLevel = 2;
	let slowFrameCount = 0;
	let fastFrameCount = 0;
	let sampleTextCache = new Map<string, SamplePoint[]>();
	let perfCanvas: HTMLCanvasElement;
	let perfCtx: CanvasRenderingContext2D | null = null;
	let showPerfPanel = $state(false);
	let perfSampleIndex = 0;
	let perfSampleCount = 0;
	let perfIntervalCount = 0;
	let perfCostTotal = 0;
	let perfIntervalTotal = 0;
	let perfLastFrameAt = 0;
	let perfLastPaintAt = 0;
	let perfSamples = new Float32Array(180);
	let perfIntervals = new Float32Array(180);
	let perfSortedSamples = new Float32Array(180);
	let rafCallbacksTotal = 0;
	let skippedRafCallbacksTotal = 0;
	let profileActive = false;
	let profileTargetFrames = 0;
	let profileFrameCount = 0;
	let profileStartedAt = 0;
	let profileBuckets = new Map<string, ProfileBucket>();
	let profileFrameSamples = new Float32Array(0);
	let profilePromise: Promise<ProfileResult> | null = null;
	let profileResolve: ((result: ProfileResult) => void) | null = null;
	let profileTouchedParticlesTotal = 0;
	let profileTouchedParticlesMax = 0;
	let profileStaticIdleFrames = 0;
	let profileDrawAllFrames = 0;
	let profileRafCallbacks = 0;
	let profileSkippedRafCallbacks = 0;
	let profileLabel = '';

	const PERF_PANEL_WIDTH = 236;
	const PERF_PANEL_HEIGHT = 126;
	const PERF_PANEL_UPDATE_MS = 250;


	function snapX(value: number) {
		return Math.round(value / CELL_X) * CELL_X + CELL_X / 2;
	}

	function snapY(value: number) {
		return Math.round(value / CELL_Y) * CELL_Y + CELL_Y / 2;
	}

	function hasRenderer() {
		return Boolean(ctx || gpuRenderer);
	}

	function gridSafeDprFor(nativeDpr: number, hardCap: number, cssWidth: number, cssHeight: number) {
		const cssMegapixels = (cssWidth * cssHeight) / 1_000_000;
		const maxCanvasMegapixels = cssWidth < MOBILE_BREAKPOINT ? 2.2 : 8.5;
		const allowed = [3, 2, 1.5, 1].filter((value) => value <= nativeDpr && value <= hardCap);

		for (const candidate of allowed) {
			if (cssMegapixels * candidate * candidate <= maxCanvasMegapixels) {
				return candidate;
			}
		}

		return allowed.at(-1) ?? 1;
	}

	function getMeasureContext() {
		if (measureCtx) return measureCtx;

		const measureCanvas = document.createElement('canvas');
		measureCtx = measureCanvas.getContext('2d');
		return measureCtx;
	}

	function drawGlyph(target: CanvasRenderingContext2D | null, glyph: string, x: number, y: number, color: string, fontSize = 7, alpha = 1) {
		if (gpuRenderer) {
			gpuRenderer.drawGlyph(glyph, x, y, color, fontSize, alpha);
			return;
		}

		if (!target) return;
		glyphAtlas.drawGlyph(target, glyph, x, y, color, fontSize, alpha);
	}

	function setupPerfPanel() {
		const params = new URLSearchParams(window.location.search);
		const value = params.get('p');
		showPerfPanel = params.has('p') && value !== '0' && value !== 'false';

		if (!showPerfPanel || !perfCanvas) return;

		const perfDpr = Math.min(window.devicePixelRatio || 1, 2);
		perfCanvas.width = Math.round(PERF_PANEL_WIDTH * perfDpr);
		perfCanvas.height = Math.round(PERF_PANEL_HEIGHT * perfDpr);
		perfCanvas.style.width = `${PERF_PANEL_WIDTH}px`;
		perfCanvas.style.height = `${PERF_PANEL_HEIGHT}px`;

		perfCtx = perfCanvas.getContext('2d', { alpha: true });
		if (!perfCtx) return;

		perfCtx.setTransform(perfDpr, 0, 0, perfDpr, 0, 0);
		perfCtx.imageSmoothingEnabled = false;
		drawPerfPanel(performance.now());
	}

	function setupUrlConfig() {
		const params = new URLSearchParams(window.location.search);

		if (!params.has('t')) {
			configuredTargetFps = null;
		} else {
			const value = Number(params.get('t'));
			configuredTargetFps = Number.isFinite(value) ? Math.max(0, value) : null;
		}

		if (!params.has('d')) {
			configuredDprCap = null;
		} else {
			const dprValue = Number(params.get('d'));
			configuredDprCap = Number.isFinite(dprValue) && dprValue > 0 ? dprValue : null;
		}

		configuredRendererMode = (params.get('g') ?? 'auto').toLowerCase();
	}

	function getWebglInfo() {
		const probe = document.createElement('canvas');
		const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');

		if (!gl) {
			return {
				vendor: 'unavailable',
				renderer: 'unavailable'
			};
		}

		const context = gl as WebGLRenderingContext;
		const debugInfo = context.getExtension('WEBGL_debug_renderer_info');

		return {
			vendor: String(debugInfo ? context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR)),
			renderer: String(debugInfo ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER))
		};
	}

	function getProfileEnvironment(): ProfileEnvironment {
		const gpuInfo = gpuRenderer?.getInfo();
		const webgl = gpuInfo ? { vendor: gpuInfo.vendor, renderer: gpuInfo.renderer } : getWebglInfo();

		return {
			cssWidth: width,
			cssHeight: height,
			canvasWidth: canvas?.width ?? 0,
			canvasHeight: canvas?.height ?? 0,
			canvasMegapixels: ((canvas?.width ?? 0) * (canvas?.height ?? 0)) / 1_000_000,
			devicePixelRatio: window.devicePixelRatio || 1,
			effectiveDpr: dpr,
			configuredDprCap,
			renderer: gpuRenderer ? 'webgl2-gpu' : 'canvas2d',
			rendererMode: configuredRendererMode,
			userAgent: navigator.userAgent,
			webglVendor: webgl.vendor,
			webglRenderer: webgl.renderer
		};
	}

	function heroDiagnostics() {
		const diagnostics = getProfileEnvironment();
		console.table([diagnostics]);
		return diagnostics;
	}

	function setupConsoleProfiler() {
		const targetWindow = window as Window & {
			profiler?: (frames?: number) => Promise<ProfileResult>;
			heroDiagnostics?: () => ProfileEnvironment;
			__textFieldHeroProfile?: ProfileResult;
		};

		targetWindow.profiler = startConsoleProfiler;
		targetWindow.heroDiagnostics = heroDiagnostics;
	}

	function startConsoleProfiler(frames = 120) {
		if (profileActive && profilePromise) {
			console.warn('[TextFieldHero profiler] A profile is already running.');
			return profilePromise;
		}

		const safeFrames = clamp(Math.floor(Number(frames) || 120), 1, 2000);
		profileTargetFrames = safeFrames;
		profileFrameCount = 0;
		profileStartedAt = performance.now();
		profileBuckets = new Map();
		profileFrameSamples = new Float32Array(safeFrames);
		profileTouchedParticlesTotal = 0;
		profileTouchedParticlesMax = 0;
		profileStaticIdleFrames = 0;
		profileDrawAllFrames = 0;
		profileRafCallbacks = 0;
		profileSkippedRafCallbacks = 0;
		profileLabel = `TextFieldHero ${safeFrames} frames`;
		profileActive = true;

		if (typeof console.profile === 'function') {
			console.profile(profileLabel);
		}

		console.info(`[TextFieldHero profiler] Capturing ${safeFrames} rendered frames...`);

		profilePromise = new Promise<ProfileResult>((resolve) => {
			profileResolve = resolve;
		});

		syncRunningState();
		return profilePromise;
	}

	function profileStart() {
		return profileActive ? performance.now() : 0;
	}

	function profileEnd(name: string, startedAt: number) {
		if (!profileActive || startedAt <= 0) return;

		const elapsed = performance.now() - startedAt;
		let bucket = profileBuckets.get(name);

		if (!bucket) {
			bucket = {
				name,
				total: 0,
				max: 0,
				count: 0,
				samples: new Float32Array(profileTargetFrames)
			};
			profileBuckets.set(name, bucket);
		}

		if (bucket.count < bucket.samples.length) {
			bucket.samples[bucket.count] = elapsed;
		}

		bucket.count += 1;
		bucket.total += elapsed;
		if (elapsed > bucket.max) bucket.max = elapsed;
	}

	function profileParticlePass(touched: number, usedStaticIdle: boolean, drawAllParticles: boolean) {
		if (!profileActive) return;

		profileTouchedParticlesTotal += touched;
		if (touched > profileTouchedParticlesMax) profileTouchedParticlesMax = touched;
		if (usedStaticIdle) profileStaticIdleFrames += 1;
		if (drawAllParticles) profileDrawAllFrames += 1;
	}

	function profileFrame(frameCost: number) {
		if (!profileActive) return;

		if (profileFrameCount < profileFrameSamples.length) {
			profileFrameSamples[profileFrameCount] = frameCost;
		}

		profileFrameCount += 1;

		if (profileFrameCount >= profileTargetFrames) {
			finishConsoleProfiler();
		}
	}

	function statsFor(samples: Float32Array, count: number, total?: number, maxValue?: number): ProfileStats {
		const safeCount = Math.max(0, count);
		if (safeCount === 0) {
			return { total: 0, avg: 0, median: 0, max: 0, p95: 0 };
		}

		const sorted = new Float32Array(safeCount);
		let computedTotal = 0;
		let computedMax = 0;

		for (let i = 0; i < safeCount; i++) {
			const value = samples[i];
			sorted[i] = value;
			computedTotal += value;
			if (value > computedMax) computedMax = value;
		}

		sorted.sort();

		const middle = Math.floor(safeCount / 2);
		const median = safeCount % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
		const p95 = sorted[Math.min(safeCount - 1, Math.ceil(safeCount * 0.95) - 1)] ?? 0;
		const finalTotal = total ?? computedTotal;

		return {
			total: finalTotal,
			avg: finalTotal / safeCount,
			median,
			max: maxValue ?? computedMax,
			p95
		};
	}

	function finishConsoleProfiler() {
		if (!profileActive) return;

		profileActive = false;

		if (typeof console.profileEnd === 'function') {
			console.profileEnd(profileLabel);
		}

		const durationMs = performance.now() - profileStartedAt;
		const frame = statsFor(profileFrameSamples, profileFrameCount);
		const sections = [...profileBuckets.values()]
			.map((bucket) => {
				const stats = statsFor(bucket.samples, Math.min(bucket.count, bucket.samples.length), bucket.total, bucket.max);
				return {
					name: bucket.name,
					...stats,
					percent: frame.total > 0 ? (stats.total / frame.total) * 100 : 0
				};
			})
			.sort((a, b) => b.total - a.total);
		const result: ProfileResult = {
			label: profileLabel,
			frames: profileFrameCount,
			durationMs,
			fps: durationMs > 0 ? (profileFrameCount / durationMs) * 1000 : 0,
			environment: getProfileEnvironment(),
			frame,
			scheduler: {
				avgFrameIntervalMs: profileFrameCount > 0 ? durationMs / profileFrameCount : 0,
				renderUtilization: durationMs > 0 ? (frame.total / durationMs) * 100 : 0,
				targetFrameBudgetMs: frameBudget,
				rafCallbacks: profileRafCallbacks,
				skippedRafCallbacks: profileSkippedRafCallbacks,
				skipRate: profileRafCallbacks > 0 ? (profileSkippedRafCallbacks / profileRafCallbacks) * 100 : 0
			},
			particles: {
				avgTouched: profileFrameCount > 0 ? profileTouchedParticlesTotal / profileFrameCount : 0,
				maxTouched: profileTouchedParticlesMax,
				staticIdleFrames: profileStaticIdleFrames,
				drawAllFrames: profileDrawAllFrames
			},
			sections
		};
		const targetWindow = window as Window & { __textFieldHeroProfile?: ProfileResult };
		targetWindow.__textFieldHeroProfile = result;

		console.groupCollapsed(`[TextFieldHero profiler] ${profileFrameCount} frames`);
		console.table(
			sections.map((section) => ({
				section: section.name,
				totalMs: Number(section.total.toFixed(2)),
				avgMs: Number(section.avg.toFixed(3)),
				medianMs: Number(section.median.toFixed(3)),
				p95Ms: Number(section.p95.toFixed(3)),
				maxMs: Number(section.max.toFixed(3)),
				percent: Number(section.percent.toFixed(1))
			}))
		);
		console.log('summary', result);
		console.log('scheduler', result.scheduler);
		console.log('environment', result.environment);
		console.groupEnd();

		profileResolve?.(result);
		profileResolve = null;
		profilePromise = null;
	}

	function createLayer() {
		const layer = document.createElement('canvas');
		layer.width = Math.max(1, Math.round(width * dpr));
		layer.height = Math.max(1, Math.round(height * dpr));

		const layerCtx = layer.getContext('2d', { alpha: true });
		if (!layerCtx) return null;

		layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
		layerCtx.imageSmoothingEnabled = false;
		return { layer, layerCtx };
	}

	function buildStaticBackgroundLayer() {
		const target = createLayer();
		if (!target) return;

		const { layer, layerCtx } = target;

		// Qwen + Claude Sonnet: cache the background, radial glow, and regular grid outside the frame loop.
		layerCtx.fillStyle = '#161713';
		layerCtx.fillRect(0, 0, width, height);

		const radial = layerCtx.createRadialGradient(width * 0.54, height * 0.48, 0, width * 0.54, height * 0.48, width * 0.62);
		radial.addColorStop(0, accentColor);
		radial.addColorStop(0.44, 'rgba(240, 240, 232, 0.08)');
		radial.addColorStop(1, 'rgba(22, 23, 19, 0)');

		layerCtx.globalAlpha = 0.11;
		layerCtx.fillStyle = radial;
		layerCtx.fillRect(0, 0, width, height);
		layerCtx.globalAlpha = 1;

		layerCtx.strokeStyle = `rgba(242, 241, 236, ${width < MOBILE_BREAKPOINT ? 0.008 : 0.017})`;
		layerCtx.lineWidth = 1;
		layerCtx.beginPath();

		for (let x = 0.5; x <= width; x += CELL_X) {
			layerCtx.moveTo(x, 0);
			layerCtx.lineTo(x, height);
		}

		for (let y = 0.5; y <= height; y += CELL_Y) {
			layerCtx.moveTo(0, y);
			layerCtx.lineTo(width, y);
		}

		layerCtx.stroke();
		staticBackgroundLayer = layer;
	}

	function buildStaticParticleLayer() {
		const target = createLayer();
		if (!target) return;

		const { layer, layerCtx } = target;

		// Qwen: bake resting particles so idle frames do not loop through every glyph.
		for (const particle of particles) {
			const roleBoost = particle.role === 'signature' ? 1.85 : 1.28;
			const alpha = Math.min(1, particle.alpha * roleBoost);
			drawGlyph(layerCtx, particle.baseGlyph, particle.homeX, particle.homeY, colorSteps[particle.baseFillIndex] ?? colorSteps[0], 7, alpha);
		}

		layerCtx.globalAlpha = 1;
		staticParticleLayer = layer;
	}

	function drawTickerRowGlyphs(
		target: CanvasRenderingContext2D | null,
		row: TickerRow,
		rowIndex: number,
		amount: number,
		boot: number,
		alphaScale: number
	) {
		const travel = amount * CELL_X * (4 + row.speed * 18);
		const offset = (row.phase + travel) % CELL_X;
		const glyphShift = Math.round(travel / CELL_X);
		const y = row.y;
		const alpha = row.alpha * boot * alphaScale;

		if (alpha <= 0) return;

		for (let x = -CELL_X; x < width + CELL_X; x += CELL_X) {
			const col = Math.floor((x + offset) / CELL_X);
			const glyphIndex = col * 3 + rowIndex * 17 + glyphShift;
			const color = Math.abs(col) % row.accentEvery === 0 ? colorSteps[4] : colorSteps[0];

			drawGlyph(target, glyphAt(glyphIndex), x + offset, y, color, 7, alpha);
		}
	}

	function buildGpuStaticTickerLayer() {
		if (!gpuRenderer) return;

		gpuRenderer.beginStaticGlyphCapture();

		const baseAlpha = width < MOBILE_BREAKPOINT ? 0.18 : 0.38;

		for (let rowIndex = 0; rowIndex < tickerRows.length; rowIndex++) {
			drawTickerRowGlyphs(ctx, tickerRows[rowIndex], rowIndex, 0, 1, baseAlpha);
		}

		gpuRenderer.endStaticGlyphCapture();
	}

	function buildStaticTickerLayer() {
		const target = createLayer();
		if (!target) return;

		const { layer, layerCtx } = target;
		const baseAlpha = width < MOBILE_BREAKPOINT ? 0.18 : 0.38;

		// Qwen + ChatGPT: cache the idle ticker; only burst overlays redraw per-frame.
		for (let rowIndex = 0; rowIndex < tickerRows.length; rowIndex++) {
			drawTickerRowGlyphs(layerCtx, tickerRows[rowIndex], rowIndex, 0, 1, baseAlpha);
		}

		layerCtx.globalAlpha = 1;
		staticTickerLayer = layer;
	}

	function drawStaticParticleLayer() {
		if (gpuRenderer) return;
		if (!ctx || !staticParticleLayer) return;
		ctx.globalAlpha = 1;
		ctx.drawImage(staticParticleLayer, 0, 0, width, height);
	}

	function gridKey(cellX: number, cellY: number) {
		return cellX * 100000 + cellY;
	}

	function buildSpatialGrid() {
		particleGrid = new Map();

		// Qwen + DeepSeek + Claude Sonnet: index particles spatially so local effects query nearby cells only.
		for (let index = 0; index < particles.length; index++) {
			const particle = particles[index];
			const cellX = Math.floor(particle.homeX / SPATIAL_GRID_CELL);
			const cellY = Math.floor(particle.homeY / SPATIAL_GRID_CELL);
			const key = gridKey(cellX, cellY);
			const bucket = particleGrid.get(key);

			if (bucket) bucket.push(index);
			else particleGrid.set(key, [index]);
		}
	}

	function queryParticleGrid(minX: number, minY: number, maxX: number, maxY: number, visit: (index: number) => void) {
		const startX = Math.floor(minX / SPATIAL_GRID_CELL);
		const endX = Math.floor(maxX / SPATIAL_GRID_CELL);
		const startY = Math.floor(minY / SPATIAL_GRID_CELL);
		const endY = Math.floor(maxY / SPATIAL_GRID_CELL);

		for (let cellY = startY; cellY <= endY; cellY++) {
			for (let cellX = startX; cellX <= endX; cellX++) {
				const bucket = particleGrid.get(gridKey(cellX, cellY));
				if (!bucket) continue;

				for (let i = 0; i < bucket.length; i++) {
					visit(bucket[i]);
				}
			}
		}
	}

	function ensureInfluenceArrays() {
		const count = particles.length;
		if (hoverInfluence.length === count) return;

		// Claude Sonnet: typed influence arrays keep effect state compact without rewriting all particles as typed storage.
		hoverInfluence = new Float32Array(count);
		hoverLevelInfluence = new Uint8Array(count);
		reboundInfluence = new Float32Array(count);
		reboundLevelInfluence = new Uint8Array(count);
		rippleInfluence = new Float32Array(count);
		colorLifeInfluence = new Float32Array(count);
		dynamicParticleFlags = new Uint8Array(count);
	}

	function clearInfluences() {
		hoverInfluence.fill(0);
		hoverLevelInfluence.fill(0);
		reboundInfluence.fill(0);
		reboundLevelInfluence.fill(0);
		rippleInfluence.fill(0);
		colorLifeInfluence.fill(0);
		dynamicParticleFlags.fill(0);
		dynamicParticleIndexes.length = 0;
	}

	function markDynamicParticle(index: number) {
		if (dynamicParticleFlags[index]) return;

		dynamicParticleFlags[index] = 1;
		dynamicParticleIndexes.push(index);
	}

	function densityRadiusFor(field: DensityField) {
		return {
			x: field.amount < 0 ? CURSOR_REBOUND_RADIUS_X : CURSOR_RADIUS_X,
			y: field.amount < 0 ? CURSOR_REBOUND_RADIUS_Y : CURSOR_RADIUS_Y
		};
	}

	function applyDensityInfluence(field: DensityField | null, strengthTarget: Float32Array, levelTarget: Uint8Array, scale = 1) {
		if (!field) return;

		const radius = densityRadiusFor(field);
		queryParticleGrid(field.x - radius.x, field.y - radius.y, field.x + radius.x, field.y + radius.y, (index) => {
			const particle = particles[index];
			const rawStrength = pointerDensityStrengthAt(particle.homeX, particle.homeY, field);
			if (rawStrength <= 0) return;

			strengthTarget[index] = rawStrength * scale;
			levelTarget[index] = pointerDensityLevelFromStrength(rawStrength);
			markDynamicParticle(index);
		});
	}

	function applyClickRippleInfluence(now: number) {
		if (clickRipples.length === 0) return;

		// Claude Sonnet + ChatGPT: push ripple influence from each ring into nearby particles with squared-distance rejection.
		for (const ripple of clickRipples) {
			const elapsed = now - ripple.startedAt;
			if (elapsed < 0 || elapsed >= CLICK_RIPPLE_DURATION) continue;

			const age = elapsed / CLICK_RIPPLE_DURATION;
			const ringRadius = elapsed * CLICK_RIPPLE_SPEED;
			const maxDistance = ringRadius + CLICK_RIPPLE_WIDTH * 3.2 + CLICK_RIPPLE_CENTER_WIDTH * 1.5;
			const maxDistanceSquared = maxDistance * maxDistance;
			const queryRadius = maxDistance * Math.max(CELL_X, CELL_Y);

			queryParticleGrid(ripple.x - queryRadius, ripple.y - queryRadius, ripple.x + queryRadius, ripple.y + queryRadius, (index) => {
				const particle = particles[index];
				const dx = (particle.homeX - ripple.x) / CELL_X;
				const dy = (particle.homeY - ripple.y) / CELL_Y;
				const distanceSquared = dx * dx + dy * dy;
				if (distanceSquared > maxDistanceSquared) return;

				const distance = Math.sqrt(distanceSquared);
				const wave = ringRadius - distance;
				const ring = Math.exp(-(wave * wave) / (2 * CLICK_RIPPLE_WIDTH * CLICK_RIPPLE_WIDTH));
				const center = Math.exp(-distanceSquared / (2 * CLICK_RIPPLE_CENTER_WIDTH * CLICK_RIPPLE_CENTER_WIDTH));
				const fade = Math.pow(1 - age, 1.45);
				const globalAfterwave = Math.sin(age * Math.PI) * CLICK_RIPPLE_GLOBAL_AFTERWAVE;
				const travellingRing = ring * (0.72 + age * 0.28);
				const local = (travellingRing + center * Math.max(0, 0.34 - age) + globalAfterwave) * fade * CLICK_RIPPLE_MAX_AMOUNT;

				if (local <= rippleInfluence[index]) return;
				rippleInfluence[index] = clamp(local, 0, 1);
				markDynamicParticle(index);
			});
		}
	}

	function applyColorLifeInfluence(now: number) {
		if (!activeVisualEvent || activeVisualEvent.kind !== 'color-life') return;

		const elapsed = now - activeVisualEvent.startedAt;
		if (elapsed < 0 || elapsed >= activeVisualEvent.duration) return;

		const age = elapsed / activeVisualEvent.duration;
		const globalFade = Math.pow(1 - age, 1.45);

		// Claude Sonnet + ChatGPT: push color-life waves from origins instead of checking every particle/origin pair.
		for (const origin of activeVisualEvent.origins) {
			const waveDistance = elapsed * COLOR_LIFE_WAVE_SPEED;
			const maxDistance = waveDistance + COLOR_LIFE_WAVE_WIDTH * 3.2;
			const maxDistanceSquared = maxDistance * maxDistance;
			const queryRadius = maxDistance * Math.max(CELL_X, CELL_Y);

			queryParticleGrid(origin.x - queryRadius, origin.y - queryRadius, origin.x + queryRadius, origin.y + queryRadius, (index) => {
				const particle = particles[index];
				if (particle.role !== 'main') return;

				const dx = (particle.homeX - origin.x) / CELL_X;
				const dy = (particle.homeY - origin.y) / CELL_Y;
				const distanceSquared = dx * dx + dy * dy;
				if (distanceSquared > maxDistanceSquared) return;

				const distance = Math.sqrt(distanceSquared);
				const wave = waveDistance - distance;
				const waveAmount = Math.exp(-(wave * wave) / (2 * COLOR_LIFE_WAVE_WIDTH * COLOR_LIFE_WAVE_WIDTH));
				const passedLife = Math.pow(COLOR_LIFE_DISTANCE_DECAY, distance);
				const local = waveAmount * passedLife * globalFade * origin.strength;

				if (local <= colorLifeInfluence[index]) return;
				colorLifeInfluence[index] = clamp(local, 0, 1);
				markDynamicParticle(index);
			});
		}
	}

	function markLetterSwapParticles(now: number) {
		if (!activeVisualEvent || activeVisualEvent.kind !== 'letter-swap') return;

		const elapsed = now - activeVisualEvent.startedAt;
		if (elapsed < 0 || elapsed >= activeVisualEvent.duration) return;

		for (let index = 0; index < particles.length; index++) {
			const particle = particles[index];
			if (particle.role === 'main' && activeVisualEvent.targets.has(particle.charIndex)) {
				markDynamicParticle(index);
			}
		}
	}

	function prepareInfluences(now: number, hoverField: DensityField | null, reboundField: DensityField | null) {
		let sectionStartedAt = profileStart();
		ensureInfluenceArrays();
		clearInfluences();
		profileEnd('influences: clear typed arrays', sectionStartedAt);

		sectionStartedAt = profileStart();
		applyDensityInfluence(hoverField, hoverInfluence, hoverLevelInfluence);
		applyDensityInfluence(reboundField, reboundInfluence, reboundLevelInfluence, Math.min(1, Math.abs(reboundField?.amount ?? 0)));
		profileEnd('influences: pointer/rebound', sectionStartedAt);

		sectionStartedAt = profileStart();
		applyClickRippleInfluence(now);
		profileEnd('influences: click ripples', sectionStartedAt);

		sectionStartedAt = profileStart();
		applyColorLifeInfluence(now);
		profileEnd('influences: color life', sectionStartedAt);

		sectionStartedAt = profileStart();
		markLetterSwapParticles(now);
		profileEnd('influences: letter swap marks', sectionStartedAt);
	}

	function hoverDensityField(): DensityField | null {
		if (!pointerActive) return null;

		return {
			x: pointerX,
			y: pointerY + CELL_Y * 1.2,
			amount: 1
		};
	}

	function reboundDensityField(now: number): DensityField | null {
		if (densityExitStart <= 0) return null;

		const elapsed = now - densityExitStart;
		if (elapsed >= DENSITY_REBOUND_DURATION) return null;

		const progress = elapsed / DENSITY_REBOUND_DURATION;
		const overshoot = Math.sin(progress * Math.PI);
		const settle = 1 - easeOutCubic(progress);

		return {
			x: densityExitX,
			y: densityExitY,
			amount: -overshoot * (BLOCK_REBOUND_OVERSHOOT + settle * 0.18)
		};
	}


	function clickBlockProgress(now: number) {
		if (blockStart <= 0) return blockAmount;

		const duration = blockDirection === 1 ? CLICK_BLOCK_DURATION : CLICK_UNBLOCK_DURATION;
		const progress = clamp((now - blockStart) / duration, 0, 1);
		const eased = easeOutCubic(progress);

		if (blockDirection === 1) {
			blockAmount = eased;
		} else {
			blockAmount = 1 - eased;
		}

		if (progress >= 1) {
			blockStart = 0;
			blockAmount = blockDirection === 1 ? 1 : 0;
		}

		return blockAmount;
	}

	function sampleText(label: string, fontSize: number, x: number, y: number, align: CanvasTextAlign, stepX: number, stepY: number) {
		const cacheKey = `${width}|${height}|${label}|${fontSize}|${x}|${y}|${align}|${stepX}|${stepY}`;
		const cached = sampleTextCache.get(cacheKey);
		if (cached) return cached;

		const sample = document.createElement('canvas');
		const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
		if (!sampleCtx) return [] as SamplePoint[];

		sample.width = Math.max(1, Math.floor(width));
		sample.height = Math.max(1, Math.floor(height));
		sampleCtx.fillStyle = '#fff';
		sampleCtx.textAlign = align;
		sampleCtx.textBaseline = 'middle';
		sampleCtx.font = `900 ${fontSize}px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace`;

		const textWidth = sampleCtx.measureText(label).width;
		const textLeft = align === 'center' ? x - textWidth / 2 : align === 'right' ? x - textWidth : x;
		const spans: { start: number; end: number; glyph: string; charIndex: number }[] = [];
		const realGlyphs = label.replace(/\s+/g, '') || label;
		let cursor = textLeft;
		let visibleCharIndex = 0;

		for (const glyph of label) {
			const glyphWidth = sampleCtx.measureText(glyph).width || fontSize * 0.58;
			const hasGlyph = Boolean(glyph.trim());

			spans.push({
				start: cursor,
				end: cursor + glyphWidth,
				glyph: hasGlyph ? glyph : '',
				charIndex: hasGlyph ? visibleCharIndex : -1
			});

			if (hasGlyph) visibleCharIndex += 1;
			cursor += glyphWidth;
		}

		const glyphMetaFor = (px: number, py: number) => {
			for (const span of spans) {
				if (px >= span.start && px <= span.end && span.glyph) {
					return {
						glyph: span.glyph,
						charIndex: span.charIndex
					};
				}
			}

			const fallbackIndex = Math.abs(Math.floor(px + py)) % Math.max(1, realGlyphs.length);
			return {
				glyph: realGlyphs[fallbackIndex] ?? label[0] ?? '',
				charIndex: fallbackIndex
			};
		};

		sampleCtx.fillText(label, x, y);

		const image = sampleCtx.getImageData(0, 0, sample.width, sample.height).data;
		const points: SamplePoint[] = [];
		const startX = Math.floor(stepX / 2);
		const startY = Math.floor(stepY / 2);

		for (let py = startY; py < sample.height; py += stepY) {
			for (let px = startX; px < sample.width; px += stepX) {
				if (image[(py * sample.width + px) * 4 + 3] > 72) {
					const meta = glyphMetaFor(px, py);
					points.push({
						x: px,
						y: py,
						glyph: meta.glyph,
						charIndex: meta.charIndex
					});
				}
			}
		}

		// Derived from all proposals: cache setup-time text sampling to avoid repeated getImageData work during resize churn.
		sampleTextCache.set(cacheKey, points);
		return points;
	}

	function signatureFontSize(label: string) {
		const measure = getMeasureContext();
		if (!measure) return 88;

		let size = clamp(Math.floor(width * 0.086), 88, 158);
		const maxWidth = width * 0.45;

		while (size > 68) {
			measure.font = `900 ${size}px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace`;
			if (measure.measureText(label).width <= maxWidth) break;
			size -= 4;
		}

		return size;
	}

	function fittedMonoFontSize(label: string, maxWidth: number, minSize: number, maxSize: number) {
		const measure = getMeasureContext();
		if (!measure || !label.trim()) return minSize;

		let size = maxSize;

		while (size > minSize) {
			measure.font = `900 ${size}px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace`;

			if (measure.measureText(label).width <= maxWidth) {
				return size;
			}

			size -= 2;
		}

		return minSize;
	}

	function titleLinesForWidth(label: string, maxWidth: number, minSize: number, maxSize: number) {
		const clean = label.trim().toUpperCase();
		const oneLineSize = fittedMonoFontSize(clean, maxWidth, minSize, maxSize);

		if (oneLineSize > minSize + 4) {
			return [{ label: clean, size: oneLineSize }];
		}

		const words = clean.split(/\s+/).filter(Boolean);

		if (words.length <= 1) {
			return [{ label: clean, size: oneLineSize }];
		}

		return words.map((word) => ({
			label: word,
			size: fittedMonoFontSize(word, maxWidth, minSize, maxSize)
		}));
	}

	function makeSamplePoints() {
		const cleanSignature = signature?.trim();
		const isMobile = width < MOBILE_BREAKPOINT;
		const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;

		if (isMobile) {
			const mobileWords = text
				.trim()
				.toUpperCase()
				.split(/\s+/)
				.filter(Boolean);

			const titleLines = mobileWords.length > 0 ? mobileWords : [text.trim().toUpperCase()];
			const rightX = width - MOBILE_RIGHT_PADDING;
			const availableWidth = width - MOBILE_RIGHT_PADDING * 2;
			const titleStartY = height * MOBILE_TITLE_TOP_Y;
			const titleGap = height * MOBILE_TITLE_LINE_GAP_Y;

			const mainPoints = titleLines.flatMap((line, index) =>
				sampleText(
					line,
					fittedMonoFontSize(
						line,
						availableWidth,
						56,
						clamp(Math.floor(width * MOBILE_TITLE_FONT_SCALE), 72, 122)
					),
					rightX,
					titleStartY + index * titleGap,
					'right',
					MOBILE_TEXT_SAMPLE_MAIN_STEP_X,
					MOBILE_TEXT_SAMPLE_MAIN_STEP_Y
				)
			);

			const signaturePoints = cleanSignature
				? sampleText(
						cleanSignature.toUpperCase(),
						fittedMonoFontSize(
							cleanSignature.toUpperCase(),
							availableWidth,
							28,
							clamp(Math.floor(width * MOBILE_NAME_FONT_SCALE), 40, 72)
						),
						rightX,
						height * MOBILE_NAME_Y,
						'right',
						MOBILE_TEXT_SAMPLE_SIGNATURE_STEP_X,
						MOBILE_TEXT_SAMPLE_SIGNATURE_STEP_Y
					)
				: [];

			return {
				main: mainPoints,
				signature: signaturePoints
			};
		}

		const maxTitleWidth = width * (isTablet ? 0.86 : 0.88);
		const titleMin = isTablet ? 72 : 104;
		const titleMax = isTablet ? 136 : 218;
		const titleLines = titleLinesForWidth(text, maxTitleWidth, titleMin, titleMax);

		const lineGap = isTablet ? height * 0.13 : height * 0.12;
		const titleCenterY = isTablet ? height * 0.43 : height * 0.46;
		const titleStartY = titleCenterY - ((titleLines.length - 1) * lineGap) / 2;

		const mainPoints = titleLines.flatMap((line, index) =>
			sampleText(
				line.label,
				line.size,
				width / 2,
				titleStartY + index * lineGap,
				'center',
				TEXT_SAMPLE_MAIN_STEP_X,
				TEXT_SAMPLE_MAIN_STEP_Y
			)
		);

		const signatureLabel = cleanSignature
			? isTablet
				? cleanSignature.toUpperCase()
				: `WELCOME BACK ${cleanSignature.toUpperCase()}`
			: '';

		const signaturePoints = signatureLabel
			? sampleText(
					signatureLabel,
					fittedMonoFontSize(
						signatureLabel,
						width * (isTablet ? 0.72 : 0.45),
						isTablet ? 36 : 68,
						isTablet ? 64 : signatureFontSize(signatureLabel)
					),
					isTablet ? width / 2 : width - clamp(width * 0.075, 82, 140),
					isTablet ? height * 0.68 : height * 0.68,
					isTablet ? 'center' : 'right',
					TEXT_SAMPLE_SIGNATURE_STEP_X,
					TEXT_SAMPLE_SIGNATURE_STEP_Y
				)
			: [];

		return {
			main: mainPoints,
			signature: signaturePoints
		};
	}

	function buildParticles() {
		const points = makeSamplePoints();
		const qualityScale = qualityLevel <= 0 ? 0.55 : qualityLevel === 1 ? 0.75 : 1;
		// DeepSeek + Qwen + ChatGPT: use explicit device/quality particle budgets instead of one fixed density.
		const maxMainBase =
			width < MOBILE_BREAKPOINT
				? clamp(Math.floor((width * height) / 300), 2600, 6200)
				: clamp(Math.floor((width * height) / 260), 4200, 12000);
		const maxMain = Math.floor(maxMainBase * qualityScale);
		const mainStep = Math.max(1, Math.ceil(points.main.length / maxMain));
		const main = points.main.filter((_, index) => index % mainStep === 0);
		const maxSignatureBase =
			width < MOBILE_BREAKPOINT
				? clamp(Math.floor((width * height) / 360), 1800, 3600)
				: clamp(Math.floor((width * height) / 320), 2600, 7000);
		const maxSignature = Math.floor(maxSignatureBase * qualityScale);
		const signatureStep = Math.max(1, Math.ceil(points.signature.length / maxSignature));
		const signature = points.signature.filter((_, index) => index % signatureStep === 0);
		const combined = [
			...main.map((point) => ({ point, role: 'main' as const })),
			...signature.map((point) => ({ point, role: 'signature' as const }))
		];

		particles = combined.map(({ point, role }, index) => {
			const lane = index % 24;
			const homeX = point.x;
			const homeY = point.y;
			const accent = role === 'signature' ? index % 5 === 0 : index % 13 === 0;
			const rollSeed = role === 'signature' ? index * 19 + Math.floor(homeX / 2) : index + Math.floor(homeX / CELL_X);

			return {
				homeX,
				homeY,
				startX: homeX + (lane - 12) * CELL_X,
				startY: height + CELL_Y * (12 + (index % 16)),
				phase: (index % 97) * 0.19,
				delay: (index % 58) * 9,
				alpha: role === 'signature' ? 1.02 + (index % 4) * 0.02 : 0.82 + (index % 5) * 0.03,
				glyph: glyphAt(index * 11),
				literalGlyph: point.glyph,
				charIndex: point.charIndex,
				accent,
				// ChatGPT + Qwen: precompute per-particle invariants instead of repeating this arithmetic every frame.
				rollSeed,
				lockOrder: ((index * 37) % 100) / 100,
				hideGate: ((index * 29) % 100) / 100,
				baseGlyph: stableParticleGlyph(index + (role === 'signature' ? 100000 : 0), point.charIndex, homeX, homeY),
				baseFillIndex: accent ? 3 : 0,
				baseFontSize: role === 'signature' ? 4.2 : 5.1,
				role
			};
		});

		buildSpatialGrid();
		ensureInfluenceArrays();
	}


	function availableBigLetterIndexes() {
		const indexes = new Set<number>();

		for (const particle of particles) {
			if (particle.role === 'main' && particle.charIndex >= 0 && isAlphabeticGlyph(particle.literalGlyph)) {
				indexes.add(particle.charIndex);
			}
		}

		return [...indexes];
	}

	function shuffledIndexes(indexes: number[], seed: number) {
		return [...indexes].sort((a, b) => hashNumber(seed + a * 13.7) - hashNumber(seed + b * 13.7));
	}

	function pickLetterSwapTargets(seed: number) {
		const indexes = shuffledIndexes(availableBigLetterIndexes(), seed);
		const maxCount = Math.min(LETTER_SWAP_MAX_TARGETS, indexes.length);
		const minCount = Math.min(LETTER_SWAP_MIN_TARGETS, maxCount);
		const count =
			maxCount <= minCount
				? minCount
				: minCount + Math.floor(hashNumber(seed + 77.1) * (maxCount - minCount + 1));

		const targets = new Map<number, string>();

		for (const charIndex of indexes.slice(0, count)) {
			targets.set(charIndex, pseudoRandomGlyph(seed, charIndex));
		}

		return targets;
	}

	function pickColorLifeOrigins(seed: number) {
		const mainParticles = particles.filter((particle) => particle.role === 'main');

		if (mainParticles.length === 0) return [];

		const count = Math.min(
			COLOR_LIFE_MAX_ORIGINS,
			Math.max(COLOR_LIFE_MIN_ORIGINS, Math.floor(randomBetween(COLOR_LIFE_MIN_ORIGINS, COLOR_LIFE_MAX_ORIGINS + 1)))
		);
		const origins: ColorLifeOrigin[] = [];

		for (let i = 0; i < count; i++) {
			const index = Math.floor(hashNumber(seed + i * 89.3) * mainParticles.length);
			const particle = mainParticles[index];

			if (!particle) continue;

			origins.push({
				x: particle.homeX,
				y: particle.homeY,
				seed: seed + i * 131,
				strength: COLOR_LIFE_MIN_STRENGTH + hashNumber(seed + i * 17.7) * (COLOR_LIFE_MAX_STRENGTH - COLOR_LIFE_MIN_STRENGTH)
			});
		}

		return origins;
	}

	function clearVisualEventTimer() {
		if (visualEventTimer !== null) {
			window.clearTimeout(visualEventTimer);
			visualEventTimer = null;
		}
	}

	function scheduleNextVisualEvent() {
		clearVisualEventTimer();

		if (reduceMotion || document.visibilityState === 'hidden' || !visible) return;

		const delay = randomBetween(VISUAL_EVENT_MIN_GAP, VISUAL_EVENT_MAX_GAP);

		visualEventTimer = window.setTimeout(() => {
			startVisualEvent();
		}, delay);
	}

	function startVisualEvent() {
		if (reduceMotion || activeVisualEvent || particles.length === 0) {
			scheduleNextVisualEvent();
			return;
		}

		const seed = Math.floor(Math.random() * 1000000);
		const eventKind = VISUAL_EVENT_KINDS[Math.floor(hashNumber(seed) * VISUAL_EVENT_KINDS.length)] ?? 'letter-swap';

		if (eventKind === 'letter-swap') {
			const targets = pickLetterSwapTargets(seed);

			if (targets.size === 0) {
				scheduleNextVisualEvent();
				return;
			}

			activeVisualEvent = {
				kind: 'letter-swap',
				startedAt: performance.now(),
				duration: LETTER_SWAP_DURATION,
				targets,
				seed
			};

			clearVisualEventTimer();
			visualEventTimer = window.setTimeout(() => {
				activeVisualEvent = null;
				scheduleNextVisualEvent();
			}, LETTER_SWAP_DURATION);

			return;
		}

		const origins = pickColorLifeOrigins(seed);

		if (origins.length === 0) {
			scheduleNextVisualEvent();
			return;
		}

		activeVisualEvent = {
			kind: 'color-life',
			startedAt: performance.now(),
			duration: COLOR_LIFE_DURATION,
			origins,
			seed
		};

		clearVisualEventTimer();
		visualEventTimer = window.setTimeout(() => {
			activeVisualEvent = null;
			scheduleNextVisualEvent();
		}, COLOR_LIFE_DURATION);
	}

	function resetVisualEvents() {
		activeVisualEvent = null;
		clearVisualEventTimer();
		scheduleNextVisualEvent();
	}

	function syncRunningState() {
		const shouldRun = !reduceMotion && visible && document.visibilityState !== 'hidden';

		if (!shouldRun) {
			stop();
			activeVisualEvent = null;
			clearVisualEventTimer();
			return;
		}

		start();
		if (!activeVisualEvent && visualEventTimer === null) {
			scheduleNextVisualEvent();
		}
	}

	function applyQualityFrameBudget() {
		if (configuredTargetFps !== null) {
			frameBudget = configuredTargetFps <= 0 ? 0 : 1000 / configuredTargetFps;
			return;
		}

		frameBudget = width < MOBILE_BREAKPOINT ? MOBILE_FRAME_MS : FRAME_MS;
	}

	function rebuildParticleCachesForQuality() {
		if (!hasRenderer() || width <= 0 || height <= 0) return;

		buildParticles();
		if (!gpuRenderer) {
			buildStaticParticleLayer();
		}
	}

	function recordFrameCost(cost: number) {
		// DeepSeek + Qwen + ChatGPT: adapt quality from observed frame cost instead of hardcoding one budget.
		if (cost > QUALITY_DROP_FRAME_MS) {
			slowFrameCount += 1;
			fastFrameCount = 0;
		} else if (cost < QUALITY_RAISE_FRAME_MS) {
			fastFrameCount += 1;
			slowFrameCount = 0;
		} else {
			slowFrameCount = 0;
			fastFrameCount = 0;
		}

		if (slowFrameCount >= QUALITY_DROP_AFTER_FRAMES && qualityLevel > 0) {
			qualityLevel -= 1;
			slowFrameCount = 0;
			applyQualityFrameBudget();
			rebuildParticleCachesForQuality();
		}

		if (fastFrameCount >= QUALITY_RAISE_AFTER_FRAMES && qualityLevel < 2) {
			qualityLevel += 1;
			fastFrameCount = 0;
			applyQualityFrameBudget();
			rebuildParticleCachesForQuality();
		}
	}

	function recordPerfSample(cost: number, now: number) {
		if (!showPerfPanel || !perfCtx) return;

		const interval = perfLastFrameAt > 0 ? now - perfLastFrameAt : 0;
		perfLastFrameAt = now;

		if (perfSampleCount < perfSamples.length) {
			perfSampleCount += 1;
		} else {
			perfCostTotal -= perfSamples[perfSampleIndex];

			if (perfIntervals[perfSampleIndex] > 0) {
				perfIntervalTotal -= perfIntervals[perfSampleIndex];
				perfIntervalCount -= 1;
			}
		}

		perfSamples[perfSampleIndex] = cost;
		perfCostTotal += cost;

		perfIntervals[perfSampleIndex] = interval;
		if (interval > 0) {
			perfIntervalTotal += interval;
			perfIntervalCount += 1;
		}

		perfSampleIndex = (perfSampleIndex + 1) % perfSamples.length;

		if (now - perfLastPaintAt >= PERF_PANEL_UPDATE_MS) {
			perfLastPaintAt = now;
			drawPerfPanel(now);
		}
	}

	function drawPerfPanel(now: number) {
		if (!perfCtx) return;

		const count = perfSampleCount;
		const panel = perfCtx;

		panel.clearRect(0, 0, PERF_PANEL_WIDTH, PERF_PANEL_HEIGHT);
		panel.fillStyle = 'rgba(16, 17, 14, 0.82)';
		panel.fillRect(0, 0, PERF_PANEL_WIDTH, PERF_PANEL_HEIGHT);
		panel.strokeStyle = 'rgba(242, 241, 236, 0.2)';
		panel.strokeRect(0.5, 0.5, PERF_PANEL_WIDTH - 1, PERF_PANEL_HEIGHT - 1);

		if (count === 0) {
			panel.fillStyle = 'rgba(242, 241, 236, 0.74)';
			panel.font = '10px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
			panel.fillText('perf monitor', 12, 18);
			return;
		}

		let max = 0;
		for (let i = 0; i < count; i++) {
			const value = perfSamples[i];
			perfSortedSamples[i] = value;
			if (value > max) max = value;
		}

		perfSortedSamples.subarray(0, count).sort();

		const avg = perfCostTotal / count;
		const middle = Math.floor(count / 2);
		const median = count % 2 === 0 ? (perfSortedSamples[middle - 1] + perfSortedSamples[middle]) / 2 : perfSortedSamples[middle];
		const fps = perfIntervalCount > 0 ? 1000 / (perfIntervalTotal / perfIntervalCount) : 0;
		const graphLeft = 10;
		const graphTop = 54;
		const graphWidth = PERF_PANEL_WIDTH - 20;
		const graphHeight = PERF_PANEL_HEIGHT - graphTop - 12;
		const graphScale = Math.max(16.7, max, 33.4);
		const capLabel =
			configuredTargetFps === null
				? width < MOBILE_BREAKPOINT
					? 'cap mobile'
					: 'cap raf'
				: configuredTargetFps <= 0
					? 'cap ∞'
					: `cap ${configuredTargetFps}`;
		const dprLabel = `dpr ${dpr.toFixed(dpr % 1 === 0 ? 0 : 1)}`;
		const rendererLabel = gpuRenderer ? 'webgl2' : 'canvas2d';
		const skipRate = rafCallbacksTotal > 0 ? (skippedRafCallbacksTotal / rafCallbacksTotal) * 100 : 0;

		panel.fillStyle = 'rgba(242, 241, 236, 0.92)';
		panel.font = '10px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
		panel.fillText(`frame ${avg.toFixed(1)} avg  ${median.toFixed(1)} med`, 10, 16);
		panel.fillText(`${max.toFixed(1)} max  ${fps.toFixed(0)} fps  ${capLabel}  ${dprLabel}`, 10, 30);
		panel.fillText(`${rendererLabel}  raf skip ${skipRate.toFixed(0)}%`, 10, 44);

		panel.strokeStyle = 'rgba(242, 241, 236, 0.16)';
		panel.beginPath();
		panel.moveTo(graphLeft, graphTop + graphHeight * (1 - 16.7 / graphScale));
		panel.lineTo(graphLeft + graphWidth, graphTop + graphHeight * (1 - 16.7 / graphScale));
		panel.stroke();

		panel.strokeStyle = max > 22 ? 'rgba(255, 112, 67, 0.95)' : 'rgba(242, 241, 236, 0.86)';
		panel.beginPath();

		for (let i = 0; i < count; i++) {
			const sampleIndex = (perfSampleIndex + perfSamples.length - count + i) % perfSamples.length;
			const value = perfSamples[sampleIndex];
			const x = graphLeft + (i / Math.max(1, count - 1)) * graphWidth;
			const y = graphTop + graphHeight - clamp(value / graphScale, 0, 1) * graphHeight;

			if (i === 0) panel.moveTo(x, y);
			else panel.lineTo(x, y);
		}

		panel.stroke();
		panel.fillStyle = 'rgba(242, 241, 236, 0.42)';
		panel.fillText(`${Math.round(now % 100000)}ms`, PERF_PANEL_WIDTH - 58, PERF_PANEL_HEIGHT - 8);
	}

	function maxActiveRipplesForQuality() {
		return qualityLevel <= 0 ? 2 : qualityLevel === 1 ? 3 : CLICK_RIPPLE_MAX_ACTIVE;
	}

	function isHugeCanvas() {
		return width * height * dpr * dpr > 4_500_000;
	}

	function buildTickerRows() {
		const rows: TickerRow[] = [];
		for (let y = CELL_Y; y < height + CELL_Y; y += CELL_Y * 2) {
			rows.push({
				y,
				speed: 0.072 + (rows.length % 5) * 0.011,
				alpha: 0.038 + (rows.length % 4) * 0.01,
				phase: rows.length * 173,
				accentEvery: 17 + (rows.length % 9)
			});
		}

		tickerRows = rows;
	}

	function shouldForceCanvasRenderer() {
		return configuredRendererMode === '0' || configuredRendererMode === 'canvas' || configuredRendererMode === '2d';
	}

	function setupCanvas() {
		if (!canvas) return false;

		const rect = canvas.getBoundingClientRect();
		const nextWidth = Math.round(rect.width);
		const nextHeight = Math.round(rect.height);

		if (nextWidth < 1 || nextHeight < 1) return false;

		width = nextWidth;
		height = nextHeight;
		const nativeDpr = window.devicePixelRatio || 1;
		const hardDprCap = configuredDprCap ?? 2;

		dpr = gridSafeDprFor(nativeDpr, hardDprCap, width, height);
		applyQualityFrameBudget();
		staticBackgroundLayer = null;
		staticTickerLayer = null;
		staticParticleLayer = null;

		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		if (!ctx && !gpuRenderer && !shouldForceCanvasRenderer()) {
			gpuRenderer = GpuGlyphRenderer.create(canvas);
		}

		if (gpuRenderer) {
			gpuRenderer.resize(width, height, dpr, accentColor);
			ctx = null;
		} else {
			glyphAtlas.reset(dpr);
			ctx = canvas.getContext('2d', { alpha: false });
			if (!ctx) return false;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.imageSmoothingEnabled = false;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = '7px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
		}

		accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || accentColor;
		colorSteps = buildColorSteps(accentColor);
		gpuRenderer?.resize(width, height, dpr, accentColor);

		if (!gpuRenderer) {
			buildStaticBackgroundLayer();
		}

		bootTime = performance.now();
		lastFrame = 0;
		nextFrameDue = 0;
		rafCallbacksTotal = 0;
		skippedRafCallbacksTotal = 0;
		activeVisualEvent = null;
		buildTickerRows();
		if (gpuRenderer) {
			buildGpuStaticTickerLayer();
		} else {
			buildStaticTickerLayer();
		}
		buildParticles();
		if (!gpuRenderer) {
			buildStaticParticleLayer();
		}
		draw(performance.now());

		return true;
	}

	function drawRegularGrid(boot: number) {
		if (!ctx) return;

		ctx.strokeStyle = `rgba(242, 241, 236, ${width < MOBILE_BREAKPOINT ? 0.004 + boot * 0.004 : 0.009 + boot * 0.008})`;
		ctx.lineWidth = 1;
		ctx.beginPath();

		for (let x = 0.5; x <= width; x += CELL_X) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
		}

		for (let y = 0.5; y <= height; y += CELL_Y) {
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
		}

		ctx.stroke();
	}

	function drawTickerRows(now: number, boot: number) {
		if (!hasRenderer()) return;

		let sectionStartedAt = profileStart();
		if (gpuRenderer) {
			gpuRenderer.flushStaticGlyphs();
		} else if (staticTickerLayer && ctx) {
			ctx.globalAlpha = 1;
			ctx.drawImage(staticTickerLayer, 0, 0, width, height);
		} else {
			const baseAlpha = width < MOBILE_BREAKPOINT ? 0.18 : 0.38;
			for (let rowIndex = 0; rowIndex < tickerRows.length; rowIndex++) {
				drawTickerRowGlyphs(ctx, tickerRows[rowIndex], rowIndex, 0, boot, baseAlpha);
			}
		}
		profileEnd('ticker: static layer', sectionStartedAt);

		sectionStartedAt = profileStart();
		const burstAlpha = width < MOBILE_BREAKPOINT ? 0.14 : 0.28;

		for (let rowIndex = 0; rowIndex < tickerRows.length; rowIndex++) {
			const row = tickerRows[rowIndex];
			const amount = reduceMotion ? 0 : burstAmount(now, bootTime, TICKER_BURST_PERIOD, TICKER_BURST_DURATION, row.phase);
			if (amount <= 0.025) continue;

			drawTickerRowGlyphs(ctx, row, rowIndex, amount, boot, amount * burstAlpha);
		}
		profileEnd('ticker: burst overlay', sectionStartedAt);

		if (ctx) ctx.globalAlpha = 1;
	}

	function drawDoubleHelix(now: number, boot: number) {
		// Derived from all proposals: helix is decorative, so quality drops sacrifice it first.
		if (!hasRenderer() || reduceMotion || width < 1024 || qualityLevel <= 0) return;

		const elapsed = now - bootTime - HELIX_START_DELAY;
		if (elapsed < 0) return;

		const opacity = boot * easeOutCubic(elapsed / 900);
		const raceAHead = clamp((elapsed - 80) / 1320, 0, 1);
		const raceBHead = clamp((elapsed - 290) / 1840, 0, 1);
		if (raceAHead <= 0 && raceBHead <= 0) return;
		const startX = width * 0.08;
		const startY = height * 0.16;
		const endX = width * 0.94;
		const endY = height * 0.84;
		const axisX = endX - startX;
		const axisY = endY - startY;
		const axisLength = Math.hypot(axisX, axisY);
		const unitX = axisX / axisLength;
		const unitY = axisY / axisLength;
		const normalX = -unitY;
		const normalY = unitX;
		const baseAmplitude = clamp(width * 0.035, 56, 92);
		const columns = Math.max(120, Math.floor(axisLength / CELL_X));
		const turns = 5.1;

		const motion = elapsed * 0.00082;
		const accelWave = Math.sin(motion * 1.2) * 0.36 + Math.sin(motion * 0.47 + 1.1) * 0.14;
		const accelA = motion + accelWave;
		const accelB = motion - accelWave + 0.52;

		const drawStrandCluster = (x: number, y: number, seed: number, alpha: number, color: string, outward: number) => {
			const offsets = [
				{ dx: 0, dy: 0, alpha: 1, seed: 0 },
				{ dx: normalX * CELL_Y * 0.78 * outward, dy: normalY * CELL_Y * 0.78 * outward, alpha: 0.74, seed: 1 },
				{ dx: -normalX * CELL_Y * 0.56 * outward, dy: -normalY * CELL_Y * 0.56 * outward, alpha: 0.58, seed: 2 },
				{ dx: unitX * CELL_X * 0.92, dy: unitY * CELL_X * 0.92, alpha: 0.5, seed: 3 },
				{ dx: -unitX * CELL_X * 0.92, dy: -unitY * CELL_X * 0.92, alpha: 0.42, seed: 4 }
			];

			for (const offset of offsets) {
				drawGlyph(ctx, scienceGlyphAt(seed + offset.seed), snapX(x + offset.dx), snapY(y + offset.dy), color, 8, alpha * offset.alpha);
			}
		};

		for (let column = 0; column <= columns; column++) {
			const t = column / columns;
			const centerX = startX + axisX * t;
			const centerY = startY + axisY * t;
			const basePhase = t * Math.PI * 2 * turns;
			const phaseA = basePhase + accelA;
			const phaseB = basePhase + Math.PI + accelB;
			const amplitudeNoise =
				Math.sin(t * Math.PI * 7.2 + motion * 1.12) * 0.105 +
				Math.sin(t * Math.PI * 19.4 + motion * 0.58 + 1.7) * 0.05 +
				Math.sin(t * Math.PI * 31.0 + motion * 0.31 + 2.4) * 0.025;
			const amplitude = baseAmplitude * (1 + amplitudeNoise);
			const waveA = Math.sin(phaseA);
			const waveB = Math.sin(phaseB);
			const xA = centerX + normalX * waveA * amplitude;
			const yA = centerY + normalY * waveA * amplitude;
			const xB = centerX + normalX * waveB * amplitude;
			const yB = centerY + normalY * waveB * amplitude;
			const depthA = (Math.cos(phaseA) + 1) / 2;
			const depthB = (Math.cos(phaseB) + 1) / 2;
			const stepA = 2 + Math.round(depthA * 3);
			const stepB = 1 + Math.round(depthB * 3);

			const strandAVisible = t <= raceAHead;
			const strandBVisible = t <= raceBHead;

			if (strandAVisible) {
				drawStrandCluster(xA, yA, column + stepA, opacity * (0.10 + depthA * 0.20), colorSteps[stepA] ?? accentColor, 1);
			}

			if (strandBVisible) {
				drawStrandCluster(xB, yB, column + stepB + 3, opacity * (0.09 + depthB * 0.18), colorSteps[stepB] ?? colorSteps[0], -1);
			}

			if (strandAVisible && strandBVisible && column % 5 === 0) {
				const deltaX = xB - xA;
				const deltaY = yB - yA;
				const connector =
					Math.abs(deltaX) > Math.abs(deltaY) * 1.35
						? '-'
						: Math.abs(deltaY) > Math.abs(deltaX) * 1.35
							? '|'
							: deltaX * deltaY > 0
								? '\\'
								: '/';
				const connectorCount = clamp(Math.floor(Math.hypot(deltaX, deltaY) / (CELL_Y * 1.7)), 2, 8);

				for (let step = 1; step <= connectorCount; step++) {
					const linkT = step / (connectorCount + 1);
					const linkX = snapX(xA + (xB - xA) * linkT);
					const linkY = snapY(yA + (yB - yA) * linkT);

					drawGlyph(ctx, connector, linkX, linkY, colorSteps[3] ?? colorSteps[0], 8, opacity * 0.08);
				}
			}
		}

		if (ctx) ctx.globalAlpha = 1;
	}

	function drawBackground(now: number, boot: number) {
		if (!hasRenderer()) return;

		let sectionStartedAt = profileStart();
		if (gpuRenderer) {
			// User-requested GPU migration: background/grid are shader-rendered in beginFrame().
		} else if (staticBackgroundLayer && ctx) {
			ctx.globalAlpha = 1;
			ctx.drawImage(staticBackgroundLayer, 0, 0, width, height);
		} else if (ctx) {
			ctx.fillStyle = '#161713';
			ctx.fillRect(0, 0, width, height);
			drawRegularGrid(boot);
		}
		profileEnd('background: cached layer/grid', sectionStartedAt);

		sectionStartedAt = profileStart();
		drawTickerRows(now, boot);
		profileEnd('background: ticker rows', sectionStartedAt);

		sectionStartedAt = profileStart();
		drawDoubleHelix(now, boot);
		profileEnd('background: double helix', sectionStartedAt);
	}


	function drawDensityGlyphCluster(
		x: number,
		y: number,
		alpha: number,
		color: string,
		seed: number,
		amount: number,
		fontMin = HOVER_MIN_FONT,
		fontMax = HOVER_MAX_FONT,
		countMin = HOVER_MIN_DENSITY,
		countMax = HOVER_MAX_DENSITY,
		readableGlyph: string | null = null
	) {
		if (!hasRenderer()) return;

		const profile = densityGlyphProfile(amount, fontMin, fontMax, countMin, countMax);
		const mainGlyph = readableGlyph?.trim() || glyphAt(seed);

		/*
			Readability rule:
			- center and near-center use the real sampled text glyph
			- outer particles add texture
			This keeps the hover compressed, but the word remains legible.
		*/
		for (let index = 0; index < profile.count; index++) {
			const angle = seed * 0.73 + index * 2.399963;
			const ring = index === 0 ? 0 : Math.sqrt(index / profile.count);
			const jitterX = Math.sin(seed * 0.13 + index * 1.7) * 0.85;
			const jitterY = Math.cos(seed * 0.17 + index * 1.3) * 0.75;
			const px = snapX(x + Math.cos(angle) * profile.spreadX * ring + jitterX);
			const py = snapY(y + Math.sin(angle) * profile.spreadY * ring + jitterY);
			const useReadable = index < Math.max(3, Math.floor(profile.count * 0.68));

			drawGlyph(ctx, useReadable ? mainGlyph : glyphAt(seed + index * 7), px, py, color, profile.fontSize, alpha * profile.alpha * (1 - index / (profile.count * 1.34)));
		}
	}

	function letterSwapProgress(now: number, particle: Particle) {
		if (
			!activeVisualEvent ||
			activeVisualEvent.kind !== 'letter-swap' ||
			particle.role !== 'main' ||
			particle.charIndex < 0 ||
			!activeVisualEvent.targets.has(particle.charIndex)
		) {
			return -1;
		}

		const elapsed = now - activeVisualEvent.startedAt;

		if (elapsed < 0 || elapsed >= activeVisualEvent.duration) {
			return -1;
		}

		return elapsed / activeVisualEvent.duration;
	}

	function glyphForLetterSwap(particle: Particle, particleIndex: number, seed: number, progress: number) {
		const normal = stableParticleGlyph(particleIndex, particle.charIndex, particle.homeX, particle.homeY);

		if (progress < 0) return normal;

		const eventSeed = activeVisualEvent?.seed ?? seed;
		const useBlock = pseudoRandomBool(eventSeed, particle.charIndex, LETTER_SWAP_TRANSITION_BLOCK_CHANCE);
		const replacementTexture = pseudoRandomGlyph(eventSeed, particle.charIndex, particleIndex);

		/*
			The large character shape stays readable because the particle positions still form the
			big letter. The small glyphs inside that shape are pseudo-random and stable, not just
			the same letter repeated.
		*/
		if (progress < LETTER_SWAP_IN_END) {
			const intro = progress / LETTER_SWAP_IN_END;

			if (intro < 0.42) {
				return useBlock
					? blockGlyphAt(seed + particle.charIndex * 5 + particleIndex)
					: randomLetterAt(seed + particle.charIndex * 17 + particleIndex + Math.floor(intro * 18));
			}

			return replacementTexture;
		}

		if (progress < LETTER_SWAP_HOLD_END) {
			return replacementTexture;
		}

		if (progress < LETTER_SWAP_OUT_END) {
			const outro = (progress - LETTER_SWAP_HOLD_END) / (LETTER_SWAP_OUT_END - LETTER_SWAP_HOLD_END);

			if (outro < 0.4) return replacementTexture;

			if (outro < 0.72) {
				return useBlock
					? blockGlyphAt(seed + particle.charIndex * 9 + particleIndex)
					: randomLetterAt(seed + particle.charIndex * 23 + particleIndex + Math.floor(outro * 26));
			}
		}

		return normal;
	}

	function shouldDrawAllParticles(now: number, blockProgress: number) {
		if (gpuRenderer) return true;

		const booting = !reduceMotion && now - bootTime < STATIC_PARTICLE_BOOT_MS;
		const blockAnimating = blockStart > 0 || blockProgress > 0.01;
		return booting || blockAnimating;
	}

	function canUseStaticParticles(now: number, hoverField: DensityField | null, reboundField: DensityField | null, blockProgress: number) {
		if (gpuRenderer) return false;

		return Boolean(
			staticParticleLayer &&
				!shouldDrawAllParticles(now, blockProgress) &&
				!hoverField &&
				!reboundField &&
				clickRipples.length === 0 &&
				!activeVisualEvent
		);
	}

	function drawParticles(now: number, boot: number) {
		if (!hasRenderer()) return;

		const hoverField = hoverDensityField();
		const reboundField = reboundDensityField(now);
		const blockProgress = clickBlockProgress(now);

		let sectionStartedAt = profileStart();
		if (clickRipples.length > 0) {
			let writeIndex = 0;
			for (let readIndex = 0; readIndex < clickRipples.length; readIndex++) {
				const ripple = clickRipples[readIndex];
				if (now - ripple.startedAt < CLICK_RIPPLE_DURATION) {
					clickRipples[writeIndex] = ripple;
					writeIndex += 1;
				}
			}
			clickRipples.length = writeIndex;
		}
		profileEnd('particles: cleanup ripples', sectionStartedAt);

		if (canUseStaticParticles(now, hoverField, reboundField, blockProgress)) {
			sectionStartedAt = profileStart();
			drawStaticParticleLayer();
			profileEnd('particles: static idle layer', sectionStartedAt);
			profileParticlePass(0, true, false);
			if (ctx) ctx.globalAlpha = 1;
			return;
		}

		sectionStartedAt = profileStart();
		prepareInfluences(now, hoverField, reboundField);
		profileEnd('particles: prepare influences total', sectionStartedAt);

		const drawAllParticles = shouldDrawAllParticles(now, blockProgress);
		if (!drawAllParticles) {
			sectionStartedAt = profileStart();
			drawStaticParticleLayer();
			profileEnd('particles: static base layer', sectionStartedAt);
		}

		let strongestHover = 0;
		let strongestHoverX = -9999;
		let strongestHoverY = -9999;
		const loopLength = drawAllParticles ? particles.length : dynamicParticleIndexes.length;
		profileParticlePass(loopLength, false, drawAllParticles);

		sectionStartedAt = profileStart();
		for (let loopIndex = 0; loopIndex < loopLength; loopIndex++) {
			const i = drawAllParticles ? loopIndex : dynamicParticleIndexes[loopIndex];
			const particle = particles[i];
			const localBoot = drawAllParticles && !reduceMotion ? easeOutCubic((now - bootTime - particle.delay) / 1300) : 1;
			const settle = drawAllParticles ? Math.max(boot, localBoot) : 1;
			const wobble =
				drawAllParticles && now - bootTime < STATIC_PARTICLE_BOOT_MS
					? Math.sin(now * 0.0009 + particle.phase) * (particle.role === 'signature' ? 0.35 : 0.6) * (1 - blockProgress)
					: 0;
			const settledX = particle.startX + (particle.homeX - particle.startX) * settle;
			const settledY = particle.startY + (particle.homeY - particle.startY) * settle;
			const x = settledX + (particle.homeX - settledX) * blockProgress;
			const y = settledY + (particle.homeY - settledY) * blockProgress + wobble;

			const hoverAmount = hoverInfluence[i] ?? 0;
			const reboundAmount = reboundInfluence[i] ?? 0;
			const pointerZone = Math.max(hoverLevelInfluence[i] ?? 0, reboundLevelInfluence[i] ?? 0);

			if (hoverField && hoverAmount > strongestHover) {
				strongestHover = hoverAmount;
				strongestHoverX = hoverField.x;
				strongestHoverY = hoverField.y;
			}

			const reveal = reduceMotion ? 1 : clamp((now - bootTime - particle.delay) / 820, 0, 1);
			const rollSeed = particle.rollSeed;
			const lockOrder = particle.lockOrder;

			/*
				Click state is now one continuous per-particle threshold.
				Same logic in both directions:
				- progress above particle threshold = block
				- near threshold = density transition
				- below threshold = normal text
				This removes the end snap and the reverse fade/snap.
			*/
			const thresholdDistance = Math.abs(blockProgress - lockOrder);
			const clickDensityAmount = 1 - clamp(thresholdDistance / CLICK_TRANSITION_WINDOW, 0, 1);
			const clickTransition = clickDensityAmount > 0.02 && blockProgress > 0.01 && blockProgress < 0.99;
			const isBlocked = blockProgress >= lockOrder;
			const clickHidden = false;

			const letterSwapProgressValue = letterSwapProgress(now, particle);
			const letterSwapActive = letterSwapProgressValue >= 0 && hoverAmount <= 0.02 && reboundAmount <= 0.03 && !clickTransition;
			const letterSwapAmount = letterSwapActive ? Math.sin(letterSwapProgressValue * Math.PI) : 0;
			const colorLifeAmount = colorLifeInfluence[i] ?? 0;
			const clickRippleAmount = rippleInfluence[i] ?? 0;

			const roleBoost = particle.role === 'signature' ? 1.42 : 1;
			const alpha = Math.min(
				1,
				particle.alpha *
					roleBoost *
					reveal *
					(0.5 +
						settle * 0.5 +
						hoverAmount * 0.18 +
						reboundAmount * 0.28 +
						colorLifeAmount * 0.16 +
						clickRippleAmount * 0.2 +
						letterSwapAmount * 0.14)
			);

			const baseFill =
				pointerZone > 0
					? (colorSteps[Math.min(pointerZone, colorSteps.length - 1)] ?? accentColor)
					: clickRippleAmount > 0.035
						? (colorSteps[Math.min(colorSteps.length - 1, 2 + Math.floor(clickRippleAmount * 4))] ?? accentColor)
						: colorLifeAmount > 0.035
							? (colorSteps[Math.min(colorSteps.length - 1, 2 + Math.floor(colorLifeAmount * 4))] ?? accentColor)
							: particle.accent
							? colorSteps[3]
							: colorSteps[0];

			const fill = letterSwapActive ? colorSteps[4] ?? accentColor : baseFill;
			const fontSize = particle.baseFontSize;

			const normalGlyph = letterSwapActive
				? glyphForLetterSwap(particle, i, rollSeed, letterSwapProgressValue)
				: particle.baseGlyph;

			if (clickHidden) continue;

			if (hoverAmount > 0.02) {
				drawDensityGlyphCluster(
					x,
					y,
					alpha * (1 + hoverAmount * 0.2),
					fill,
					rollSeed,
					hoverAmount,
					HOVER_MIN_FONT,
					HOVER_MAX_FONT,
					HOVER_MIN_DENSITY,
					HOVER_MAX_DENSITY,
					particle.literalGlyph
				);
				continue;
			}

			if (reboundAmount > 0.03) {
				if (particle.hideGate < reboundAmount * BLOCK_REBOUND_HIDE_MAX) continue;

				if (reboundAmount > 0.16) {
					drawGlyph(ctx, blockGlyphAt(i + Math.floor(reboundAmount * 11)), x, y, fill, fontSize, alpha * (0.82 + reboundAmount * 0.3));

					if (reboundAmount > 0.42) {
						drawGlyph(ctx, blockGlyphAt(i + 3), snapX(x + CELL_X * 0.45), snapY(y), fill, fontSize + 0.8, alpha * reboundAmount * 0.28);
					}
				} else {
					drawGlyph(ctx, normalGlyph, x, y, fill, fontSize, alpha);
				}

				continue;
			}

			if (clickTransition) {
				drawDensityGlyphCluster(
					x,
					y,
					isBlocked ? 0.9 : alpha * (0.98 + clickDensityAmount * 0.12),
					fill,
					rollSeed + 23,
					clickDensityAmount,
					CLICK_DENSITY_MIN_FONT,
					CLICK_DENSITY_MAX_FONT,
					CLICK_DENSITY_MIN_COUNT,
					CLICK_DENSITY_MAX_COUNT,
					isBlocked ? blockGlyphAt(i) : particle.literalGlyph
				);
				continue;
			}

			const rippleBlockAmount = clamp(
				(clickRippleAmount - CLICK_RIPPLE_BLOCK_THRESHOLD) / (1 - CLICK_RIPPLE_BLOCK_THRESHOLD),
				0,
				1
			);
			const rippleBlocifying = rippleBlockAmount > 0.04;
			const glyph =
				isBlocked || rippleBlocifying
					? blockGlyphAt(i + Math.floor((blockProgress + rippleBlockAmount) * 10))
					: normalGlyph;

			const drawAlpha = isBlocked ? 0.9 : rippleBlocifying ? Math.min(0.94, alpha + rippleBlockAmount * CLICK_RIPPLE_BLOCK_ALPHA) : alpha;
			drawGlyph(ctx, glyph, x, y, fill, fontSize, drawAlpha);
		}
		profileEnd('particles: dynamic loop', sectionStartedAt);

		sectionStartedAt = profileStart();
		if (hoverField && strongestHover > 0.035) {
			lastTextHoverX = strongestHoverX;
			lastTextHoverY = strongestHoverY;
			lastTextHoverAt = now;
		}

		/*
			If the cursor moves from actual text into empty space, there are no particles under
			the cursor, so a normal hover/rebound field has nothing to draw.
			This remembers the last text area and rebounds that instead.
		*/
		if (
			hoverField &&
			strongestHover <= 0.035 &&
			now - lastTextHoverAt < EMPTY_HOVER_MEMORY &&
			now - lastAutoReboundAt > EMPTY_HOVER_REBOUND_AFTER &&
			now - densityExitStart > EMPTY_HOVER_REBOUND_AFTER
		) {
			densityExitX = lastTextHoverX;
			densityExitY = lastTextHoverY;
			densityExitStart = now;
			lastAutoReboundAt = now;
		}
		profileEnd('particles: hover memory/rebound', sectionStartedAt);

		if (ctx) ctx.globalAlpha = 1;
	}

	function draw(now: number) {
		if (!hasRenderer()) return;

		const frameStart = performance.now();
		const boot = reduceMotion ? 1 : easeOutCubic((now - bootTime) / 1500);

		gpuRenderer?.beginFrame();

		let sectionStartedAt = profileStart();
		drawBackground(now, boot);
		profileEnd('frame: background total', sectionStartedAt);

		sectionStartedAt = profileStart();
		drawParticles(now, boot);
		profileEnd('frame: particles total', sectionStartedAt);

		sectionStartedAt = profileStart();
		gpuRenderer?.flushGlyphs();
		profileEnd('frame: gpu glyph flush', sectionStartedAt);

		const renderCost = performance.now() - frameStart;
		sectionStartedAt = profileStart();
		recordFrameCost(renderCost);
		recordPerfSample(renderCost, now);
		profileEnd('frame: quality/perf bookkeeping', sectionStartedAt);
		profileFrame(performance.now() - frameStart);
	}

	function shouldRenderThisRaf(now: number) {
		if (frameBudget <= 0) {
			lastFrame = now;
			nextFrameDue = now;
			return true;
		}

		if (lastFrame <= 0 || nextFrameDue <= 0) {
			lastFrame = now;
			nextFrameDue = now + frameBudget;
			return true;
		}

		/*
			The first `?t=60` implementation used a strict elapsed >= 16.666ms gate.
			Real RAF timestamps often land a fraction below that, which aliases into
			accidental 30/40/24 FPS. This scheduler keeps a target cadence with tolerance
			instead of punishing normal browser timestamp jitter.
		*/
		const tolerance = Math.min(2, frameBudget * 0.22);
		if (now + tolerance < nextFrameDue) return false;

		lastFrame = now;
		nextFrameDue += frameBudget;
		if (nextFrameDue < now - frameBudget) {
			nextFrameDue = now + frameBudget;
		}

		return true;
	}

	function tick(now: number) {
		if (!running) return;

		rafCallbacksTotal += 1;
		if (profileActive) profileRafCallbacks += 1;

		if (shouldRenderThisRaf(now)) {
			draw(now);
		} else if (profileActive) {
			profileSkippedRafCallbacks += 1;
			skippedRafCallbacksTotal += 1;
		} else {
			skippedRafCallbacksTotal += 1;
		}

		raf = requestAnimationFrame(tick);
	}

	function start() {
		if (running || reduceMotion || !visible || document.visibilityState === 'hidden') return;

		running = true;
		lastFrame = 0;
		nextFrameDue = 0;
		raf = requestAnimationFrame(tick);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(raf);
	}

	function scheduleResize() {
		cancelAnimationFrame(resizeRaf);

		resizeRaf = requestAnimationFrame(() => {
			setupUrlConfig();
			setupCanvas();
			setupPerfPanel();
			start();
		});
	}

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		setupUrlConfig();
		setupPerfPanel();
		setupConsoleProfiler();
		setupCanvas();

		const onResize = () => scheduleResize();

		const onPointerMove = (event: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			const nextX = event.clientX - rect.left;
			const nextY = event.clientY - rect.top;

			if (pointerActive) {
				const moved = Math.hypot(nextX - previousPointerX, nextY - previousPointerY);

				if (moved >= CURSOR_REBOUND_MOVE_THRESHOLD) {
					densityExitX = previousPointerX;
					densityExitY = previousPointerY + CELL_Y * 1.2;
					densityExitStart = performance.now();
				}
			}

			previousPointerX = nextX;
			previousPointerY = nextY;
			pointerX = nextX;
			pointerY = nextY;
			pointerActive = true;
		};

		const onPointerLeave = () => {
			densityExitX = pointerX;
			densityExitY = pointerY + CELL_Y * 1.2;
			densityExitStart = performance.now();
			pointerActive = false;
			previousPointerX = -9999;
			previousPointerY = -9999;
		};

		const onClick = (event: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const now = performance.now();

			clickRipples.push({
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
				startedAt: now,
				seed: Math.floor(Math.random() * 1000000)
			});

			const maxRipples = maxActiveRipplesForQuality();
			if (clickRipples.length > maxRipples) {
				clickRipples = clickRipples.slice(-maxRipples);
			}
		};

		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target;

			if (target instanceof HTMLElement) {
				const tag = target.tagName.toLowerCase();

				if (target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select') {
					return;
				}
			}

			if (event.code !== 'Space' && event.key !== ' ') return;
			if (event.repeat) return;

			event.preventDefault();
			blockDirection = blockAmount >= 0.5 ? -1 : 1;
			blockStart = performance.now();
		};

		const onVisibility = () => {
			syncRunningState();
		};

		observer = new IntersectionObserver(([entry]) => {
			visible = Boolean(entry?.isIntersecting);

			syncRunningState();
		});

		observer.observe(root);

		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		document.addEventListener('visibilitychange', onVisibility);
		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerleave', onPointerLeave);
		canvas.addEventListener('click', onClick);

		if (reduceMotion) {
			draw(performance.now());
		} else {
			syncRunningState();
		}

		return () => {
			stop();
			clearVisualEventTimer();
			cancelAnimationFrame(resizeRaf);
			observer?.disconnect();
			window.removeEventListener('resize', onResize);
			window.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('visibilitychange', onVisibility);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerleave', onPointerLeave);
			canvas.removeEventListener('click', onClick);

			if (profileActive) {
				finishConsoleProfiler();
			}

			const targetWindow = window as Window & {
				profiler?: (frames?: number) => Promise<ProfileResult>;
				heroDiagnostics?: () => ProfileEnvironment;
			};
			if (targetWindow.profiler === startConsoleProfiler) {
				delete targetWindow.profiler;
			}
			if (targetWindow.heroDiagnostics === heroDiagnostics) {
				delete targetWindow.heroDiagnostics;
			}

			gpuRenderer?.destroy();
			gpuRenderer = null;
		};
	});
</script>

<div bind:this={root} class="terminal-field" aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
	<canvas bind:this={perfCanvas} class:active={showPerfPanel} class="perf-panel"></canvas>
</div>

<style>
	.terminal-field {
		position: absolute;
		inset: 0;
		display: block;
		overflow: hidden;
		background: #161713;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: manipulation;
	}

	.perf-panel {
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 2;
		display: none;
		width: 236px;
		height: 126px;
		pointer-events: none;
	}

	.perf-panel.active {
		display: block;
	}
</style>
