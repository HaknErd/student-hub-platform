import { BLOCK_GLYPHS, CELL_X, CELL_Y, GLYPHS, SCIENCE_GLYPHS } from './constants';

const FONT_FAMILY = '"Berkeley Mono", "IBM Plex Mono", "JetBrains Mono", monospace';
const FONT_WEIGHT = 900;
const ATLAS_CELL = 48;
const ATLAS_COLUMNS = 16;
const GLYPH_STRIDE = 12;
const DEFAULT_MAX_GLYPHS = 120_000;

type GlyphUv = {
	u0: number;
	v0: number;
	u1: number;
	v1: number;
};

type ParsedColor = {
	r: number;
	g: number;
	b: number;
};

type ShaderBundle = {
	program: WebGLProgram;
};

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.warn('[TextFieldHero GPU] Shader compile failed:', gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

	if (!vertex || !fragment) return null;

	const program = gl.createProgram();
	if (!program) return null;

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.warn('[TextFieldHero GPU] Program link failed:', gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}

	return program;
}

function uniqueGlyphs() {
	return [
		...new Set([
			...Array.from(GLYPHS),
			...SCIENCE_GLYPHS,
			...BLOCK_GLYPHS,
			...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>/\\+=:;._-#$%!?~@&*|'
		])
	];
}

function parseColor(value: string): ParsedColor {
	const trimmed = value.trim();
	const hex = trimmed.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];

	if (hex) {
		const full = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;

		return {
			r: parseInt(full.slice(0, 2), 16) / 255,
			g: parseInt(full.slice(2, 4), 16) / 255,
			b: parseInt(full.slice(4, 6), 16) / 255
		};
	}

	const rgb = trimmed.match(/rgba?\(([^)]+)\)/i);
	if (rgb) {
		const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);

		return {
			r: (parts[0] ?? 242) / 255,
			g: (parts[1] ?? 241) / 255,
			b: (parts[2] ?? 236) / 255
		};
	}

	return { r: 242 / 255, g: 241 / 255, b: 236 / 255 };
}

export class GpuGlyphRenderer {
	private readonly gl: WebGL2RenderingContext;
	private readonly canvas: HTMLCanvasElement;
	private readonly maxGlyphs: number;
	private readonly glyphData: Float32Array;
	private readonly colorCache = new Map<string, ParsedColor>();
	private readonly glyphUvs = new Map<string, GlyphUv>();
	private readonly glyphProgram: WebGLProgram;
	private readonly backgroundProgram: WebGLProgram;
	private readonly glyphVao: WebGLVertexArrayObject;
	private readonly glyphInstanceBuffer: WebGLBuffer;
	private readonly staticGlyphInstanceBuffer: WebGLBuffer;
	private readonly atlasTexture: WebGLTexture;
	private readonly backgroundBundle: ShaderBundle;
	private readonly glyphUniforms: {
		atlas: WebGLUniformLocation | null;
		resolution: WebGLUniformLocation | null;
	};
	private readonly backgroundUniforms: {
		resolution: WebGLUniformLocation | null;
		dpr: WebGLUniformLocation | null;
		accent: WebGLUniformLocation | null;
		cell: WebGLUniformLocation | null;
	};
	private glyphCount = 0;
	private staticGlyphCount = 0;
	private capturingStaticGlyphs = false;
	private readonly staticGlyphData: Float32Array;
	private width = 1;
	private height = 1;
	private dpr = 1;
	private accent: ParsedColor = { r: 1, g: 112 / 255, b: 67 / 255 };
	private rendererInfo = {
		vendor: 'webgl2',
		renderer: 'webgl2'
	};

