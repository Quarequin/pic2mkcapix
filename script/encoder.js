
function writeGifWord(e, t) {
	e.push(255 & t, (t >> 8) & 255);
}

/**
 * Proper GIF LZW encoder (standalone — no browser APIs).
 * Timing of code-size growth matches omggif / giflib:
 * bump width when nextCode already needs more bits, THEN insert the new entry.
 * @param {Uint8Array|number[]} indexPixels - row-major palette indices
 * @param {number} minCodeSize - GIF minimum code size (usually log2(colorTableSize))
 * @returns {number[]} packed LZW bytes (without minCodeSize byte / sub-block framing)
 */
function encodeGifLzw(indexPixels, minCodeSize) {
	const clearCode = 1 << minCodeSize;
	const eoiCode = clearCode + 1;
	let nextCode = eoiCode + 1;
	let codeSize = minCodeSize + 1;
	let table = Object.create(null);

	let bitBuf = 0;
	let bitCount = 0;
	const out = [];
	const emitCode = (code) => {
		bitBuf |= code << bitCount;
		bitCount += codeSize;
		while (bitCount >= 8) {
			out.push(bitBuf & 255);
			bitBuf >>= 8;
			bitCount -= 8;
		}
	};

	if (!indexPixels.length) {
		emitCode(clearCode);
		emitCode(eoiCode);
		if (bitCount) out.push(bitBuf & 255);
		return out;
	}

	let ibCode = indexPixels[0] & 255;
	emitCode(clearCode);

	for (let i = 1; i < indexPixels.length; i += 1) {
		const k = indexPixels[i] & 255;
		const key = (ibCode << 8) | k;
		const existing = table[key];
		if (existing !== undefined) {
			ibCode = existing;
			continue;
		}
		emitCode(ibCode);
		if (nextCode === 4096) {
			emitCode(clearCode);
			nextCode = eoiCode + 1;
			codeSize = minCodeSize + 1;
			table = Object.create(null);
		} else {
			// Grow bit width before inserting when nextCode needs the extra bit.
			if (nextCode >= 1 << codeSize) codeSize += 1;
			table[key] = nextCode;
			nextCode += 1;
		}
		ibCode = k;
	}
	emitCode(ibCode);
	emitCode(eoiCode);
	if (bitCount) out.push(bitBuf & 255);
	return out;
}

function encodeAnimatedGif(e) {
	const t = paletteForOutput().map((c) => ({
		r: c.r,
		g: c.g,
		b: c.b,
		a: c.a,
	}));
	// จำกัดขนาดสีสูงสุดไม่เกิน 256 สีตามมาตรฐาน GIF
	const maxColors = Math.min(256, Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, t.length)))));
	while (t.length < maxColors)
		t.push({ r: 0, g: 0, b: 0, a: 0 });
	if (t.length > 256) t.length = 256;

	const n = Math.max(1, Math.min(8, Math.ceil(Math.log2(t.length)))),
		i = [..."GIF89a"].map((e) => e.charCodeAt(0)),
		transFlag = t[0] && t[0].a === 0 ? 1 : 0;

	writeGifWord(i, e.width);
	writeGifWord(i, e.height);
	i.push(240 | (n - 1), 0, 0);

	for (const color of t) i.push(color.r, color.g, color.b);

	if (null !== e.repeat && undefined !== e.repeat) {
		i.push(33, 255, 11);
		for (const char of "NETSCAPE2.0") i.push(char.charCodeAt(0));
		i.push(3, 1, 255 & e.repeat, (e.repeat >> 8) & 255, 0);
	}

	for (const frame of e.frames) {
		const a = frame.rect || {
				x: 0,
				y: 0,
				width: e.width,
				height: e.height,
			},
			expectedLength = a.width * a.height,
			srcMap = frame.indexMap && frame.indexMap.length === expectedLength 
				? frame.indexMap 
				: new Uint8Array(expectedLength),
			maxIndex = Math.max(0, (1 << n) - 1),
			o = new Uint8Array(srcMap.length),
			r = Math.min(65535, Math.max(1, Math.round((frame.delay || 100) / 10))),
			s = Math.max(0, Math.min(7, 0 | frame.disposal)),
			trans = transFlag;

		for (let p = 0; p < srcMap.length; p += 1) {
			const v = srcMap[p] & 0xffff;
			o[p] = v > maxIndex ? maxIndex : v;
		}

		i.push(33, 249, 4, (s << 2) | trans);
		writeGifWord(i, r);
		i.push(0, 0, 44);
		writeGifWord(i, a.x);
		writeGifWord(i, a.y);
		writeGifWord(i, a.width);
		writeGifWord(i, a.height);
		i.push(0);

		const l = encodeGifLzw(o, n);
		i.push(n);
		for (let idx = 0; idx < l.length; idx += 255) {
			const chunk = l.slice(idx, idx + 255);
			i.push(chunk.length, ...chunk);
		}
		i.push(0);
	}

	i.push(59);
	return new Blob([new Uint8Array(i)], {
		type: "image/gif",
	});
}

