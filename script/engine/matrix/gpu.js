// GLSL sources use tab indent to match the rest of the project.
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	v_texCoord = a_texCoord;
}
`;

const FRAG_BASE = `
precision highp float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;

vec3 samplePixel() {
	return texture2D(u_image, v_texCoord).rgb;
}

float getAlpha() {
	return texture2D(u_image, v_texCoord).a;
}
`;

const FRAG_SOLID = FRAG_BASE + `
void main() {
	float alpha = getAlpha();
	if (alpha < 0.5) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}
	gl_FragColor = vec4(samplePixel(), 1.0);
}
`;

// Ordered Bayer: factor = matrixSample - 0.5; add factor * spread/255
const FRAG_BAYER = FRAG_BASE + `
uniform sampler2D u_bayerTex;
uniform float u_bayerSize;
uniform float u_spread;

void main() {
	float alpha = getAlpha();
	if (alpha < 0.5) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}
	vec2 px = v_texCoord * u_resolution;
	vec2 bayerUV = mod(px, u_bayerSize) / u_bayerSize;
	float factor = texture2D(u_bayerTex, bayerUV).r - 0.5;
	vec3 col = samplePixel() + factor * u_spread / 255.0;
	col = clamp(col, 0.0, 1.0);
	gl_FragColor = vec4(col, 1.0);
}
`;

// Blue-noise map tiled across the image (same spread convention as Bayer).
const FRAG_BLUE = FRAG_BASE + `
uniform sampler2D u_noise;
uniform float u_spread;
uniform vec2 u_noiseSize;

void main() {
	float alpha = getAlpha();
	if (alpha < 0.5) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}
	vec2 noiseUV = fract(v_texCoord * u_resolution / u_noiseSize);
	float factor = texture2D(u_noise, noiseUV).r - 0.5;
	vec3 col = samplePixel() + factor * u_spread / 255.0;
	col = clamp(col, 0.0, 1.0);
	gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error("Shader compile error: " + log);
	}
	return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
	const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
	const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
	}
	return prog;
}

/** Bayer / blue-noise amplitude used as u_spread (matches Script/WASM). */
const GPU_SPREAD = {
	bayer4: 136,
	bayer8: 152,
	bayer16: 168,
	blue8: 136,
	blue16: 152,
	blue32: 168,
	blue64: 176,
	blue128: 184,
	blue256: 192,
};

class GLEngine {
	static checkWebGL(canvas) {
		try {
			const el = canvas || document.createElement("canvas");
			const opts = {
				premultipliedAlpha: false,
				alpha: true,
				antialias: false,
			};
			return (
				el.getContext("webgl2", opts) ||
				el.getContext("webgl", opts) ||
				el.getContext("experimental-webgl", opts) ||
				null
			);
		} catch {
			return null;
		}
	}

	constructor(sourceCanvas) {
		this._sourceCanvas = sourceCanvas;
		this.canvas = document.createElement("canvas");
		const gl = GLEngine.checkWebGL(this.canvas);
		if (!gl) throw new Error("WebGL not supported");
		this.gl = gl;
		this.programs = {};
		this.textures = {};
		this._initQuad();
	}

