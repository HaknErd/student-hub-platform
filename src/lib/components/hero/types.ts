export type Props = {
	text?: string;
	signature?: string | null;
};

export type Particle = {
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
	rollSeed: number;
	lockOrder: number;
	hideGate: number;
	baseGlyph: string;
	baseFillIndex: number;
	baseFontSize: number;
	role: 'main' | 'signature';
};

export type SamplePoint = {
	x: number;
	y: number;
	glyph: string;
	charIndex: number;
};

export type TickerRow = {
	y: number;
	speed: number;
	alpha: number;
	phase: number;
	accentEvery: number;
};

export type RGB = {
	r: number;
	g: number;
	b: number;
};

export type DensityField = {
	x: number;
	y: number;
	amount: number;
};

export type PointerDensity = {
	level: number;
	strength: number;
};

export type VisualEventKind = 'letter-swap' | 'color-life';

export type LetterSwapEvent = {
	kind: 'letter-swap';
	startedAt: number;
	duration: number;
	targets: Map<number, string>;
	seed: number;
};

export type ColorLifeOrigin = {
	x: number;
	y: number;
	seed: number;
	strength: number;
};

export type ColorLifeEvent = {
	kind: 'color-life';
	startedAt: number;
	duration: number;
	origins: ColorLifeOrigin[];
	seed: number;
};

export type VisualEvent = LetterSwapEvent | ColorLifeEvent;

export type ClickRipple = {
	x: number;
	y: number;
	startedAt: number;
	seed: number;
};