function createGifStreamWriter(e) {
	const t = paletteForOutput();
	const maxColors = Math.min(256, Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, t.length)))));
	while (t.length < maxColors)
		t.push({ r: 0, g: 0, b: 0, a: 0 });
	if (t.length > 256) t.length = 256;

	const n = Math.max(1, Math.min(8, Math.ceil(Math.log2(t.length)))),
		i = [..."GIF89a"].map((e) => e.charCodeAt(0));

	writeGifWord(i, e.width);
	writeGifWord(i, e.height);
	i.push(240 | (n - 1), 0, 0);

	for (const color of t) i.push(color.r, color.g, color.b);

	const o = [new Uint8Array(i)];
	if (null !== e.repeat && undefined !== e.repeat) {
		const t = [
			33,
			255,
			11,
			..."NETSCAPE2.0".split("").map((char) => char.charCodeAt(0)),
			3,
			1,
			255 & e.repeat,
			(e.repeat >> 8) & 255,
			0,
		];
		o.push(new Uint8Array(t));
	}

	const maxIndex = Math.max(0, (1 << n) - 1);
	const transparentFlag = t.length && t[0] && t[0].a === 0 ? 1 : 0;

	return {
		add(frame) {
			const a = frame.rect || {
					x: 0,
					y: 0,
					width: e.width,
					height: e.height,
				},
				expectedLength = a.width * a.height,
				srcMap = frame.indexMap && frame.indexMap.length === expectedLength
					? frame.indexMap
					: new Uint8Array(expectedLength),
				pixelBytes = new Uint8Array(srcMap.length);

			for (let p = 0; p < srcMap.length; p += 1) {
				const v = srcMap[p] & 0xffff;
				pixelBytes[p] = v > maxIndex ? maxIndex : v;
			}

			const r = Math.min(65535, Math.max(1, Math.round((frame.delay || 100) / 10))),
				s = [
					33,
					249,
					4,
					(Math.max(0, Math.min(7, 0 | frame.disposal)) << 2) | transparentFlag,
				];

			writeGifWord(s, r);
			s.push(0, 0, 44);
			writeGifWord(s, a.x);
			writeGifWord(s, a.y);
			writeGifWord(s, a.width);
			writeGifWord(s, a.height);
			s.push(0);

			const l = encodeGifLzw(pixelBytes, n);
			s.push(n);
			for (let idx = 0; idx < l.length; idx += 255) {
				const chunk = l.slice(idx, idx + 255);
				s.push(chunk.length, ...chunk);
			}
			s.push(0);
			o.push(new Uint8Array(s));
		},
		finish: () => (
			o.push(new Uint8Array([59])),
			new Blob(o, {
				type: "image/gif",
			})
		),
	};
}

function crc32(e) {
	let t = 4294967295;
	for (const a of e) {
		t ^= a;
		for (let e = 0; e < 8; e += 1) t = (t >>> 1) ^ (3988292384 & -(1 & t));
	}
	return (4294967295 ^ t) >>> 0;
}

function pngChunk(e, t) {
	const a = new Uint8Array([...e].map((e) => e.charCodeAt(0))),
		n = new Uint8Array(a.length + t.length);
	(n.set(a), n.set(t, a.length));
	const i = new Uint8Array(12 + t.length),
		o = new DataView(i.buffer);
	return (o.setUint32(0, t.length), i.set(n, 4), o.setUint32(8 + t.length, crc32(n)), i);
}

function adler32(e) {
	let t = 1,
		a = 0;
	for (const n of e) ((t = (t + n) % 65521), (a = (a + t) % 65521));
	return ((a << 16) | t) >>> 0;
}

function zlibStore(e) {
	const t = [new Uint8Array([120, 1])];
	for (let a = 0; a < e.length || 0 === a; a += 65535) {
		const n = Math.min(e.length, a + 65535),
			i = n - a,
			o = new Uint8Array(5 + i);
		((o[0] = n >= e.length ? 1 : 0), (o[1] = 255 & i), (o[2] = (i >> 8) & 255));
		const r = 65535 & ~i;
		if (
			((o[3] = 255 & r),
			(o[4] = r >> 8),
			o.set(e.subarray(a, n), 5),
			t.push(o),
			n >= e.length)
		)
			break;
	}
	const a = new Uint8Array(4);
	(new DataView(a.buffer).setUint32(0, adler32(e)), t.push(a));
	const n = new Uint8Array(t.reduce((e, t) => e + t.length, 0));
	let i = 0;
	for (const e of t) (n.set(e, i), (i += e.length));
	return n;
}

function pngIndexedFrame(e, t, a) {
	const n = new Uint8Array((t + 1) * a);
	for (let i = 0; i < a; i += 1)
		((n[i * (t + 1)] = 0), n.set(e.subarray(i * t, (i + 1) * t), i * (t + 1) + 1));
	return zlibStore(n);
}

