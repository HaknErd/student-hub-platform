import {
	BLOCK_GLYPHS,
	CURSOR_LEVELS,
	CURSOR_RADIUS_X,
	CURSOR_RADIUS_Y,
	CURSOR_REBOUND_RADIUS_X,
	CURSOR_REBOUND_RADIUS_Y,
	GLYPHS,
	HOVER_CLUSTER_RADIUS_X,
	HOVER_CLUSTER_RADIUS_Y,
	HOVER_MAX_ALPHA,
	HOVER_MAX_DENSITY,
	HOVER_MAX_FONT,
	HOVER_MIN_ALPHA,
	HOVER_MIN_DENSITY,
	HOVER_MIN_FONT,
	LETTER_SWAP_REPLACEMENT_GLYPHS,
	NORMAL_GLYPH_POOL,
	SCIENCE_GLYPHS
} from './constants';
import type { DensityField, PointerDensity, RGB } from './types';

export function blockGlyphAt(index: number) { return BLOCK_GLYPHS[Math.abs(index) % BLOCK_GLYPHS.length] ?? '█'; }
export function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
export function easeOutCubic(value: number) { const t = clamp(value, 0, 1); return 1 - Math.pow(1 - t, 3); }
export function easeInOutSine(value: number) { const t = clamp(value, 0, 1); return -(Math.cos(Math.PI * t) - 1) / 2; }
export function glyphAt(index: number) { return GLYPHS[Math.abs(index) % GLYPHS.length] ?? '.'; }
export function scienceGlyphAt(index: number) { return SCIENCE_GLYPHS[Math.abs(index) % SCIENCE_GLYPHS.length] ?? '·'; }

export function hexToRgb(value: string): RGB | null {
	const hex = value.trim().replace(/^#/, '');
	if (/^[\da-f]{3}$/i.test(hex)) return { r: parseInt(hex[0] + hex[0], 16), g: parseInt(hex[1] + hex[1], 16), b: parseInt(hex[2] + hex[2], 16) };
	if (/^[\da-f]{6}$/i.test(hex)) return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
	return null;
}

export function mixRgb(from: RGB, to: RGB, amount: number): RGB {
	const t = clamp(amount, 0, 1);
	return { r: Math.round(from.r + (to.r - from.r) * t), g: Math.round(from.g + (to.g - from.g) * t), b: Math.round(from.b + (to.b - from.b) * t) };
}

export function rgbToCss(color: RGB) { return `rgb(${color.r} ${color.g} ${color.b})`; }
export function buildColorSteps(source: string) { const paper = { r: 242, g: 241, b: 236 }; const accent = hexToRgb(source) ?? { r: 255, g: 112, b: 67 }; return [0, 0.18, 0.34, 0.52, 0.72, 1].map((amount) => rgbToCss(mixRgb(paper, accent, amount))); }
export function smoothStep(value: number) { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); }

export function pointerDensityLevelFromStrength(strength: number) {
	return clamp(Math.ceil(strength * CURSOR_LEVELS), 1, CURSOR_LEVELS);
}

export function pointerDensityStrengthAt(x: number, y: number, field: DensityField | null) {
	if (!field) return 0;
	const radiusX = field.amount < 0 ? CURSOR_REBOUND_RADIUS_X : CURSOR_RADIUS_X;
	const radiusY = field.amount < 0 ? CURSOR_REBOUND_RADIUS_Y : CURSOR_RADIUS_Y;
	const dx = (x - field.x) / radiusX;
	const dy = (y - field.y) / radiusY;
	const distanceSquared = dx * dx + dy * dy;

	// ChatGPT: reject out-of-radius particles before sqrt/pow in the pointer hot path.
	if (distanceSquared >= 1) return 0;

	return Math.pow(1 - smoothStep(Math.sqrt(distanceSquared)), 0.86);
}

export function pointerDensityAt(x: number, y: number, field: DensityField | null): PointerDensity {
	const strength = pointerDensityStrengthAt(x, y, field);
	if (strength <= 0) return { level: 0, strength: 0 };
	return { level: pointerDensityLevelFromStrength(strength), strength };
}

export function densityGlyphProfile(amount: number, minFont = HOVER_MIN_FONT, maxFont = HOVER_MAX_FONT, minCount = HOVER_MIN_DENSITY, maxCount = HOVER_MAX_DENSITY) {
	const t = clamp(amount, 0, 1);
	return { fontSize: minFont + (maxFont - minFont) * (1 - t), count: Math.round(minCount + (maxCount - minCount) * t), alpha: HOVER_MIN_ALPHA + (HOVER_MAX_ALPHA - HOVER_MIN_ALPHA) * t, spreadX: HOVER_CLUSTER_RADIUS_X * (0.42 + t * 0.9), spreadY: HOVER_CLUSTER_RADIUS_Y * (0.42 + t * 0.85) };
}

export function randomBetween(min: number, max: number) { return min + Math.random() * (max - min); }
export function burstAmount(now: number, bootTime: number, period: number, duration: number, phase = 0) { const cycle = (now - bootTime + phase) % period; return cycle >= duration ? 0 : Math.sin((cycle / duration) * Math.PI); }
export function burstProgress(now: number, bootTime: number, period: number, duration: number, phase = 0) { const cycle = (now - bootTime + phase) % period; return cycle >= duration ? 1 : cycle / duration; }
export function hashNumber(value: number) { const x = Math.sin(value * 12.9898) * 43758.5453; return x - Math.floor(x); }
export function pseudoGlyphFrom(pool: string, seed: number) { const index = Math.floor(hashNumber(seed) * pool.length); return pool[index] ?? '#'; }
export function stableParticleGlyph(index: number, charIndex: number, homeX: number, homeY: number) { return pseudoGlyphFrom(NORMAL_GLYPH_POOL, index * 97.31 + charIndex * 41.77 + homeX * 0.13 + homeY * 0.17); }
export function pseudoRandomGlyph(seed: number, charIndex: number, particleIndex = 0) { return pseudoGlyphFrom(LETTER_SWAP_REPLACEMENT_GLYPHS, seed + charIndex * 101.7 + particleIndex * 17.19); }
export function pseudoRandomBool(seed: number, charIndex: number, chance: number) { return hashNumber(seed + charIndex * 29.31) < chance; }
export function isAlphabeticGlyph(value: string) { return /^[A-Z]$/i.test(value.trim()); }
export function randomLetterAt(index: number) { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return letters[Math.abs(index) % letters.length] ?? 'A'; }
