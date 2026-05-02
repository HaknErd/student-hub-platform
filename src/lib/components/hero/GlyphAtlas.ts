const FONT_FAMILY = '"Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
const FONT_WEIGHT = 900;

type GlyphSprite = {
	canvas: HTMLCanvasElement;
	cssWidth: number;
	cssHeight: number;
};

export class GlyphAtlas {
	private cache = new Map<string, GlyphSprite>();
	private dpr = 1;

	reset(dpr: number) {
		this.dpr = Math.max(1, dpr);
		this.cache.clear();
	}

	// ChatGPT + Qwen: cache glyph rasterization so frame hot paths blit sprites instead of rerunning fillText.
	drawGlyph(
		ctx: CanvasRenderingContext2D,
		glyph: string,
		x: number,
		y: number,
		color: string,
		fontSize: number,
		alpha: number
	) {
		if (alpha <= 0) return;

		const sprite = this.spriteFor(glyph, color, fontSize);
		ctx.globalAlpha = alpha;
		ctx.drawImage(sprite.canvas, x - sprite.cssWidth / 2, y - sprite.cssHeight / 2, sprite.cssWidth, sprite.cssHeight);
	}

	private spriteFor(glyph: string, color: string, fontSize: number) {
		const quantizedFontSize = Math.max(2.5, Math.round(fontSize * 2) / 2);
		const key = `${glyph}|${color}|${quantizedFontSize}`;
		const cached = this.cache.get(key);
		if (cached) return cached;

		const measureCanvas = document.createElement('canvas');
		const measureCtx = measureCanvas.getContext('2d');
		const font = `${FONT_WEIGHT} ${quantizedFontSize}px ${FONT_FAMILY}`;

		if (!measureCtx) {
			const fallback = {
				canvas: measureCanvas,
				cssWidth: Math.ceil(quantizedFontSize * 2),
				cssHeight: Math.ceil(quantizedFontSize * 2)
			};
			this.cache.set(key, fallback);
			return fallback;
		}

		measureCtx.font = font;
		const metrics = measureCtx.measureText(glyph || ' ');
		const cssWidth = Math.ceil(Math.max(quantizedFontSize, metrics.width) + 8);
		const cssHeight = Math.ceil(quantizedFontSize * 2.4 + 8);
		const canvas = document.createElement('canvas');

		canvas.width = Math.max(1, Math.ceil(cssWidth * this.dpr));
		canvas.height = Math.max(1, Math.ceil(cssHeight * this.dpr));

		const spriteCtx = canvas.getContext('2d');
		if (spriteCtx) {
			spriteCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
			spriteCtx.imageSmoothingEnabled = false;
			spriteCtx.font = font;
			spriteCtx.textAlign = 'center';
			spriteCtx.textBaseline = 'middle';
			spriteCtx.fillStyle = color;
			spriteCtx.fillText(glyph, cssWidth / 2, cssHeight / 2);
		}

		const sprite = { canvas, cssWidth, cssHeight };
		this.cache.set(key, sprite);
		return sprite;
	}
}