function createApngStreamWriter(e) {
	const t = paletteForOutput(),
		a = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
		n = new Uint8Array(13),
		i = new DataView(n.buffer);
	(i.setUint32(0, e.width),
		i.setUint32(4, e.height),
		(n[8] = 8),
		(n[9] = 3),
		a.push(pngChunk("IHDR", n)));
	const o = new Uint8Array(3 * t.length),
		r = new Uint8Array(t.length);
	(t.forEach((e, t) => {
		((o[3 * t] = e.r), (o[3 * t + 1] = e.g), (o[3 * t + 2] = e.b), (r[t] = e.a));
	}),
		a.push(pngChunk("PLTE", o), pngChunk("tRNS", r)));
	const s = new Uint8Array(8),
		l = new DataView(s.buffer);
	(l.setUint32(0, e.frameCount || 1), l.setUint32(4, e.repeat ?? 0), a.push(pngChunk("acTL", s)));
	let c = 0,
		u = 0;
	return {
		add(t) {
			const n = t.rect || {
					x: 0,
					y: 0,
					width: e.width,
					height: e.height,
				},
				i = new Uint8Array(26),
				o = new DataView(i.buffer);
			(o.setUint32(0, c++),
				o.setUint32(4, n.width),
				o.setUint32(8, n.height),
				o.setUint32(12, n.x),
				o.setUint32(16, n.y));
			const r = Math.max(1, Math.round(t.delay || 100));
			(o.setUint16(20, Math.min(65535, r)),
				o.setUint16(22, 1e3),
				(i[24] = 3 === t.disposal ? 2 : 2 === t.disposal ? 1 : 0),
				(i[25] = t.changedOnly ? 1 : 0),
				a.push(pngChunk("fcTL", i)));
			const s = pngIndexedFrame(
				t.indexMap || new Uint8Array(n.width * n.height),
				n.width,
				n.height,
			);
			if (0 === u) a.push(pngChunk("IDAT", s));
			else {
				const e = new Uint8Array(s.length + 4);
				(new DataView(e.buffer).setUint32(0, c++),
					e.set(s, 4),
					a.push(pngChunk("fdAT", e)));
			}
			u += 1;
		},
		finish: () => (
			a.push(pngChunk("IEND", new Uint8Array(0))),
			new Blob(a, {
				type: "image/apng",
			})
		),
	};
}