	static create(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: false,
			powerPreference: 'high-performance'
		});

		if (!gl) return null;

		try {
			return new GpuGlyphRenderer(canvas, gl);
		} catch (error) {
			console.warn('[TextFieldHero GPU] Falling back to Canvas 2D:', error);
			return null;
		}
	}

	private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, maxGlyphs = DEFAULT_MAX_GLYPHS) {
		this.canvas = canvas;
		this.gl = gl;
		this.maxGlyphs = maxGlyphs;
		this.glyphData = new Float32Array(maxGlyphs * GLYPH_STRIDE);
		this.staticGlyphData = new Float32Array(maxGlyphs * GLYPH_STRIDE);

		const backgroundProgram = createProgram(gl, BACKGROUND_VERTEX_SHADER, BACKGROUND_FRAGMENT_SHADER);
		const glyphProgram = createProgram(gl, GLYPH_VERTEX_SHADER, GLYPH_FRAGMENT_SHADER);
		const glyphVao = gl.createVertexArray();
		const glyphInstanceBuffer = gl.createBuffer();
		const staticGlyphInstanceBuffer = gl.createBuffer();
		const atlasTexture = gl.createTexture();

		if (!backgroundProgram || !glyphProgram || !glyphVao || !glyphInstanceBuffer || !staticGlyphInstanceBuffer || !atlasTexture) {
			throw new Error('Unable to initialize WebGL2 renderer resources.');
		}

		this.backgroundProgram = backgroundProgram;
		this.glyphProgram = glyphProgram;
		this.glyphVao = glyphVao;
		this.glyphInstanceBuffer = glyphInstanceBuffer;
		this.staticGlyphInstanceBuffer = staticGlyphInstanceBuffer;
		this.atlasTexture = atlasTexture;
		this.backgroundBundle = { program: backgroundProgram };
		this.glyphUniforms = {
			atlas: gl.getUniformLocation(glyphProgram, 'uAtlas'),
			resolution: gl.getUniformLocation(glyphProgram, 'uResolution')
		};
		this.backgroundUniforms = {
			resolution: gl.getUniformLocation(backgroundProgram, 'uResolution'),
			dpr: gl.getUniformLocation(backgroundProgram, 'uDpr'),
			accent: gl.getUniformLocation(backgroundProgram, 'uAccent'),
			cell: gl.getUniformLocation(backgroundProgram, 'uCell')
		};

		this.configureGlyphPipeline();
		this.buildGlyphAtlas();
		this.captureRendererInfo();
	}

	resize(width: number, height: number, dpr: number, accentColor: string) {
		this.width = Math.max(1, width);
		this.height = Math.max(1, height);
		this.dpr = Math.max(1, dpr);
		this.accent = this.colorFor(accentColor);
	}

	beginFrame() {
		const gl = this.gl;
		this.glyphCount = 0;

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		this.drawBackground();
	}

	// Qwen + Claude Sonnet: batch glyph draws into GPU instances instead of changing Canvas 2D state per glyph.
	drawGlyph(glyph: string, x: number, y: number, color: string, fontSize: number, alpha: number) {
		const targetCount = this.capturingStaticGlyphs ? this.staticGlyphCount : this.glyphCount;
		if (alpha <= 0 || targetCount >= this.maxGlyphs) return;

		const uv = this.glyphUvs.get(glyph) ?? this.glyphUvs.get('.') ?? this.glyphUvs.values().next().value;
		if (!uv) return;

		const parsed = this.colorFor(color);
		const target = this.capturingStaticGlyphs ? this.staticGlyphData : this.glyphData;
		const offset = targetCount * GLYPH_STRIDE;
		const width = Math.max(4, fontSize + 8);
		const height = Math.max(6, fontSize * 2.4 + 8);

		target[offset] = x;
		target[offset + 1] = y;
		target[offset + 2] = width;
		target[offset + 3] = height;
		target[offset + 4] = uv.u0;
		target[offset + 5] = uv.v0;
		target[offset + 6] = uv.u1;
		target[offset + 7] = uv.v1;
		target[offset + 8] = parsed.r;
		target[offset + 9] = parsed.g;
		target[offset + 10] = parsed.b;
		target[offset + 11] = Math.min(1, Math.max(0, alpha));

		if (this.capturingStaticGlyphs) {
			this.staticGlyphCount += 1;
		} else {
			this.glyphCount += 1;
		}
	}

	beginStaticGlyphCapture() {
		this.staticGlyphCount = 0;
		this.capturingStaticGlyphs = true;
	}

	endStaticGlyphCapture() {
		this.capturingStaticGlyphs = false;

		if (this.staticGlyphCount === 0) return;

		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.staticGlyphInstanceBuffer);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.staticGlyphData, 0, this.staticGlyphCount * GLYPH_STRIDE);
	}

	clearStaticGlyphs() {
		this.staticGlyphCount = 0;
		this.capturingStaticGlyphs = false;
	}

	flushStaticGlyphs() {
		this.drawGlyphBuffer(this.staticGlyphInstanceBuffer, this.staticGlyphCount, false);
	}

	flushGlyphs() {
		if (this.glyphCount > 0) {
			this.drawGlyphBuffer(this.glyphInstanceBuffer, this.glyphCount, true);
		}
	}

	private drawGlyphBuffer(buffer: WebGLBuffer, count: number, upload: boolean) {
		if (count === 0) return;

		const gl = this.gl;
		gl.useProgram(this.glyphProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
		gl.uniform1i(this.glyphUniforms.atlas, 0);
		gl.uniform2f(this.glyphUniforms.resolution, this.width, this.height);
		gl.bindVertexArray(this.glyphVao);
		this.bindInstanceBuffer(buffer);

		if (upload) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.glyphData, 0, count * GLYPH_STRIDE);
		}

		gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, count);
		gl.bindVertexArray(null);
	}

	getInfo() {
		return {
			mode: 'webgl2',
			vendor: this.rendererInfo.vendor,
			renderer: this.rendererInfo.renderer,
			queuedGlyphs: this.glyphCount,
			maxGlyphs: this.maxGlyphs
		};
	}

	destroy() {
		const gl = this.gl;
		gl.deleteTexture(this.atlasTexture);
		gl.deleteBuffer(this.glyphInstanceBuffer);
		gl.deleteBuffer(this.staticGlyphInstanceBuffer);
		gl.deleteVertexArray(this.glyphVao);
		gl.deleteProgram(this.glyphProgram);
		gl.deleteProgram(this.backgroundProgram);
	}

	private configureGlyphPipeline() {
		const gl = this.gl;
		const quadBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();

		if (!quadBuffer || !indexBuffer) {
			throw new Error('Unable to create WebGL2 glyph buffers.');
		}

		gl.bindVertexArray(this.glyphVao);

		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([
				-0.5, -0.5,
				0.5, -0.5,
				0.5, 0.5,
				-0.5, 0.5
			]),
			gl.STATIC_DRAW
		);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.glyphInstanceBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.glyphData.byteLength, gl.DYNAMIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.staticGlyphInstanceBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.staticGlyphData.byteLength, gl.DYNAMIC_DRAW);

		this.bindInstanceBuffer(this.glyphInstanceBuffer);

		gl.bindVertexArray(null);
	}

	private bindInstanceBuffer(buffer: WebGLBuffer) {
		const gl = this.gl;
		const strideBytes = GLYPH_STRIDE * Float32Array.BYTES_PER_ELEMENT;

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

		const attributes = [
			{ index: 1, size: 2, offset: 0 },
			{ index: 2, size: 2, offset: 2 },
			{ index: 3, size: 4, offset: 4 },
			{ index: 4, size: 4, offset: 8 }
		];

		for (const attribute of attributes) {
			gl.enableVertexAttribArray(attribute.index);
			gl.vertexAttribPointer(
				attribute.index,
				attribute.size,
				gl.FLOAT,
				false,
				strideBytes,
				attribute.offset * Float32Array.BYTES_PER_ELEMENT
			);
			gl.vertexAttribDivisor(attribute.index, 1);
		}
	}

	private buildGlyphAtlas() {
		const gl = this.gl;
		const glyphs = uniqueGlyphs();
		const rows = Math.ceil(glyphs.length / ATLAS_COLUMNS);
		const atlas = document.createElement('canvas');
		atlas.width = ATLAS_COLUMNS * ATLAS_CELL;
		atlas.height = rows * ATLAS_CELL;

		const atlasCtx = atlas.getContext('2d');
		if (!atlasCtx) {
			throw new Error('Unable to create WebGL glyph atlas canvas.');
		}

		atlasCtx.clearRect(0, 0, atlas.width, atlas.height);
		atlasCtx.fillStyle = '#fff';
		atlasCtx.font = `${FONT_WEIGHT} 24px ${FONT_FAMILY}`;
		atlasCtx.textAlign = 'center';
		atlasCtx.textBaseline = 'middle';

		for (let index = 0; index < glyphs.length; index++) {
			const glyph = glyphs[index];
			const column = index % ATLAS_COLUMNS;
			const row = Math.floor(index / ATLAS_COLUMNS);
			const x = column * ATLAS_CELL;
			const y = row * ATLAS_CELL;

			atlasCtx.fillText(glyph, x + ATLAS_CELL / 2, y + ATLAS_CELL / 2);
			this.glyphUvs.set(glyph, {
				u0: x / atlas.width,
				v0: y / atlas.height,
				u1: (x + ATLAS_CELL) / atlas.width,
				v1: (y + ATLAS_CELL) / atlas.height
			});
		}

		gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	private drawBackground() {
		const gl = this.gl;
		gl.useProgram(this.backgroundBundle.program);
		gl.uniform2f(this.backgroundUniforms.resolution, this.width, this.height);
		gl.uniform1f(this.backgroundUniforms.dpr, this.dpr);
		gl.uniform3f(this.backgroundUniforms.accent, this.accent.r, this.accent.g, this.accent.b);
		gl.uniform2f(this.backgroundUniforms.cell, CELL_X, CELL_Y);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	private colorFor(value: string) {
		const cached = this.colorCache.get(value);
		if (cached) return cached;

		const parsed = parseColor(value);
		this.colorCache.set(value, parsed);
		return parsed;
	}

	private captureRendererInfo() {
		const gl = this.gl;
		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

		this.rendererInfo = {
			vendor: String(debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
			renderer: String(debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
		};
	}
}

const BACKGROUND_VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
	vec2 positions[3] = vec2[3](
		vec2(-1.0, -1.0),
		vec2(3.0, -1.0),
		vec2(-1.0, 3.0)
	);

	vec2 position = positions[gl_VertexID];
	vUv = position * 0.5 + 0.5;
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BACKGROUND_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec3 uAccent;
uniform vec2 uCell;
out vec4 outColor;

void main() {
	vec2 p = vec2(gl_FragCoord.x / uDpr, uResolution.y - gl_FragCoord.y / uDpr);
	vec3 base = vec3(22.0, 23.0, 19.0) / 255.0;
	vec3 paper = vec3(242.0, 241.0, 236.0) / 255.0;
	float radialDistance = distance(p, vec2(uResolution.x * 0.54, uResolution.y * 0.48));
	float radial = smoothstep(uResolution.x * 0.62, 0.0, radialDistance);
	vec3 color = mix(base, uAccent, radial * 0.11);

	float gridX = mod(p.x + 0.5, uCell.x);
	float gridY = mod(p.y + 0.5, uCell.y);
	float lineX = min(gridX, uCell.x - gridX);
	float lineY = min(gridY, uCell.y - gridY);
	float grid = 1.0 - smoothstep(0.35, 0.85, min(lineX, lineY));
	float gridAlpha = uResolution.x < 640.0 ? 0.008 : 0.017;

	color = mix(color, paper, grid * gridAlpha);
	outColor = vec4(color, 1.0);
}
`;

const GLYPH_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec2 aCenter;
layout(location = 2) in vec2 aSize;
layout(location = 3) in vec4 aUv;
layout(location = 4) in vec4 aColor;

uniform vec2 uResolution;

out vec2 vUv;
out vec4 vColor;

void main() {
	vec2 position = aCenter + aCorner * aSize;
	vec2 clip = position / uResolution * 2.0 - 1.0;

	vUv = mix(aUv.xy, aUv.zw, aCorner + 0.5);
	vColor = aColor;
	gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const GLYPH_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
in vec4 vColor;

uniform sampler2D uAtlas;

out vec4 outColor;

void main() {
	float alpha = texture(uAtlas, vUv).a * vColor.a;
	if (alpha <= 0.002) discard;
	outColor = vec4(vColor.rgb, alpha);
}
`;