	_initQuad() {
		const gl = this.gl;
		const vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);
		this.vbo = vbo;
	}

	_useProgram(prog) {
		const gl = this.gl;
		gl.useProgram(prog);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		const pos = gl.getAttribLocation(prog, "a_position");
		const uv = gl.getAttribLocation(prog, "a_texCoord");
		gl.enableVertexAttribArray(pos);
		gl.enableVertexAttribArray(uv);
		gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 16, 0);
		gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
	}

	_getProgram(mode) {
		if (this.programs[mode]) return this.programs[mode];
		const gl = this.gl;
		let prog;
		if (mode.startsWith("bayer")) {
			prog = createProgram(gl, VERTEX_SHADER, FRAG_BAYER);
		} else if (mode.startsWith("blue")) {
			prog = createProgram(gl, VERTEX_SHADER, FRAG_BLUE);
		} else {
			prog = createProgram(gl, VERTEX_SHADER, FRAG_SOLID);
		}
		this.programs[mode] = prog;
		return prog;
	}

	_uploadImageTexture(pixels, w, h) {
		const gl = this.gl;
		let tex = this.textures.image;
		if (!tex) {
			tex = gl.createTexture();
			this.textures.image = tex;
		}
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		return tex;
	}

	_uploadLumaTex(key, data, size, unit) {
		const gl = this.gl;
		let tex = this.textures[key];
		if (!tex) {
			tex = gl.createTexture();
			this.textures[key] = tex;
		}
		gl.activeTexture(unit);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.LUMINANCE,
			size,
			size,
			0,
			gl.LUMINANCE,
			gl.UNSIGNED_BYTE,
			data,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		return tex;
	}

	_bayerMap(mode) {
		if (mode === "bayer8") return { data: BAYER8_U8, size: 8 };
		if (mode === "bayer16") return { data: BAYER16_U8, size: 16 };
		return { data: BAYER4_U8, size: 4 };
	}

	_blueMap(mode) {
		if (mode === "blue16") return { data: BLUE16_U8, size: 16 };
		if (mode === "blue32") return { data: BLUE32_U8, size: 32 };
		if (mode === "blue64") return { data: BLUE64_U8, size: 64 };
		if (mode === "blue128") return { data: BLUE128_U8, size: 128 };
		if (mode === "blue256") return { data: BLUE256_U8, size: 256 };
		return { data: BLUE8_U8, size: 8 };
	}

	/**
	 * GPU ordered dither → readback → palette quantize (+ 0.6 residual for ordered modes).
	 */
	async render({
		data: pixels,
		w,
		h,
		mode,
		rgbPalette: palette,
		outImgData: outImg,
		onRow,
		hasAlpha,
	}) {
		const gl = this.gl;
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
		}
		const prog = this._getProgram(mode);
		this._useProgram(prog);
		this._uploadImageTexture(pixels, w, h);
		gl.uniform1i(gl.getUniformLocation(prog, "u_image"), 0);
		gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), w, h);

		if (mode.startsWith("bayer")) {
			const map = this._bayerMap(mode);
			this._uploadLumaTex("bayer", map.data, map.size, gl.TEXTURE1);
			gl.uniform1i(gl.getUniformLocation(prog, "u_bayerTex"), 1);
			gl.uniform1f(gl.getUniformLocation(prog, "u_bayerSize"), map.size);
			gl.uniform1f(gl.getUniformLocation(prog, "u_spread"), GPU_SPREAD[mode] || 112);
		} else if (mode.startsWith("blue")) {
			const map = this._blueMap(mode);
			this._uploadLumaTex("noise", map.data, map.size, gl.TEXTURE1);
			gl.uniform1i(gl.getUniformLocation(prog, "u_noise"), 1);
			gl.uniform1f(gl.getUniformLocation(prog, "u_spread"), GPU_SPREAD[mode] || 112);
			gl.uniform2f(gl.getUniformLocation(prog, "u_noiseSize"), map.size, map.size);
		}

		gl.viewport(0, 0, w, h);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		const rgba = new Uint8Array(w * h * 4);
		gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, rgba);

			// WebGL readPixels is bottom-up. The current quad also mirrors the
			// horizontal texture axis, so normalize both axes before output.
			const out = outImg.data;
			for (let y = 0; y < h; y += 1) {
				for (let x = 0; x < w; x += 1) {
					const source = ((h - 1 - y) * w + (w - 1 - x)) * 4;
					const destination = (y * w + x) * 4;
					out[destination] = rgba[source];
					out[destination + 1] = rgba[source + 1];
					out[destination + 2] = rgba[source + 2];
					out[destination + 3] = rgba[source + 3];
				}
			}

		const indexMap = createIndexMap(w * h);
		const chars = CHAR_TABLE;
		const palLen = palette.length;
		const ordered = mode.startsWith("bayer") || mode.startsWith("blue");
		const needText = typeof onRow === "function";
		const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
		const colorCache = new Map();
		const rowBatch = Math.max(64, Math.ceil(h / 8));
		let pendingRow = null;

		for (let y = 0; y < h; y += 1) {
			let line = needText ? "" : null;
			const rowStart = y * w;
			let resR = 0,
				resG = 0,
				resB = 0;
			for (let x = 0; x < w; x += 1) {
				const i = rowStart + x;
				const o = i << 2;
				if (out[o + 3] < 128) {
					indexMap[i] = 0;
					if (needText) line += chars[0];
					out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
					resR = resG = resB = 0;
					continue;
				}
				const r = ordered ? clamp8(out[o] + resR) : out[o];
				const g = ordered ? clamp8(out[o + 1] + resG) : out[o + 1];
				const b = ordered ? clamp8(out[o + 2] + resB) : out[o + 2];
				const key = ((255 & r) << 16) | ((255 & g) << 8) | (255 & b);
				let best = colorCache.get(key);
				if (best === undefined) {
					best = 1;
					let bestD = Infinity;
					for (let p = 1; p < palLen; p += 1) {
						const c = palette[p];
						if ((c.a ?? 255) < 128) continue;
						const rmean = (r + c.r) >> 1;
						const dr = r - c.r,
							dg = g - c.g,
							db = b - c.b;
						const d =
							(((512 + rmean) * dr * dr) >> 8) +
							4 * dg * dg +
							(((767 - rmean) * db * db) >> 8);
						if (d < bestD) {
							bestD = d;
							best = p;
							if (d === 0) break;
						}
					}
					if (colorCache.size >= 262144) colorCache.clear();
					colorCache.set(key, best);
				}
				indexMap[i] = best;
				if (needText) line += chars[best];
				const c = palette[best];
				if (ordered) {
					resR = 0.85 * (r - c.r);
					resG = 0.85 * (g - c.g);
					resB = 0.85 * (b - c.b);
				}
				out[o] = c.r;
				out[o + 1] = c.g;
				out[o + 2] = c.b;
				out[o + 3] = hasAlpha && c.a !== undefined ? c.a : 255;
			}
			if (needText) {
				pendingRow = onRow(y, line, indexMap.subarray(rowStart, rowStart + w));
				if ((y + 1) % rowBatch === 0) {
					await pendingRow;
					pendingRow = null;
				}
			}
		}
		if (pendingRow) await pendingRow;

		return {
			hexString: "",
			indexMap,
		};
	}
}

let sharedGLEngine = null;
let sharedGPUCanvas = null;

async function runGLPipeline({
	canvas,
	data,
	w,
	h,
	mode,
	rgbPalette,
	outImgData,
	onProgress,
	onRow,
	hasAlpha,
	yieldFrames = true,
}) {
	throwIfStopRequested();
	if (!sharedGLEngine) {
		sharedGPUCanvas = document.createElement("canvas");
		sharedGLEngine = new GLEngine(sharedGPUCanvas);
	}
	if (onProgress) {
		onProgress("25.0000");
		if (yieldFrames) await new Promise((r) => requestAnimationFrame(r));
		onProgress("50.0000");
		if (yieldFrames) await new Promise((r) => requestAnimationFrame(r));
	}
	const result = await sharedGLEngine.render({
		data,
		w,
		h,
		mode,
		rgbPalette,
		outImgData,
		onRow,
		hasAlpha,
	});
	if (onProgress) onProgress("100.0000");
	return result;
}