/** True for Firefox / Waterfox / other pure-Gecko builds (not Chromium). */
function isGeckoEngine() {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent || "";
	// Brave/Chrome/Edge include "Chrome"; pure Gecko builds do not.
	if (/Chrome\/|Chromium\/|Edg\/|OPR\//i.test(ua)) return false;
	return /Gecko\//i.test(ua) || /(?:Firefox|Waterfox|PaleMoon|Iceweasel|IceCat)\//i.test(ua);
}

function videoMimeCandidates(extension) {
	const gecko = isGeckoEngine();
	// Gecko records WebM/VP8(+Opus) most reliably; VP9/mp4 support varies by build.
	const webm = gecko
		? [
				"video/webm;codecs=vp8,opus",
				"video/webm;codecs=vp8",
				"video/webm;codecs=vp9,opus",
				"video/webm;codecs=vp9",
				"video/webm",
			]
		: [
				"video/webm;codecs=vp9,opus",
				"video/webm;codecs=vp8,opus",
				"video/webm;codecs=vp9",
				"video/webm;codecs=vp8",
				"video/webm",
			];
	return {
		webm,
		mp4: gecko
			? [
					// Most Gecko builds cannot MediaRecorder→mp4; fall back to webm.
					"video/webm;codecs=vp8,opus",
					"video/webm;codecs=vp8",
					"video/webm",
					"video/mp4",
				]
			: [
					"video/mp4;codecs=avc1.42E01E,mp4a.40.2",
					"video/mp4;codecs=avc1.42E01E",
					"video/mp4",
				],
		mkv: gecko
			? ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp8", "video/webm"]
			: ["video/x-matroska", "video/webm"],
		mov: gecko
			? ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp8", "video/webm"]
			: ["video/quicktime", "video/mp4"],
	}[extension] || webm;
}

/**
 * Two-phase video writer (root timing fix):
 *   1) add() only queues processed bitmaps — never records during quantize
 *   2) finish() plays the queue onto a private canvas on an absolute timeline
 *      derived from source duration/FPS, then requestFrame at those instants
 *
 * MediaRecorder always follows wall-clock capture times. Recording while
 * quantize runs makes output slower/longer than the source. Separating the
 * phases removes that coupling on both Gecko and Chromium.
 */
function createRecorderVideoWriter(extension, options = {}) {
	if (typeof MediaRecorder === "undefined")
		throw new Error(`This browser cannot encode ${extension.toUpperCase()} output.`);
	if (typeof canvas.captureStream !== "function")
		throw new Error(`This browser cannot capture canvas frames for ${extension.toUpperCase()} output.`);

	const width = Math.max(1, options.width || canvas.width || 1);
	const height = Math.max(1, options.height || canvas.height || 1);
	const gecko = isGeckoEngine();
	const keepAudio = !!(options.keepAudio && options.audioBuffer && options.audioMime);

	let fps = Number(options.fps) || 0;
	if (!fps && options.duration && options.frameCount)
		fps = options.frameCount / options.duration;
	if (!fps || !Number.isFinite(fps)) fps = 30;
	fps = Math.min(120, Math.max(1, fps));

	const expectedFrames = Math.max(1, Number(options.frameCount) || 1);
	// Prefer exact source duration when known so output length matches origin.
	const sourceDurationMs =
		options.duration && options.duration > 0
			? options.duration * 1000
			: (expectedFrames * 1000) / fps;

	const candidates = videoMimeCandidates(extension);
	let mimeType = candidates.find(
		(type) =>
			type &&
			(typeof MediaRecorder.isTypeSupported !== "function" ||
				MediaRecorder.isTypeSupported(type)),
	);
	if (keepAudio) {
		const withAudio = candidates.find(
			(type) =>
				type &&
				/opus|mp4a/i.test(type) &&
				(typeof MediaRecorder.isTypeSupported !== "function" ||
					MediaRecorder.isTypeSupported(type)),
		);
		if (withAudio) mimeType = withAudio;
	}
	if (!mimeType)
		throw new Error(
			`This browser cannot encode ${extension.toUpperCase()} output (no supported MediaRecorder MIME type).`,
		);

	const queue = [];
	const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

	return {
		async add(_frame) {
			// Compressed snapshot (palette art -> tiny PNG). Nothing waits on the queue,
			// so quantizing can never deadlock and memory stays small.
			queue.push(await canvasToBlob(canvas, "image/png"));
		},

		abort() {
			queue.length = 0;
		},

		finish: async () => {
			if (!queue.length)
				throw new Error(`${extension.toUpperCase()} recording produced no frames.`);

			const frameCount = queue.length;
			// Equal spacing across the whole source duration (not per-frame wall delays).
			const stepMs = sourceDurationMs / frameCount;

			const encodeCanvas = document.createElement("canvas");
			encodeCanvas.width = width;
			encodeCanvas.height = height;
			const encodeCtx = encodeCanvas.getContext("2d", { alpha: true });
			// captureStream(0) + requestFrame: we own every sample instant.
			// Fallback captureStream(fps) if requestFrame is missing (older Gecko).
			const hasRequestFrame =
				typeof MediaStreamTrack.prototype.requestFrame === "function";
			let mediaStream = encodeCanvas.captureStream(hasRequestFrame ? 0 : fps);
			const track = mediaStream.getVideoTracks()[0];

			let audioCtx = null;
			let audioSource = null;
			if (keepAudio) {
				try {
					const pcm = await decodeSourceAudio(options);
					if (pcm) {
						audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
						const dest = audioCtx.createMediaStreamDestination();
						audioSource = audioCtx.createBufferSource();
						audioSource.buffer = pcm;
						audioSource.connect(dest);
						mediaStream = new MediaStream([
							...mediaStream.getVideoTracks(),
							...dest.stream.getAudioTracks(),
						]);
					}
				} catch {
					/* video-only still encodes */
				}
			}

			const chunks = [];
			let recorder;
			const recOpts = { mimeType };
			if (!gecko) recOpts.videoBitsPerSecond = 4e6;
			try {
				recorder = new MediaRecorder(mediaStream, recOpts);
			} catch {
				recorder = new MediaRecorder(mediaStream, {
					mimeType: mimeType.split(";")[0],
				});
			}
			const stopped = new Promise((resolve, reject) => {
				recorder.addEventListener("dataavailable", (event) => {
					if (event.data?.size) chunks.push(event.data);
				});
				recorder.addEventListener("stop", resolve, { once: true });
				recorder.addEventListener(
					"error",
					() => reject(new Error(`${extension.toUpperCase()} recording failed.`)),
					{ once: true },
				);
			});

			// Draw frame 0 before starting so the first captured sample is valid.
			const drawQueued = async (index) => {
				const bitmap = await createImageBitmap(queue[index]);
				encodeCtx.globalCompositeOperation = "copy";
				encodeCtx.drawImage(bitmap, 0, 0, width, height);
				bitmap.close();
				queue[index] = null;
			};
			await drawQueued(0);
			try {
				recorder.start(gecko ? 250 : 100);
			} catch {
				recorder.start();
			}
			// Let the recorder arm before the timeline starts.
			await sleep(gecko ? 50 : 20);

			// Start audio on the audio clock at a known instant and anchor the frame timeline
			// to that same instant (the old play()-then-measure order left audio early by the
			// play() latency).
			let t0 = performance.now();
			if (audioSource) {
				try {
					await audioCtx.resume();
					const when = audioCtx.currentTime + 0.12;
					audioSource.start(when);
					t0 = performance.now() + (when - audioCtx.currentTime) * 1000;
				} catch {
					/* ignore autoplay blocks */
				}
			}
			const waitUntil = async (absMs) => {
				for (;;) {
					const left = absMs - performance.now();
					if (left <= 0) return;
					// rAF keeps us aligned with display; short sleep avoids spin.
					await Promise.race([
						new Promise((r) => requestAnimationFrame(r)),
						sleep(Math.min(left, 12)),
					]);
				}
			};

			for (let i = 0; i < frameCount; i += 1) {
				if (i > 0) await drawQueued(i);
				// Absolute timeline: frame i is emitted at t0 + i*stepMs.
				await waitUntil(t0 + i * stepMs);
				if (hasRequestFrame && track.requestFrame) track.requestFrame();
			}

			// Hold through the full source duration so container length matches.
			await waitUntil(t0 + sourceDurationMs);
			if (hasRequestFrame && track.requestFrame) track.requestFrame();
			await sleep(Math.max(40, stepMs * 0.25));

			if (recorder.state !== "inactive") recorder.stop();
			await stopped;
			mediaStream.getTracks().forEach((t) => t.stop());

			try {
				audioSource?.stop();
			} catch {
				/* not started */
			}
			try {
				await audioCtx?.close();
			} catch {
				/* ignore */
			}

			const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
			if (!blob.size)
				throw new Error(`${extension.toUpperCase()} recording produced an empty file.`);
			return blob;
		},
	};
}

//muxer:begin
function ebmlUint(value) {
	const bytes = [];
	let rest = Math.max(0, Math.floor(value));
	do {
		bytes.unshift(rest % 256);
		rest = Math.floor(rest / 256);
	} while (rest > 0);
	return Uint8Array.from(bytes);
}

function ebmlSize(size) {
	let length = 1;
	while (length < 8 && size >= 2 ** (7 * length) - 1) length += 1;
	const out = new Uint8Array(length);
	let rest = size;
	for (let i = length - 1; i >= 0; i -= 1) {
		out[i] = rest % 256;
		rest = Math.floor(rest / 256);
	}
	out[0] |= 1 << (8 - length);
	return out;
}

function ebmlJoin(parts) {
	let total = 0;
	for (const part of parts) total += part.length;
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

function ebmlElement(id, payload) {
	return ebmlJoin([ebmlUint(id), ebmlSize(payload.length), payload]);
}

/** OpusHead (19 bytes): taken from the encoder when given, otherwise synthesized. */
function opusHead(description, channels, rate) {
	if (description && description.length >= 19 && description[0] === 0x4f) return description;
	const head = new Uint8Array(19);
	head.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64, 1, channels]);
	const view = new DataView(head.buffer);
	view.setUint16(10, 312, true);
	view.setUint32(12, rate, true);
	return head;
}

