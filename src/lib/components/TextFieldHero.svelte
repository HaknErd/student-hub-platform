<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		text?: string;
		signature?: string | null;
	};

	type Particle = {
		homeX: number;
		homeY: number;
		startX: number;
		startY: number;
		phase: number;
		delay: number;
		alpha: number;
		glyph: string;
		literalGlyph: string;
		charIndex: number;
		accent: boolean;
		role: 'main' | 'signature';
	};

	type SamplePoint = {
		x: number;
		y: number;
		glyph: string;
		charIndex: number;
	};

	type TickerRow = {
		y: number;
		speed: number;
		alpha: number;
		phase: number;
		accentEvery: number;
	};

	type RGB = {
		r: number;
		g: number;
		b: number;
	};

	type DensityField = {
		x: number;
		y: number;
		amount: number;
	};

	type PointerDensity = {
		level: number;
		strength: number;
	};

	type VisualEventKind = 'letter-swap' | 'color-life';

	type LetterSwapEvent = {
		kind: 'letter-swap';
		startedAt: number;
		duration: number;
		targets: Map<number, string>;
		seed: number;
	};

	type ColorLifeOrigin = {
		x: number;
		y: number;
		seed: number;
		strength: number;
	};

	type ColorLifeEvent = {
		kind: 'color-life';
		startedAt: number;
		duration: number;
		origins: ColorLifeOrigin[];
		seed: number;
	};

	type VisualEvent = LetterSwapEvent | ColorLifeEvent;

	type ClickRipple = {
		x: number;
		y: number;
		startedAt: number;
		seed: number;
	};

	let { text = 'STUDENT HUB', signature = null }: Props = $props();
	
	let root: HTMLElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
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

	const GLYPHS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/\\\\+=:;._-#$%';
	const SCIENCE_GLYPHS = ['·', '∙', '•', '/', '\\', '-', '|',"@", '#', '$', '%', '&', '*', '+', '=', '?', '!', '~'];
	const BLOCK_GLYPHS = ['█', '▓', '▒', '░'];
	const FRAME_MS = 1000 / 42;
	const CELL_X = 6;
	const CELL_Y = 8;

	const CURSOR_LEVELS = 10;
	const CURSOR_RADIUS_X = 42;
	const CURSOR_RADIUS_Y = 32;
	const CURSOR_REBOUND_RADIUS_X = 70;
	const CURSOR_REBOUND_RADIUS_Y = 54;
	const CURSOR_REBOUND_MOVE_THRESHOLD = 18;

	const HOVER_MIN_FONT = 2.8;
	const HOVER_MAX_FONT = 7;
	const HOVER_MIN_ALPHA = 0.22;
	const HOVER_MAX_ALPHA = 0.76;
	const HOVER_MIN_DENSITY = 3;
	const HOVER_MAX_DENSITY = 18;
	const HOVER_CLUSTER_RADIUS_X = 10.5;
	const HOVER_CLUSTER_RADIUS_Y = 9.2;

	const BLOCK_REBOUND_DURATION = 980;
	const BLOCK_REBOUND_OVERSHOOT = 1.55;
	const BLOCK_REBOUND_HIDE_MAX = 0.16;

	const CLICK_BLOCK_DURATION = 980;
	const CLICK_UNBLOCK_DURATION = 760;
	const CLICK_RAREFY_MAX = 0.18;
	const CLICK_TRANSITION_WINDOW = 0.22;
	const CLICK_DENSITY_MIN_FONT = 3.5;
	const CLICK_DENSITY_MAX_FONT = 7;
	const CLICK_DENSITY_MIN_COUNT = 2;
	const CLICK_DENSITY_MAX_COUNT = 11;

	const CLICK_RIPPLE_DURATION = 2600;
	const CLICK_RIPPLE_SPEED = 0.125;
	const CLICK_RIPPLE_WIDTH = 14.5;
	const CLICK_RIPPLE_CENTER_WIDTH = 8.5;
	const CLICK_RIPPLE_MAX_AMOUNT = 1.35;
	const CLICK_RIPPLE_MAX_ACTIVE = 5;
	const CLICK_RIPPLE_BLOCK_THRESHOLD = 0.24;
	const CLICK_RIPPLE_BLOCK_ALPHA = 0.56;
	const CLICK_RIPPLE_GLOBAL_AFTERWAVE = 0;

	const EMPTY_HOVER_REBOUND_AFTER = 120;
	const EMPTY_HOVER_MEMORY = 560;

	const TEXT_SAMPLE_MAIN_STEP_X = 5;
	const TEXT_SAMPLE_MAIN_STEP_Y = 6;
	const TEXT_SAMPLE_SIGNATURE_STEP_X = 3;
	const TEXT_SAMPLE_SIGNATURE_STEP_Y = 4;

	const VISUAL_EVENT_KINDS: VisualEventKind[] = ['letter-swap', 'color-life'];
	const VISUAL_EVENT_MIN_GAP = 14500;
	const VISUAL_EVENT_MAX_GAP = 32000;

	const LETTER_SWAP_DURATION = 4300;
	const LETTER_SWAP_MIN_TARGETS = 1;
	const LETTER_SWAP_MAX_TARGETS = 3;
	const LETTER_SWAP_IN_END = 0.28;
	const LETTER_SWAP_HOLD_END = 0.68;
	const LETTER_SWAP_OUT_END = 1;
	const LETTER_SWAP_TRANSITION_BLOCK_CHANCE = 0.42;
	const LETTER_SWAP_REPLACEMENT_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>#$%+=:;';

	const COLOR_LIFE_DURATION = 6200;
	const COLOR_LIFE_MIN_ORIGINS = 1;
	const COLOR_LIFE_MAX_ORIGINS = 4;
	const COLOR_LIFE_WAVE_SPEED = 0.021;
	const COLOR_LIFE_WAVE_WIDTH = 6.8;
	const COLOR_LIFE_DISTANCE_DECAY = 0.9;
	const COLOR_LIFE_MIN_STRENGTH = 0.55;
	const COLOR_LIFE_MAX_STRENGTH = 0.95;

	const NORMAL_GLYPH_POOL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/\\+=:;._-#$%';

	const DENSITY_REBOUND_DURATION = BLOCK_REBOUND_DURATION;
	const TICKER_BURST_PERIOD = 7200;
	const TICKER_BURST_DURATION = 1650;
	const IDLE_BURST_PERIOD = 7600;
	const IDLE_BURST_DURATION = 1150;
	const HELIX_START_DELAY = 1640;
	const HELIX_BURST_PERIOD = 9200;
	const HELIX_BURST_DURATION = 2200;

	function blockGlyphAt(index: number) {
		return BLOCK_GLYPHS[Math.abs(index) % BLOCK_GLYPHS.length] ?? '█';
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function easeOutCubic(value: number) {
		const t = clamp(value, 0, 1);
		return 1 - Math.pow(1 - t, 3);
	}

	function easeInOutSine(value: number) {
		const t = clamp(value, 0, 1);
		return -(Math.cos(Math.PI * t) - 1) / 2;
	}

	function glyphAt(index: number) {
		return GLYPHS[Math.abs(index) % GLYPHS.length] ?? '.';
	}

	function scienceGlyphAt(index: number) {
		return SCIENCE_GLYPHS[Math.abs(index) % SCIENCE_GLYPHS.length] ?? '·';
	}

	function hexToRgb(value: string): RGB | null {
		const hex = value.trim().replace(/^#/, '');

		if (/^[\da-f]{3}$/i.test(hex)) {
			return {
				r: parseInt(hex[0] + hex[0], 16),
				g: parseInt(hex[1] + hex[1], 16),
				b: parseInt(hex[2] + hex[2], 16)
			};
		}

		if (/^[\da-f]{6}$/i.test(hex)) {
			return {
				r: parseInt(hex.slice(0, 2), 16),
				g: parseInt(hex.slice(2, 4), 16),
				b: parseInt(hex.slice(4, 6), 16)
			};
		}

		return null;
	}

	function mixRgb(from: RGB, to: RGB, amount: number): RGB {
		const t = clamp(amount, 0, 1);
		return {
			r: Math.round(from.r + (to.r - from.r) * t),
			g: Math.round(from.g + (to.g - from.g) * t),
			b: Math.round(from.b + (to.b - from.b) * t)
		};
	}

	function rgbToCss(color: RGB) {
		return `rgb(${color.r} ${color.g} ${color.b})`;
	}

	function buildColorSteps(source: string) {
		const paper = { r: 242, g: 241, b: 236 };
		const accent = hexToRgb(source) ?? { r: 255, g: 112, b: 67 };

		return [0, 0.18, 0.34, 0.52, 0.72, 1].map((amount) => rgbToCss(mixRgb(paper, accent, amount)));
	}

	function burstState(now: number, period: number, duration: number, phase = 0) {
		const cycle = (now - bootTime + phase) % period;

		if (cycle >= duration) {
			return {
				active: false,
				progress: 1,
				amount: 0
			};
		}

		const progress = cycle / duration;
		return {
			active: true,
			progress,
			amount: Math.sin(progress * Math.PI)
		};
	}

	function delayedBurstState(now: number, delay: number, period: number, duration: number) {
		const elapsed = now - bootTime - delay;

		if (elapsed < 0) {
			return {
				active: false,
				progress: 0,
				amount: 0
			};
		}

		const cycle = elapsed % period;

		if (cycle >= duration) {
			return {
				active: false,
				progress: 1,
				amount: 0
			};
		}

		const progress = cycle / duration;
		return {
			active: true,
			progress,
			amount: Math.sin(progress * Math.PI)
		};
	}

	function snapX(value: number) {
		return Math.round(value / CELL_X) * CELL_X + CELL_X / 2;
	}

	function snapY(value: number) {
		return Math.round(value / CELL_Y) * CELL_Y + CELL_Y / 2;
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

	function smoothStep(value: number) {
		const t = clamp(value, 0, 1);
		return t * t * (3 - 2 * t);
	}

	function pointerDensityAt(x: number, y: number, field: DensityField | null): PointerDensity {
		if (!field) return { level: 0, strength: 0 };

		const radiusX = field.amount < 0 ? CURSOR_REBOUND_RADIUS_X : CURSOR_RADIUS_X;
		const radiusY = field.amount < 0 ? CURSOR_REBOUND_RADIUS_Y : CURSOR_RADIUS_Y;
		const dx = (x - field.x) / radiusX;
		const dy = (y - field.y) / radiusY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance >= 1) return { level: 0, strength: 0 };

		const strength = Math.pow(1 - smoothStep(distance), 0.86);
		const level = clamp(Math.ceil(strength * CURSOR_LEVELS), 1, CURSOR_LEVELS);

		return { level, strength };
	}

	function densityGlyphProfile(
		amount: number,
		minFont = HOVER_MIN_FONT,
		maxFont = HOVER_MAX_FONT,
		minCount = HOVER_MIN_DENSITY,
		maxCount = HOVER_MAX_DENSITY
	) {
		const t = clamp(amount, 0, 1);

		return {
			fontSize: minFont + (maxFont - minFont) * (1 - t),
			count: Math.round(minCount + (maxCount - minCount) * t),
			alpha: HOVER_MIN_ALPHA + (HOVER_MAX_ALPHA - HOVER_MIN_ALPHA) * t,
			spreadX: HOVER_CLUSTER_RADIUS_X * (0.42 + t * 0.9),
			spreadY: HOVER_CLUSTER_RADIUS_Y * (0.42 + t * 0.85)
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

	function ambientDensityField(now: number): DensityField | null {
		const rebounding = densityExitStart > 0 && now - densityExitStart < DENSITY_REBOUND_DURATION;
		if (pointerActive || rebounding) return null;

		const period = 10400;
		const duration = 1150;
		const cycle = (now - bootTime + 3600) % period;
		if (cycle >= duration) return null;

		const progress = cycle / duration;
		const cycleIndex = Math.floor((now - bootTime + 3600) / period);

		return {
			x: width * (0.24 + (((cycleIndex * 37) % 52) / 100)),
			y: height * (0.34 + (((cycleIndex * 23) % 30) / 100)),
			amount: Math.sin(progress * Math.PI) * 0.52
		};
	}

	function sampleText(label: string, fontSize: number, x: number, y: number, align: CanvasTextAlign, stepX: number, stepY: number) {
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

		return points;
	}

	function signatureFontSize(label: string) {
		if (!ctx) return 88;

		let size = clamp(Math.floor(width * 0.086), 88, 158);
		const maxWidth = width * 0.45;

		while (size > 68) {
			ctx.font = `900 ${size}px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace`;
			if (ctx.measureText(label).width <= maxWidth) break;
			size -= 4;
		}

		return size;
	}

	function makeSamplePoints() {
		const mainSize = clamp(Math.floor(width * 0.112), 104, 218);
		const mainPoints = sampleText(
			text,
			mainSize,
			width / 2,
			height * 0.46,
			'center',
			TEXT_SAMPLE_MAIN_STEP_X,
			TEXT_SAMPLE_MAIN_STEP_Y
		);
		const signatureText = "WELCOME BACK " + signature?.trim().toUpperCase();
		const signaturePoints =
			signatureText && width >= 1024
				? sampleText(
						signatureText,
						signatureFontSize(signatureText),
						width - clamp(width * 0.075, 82, 140),
						height * 0.68,
						'right',
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
		const maxMain = clamp(Math.floor((width * height) / 620), 2400, 6400);
		const mainStep = Math.max(1, Math.ceil(points.main.length / maxMain));
		const main = points.main.filter((_, index) => index % mainStep === 0);
		const combined = [
			...main.map((point) => ({ point, role: 'main' as const })),
			...points.signature.map((point) => ({ point, role: 'signature' as const }))
		];

		particles = combined.map(({ point, role }, index) => {
			const lane = index % 24;

			return {
				homeX: point.x,
				homeY: point.y,
				startX: point.x + (lane - 12) * CELL_X,
				startY: height + CELL_Y * (12 + (index % 16)),
				phase: (index % 97) * 0.19,
				delay: (index % 58) * 9,
				alpha: role === 'signature' ? 0.86 + (index % 4) * 0.035 : 0.66 + (index % 5) * 0.045,
				glyph: glyphAt(index * 11),
				literalGlyph: point.glyph,
				charIndex: point.charIndex,
				accent: role === 'signature' ? index % 5 === 0 : index % 13 === 0,
				role
			};
		});
	}

	function randomBetween(min: number, max: number) {
		return min + Math.random() * (max - min);
	}

	function hashNumber(value: number) {
		const x = Math.sin(value * 12.9898) * 43758.5453;
		return x - Math.floor(x);
	}

	function pseudoGlyphFrom(pool: string, seed: number) {
		const index = Math.floor(hashNumber(seed) * pool.length);
		return pool[index] ?? '#';
	}

	function stableParticleGlyph(index: number, particle: Particle) {
		return pseudoGlyphFrom(NORMAL_GLYPH_POOL, index * 97.31 + particle.charIndex * 41.77 + particle.homeX * 0.13 + particle.homeY * 0.17);
	}

	function pseudoRandomGlyph(seed: number, charIndex: number, particleIndex = 0) {
		return pseudoGlyphFrom(LETTER_SWAP_REPLACEMENT_GLYPHS, seed + charIndex * 101.7 + particleIndex * 17.19);
	}

	function pseudoRandomBool(seed: number, charIndex: number, chance: number) {
		return hashNumber(seed + charIndex * 29.31) < chance;
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

		if (reduceMotion) return;

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

	function setupCanvas() {
		if (!canvas) return false;

		const rect = canvas.getBoundingClientRect();
		const nextWidth = Math.round(rect.width);
		const nextHeight = Math.round(rect.height);

		if (nextWidth < 1 || nextHeight < 1) return false;

		width = nextWidth;
		height = nextHeight;
		dpr = Math.min(window.devicePixelRatio || 1, 3);

		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		ctx = canvas.getContext('2d', { alpha: false });
		if (!ctx) return false;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.imageSmoothingEnabled = false;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = '7px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';

		accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || accentColor;
		colorSteps = buildColorSteps(accentColor);

		bootTime = performance.now();
		lastFrame = 0;
		activeVisualEvent = null;
		buildTickerRows();
		buildParticles();
		draw(performance.now());

		return true;
	}

	function drawRegularGrid(boot: number) {
		if (!ctx) return;

		ctx.strokeStyle = `rgba(242, 241, 236, ${0.009 + boot * 0.008})`;
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
		if (!ctx) return;

		ctx.font = '7px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (let rowIndex = 0; rowIndex < tickerRows.length; rowIndex++) {
			const row = tickerRows[rowIndex];
			const state = reduceMotion
				? { active: false, progress: 1, amount: 0 }
				: burstState(now, TICKER_BURST_PERIOD, TICKER_BURST_DURATION, row.phase);
			const travel = state.amount * CELL_X * (4 + row.speed * 18);
			const offset = (row.phase + travel) % CELL_X;
			const glyphShift = Math.round(travel / CELL_X);
			const y = row.y;

			for (let x = -CELL_X; x < width + CELL_X; x += CELL_X) {
				const col = Math.floor((x + offset) / CELL_X);
				const glyphIndex = col * 3 + rowIndex * 17 + glyphShift;

				ctx.globalAlpha = row.alpha * boot * (0.38 + state.amount * 0.28);
				ctx.fillStyle = Math.abs(col) % row.accentEvery === 0 ? colorSteps[4] : colorSteps[0];
				ctx.fillText(glyphAt(glyphIndex), x + offset, y);
			}
		}

		ctx.globalAlpha = 1;
	}

	function drawDoubleHelix(now: number, boot: number) {
		if (!ctx || reduceMotion || width < 1024) return;

		const context = ctx;
		const elapsed = now - bootTime - HELIX_START_DELAY;
		if (elapsed < 0) return;

		const opacity = boot * easeOutCubic(elapsed / 900);
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

		ctx.font = '8px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const drawStrandCluster = (x: number, y: number, seed: number, alpha: number, color: string, outward: number) => {
			const offsets = [
				{ dx: 0, dy: 0, alpha: 1, seed: 0 },
				{ dx: normalX * CELL_Y * 0.78 * outward, dy: normalY * CELL_Y * 0.78 * outward, alpha: 0.74, seed: 1 },
				{ dx: -normalX * CELL_Y * 0.56 * outward, dy: -normalY * CELL_Y * 0.56 * outward, alpha: 0.58, seed: 2 },
				{ dx: unitX * CELL_X * 0.92, dy: unitY * CELL_X * 0.92, alpha: 0.5, seed: 3 },
				{ dx: -unitX * CELL_X * 0.92, dy: -unitY * CELL_X * 0.92, alpha: 0.42, seed: 4 }
			];

			context.fillStyle = color;

			for (const offset of offsets) {
				context.globalAlpha = alpha * offset.alpha;
				context.fillText(scienceGlyphAt(seed + offset.seed), snapX(x + offset.dx), snapY(y + offset.dy));
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

			drawStrandCluster(xA, yA, column + stepA, opacity * (0.24 + depthA * 0.48), colorSteps[stepA] ?? accentColor, 1);
			drawStrandCluster(xB, yB, column + stepB + 3, opacity * (0.2 + depthB * 0.4), colorSteps[stepB] ?? colorSteps[0], -1);

			if (column % 5 === 0) {
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

					ctx.globalAlpha = opacity * 0.18;
					ctx.fillStyle = colorSteps[3] ?? colorSteps[0];
					ctx.fillText(connector, linkX, linkY);
				}
			}
		}

		ctx.globalAlpha = 1;
	}

	function drawBackground(now: number, boot: number) {
		if (!ctx) return;

		ctx.fillStyle = '#161713';
		ctx.fillRect(0, 0, width, height);

		const radial = ctx.createRadialGradient(width * 0.54, height * 0.48, 0, width * 0.54, height * 0.48, width * 0.62);
		radial.addColorStop(0, accentColor);
		radial.addColorStop(0.44, 'rgba(240, 240, 232, 0.08)');
		radial.addColorStop(1, 'rgba(22, 23, 19, 0)');

		ctx.globalAlpha = 0.055 + boot * 0.055;
		ctx.fillStyle = radial;
		ctx.fillRect(0, 0, width, height);
		ctx.globalAlpha = 1;

		drawRegularGrid(boot);
		drawTickerRows(now, boot);
		drawDoubleHelix(now, boot);
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
		if (!ctx) return;

		const profile = densityGlyphProfile(amount, fontMin, fontMax, countMin, countMax);
		const mainGlyph = readableGlyph?.trim() || glyphAt(seed);

		ctx.font = `${profile.fontSize}px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace`;
		ctx.fillStyle = color;

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

			ctx.globalAlpha = alpha * profile.alpha * (1 - index / (profile.count * 1.34));
			ctx.fillText(useReadable ? mainGlyph : glyphAt(seed + index * 7), px, py);
		}

		ctx.font = '7px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
	}

	function isAlphabeticGlyph(value: string) {
		return /^[A-Z]$/i.test(value.trim());
	}

	function randomLetterAt(index: number) {
		const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		return letters[Math.abs(index) % letters.length] ?? 'A';
	}

	function letterSwapProgress(now: number, particle: Particle) {
		if (
			!activeVisualEvent ||
			activeVisualEvent.kind !== 'letter-swap' ||
			particle.role !== 'main' ||
			particle.charIndex < 0 ||
			!activeVisualEvent.targets.has(particle.charIndex)
		) {
			return {
				active: false,
				progress: 1,
				amount: 0,
				replacement: ''
			};
		}

		const elapsed = now - activeVisualEvent.startedAt;

		if (elapsed < 0 || elapsed >= activeVisualEvent.duration) {
			return {
				active: false,
				progress: 1,
				amount: 0,
				replacement: ''
			};
		}

		const progress = elapsed / activeVisualEvent.duration;

		return {
			active: true,
			progress,
			amount: Math.sin(progress * Math.PI),
			replacement: activeVisualEvent.targets.get(particle.charIndex) ?? ''
		};
	}

	function glyphForLetterSwap(now: number, particle: Particle, particleIndex: number, seed: number) {
		const state = letterSwapProgress(now, particle);
		const normal = stableParticleGlyph(particleIndex, particle);

		if (!state.active) return normal;

		const eventSeed = activeVisualEvent?.seed ?? seed;
		const useBlock = pseudoRandomBool(eventSeed, particle.charIndex, LETTER_SWAP_TRANSITION_BLOCK_CHANCE);
		const replacementTexture = pseudoRandomGlyph(eventSeed, particle.charIndex, particleIndex);

		/*
			The large character shape stays readable because the particle positions still form the
			big letter. The small glyphs inside that shape are pseudo-random and stable, not just
			the same letter repeated.
		*/
		if (state.progress < LETTER_SWAP_IN_END) {
			const intro = state.progress / LETTER_SWAP_IN_END;

			if (intro < 0.42) {
				return useBlock
					? blockGlyphAt(seed + particle.charIndex * 5 + particleIndex)
					: randomLetterAt(seed + particle.charIndex * 17 + particleIndex + Math.floor(intro * 18));
			}

			return replacementTexture;
		}

		if (state.progress < LETTER_SWAP_HOLD_END) {
			return replacementTexture;
		}

		if (state.progress < LETTER_SWAP_OUT_END) {
			const outro = (state.progress - LETTER_SWAP_HOLD_END) / (LETTER_SWAP_OUT_END - LETTER_SWAP_HOLD_END);

			if (outro < 0.4) return replacementTexture;

			if (outro < 0.72) {
				return useBlock
					? blockGlyphAt(seed + particle.charIndex * 9 + particleIndex)
					: randomLetterAt(seed + particle.charIndex * 23 + particleIndex + Math.floor(outro * 26));
			}
		}

		return normal;
	}

	function colorLifeAmountAt(now: number, particle: Particle) {
		if (!activeVisualEvent || activeVisualEvent.kind !== 'color-life') return 0;

		const elapsed = now - activeVisualEvent.startedAt;

		if (elapsed < 0 || elapsed >= activeVisualEvent.duration) return 0;

		const age = elapsed / activeVisualEvent.duration;
		const globalFade = Math.pow(1 - age, 1.45);
		let amount = 0;

		for (const origin of activeVisualEvent.origins) {
			const dx = (particle.homeX - origin.x) / CELL_X;
			const dy = (particle.homeY - origin.y) / CELL_Y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const wave = elapsed * COLOR_LIFE_WAVE_SPEED - distance;
			const waveAmount = Math.exp(-(wave * wave) / (2 * COLOR_LIFE_WAVE_WIDTH * COLOR_LIFE_WAVE_WIDTH));
			const passedLife = Math.pow(COLOR_LIFE_DISTANCE_DECAY, distance);
			const local = waveAmount * passedLife * globalFade * origin.strength;

			amount = Math.max(amount, local);
		}

		return clamp(amount, 0, 1);
	}

	function clickRippleAmountAt(now: number, particle: Particle) {
		if (clickRipples.length === 0) return 0;

		let amount = 0;

		for (const ripple of clickRipples) {
			const elapsed = now - ripple.startedAt;

			if (elapsed < 0 || elapsed >= CLICK_RIPPLE_DURATION) continue;

			const age = elapsed / CLICK_RIPPLE_DURATION;
			const dx = (particle.homeX - ripple.x) / CELL_X;
			const dy = (particle.homeY - ripple.y) / CELL_Y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const wave = elapsed * CLICK_RIPPLE_SPEED - distance;
			const ring = Math.exp(-(wave * wave) / (2 * CLICK_RIPPLE_WIDTH * CLICK_RIPPLE_WIDTH));
			const center = Math.exp(-(distance * distance) / (2 * CLICK_RIPPLE_CENTER_WIDTH * CLICK_RIPPLE_CENTER_WIDTH));
			const fade = Math.pow(1 - age, 1.45);
			const globalAfterwave = Math.sin(age * Math.PI) * CLICK_RIPPLE_GLOBAL_AFTERWAVE;
			const travellingRing = ring * (0.72 + age * 0.28);
			const local = (travellingRing + center * Math.max(0, 0.34 - age) + globalAfterwave) * fade * CLICK_RIPPLE_MAX_AMOUNT;

			amount = Math.max(amount, local);
		}

		return clamp(amount, 0, 1);
	}

	function drawParticles(now: number, boot: number) {
		if (!ctx) return;

		const hoverField = hoverDensityField();
		const reboundField = reboundDensityField(now);
		const ambientField = !hoverField && !reboundField ? ambientDensityField(now) : null;
		const blockProgress = clickBlockProgress(now);
		const randomRollState = reduceMotion ? null : burstState(now, IDLE_BURST_PERIOD, IDLE_BURST_DURATION, 1240);
		const idleState = randomRollState?.active ? randomRollState : null;
		const idleBurst = idleState?.amount ?? 0;
		const idleRoll = idleState?.active ? Math.floor(idleState.progress * 42) : 0;

		if (clickRipples.length > 0) {
			clickRipples = clickRipples.filter((ripple) => now - ripple.startedAt < CLICK_RIPPLE_DURATION);
		}

		let strongestHover = 0;
		let strongestHoverX = -9999;
		let strongestHoverY = -9999;

		ctx.font = '7px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (let i = 0; i < particles.length; i++) {
			const particle = particles[i];
			const localBoot = reduceMotion ? 1 : easeOutCubic((now - bootTime - particle.delay) / 1300);
			const settle = Math.max(boot, localBoot);
			const wobble = Math.sin(now * 0.0009 + particle.phase) * (particle.role === 'signature' ? 0.35 : 0.6) * (1 - blockProgress);
			const settledX = particle.startX + (particle.homeX - particle.startX) * settle;
			const settledY = particle.startY + (particle.homeY - particle.startY) * settle;
			const x = settledX + (particle.homeX - settledX) * blockProgress;
			const y = settledY + (particle.homeY - settledY) * blockProgress + wobble;

			const hoverDensity = pointerDensityAt(particle.homeX, particle.homeY, hoverField ?? ambientField);
			const reboundDensity = pointerDensityAt(particle.homeX, particle.homeY, reboundField);
			const hoverAmount = hoverDensity.strength;
			const reboundAmount = reboundDensity.strength * Math.min(1, Math.abs(reboundField?.amount ?? 0));
			const pointerZone = Math.max(hoverDensity.level, reboundDensity.level);

			if (hoverField && hoverAmount > strongestHover) {
				strongestHover = hoverAmount;
				strongestHoverX = hoverField.x;
				strongestHoverY = hoverField.y;
			}

			const reveal = reduceMotion ? 1 : clamp((now - bootTime - particle.delay) / 820, 0, 1);
			const rollSeed =
				particle.role === 'signature' ? i * 19 + Math.floor(particle.homeX / 2) : i + Math.floor(particle.homeX / CELL_X);

			const lockProgress =
				idleState?.active && idleState.progress > 0.62
					? easeOutCubic((idleState.progress - 0.62) / 0.38)
					: 0;
			const lockOrder = ((i * 37) % 100) / 100;
			const idleRolling = Boolean(idleState?.active && (idleState.progress < 0.62 || lockProgress <= lockOrder));

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

			const swapState = letterSwapProgress(now, particle);
			const letterSwapActive = swapState.active && hoverAmount <= 0.02 && reboundAmount <= 0.03 && !clickTransition;
			const colorLifeAmount = colorLifeAmountAt(now, particle);
			const clickRippleAmount = clickRippleAmountAt(now, particle);

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
						idleBurst * 0.12 +
						colorLifeAmount * 0.16 +
						clickRippleAmount * 0.2 +
						(letterSwapActive ? swapState.amount * 0.14 : 0))
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

			const normalGlyph =
				letterSwapActive
					? glyphForLetterSwap(now, particle, i, rollSeed)
					: idleRolling && hoverDensity.level <= 2
						? glyphAt(rollSeed + idleRoll + pointerZone * 3)
						: stableParticleGlyph(i, particle);

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
				const hideGate = ((i * 29) % 100) / 100;
				if (hideGate < reboundAmount * BLOCK_REBOUND_HIDE_MAX) continue;

				if (reboundAmount > 0.16) {
					ctx.globalAlpha = alpha * (0.82 + reboundAmount * 0.3);
					ctx.fillStyle = fill;
					ctx.fillText(blockGlyphAt(i + Math.floor(reboundAmount * 11)), x, y);

					if (reboundAmount > 0.42) {
						ctx.font = '8px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
						ctx.globalAlpha = alpha * reboundAmount * 0.28;
						ctx.fillText(blockGlyphAt(i + 3), snapX(x + CELL_X * 0.45), snapY(y));
						ctx.font = '7px "Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
					}
				} else {
					ctx.globalAlpha = alpha;
					ctx.fillStyle = fill;
					ctx.fillText(normalGlyph, x, y);
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

			ctx.globalAlpha = isBlocked
				? 0.9
				: rippleBlocifying
					? Math.min(0.94, alpha + rippleBlockAmount * CLICK_RIPPLE_BLOCK_ALPHA)
					: alpha;
			ctx.fillStyle = fill;
			ctx.fillText(glyph, x, y);
		}

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

		ctx.globalAlpha = 1;
	}

	function draw(now: number) {
		if (!ctx) return;

		const boot = reduceMotion ? 1 : easeOutCubic((now - bootTime) / 1500);

		drawBackground(now, boot);
		drawParticles(now, boot);
	}

	function tick(now: number) {
		if (!running) return;

		if (now - lastFrame >= FRAME_MS) {
			lastFrame = now;
			draw(now);
		}

		raf = requestAnimationFrame(tick);
	}

	function start() {
		if (running || reduceMotion || !visible || document.visibilityState === 'hidden') return;

		running = true;
		raf = requestAnimationFrame(tick);
	}

	function stop() {
		running = false;
		cancelAnimationFrame(raf);
	}

	function scheduleResize() {
		cancelAnimationFrame(resizeRaf);

		resizeRaf = requestAnimationFrame(() => {
			setupCanvas();
			start();
		});
	}

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

			if (clickRipples.length > CLICK_RIPPLE_MAX_ACTIVE) {
				clickRipples = clickRipples.slice(-CLICK_RIPPLE_MAX_ACTIVE);
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
			if (document.visibilityState === 'hidden') stop();
			else start();
		};

		observer = new IntersectionObserver(([entry]) => {
			visible = Boolean(entry?.isIntersecting);

			if (visible) start();
			else stop();
		});

		observer.observe(root);

		window.addEventListener('resize', onResize);
		window.addEventListener('keydown', onKeyDown);
		document.addEventListener('visibilitychange', onVisibility);
		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerleave', onPointerLeave);
		canvas.addEventListener('click', onClick);

		if (reduceMotion) draw(performance.now());
		else scheduleNextVisualEvent();

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
		};
	});
</script>

<div bind:this={root} class="terminal-field" aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.terminal-field {
		position: absolute;
		inset: 0;
		display: none;
		overflow: hidden;
		background: #161713;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	@media (min-width: 1024px) {
		.terminal-field {
			display: block;
		}
	}
</style>