/**
 * Whole WebM/Matroska file from encoded blocks.
 * blocks: { track: 1 video | 2 audio, us, key, data } ; audio: { head, channels, rate }
 */
function buildWebm({ docType, codecId, width, height, durationMs, frameDurationMs, blocks, audio }) {
	const text = (value) => new TextEncoder().encode(value);
	const float64 = (value) => {
		const bytes = new Uint8Array(8);
		new DataView(bytes.buffer).setFloat64(0, value);
		return bytes;
	};
	const el = ebmlElement;
	const uint = ebmlUint;
	const header = el(0x1a45dfa3, ebmlJoin([
		el(0x4286, uint(1)), el(0x42f7, uint(1)), el(0x42f2, uint(4)), el(0x42f3, uint(8)),
		el(0x4282, text(docType)), el(0x4287, uint(4)), el(0x4285, uint(2)),
	]));
	const info = el(0x1549a966, ebmlJoin([
		el(0x2ad7b1, uint(1000000)), el(0x4489, float64(durationMs)),
		el(0x4d80, text("pic2mkcapix")), el(0x5741, text("pic2mkcapix")),
	]));
	const entries = [el(0xae, ebmlJoin([
		el(0xd7, uint(1)), el(0x73c5, uint(1)), el(0x83, uint(1)), el(0x9c, uint(0)),
		el(0x86, text(codecId)), el(0x23e383, uint(Math.round(frameDurationMs * 1e6))),
		el(0xe0, ebmlJoin([el(0xb0, uint(width)), el(0xba, uint(height))])),
	]))];
	if (audio) {
		const preSkip = new DataView(audio.head.buffer, audio.head.byteOffset).getUint16(10, true);
		entries.push(el(0xae, ebmlJoin([
			el(0xd7, uint(2)), el(0x73c5, uint(2)), el(0x83, uint(2)), el(0x9c, uint(0)),
			el(0x86, text("A_OPUS")), el(0x63a2, audio.head),
			el(0x56aa, uint(Math.round((preSkip / 48000) * 1e9))), el(0x56bb, uint(80000000)),
			el(0xe1, ebmlJoin([el(0xb5, float64(audio.rate)), el(0x9f, uint(audio.channels))])),
		])));
	}
	const tracks = el(0x1654ae6b, ebmlJoin(entries));
	const clusters = [];
	let group = null;
	const closeGroup = () => {
		if (group) clusters.push(el(0x1f43b675, ebmlJoin(group.parts)));
		group = null;
	};
	for (const block of blocks) {
		const time = Math.round(block.us / 1000);
		if (!group || (block.track === 1 && block.key && group.parts.length > 1) || time - group.start > 30000) {
			closeGroup();
			group = { start: time, parts: [el(0xe7, uint(time))] };
		}
		const rel = time - group.start;
		const head = new Uint8Array([0x80 | block.track, (rel >> 8) & 255, rel & 255, block.key ? 0x80 : 0]);
		group.parts.push(el(0xa3, ebmlJoin([head, block.data])));
	}
	closeGroup();
	return ebmlJoin([header, el(0x18538067, ebmlJoin([info, tracks, ...clusters]))]);
}

/**
 * MP4 / MOV (ISO BMFF) file: ftyp + mdat + moov, one chunk per track.
 * tracks: { kind: "vide"|"soun", timescale, samples: [{ data, dts, dur, key }], entry (stsd child box),
 *           width, height }
 */
function buildMp4({ brand, tracks }) {
	const u32 = (v) => {
		const b = new Uint8Array(4);
		new DataView(b.buffer).setUint32(0, v >>> 0);
		return b;
	};
	const u16 = (v) => Uint8Array.from([(v >> 8) & 255, v & 255]);
	const str = (s) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
	const zeros = (n) => new Uint8Array(n);
	const box = (type, ...parts) => {
		const body = ebmlJoin(parts);
		return ebmlJoin([u32(body.length + 8), str(type), body]);
	};
	const full = (type, flags, ...parts) => box(type, u32(flags), ...parts);
	const matrix = ebmlJoin([0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].map(u32));
	const isMov = brand === "qt  ";
	const ftyp = box("ftyp", str(brand), u32(isMov ? 0x200 : 0x200), ...(isMov ? [str("qt  ")] : ["isom", "iso2", "avc1", "mp41"].map(str)));
	let dataBytes = 0;
	for (const t of tracks) for (const s of t.samples) dataBytes += s.data.length;
	const mdat = ebmlJoin([u32(dataBytes + 8), str("mdat"), ...tracks.flatMap((t) => t.samples.map((s) => s.data))]);
	let offset = ftyp.length + 8;
	const movieMs = Math.max(...tracks.map((t) => Math.round((t.samples.reduce((n, s) => n + s.dur, 0) * 1000) / t.timescale)));
	const traks = tracks.map((t, index) => {
		const durTs = t.samples.reduce((n, s) => n + s.dur, 0);
		const trackMs = Math.round((durTs * 1000) / t.timescale);
		const runs = [];
		for (const s of t.samples) {
			const last = runs[runs.length - 1];
			if (last && last[1] === s.dur) last[0] += 1;
			else runs.push([1, s.dur]);
		}
		const keys = [];
		t.samples.forEach((s, i) => s.key && keys.push(i + 1));
		const chunkOffset = offset;
		offset += t.samples.reduce((n, s) => n + s.data.length, 0);
		const stbl = box("stbl",
			full("stsd", 0, u32(1), t.entry),
			full("stts", 0, u32(runs.length), ...runs.flatMap(([c, d]) => [u32(c), u32(d)])),
			...(t.kind === "vide" ? [full("stss", 0, u32(keys.length), ...keys.map(u32))] : []),
			full("stsc", 0, u32(1), u32(1), u32(t.samples.length), u32(1)),
			full("stsz", 0, u32(0), u32(t.samples.length), ...t.samples.map((s) => u32(s.data.length))),
			full("stco", 0, u32(1), u32(chunkOffset)));
		const minf = box("minf",
			t.kind === "vide" ? full("vmhd", 1, zeros(8)) : full("smhd", 0, zeros(4)),
			box("dinf", full("dref", 0, u32(1), full("url ", 1))), stbl);
		return box("trak",
			full("tkhd", 7, u32(0), u32(0), u32(index + 1), u32(0), u32(trackMs), zeros(8), u16(0), u16(0),
				u16(t.kind === "soun" ? 0x100 : 0), u16(0), matrix, u32((t.width || 0) * 65536), u32((t.height || 0) * 65536)),
			box("mdia",
				full("mdhd", 0, u32(0), u32(0), u32(t.timescale), u32(durTs), u16(0x55c4), u16(0)),
				full("hdlr", 0, u32(0), str(t.kind), zeros(12), str(t.kind === "vide" ? "VideoHandler\0" : "SoundHandler\0")),
				minf));
	});
	const moov = box("moov",
		full("mvhd", 0, u32(0), u32(0), u32(1000), u32(movieMs), u32(0x10000), u16(0x100), zeros(10), matrix, zeros(24), u32(tracks.length + 1)),
		...traks);
	return ebmlJoin([ftyp, mdat, moov]);
}

/** stsd child boxes. */
function mp4VideoEntry(width, height, avcC) {
	const u16 = (v) => Uint8Array.from([(v >> 8) & 255, v & 255]);
	const u32 = (v) => Uint8Array.from([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
	const wrap = (type, ...parts) => {
		const body = ebmlJoin(parts);
		return ebmlJoin([u32(body.length + 8), Uint8Array.from([...type].map((c) => c.charCodeAt(0))), body]);
	};
	return wrap("avc1", new Uint8Array(6), u16(1), new Uint8Array(16), u16(width), u16(height),
		u32(0x480000), u32(0x480000), u32(0), u16(1), new Uint8Array(32), u16(0x18), u16(0xffff), wrap("avcC", avcC));
}

function mp4AudioEntry(kind, channels, rate, description) {
	const u16 = (v) => Uint8Array.from([(v >> 8) & 255, v & 255]);
	const u32 = (v) => Uint8Array.from([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
	const wrap = (type, ...parts) => {
		const body = ebmlJoin(parts);
		return ebmlJoin([u32(body.length + 8), Uint8Array.from([...type].map((c) => c.charCodeAt(0))), body]);
	};
	let child;
	if (kind === "aac") {
		const dsi = ebmlJoin([Uint8Array.from([5, description.length]), description]);
		const dcd = ebmlJoin([Uint8Array.from([4, 13 + dsi.length, 0x40, 0x15, 0, 0, 0]), u32(0), u32(0), dsi]);
		const es = ebmlJoin([Uint8Array.from([3, 3 + dcd.length + 3, 0, 0, 0]), dcd, Uint8Array.from([6, 1, 2])]);
		child = wrap("esds", u32(0), es);
	} else {
		const head = opusHead(description, channels, rate);
		const view = new DataView(head.buffer, head.byteOffset);
		child = wrap("dOps", Uint8Array.from([0, head[9]]), u16(view.getUint16(10, true)), u32(view.getUint32(12, true)), u16(view.getInt16(16, true) & 0xffff), Uint8Array.from([head[18]]));
	}
	return wrap(kind === "aac" ? "mp4a" : "Opus", new Uint8Array(6), u16(1), new Uint8Array(8), u16(channels), u16(16), u16(0), u16(0), u32(rate * 65536), child);
}
//muxer:end

/** Decode the source file's audio track (48 kHz). Resolves to null when there is none. */
async function decodeSourceAudio(options) {
	const Context = window.AudioContext || window.webkitAudioContext;
	let context = null;
	try {
		context = new Context({ sampleRate: 48000 });
		return await context.decodeAudioData(options.audioBuffer.slice(0));
	} catch {
		return null;
	} finally {
		try {
			await context?.close();
		} catch {
			/* ignore */
		}
	}
}

async function encodeAudioTrack(pcm, config, limitUs) {
	const rate = 48000;
	const channels = config.numberOfChannels;
	const chunks = [];
	let failure = null;
	let description = null;
	const encoder = new AudioEncoder({
		output: (chunk, meta) => {
			const data = new Uint8Array(chunk.byteLength);
			chunk.copyTo(data);
			const given = meta?.decoderConfig?.description;
			if (given && !description) {
				description = ArrayBuffer.isView(given)
					? new Uint8Array(given.buffer.slice(given.byteOffset, given.byteOffset + given.byteLength))
					: new Uint8Array(given.slice(0));
			}
			chunks.push({ track: 2, us: chunk.timestamp, dur: chunk.duration || 0, key: true, data });
		},
		error: (error) => {
			failure = error;
		},
	});
	encoder.configure(config);
	const total = Math.min(pcm.length, Math.floor((limitUs * rate) / 1e6));
	const step = rate / 2;
	for (let start = 0; start < total; start += step) {
		const count = Math.min(step, total - start);
		const planar = new Float32Array(count * channels);
		for (let c = 0; c < channels; c += 1) {
			const source = pcm.getChannelData(Math.min(c, pcm.numberOfChannels - 1));
			planar.set(source.subarray(start, start + count), c * count);
		}
		const audioData = new AudioData({
			format: "f32-planar",
			sampleRate: rate,
			numberOfFrames: count,
			numberOfChannels: channels,
			timestamp: Math.round((start * 1e6) / rate),
			data: planar,
		});
		encoder.encode(audioData);
		audioData.close();
		while (encoder.encodeQueueSize > 8 && !failure) await new Promise((r) => setTimeout(r, 2));
		if (failure) throw failure;
	}
	await encoder.flush();
	if (failure) throw failure;
	encoder.close();
	for (const chunk of chunks) if (!chunk.dur) chunk.dur = Math.round(((config.codec === "opus" ? 960 : 1024) * 1e6) / rate);
	return { chunks, description, channels, rate };
}

/**
 * Streaming encoder: each processed frame goes straight into WebCodecs with an
 * explicit timestamp - no frame queue, no real-time recording. Only compressed
 * chunks are kept until finish(). Handles webm/mkv (VP9/VP8 + Opus) and mp4/mov
 * (H.264 + AAC/Opus). Resolves to null when this browser/size cannot do it, so the
 * caller can fall back to MediaRecorder.
 */
async function createWebCodecsWriter(extension, options) {
	const isMp4 = extension === "mp4" || extension === "mov";
	const width = Math.max(1, options.width || canvas.width || 1);
	const height = Math.max(1, options.height || canvas.height || 1);
	const encWidth = isMp4 ? width + (width & 1) : width;
	const encHeight = isMp4 ? height + (height & 1) : height;
	let fps = Number(options.fps) || 0;
	if (!fps && options.duration && options.frameCount) fps = options.frameCount / options.duration;
	if (!fps || !Number.isFinite(fps)) fps = 30;
	fps = Math.min(120, Math.max(1, fps));
	const bitrate = Math.round(Math.min(40e6, Math.max(1e6, encWidth * encHeight * fps * 0.6)));
	let config = null;
	const codecs = isMp4
		? ["avc1.640033", "avc1.64002A", "avc1.4d0028", "avc1.42E01F", "avc1.42001E"]
		: ["vp09.00.10.08", "vp8"];
	for (const codec of codecs) {
		const candidate = { codec, width: encWidth, height: encHeight, bitrate, framerate: fps, latencyMode: isMp4 ? "realtime" : "quality" };
		if (isMp4) candidate.avc = { format: "avc" };
		try {
			const support = await VideoEncoder.isConfigSupported(candidate);
			if (support?.supported) {
				config = candidate;
				break;
			}
		} catch {
			/* try next codec */
		}
	}
	if (!config) return null;

	// Audio: decide now so an unsupported audio encoder falls back before any frame is encoded.
	let pcm = null;
	let audioConfig = null;
	if (options.keepAudio && options.audioBuffer) {
		if (typeof AudioEncoder !== "function" || typeof AudioData !== "function") return null;
		pcm = await decodeSourceAudio(options);
		if (pcm) {
			const channels = Math.min(2, pcm.numberOfChannels);
			const base = { sampleRate: 48000, numberOfChannels: channels, bitrate: 128000 };
			const tries = isMp4 ? [{ ...base, codec: "mp4a.40.2", aac: { format: "aac" } }, { ...base, codec: "opus" }] : [{ ...base, codec: "opus" }];
			for (const candidate of tries) {
				try {
					const support = await AudioEncoder.isConfigSupported(candidate);
					if (support?.supported) {
						audioConfig = candidate;
						break;
					}
				} catch {
					/* try next */
				}
			}
			if (!audioConfig) return null;
		}
	}

	const stage = encWidth !== width || encHeight !== height ? Object.assign(document.createElement("canvas"), { width: encWidth, height: encHeight }) : null;
	const blocks = [];
	let avcC = null;
	let failure = null;
	let nextUs = 0;
	let count = 0;
	let lastDelayUs = 0;
	let exactUs = 0;
	const encoder = new VideoEncoder({
		output: (chunk, meta) => {
			const data = new Uint8Array(chunk.byteLength);
			chunk.copyTo(data);
			const given = meta?.decoderConfig?.description;
			if (given && !avcC) avcC = new Uint8Array(ArrayBuffer.isView(given) ? given.buffer.slice(given.byteOffset, given.byteOffset + given.byteLength) : given.slice(0));
			blocks.push({ track: 1, us: chunk.timestamp, key: chunk.type === "key", data });
		},
		error: (error) => {
			failure = error;
		},
	});
	encoder.configure(config);
	const keyInterval = Math.max(1, Math.round(fps * 2));
	return {
		async add(frame) {
			if (failure) throw failure;
			const startUs = Math.round(exactUs);
			exactUs += Math.max(1000, (frame.delay || 1000 / fps) * 1000);
			const delayUs = Math.max(1, Math.round(exactUs) - startUs);
			let source = canvas;
			if (stage) {
				const stageCtx = stage.getContext("2d");
				stageCtx.clearRect(0, 0, encWidth, encHeight);
				stageCtx.drawImage(canvas, 0, 0);
				source = stage;
			}
			const videoFrame = new VideoFrame(source, { timestamp: startUs, duration: delayUs });
			nextUs = startUs + delayUs;
			lastDelayUs = delayUs;
			try {
				encoder.encode(videoFrame, { keyFrame: count % keyInterval === 0 });
			} finally {
				videoFrame.close();
			}
			count += 1;
			while (encoder.encodeQueueSize > 4 && !failure) await new Promise((r) => setTimeout(r, 2));
			if (failure) throw failure;
		},
		async finish() {
			await encoder.flush();
			if (failure) throw failure;
			encoder.close();
			if (!blocks.length) throw new Error(`${extension.toUpperCase()} recording produced no frames.`);
			const audio = pcm && audioConfig ? await encodeAudioTrack(pcm, audioConfig, nextUs) : null;
			if (isMp4) {
				if (!avcC) throw new Error("H.264 encoder did not provide its decoder configuration.");
				const scale = 90000;
				const video = blocks.map((b, i) => {
					const dts = Math.round((b.us * scale) / 1e6);
					const end = Math.round(((i + 1 < blocks.length ? blocks[i + 1].us : b.us + lastDelayUs) * scale) / 1e6);
					return { data: b.data, key: b.key, dts, dur: Math.max(1, end - dts) };
				});
				const tracks = [{ kind: "vide", timescale: scale, samples: video, width: encWidth, height: encHeight, entry: mp4VideoEntry(encWidth, encHeight, avcC) }];
				if (audio) {
					const isAac = audioConfig.codec !== "opus";
					tracks.push({
						kind: "soun",
						timescale: audio.rate,
						samples: audio.chunks.map((c) => ({ data: c.data, key: true, dur: Math.max(1, Math.round((c.dur * audio.rate) / 1e6)) })),
						entry: mp4AudioEntry(isAac ? "aac" : "opus", audio.channels, audio.rate, audio.description),
					});
				}
				const bytes = buildMp4({ brand: extension === "mov" ? "qt  " : "isom", tracks });
				return new Blob([bytes], { type: extension === "mov" ? "video/quicktime" : "video/mp4" });
			}
			const isMkv = extension === "mkv";
			const all = audio ? blocks.concat(audio.chunks) : blocks;
			all.sort((a, b) => a.us - b.us);
			const bytes = buildWebm({
				docType: isMkv ? "matroska" : "webm",
				codecId: config.codec.startsWith("vp09") ? "V_VP9" : "V_VP8",
				width,
				height,
				durationMs: nextUs / 1000,
				frameDurationMs: nextUs / 1000 / count,
				blocks: all,
				audio: audio ? { head: opusHead(audio.description, audio.channels, audio.rate), channels: audio.channels, rate: audio.rate } : null,
			});
			return new Blob([bytes], { type: isMkv ? "video/x-matroska" : "video/webm" });
		},
		abort() {
			try {
				encoder.close();
			} catch {
				/* already closed */
			}
		},
	};
}

/** Streaming WebCodecs path first; MediaRecorder fallback (with a visible note) otherwise. */
function createVideoStreamWriter(extension, options = {}) {
	const eligible =
		["webm", "mkv", "mp4", "mov"].includes(extension) &&
		typeof VideoEncoder === "function" &&
		typeof VideoFrame === "function";
	let impl = null;
	const pick = async () => {
		impl = eligible ? await createWebCodecsWriter(extension, options) : null;
		if (!impl) {
			if (typeof addToSessionLog === "function")
				addToSessionLog("VIDEO", `WebCodecs cannot encode ${extension.toUpperCase()}${options.keepAudio ? " with audio" : ""} here; using the MediaRecorder fallback.`);
			impl = createRecorderVideoWriter(extension, options);
		}
	};
	return {
		async add(frame) {
			if (!impl) await pick();
			return impl.add(frame);
		},
		async finish() {
			if (!impl) await pick();
			return impl.finish();
		},
		abort() {
			impl?.abort?.();
		},
	};
}

function encodeBmpFromCanvas(e) {
	const t = e.width,
		a = e.height,
		n = e
			.getContext("2d", {
				willReadFrequently: !0,
			})
			.getImageData(0, 0, t, a).data,
		i = 4 * Math.ceil((3 * t) / 4),
		o = i * a,
		r = new Uint8Array(54 + o),
		s = new DataView(r.buffer);
	((r[0] = 66),
		(r[1] = 77),
		s.setUint32(2, r.length, !0),
		s.setUint32(10, 54, !0),
		s.setUint32(14, 40, !0),
		s.setInt32(18, t, !0),
		s.setInt32(22, -a, !0),
		s.setUint16(26, 1, !0),
		s.setUint16(28, 24, !0),
		s.setUint32(34, o, !0));
	for (let e = 0; e < a; e += 1)
		for (let a = 0; a < t; a += 1) {
			const o = 4 * (e * t + a),
				s = 54 + e * i + 3 * a;
			((r[s] = n[o + 2]), (r[s + 1] = n[o + 1]), (r[s + 2] = n[o]));
		}
	return new Blob([r], {
		type: "image/bmp",
	});
}

