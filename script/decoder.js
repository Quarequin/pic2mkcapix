const clampDelay = (e) => Math.max(10, Number.isFinite(e) ? e : 100),
	readU32 = (e, t) => ((e[t] << 24) | (e[t + 1] << 16) | (e[t + 2] << 8) | e[t + 3]) >>> 0,
	readU16 = (e, t) => e[t] | (e[t + 1] << 8),
	ascii = (e, t, r) => String.fromCharCode(...e.slice(t, t + r));


function readGifRepeat(e) {
	if (e.length < 13) return null;
	let t = 13;
	const r = e[10];
	for (128 & r && (t += 3 * (1 << (1 + (7 & r)))); t < e.length; ) {
		const r = e[t++];
		if (59 === r || 44 === r) break;
		if (33 !== r || t >= e.length) return null;
		const i = [];
		if (255 === e[t++]) {
			if (t >= e.length) return null;
			const r = e[t++];
			if (t + r > e.length) return null;
			const n = ascii(e, t, r);
			for (t += r; t < e.length; ) {
				const r = e[t++];
				if (!r) break;
				if (t + r > e.length) return null;
				(i.push(...e.slice(t, t + r)), (t += r));
			}
			if (
				(n.startsWith("NETSCAPE") || n.startsWith("ANIMEXTS")) &&
				1 === i[0] &&
				i.length >= 3
			)
				return i[1] | (i[2] << 8);
		} else
			for (; t < e.length; ) {
				const r = e[t++];
				if (!r) break;
				t += r;
			}
	}
	return null;
}

function countGifImageDescriptors(e) {
	if (e.length < 13) return 0;
	let t = 13;
	const r = e[10];
	128 & r && (t += 3 * (1 << (1 + (7 & r))));
	let i = 0;
	const n = () => {
		for (; t < e.length; ) {
			const r = e[t++];
			if (!r) return;
			t += r;
		}
	};
	for (; t < e.length; ) {
		const r = e[t++];
		if (59 === r) break;
		if (44 === r) {
			if (t + 9 > e.length) break;
			const r = e[t + 8];
			if (((t += 9), 128 & r && (t += 3 * (1 << (1 + (7 & r)))), t >= e.length)) break;
			((t += 1), n(), (i += 1));
			continue;
		}
		if (33 !== r) break;
		if (t >= e.length) break;
		((t += 1), n());
	}
	return i;
}

function isAnimatedBuffer(e, t) {
	const r = new Uint8Array(e),
		i = String(t || "").toLowerCase();
	// Always treat GIF as an animation source (even 1-frame / static GIFs)
	// so decoding goes through GIFDecoder instead of <img>. Browser <img>
	// + canvas drawImage is unreliable for some static GIFs (local-only
	// color tables, GIF87a, certain disposal/transparency combinations)
	// and produced blank processed output.
	if ("image/gif" === i) return countGifImageDescriptors(r) >= 1;
	if ("image/apng" === i || "image/png" === i) {
		for (let e = 8; e + 12 <= r.length; ) {
			const t = readU32(r, e);
			if ("acTL" === ascii(r, e + 4, 4)) return !0;
			e += t + 12;
		}
		return !1;
	}
	if ("image/webp" === i && "RIFF" === ascii(r, 0, 4) && "WEBP" === ascii(r, 8, 4)) {
		const e = ascii(r, 12, 4);
		return "ANIM" === e || "ANMF" === e || ("VP8X" === e && Boolean(2 & r[20]));
	}
	return "video/webm" === i || "image/jxl" === i;
}

function cloneCanvas(e) {
	const t = document.createElement("canvas");
	return ((t.width = e.width), (t.height = e.height), t.getContext("2d").drawImage(e, 0, 0), t);
}

function imageDataToCanvas(e, t, r) {
	const i = document.createElement("canvas");
	return ((i.width = t), (i.height = r), i.getContext("2d").putImageData(e, 0, 0), i);
}

async function openImageDecoderStream(e, t) {
	if (!("ImageDecoder" in window)) return null;
	const r = "image/apng" === t ? "image/png" : t;
	let i;
	try {
		((i = new ImageDecoder({
			data: e,
			type: r,
		})),
			await i.tracks.ready);
		const t = i.tracks.selectedTrack,
			n = Math.max(0, t?.frameCount || 0),
			a = Number.isFinite(t?.repetitionCount) ? t.repetitionCount : null,
			s = (async function* () {
				try {
					for (let e = 0; e < n; e += 1) {
						const t = (
								await i.decode({
									frameIndex: e,
								})
							).image,
							r = t.displayWidth || t.codedWidth,
							n = t.displayHeight || t.codedHeight,
							a = document.createElement("canvas");
						((a.width = r), (a.height = n));
						const bridgeCtx = a.getContext("2d", { willReadFrequently: true });
						bridgeCtx.drawImage(t, 0, 0, r, n);
						const frameImageData = bridgeCtx.getImageData(0, 0, r, n);
						(yield {
								image: a,
								imageData: frameImageData,
								delay: clampDelay((t.duration || 1e5) / 1e3),
								width: r,
								height: n,
								rect: {
									x: 0,
									y: 0,
									width: r,
									height: n,
								},
								changedOnly: !1,
								composited: !0,
								compositionMode: "replace",
							},
							t.close?.());
					}
				} finally {
					i.close?.();
				}
			})();
		return ((s.repeat = a), (s.frameCount = n), s);
	} catch (e) {
		return (i?.close?.(), null);
	}
}

class GIFDecoder {
	constructor(e) {
		((this.bytes = new Uint8Array(e)),
			(this.pos = 0),
			(this.screen = null),
			(this.width = 0),
			(this.height = 0),
			(this.globalTable = []),
			(this.backgroundIndex = 0),
			(this.delay = 100),
			(this.transparentIndex = -1),
			(this.disposal = 0),
			(this.repeat = null));
	}
	readByte() {
		if (this.pos >= this.bytes.length) throw new Error("Unexpected end of GIF data.");
		return this.bytes[this.pos++];
	}
	readWord() {
		return this.readByte() | (this.readByte() << 8);
	}
	readBytes(e) {
		const t = this.pos + e;
		if (t > this.bytes.length) throw new Error("Invalid GIF block length.");
		const r = this.bytes.subarray(this.pos, t);
		return ((this.pos = t), r);
	}
	readColorTable(e) {
		const t = new Uint8Array(3 * e);
		for (let e = 0; e < t.length; e += 1) t[e] = this.readByte();
		return t;
	}
	clearRect(e, t, r, i, n) {
		const a = Math.max(0, t),
			s = Math.max(0, r),
			o = Math.min(this.width, t + i),
			h = Math.min(this.height, r + n);
		for (let t = s; t < h; t += 1) {
			const r = 4 * (t * this.width + a);
			e.data.fill(0, r, r + 4 * (o - a));
		}
	}
	readExtension() {
		const e = this.readByte();
		if (249 === e) {
			if (4 !== this.readByte()) throw new Error("Invalid GIF graphic control extension.");
			const e = this.readByte();
			((this.disposal = (e >> 2) & 7), (this.delay = Math.max(10, 10 * this.readWord())));
			const t = this.readByte();
			return ((this.transparentIndex = 1 & e ? t : -1), void this.readByte());
		}
		if (255 === e) {
			const e = this.readByte(),
				t = ascii(this.readBytes(e), 0, e),
				r = [];
			let i;
			for (; 0 !== (i = this.readByte()); ) r.push(...this.readBytes(i));
			return void (
				(t.startsWith("NETSCAPE") || t.startsWith("ANIMEXTS")) &&
				1 === r[0] &&
				r.length >= 3 &&
				(this.repeat = r[1] | (r[2] << 8))
			);
		}
		let t;
		for (; 0 !== (t = this.readByte()); ) this.readBytes(t);
	}
	readFrame() {
		const left = this.readWord();
		const top = this.readWord();
		const frameW = this.readWord();
		const frameH = this.readWord();
		const packed = this.readByte();
		const hasLocalTable = Boolean(128 & packed);
		const interlaced = Boolean(64 & packed);
		const localTableSize = 2 ** (1 + (7 & packed));
		const colorTable = hasLocalTable ? this.readColorTable(localTableSize) : this.globalTable;
		if (!colorTable || colorTable.length < 3) {
			throw new Error("GIF frame has no color table (global or local).");
		}
		const minCodeSize = this.readByte();
		const indices = this.readLZWData(minCodeSize, frameW * frameH);
		const prevScreen =
			3 === this.disposal ? new Uint8ClampedArray(this.screen.data) : null;

		let indexAt = 0;
		const passCount = interlaced ? 4 : 1;
		for (let pass = 0; pass < passCount; pass += 1) {
			const rowStep = interlaced ? (pass < 2 ? 8 : 2 === pass ? 4 : 2) : 1;
			const rowStart = interlaced
				? 1 === pass
					? 4
					: 2 === pass
						? 2
						: 3 === pass
							? 1
							: 0
				: 0;
			for (let row = rowStart; row < frameH; row += rowStep) {
				for (let col = 0; col < frameW; col += 1) {
					const colorIndex =
						indexAt < indices.length ? indices[indexAt++] : this.transparentIndex;
					if (colorIndex === this.transparentIndex) continue;
					const tableOffset = 3 * colorIndex;
					if (tableOffset + 2 >= colorTable.length) continue;
					const x = left + col;
					const y = top + row;
					if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
					const pixel = 4 * (y * this.width + x);
					this.screen.data[pixel] = colorTable[tableOffset];
					this.screen.data[pixel + 1] = colorTable[tableOffset + 1];
					this.screen.data[pixel + 2] = colorTable[tableOffset + 2];
					this.screen.data[pixel + 3] = 255;
				}
			}
		}

		// Snapshot BEFORE disposal mutates this.screen.
		const pixels = new Uint8ClampedArray(this.screen.data);
		const imageData = new ImageData(pixels, this.width, this.height);
		const image = imageDataToCanvas(imageData, this.width, this.height);
		const partial =
			0 !== left || 0 !== top || frameW !== this.width || frameH !== this.height;
		const frame = {
			image,
			// Raw buffer so processAnimation can skip drawImage/getImageData
			// (Android WebViews often lose alpha when round-tripping GIF canvases).
			imageData,
			delay: clampDelay(this.delay),
			width: this.width,
			height: this.height,
			rect: { x: left, y: top, width: frameW, height: frameH },
			changedOnly: partial,
			composited: !0,
			compositionMode: partial ? "latest" : "replace",
			disposal: this.disposal,
		};
		if (2 === this.disposal) this.clearRect(this.screen, left, top, frameW, frameH);
		if (3 === this.disposal && prevScreen) this.screen.data.set(prevScreen);
		this.delay = 100;
		this.transparentIndex = -1;
		this.disposal = 0;
		return frame;
	}
	async *stream() {
		this.pos = 0;
		const e = ascii(this.readBytes(6), 0, 6);
		if ("GIF87a" !== e && "GIF89a" !== e) throw new Error("Invalid GIF signature.");
		((this.width = this.readWord()), (this.height = this.readWord()));
		const t = this.readByte(),
			r = Boolean(128 & t),
			i = 2 ** (1 + (7 & t));
		for (
			this.backgroundIndex = this.readByte(),
				this.readByte(),
				this.globalTable = r ? this.readColorTable(i) : [],
				this.screen = new ImageData(this.width, this.height);
			this.pos < this.bytes.length;

		) {
			const e = this.readByte();
			if (59 === e) break;
			if (0 === e) continue; // ข้ามไบต์ว่าง/แพดดิง ป้องกัน Error Unknown GIF block marker
			if (33 !== e) {
				if (44 !== e) throw new Error("Unknown GIF block marker.");
				yield this.readFrame();
			} else this.readExtension();
		}
		if (!this.width || !this.height) throw new Error("GIF contains no image frames.");
	}
	/**
	 * GIF LZW decode — logic aligned with omggif / giflib.
	 * @param {number} minCodeSize LZW minimum code size byte from the image data
	 * @param {number} outputLength expected pixel count (frameW * frameH)
	 * @returns {Uint8Array} palette indices
	 */
	readLZWData(minCodeSize, outputLength) {
		const clearCode = 1 << minCodeSize;
		const eoiCode = clearCode + 1;
		let nextCode = eoiCode + 1;
		let codeSize = minCodeSize + 1;
		let codeMask = (1 << codeSize) - 1;
		let bitBuf = 0;
		let bitCount = 0;
		let blockLeft = 0;
		const codeTable = new Int32Array(4096);
		const output = new Uint8Array(outputLength);
		let outPos = 0;
		let prevCode = null;

		const readByteFromBlocks = () => {
			if (blockLeft === 0) {
				if (this.pos >= this.bytes.length) return -1;
				blockLeft = this.readByte();
				if (blockLeft === 0) return -1;
			}
			blockLeft -= 1;
			return this.readByte();
		};

		while (outPos < outputLength) {
			while (bitCount < 16) {
				const b = readByteFromBlocks();
				if (b < 0) break;
				bitBuf |= b << bitCount;
				bitCount += 8;
			}
			if (bitCount < codeSize) break;

			const code = bitBuf & codeMask;
			bitBuf >>= codeSize;
			bitCount -= codeSize;

			if (code === clearCode) {
				nextCode = eoiCode + 1;
				codeSize = minCodeSize + 1;
				codeMask = (1 << codeSize) - 1;
				prevCode = null;
				continue;
			}
			if (code === eoiCode) break;

			const chaseCode = code < nextCode ? code : prevCode;
			if (chaseCode === null) {
				throw new Error("Invalid GIF LZW stream (code before clear).");
			}

			let chaseLength = 0;
			let chase = chaseCode;
			while (chase > clearCode) {
				chase = codeTable[chase] >> 8;
				chaseLength += 1;
			}
			const firstByte = chase;
			const needExtra = chaseCode !== code ? 1 : 0;
			const end = outPos + chaseLength + 1 + needExtra;
			if (end > outputLength) {
				// Truncate rather than corrupt the rest of the frame.
				break;
			}

			output[outPos++] = firstByte;
			let writeAt = outPos + chaseLength;
			outPos = writeAt;
			if (needExtra) {
				output[outPos++] = firstByte;
			}
			chase = chaseCode;
			while (chaseLength--) {
				const entry = codeTable[chase];
				output[--writeAt] = entry & 0xff;
				chase = entry >> 8;
			}

			if (prevCode !== null && nextCode < 4096) {
				codeTable[nextCode++] = (prevCode << 8) | firstByte;
				if (nextCode >= 1 << codeSize && codeSize < 12) {
					codeSize += 1;
					codeMask = (1 << codeSize) - 1;
				}
			}
			prevCode = code;
		}

		// Finish the image-data sub-block stream (must end with a 0-size block).
		// If we already consumed the 0 terminator via readByteFromBlocks, do nothing.
		if (blockLeft > 0) {
			this.readBytes(blockLeft);
			blockLeft = 0;
			while (this.pos < this.bytes.length) {
				const size = this.readByte();
				if (size === 0) break;
				if (this.pos + size > this.bytes.length) {
					this.pos = this.bytes.length;
					break;
				}
				this.readBytes(size);
			}
		}

		return output;
	}
}

class PNGDecoder {
	constructor(e) {
		((this.bytes = new Uint8Array(e)),
			(this.width = 0),
			(this.height = 0),
			(this.bitDepth = 0),
			(this.colorType = 0),
			(this.palette = []),
			(this.transparency = []),
			(this.playCount = 0),
			(this.frames = []));
	}
	async inflate(e) {
		if (!("DecompressionStream" in window))
			throw new Error("APNG decoding needs browser DecompressionStream support.");
		const t = e.reduce((e, t) => e + t.length, 0),
			r = new Uint8Array(t);
		let i = 0;
		for (const t of e) (r.set(t, i), (i += t.length));
		const n = new Blob([r]).stream().pipeThrough(new DecompressionStream("deflate"));
		return new Uint8Array(await new Response(n).arrayBuffer());
	}
	parseChunks() {
		if (![137, 80, 78, 71, 13, 10, 26, 10].every((e, t) => this.bytes[t] === e))
			throw new Error("Invalid PNG signature.");
		const e = [],
			t = [];
		let r = null;
		for (let i = 8; i + 12 <= this.bytes.length; ) {
			const n = readU32(this.bytes, i),
				a = ascii(this.bytes, i + 4, 4),
				s = this.bytes.subarray(i + 8, i + 8 + n);
			if (((i += n + 12), "IHDR" === a))
				((this.width = readU32(s, 0)),
					(this.height = readU32(s, 4)),
					(this.bitDepth = s[8]),
					(this.colorType = s[9]));
			else if ("acTL" === a) this.playCount = readU32(s, 4);
			else if ("PLTE" === a) this.palette = s;
			else if ("tRNS" === a) this.transparency = s;
			else if ("fcTL" === a)
				(r && t.push(r),
					(r = {
						control: {
							width: readU32(s, 4),
							height: readU32(s, 8),
							x: readU32(s, 12),
							y: readU32(s, 16),
							delayNum: (s[20] << 8) | s[21],
							delayDen: (s[22] << 8) | s[23] || 100,
							dispose: s[24],
							blend: s[25],
						},
						chunks: [],
					}));
			else if ("IDAT" === a) (r ? r.chunks : e).push(s);
			else if ("fdAT" === a && r) r.chunks.push(s.subarray(4));
			else if ("IEND" === a) break;
		}
		return (
			r && t.push(r),
			e.length && t.length && !t[0].chunks.length && (t[0].chunks = e),
			{
				frames: t,
				defaultChunks: e,
			}
		);
	}
	unfilter(e, t, r, i) {
		const n = t * i,
			a = new Uint8Array(n * r);
		let s = 0;
		for (let t = 0; t < r; t += 1) {
			const r = e[s++],
				o = t * n;
			for (let h = 0; h < n; h += 1) {
				const c = e[s++],
					d = h >= i ? a[o + h - i] : 0,
					l = t ? a[o - n + h] : 0,
					f = t && h >= i ? a[o - n + h - i] : 0;
				let u = c;
				if (1 === r) u = c + d;
				else if (2 === r) u = c + l;
				else if (3 === r) u = c + Math.floor((d + l) / 2);
				else if (4 === r) {
					const e = d + l - f,
						t = Math.abs(e - d),
						r = Math.abs(e - l),
						i = Math.abs(e - f);
					u = c + (t <= r && t <= i ? d : r <= i ? l : f);
				}
				a[o + h] = 255 & u;
			}
		}
		return a;
	}
	async decodePixels(e, t, r) {
		if (8 !== this.bitDepth) throw new Error("Only 8-bit PNG/APNG frames are supported.");
		const i = {
			0: 1,
			2: 3,
			3: 1,
			4: 2,
			6: 4,
		}[this.colorType];
		if (!i) throw new Error(`Unsupported PNG color type: ${this.colorType}.`);
		const n = this.unfilter(await this.inflate(e), t, r, i),
			a = new Uint8ClampedArray(t * r * 4);
		for (let e = 0; e < r; e += 1)
			for (let r = 0; r < t; r += 1) {
				const s = (e * t + r) * i,
					o = 4 * (e * t + r);
				let h = 0,
					c = 0,
					d = 0,
					l = 255;
				if (6 === this.colorType)
					((h = n[s]), (c = n[s + 1]), (d = n[s + 2]), (l = n[s + 3]));
				else if (2 === this.colorType) ((h = n[s]), (c = n[s + 1]), (d = n[s + 2]));
				else if (4 === this.colorType) ((h = n[s]), (c = h), (d = h), (l = n[s + 1]));
				else if (0 === this.colorType) h = c = d = n[s];
				else if (3 === this.colorType) {
					const e = 3 * n[s];
					((h = this.palette[e] ?? 0),
						(c = this.palette[e + 1] ?? 0),
						(d = this.palette[e + 2] ?? 0),
						(l = this.transparency[n[s]] ?? 255));
				}
				((a[o] = h), (a[o + 1] = c), (a[o + 2] = d), (a[o + 3] = l));
			}
		return new ImageData(a, t, r);
	}
	async *stream() {
		const e = this.parseChunks();
		if (!e.frames.length) throw new Error("PNG does not contain APNG frame controls.");
		const t = document.createElement("canvas");
		((t.width = this.width), (t.height = this.height));
		const r = t.getContext("2d");
		for (const i of e.frames) {
			const e = i.control,
				n = await this.decodePixels(i.chunks, e.width, e.height),
				a = 2 === e.dispose ? r.getImageData(0, 0, this.width, this.height) : null;
			0 === e.blend && r.clearRect(e.x, e.y, e.width, e.height);
			const s = imageDataToCanvas(n, e.width, e.height);
			r.drawImage(s, e.x, e.y);
			const o = cloneCanvas(t);
			const frameImageData = r.getImageData(0, 0, this.width, this.height);
			((s.width = 0), (s.height = 0));
			const h = 0 !== e.x || 0 !== e.y || e.width !== this.width || e.height !== this.height;
			(yield {
				image: o,
				imageData: frameImageData,
				delay: clampDelay((1e3 * e.delayNum) / e.delayDen),
				width: this.width,
				height: this.height,
				rect: {
					x: e.x,
					y: e.y,
					width: e.width,
					height: e.height,
				},
				changedOnly: h,
				composited: !0,
				compositionMode: 1 === e.blend ? "overlay" : "replace",
				disposal: e.dispose,
			},
				1 === e.dispose
					? r.clearRect(e.x, e.y, e.width, e.height)
					: 2 === e.dispose && a && r.putImageData(a, 0, 0));
		}
	}
	async decode() {
		const e = [];
		for await (const t of this.stream()) e.push(t);
		return ((e.repeat = this.playCount), e);
	}
}

class MediaVideoDecoder {
	constructor(buffer, mimeType) {
		this.buffer = buffer;
		this.mimeType = mimeType || "video/webm";
	}

	/**
	 * Resolve when the seek finished AND the new frame was presented. "seeked" alone can fire
	 * before the frame is paintable, so drawImage grabbed the previous frame (video late vs audio).
	 */
	static waitSeek(video, timeSec) {
		const target = Math.max(0, Number(timeSec) || 0);
		if (
			Number.isFinite(video.currentTime) &&
			Math.abs(video.currentTime - target) < 0.0005 &&
			video.readyState >= 2
		) {
			return Promise.resolve();
		}
		return new Promise((resolve, reject) => {
			let done = false;
			let seeked = false;
			let presented = typeof video.requestVideoFrameCallback !== "function";
			const started = performance.now();
			const cleanup = () => {
				done = true;
				clearInterval(timer);
				video.removeEventListener("seeked", onSeeked);
				video.removeEventListener("error", onError);
			};
			const check = () => {
				if (done || !seeked || !presented) return;
				cleanup();
				resolve();
			};
			const onSeeked = () => {
				seeked = true;
				check();
			};
			const onError = () => {
				if (done) return;
				cleanup();
				reject(new Error("Video frame seek failed."));
			};
			const timer = setInterval(() => {
				const waited = performance.now() - started;
				// Seek finished without events (no-op seek).
				if (waited > 250 && !video.seeking && video.readyState >= 2) seeked = presented = true;
				// Frame callback never came (hidden tab / throttled): stop waiting for it.
				else if (seeked && waited > 400) presented = true;
				check();
				if (waited > 20000 && !done) {
					cleanup();
					reject(new Error("Video frame seek timed out."));
				}
			}, 50);
			video.addEventListener("seeked", onSeeked, { once: true });
			video.addEventListener("error", onError, { once: true });
			if (!presented)
				video.requestVideoFrameCallback(() => {
					presented = true;
					check();
				});
			try {
				video.currentTime = target;
			} catch {
				seeked = presented = true;
				check();
			}
		});
	}

	static drawFrame(video, width, height) {
		const frameCanvas = document.createElement("canvas");
		frameCanvas.width = width;
		frameCanvas.height = height;
		const ctx2d = frameCanvas.getContext("2d", { willReadFrequently: true });
		ctx2d.drawImage(video, 0, 0, width, height);
		const imageData = ctx2d.getImageData(0, 0, width, height);
		// Return both: imageData is the processing source; canvas kept for legacy callers.
		return { image: frameCanvas, imageData };
	}

	/**
	 * Measure source FPS with requestVideoFrameCallback when available.
	 * Falls back to 30 when the browser cannot report frame times.
	 */
	static async detectFps(video) {
		const fallback = 30;
		if (typeof video.requestVideoFrameCallback !== "function") return fallback;
		const times = [];
		try {
			video.currentTime = 0;
			await MediaVideoDecoder.waitSeek(video, 0);
			await video.play();
			await new Promise((resolve) => {
				let safety = setTimeout(resolve, 800);
				const onFrame = (_now, meta) => {
					if (meta && Number.isFinite(meta.mediaTime)) times.push(meta.mediaTime);
					if (times.length >= 12 || (times.length >= 2 && times[times.length - 1] - times[0] >= 0.35)) {
						clearTimeout(safety);
						resolve();
						return;
					}
					video.requestVideoFrameCallback(onFrame);
				};
				video.requestVideoFrameCallback(onFrame);
			});
			video.pause();
		} catch {
			try {
				video.pause();
			} catch {
				/* ignore */
			}
			return fallback;
		}
		try {
			video.currentTime = 0;
		} catch {
			/* ignore */
		}
		if (times.length < 2) return fallback;
		const deltas = [];
		for (let i = 1; i < times.length; i += 1) {
			const d = times[i] - times[i - 1];
			if (d > 0.001 && d < 0.2) deltas.push(d);
		}
		if (!deltas.length) return fallback;
		deltas.sort((a, b) => a - b);
		const median = deltas[Math.floor(deltas.length / 2)];
		const fps = 1 / median;
		if (!Number.isFinite(fps) || fps < 1 || fps > 120) return fallback;
		return Math.round(fps * 1000) / 1000;
	}

	async open() {
		const objectUrl = URL.createObjectURL(
			new Blob([this.buffer], { type: this.mimeType }),
		);
		const video = document.createElement("video");
		video.src = objectUrl;
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		try {
			await new Promise((resolve, reject) => {
				video.addEventListener("loadedmetadata", resolve, { once: true });
				video.addEventListener(
					"error",
					() => reject(new Error("Unable to decode this video container or codec.")),
					{ once: true },
				);
			});
			const width = video.videoWidth || 0;
			const height = video.videoHeight || 0;
			if (!width || !height) throw new Error("Video has no displayable frames.");

			const duration =
				Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
			const fps = await MediaVideoDecoder.detectFps(video);
			// Frame count from source duration × FPS so output length can match.
			const frameCount = duration ? Math.max(1, Math.round(duration * fps)) : 1;
			// Spread frames evenly across the real source duration (root timing base).
			const delayMs = duration ? (duration * 1000) / frameCount : 1000 / fps;

			const stream = (async function* () {
				try {
					video.pause();
					for (let index = 0; index < frameCount; index += 1) {
						// Frame k owns [k*delay, (k+1)*delay): sample its middle so float error at an exact
						// boundary can never pick the previous frame, and output time == source time.
						const stepSec = delayMs / 1000;
						const timeSec = duration
							? Math.min((index + 0.5) * stepSec, Math.max(0, duration - 0.5 * stepSec))
							: 0;
						await MediaVideoDecoder.waitSeek(video, timeSec);
						const drawn = MediaVideoDecoder.drawFrame(video, width, height);
						yield {
							image: drawn.image,
							imageData: drawn.imageData,
							delay: delayMs,
							width,
							height,
							rect: { x: 0, y: 0, width, height },
							changedOnly: false,
							composited: true,
							compositionMode: "replace",
						};
					}
				} finally {
					video.pause();
					video.removeAttribute("src");
					video.load();
					URL.revokeObjectURL(objectUrl);
				}
			})();
			stream.frameCount = frameCount;
			stream.repeat = 0;
			stream.duration = duration;
			stream.fps = fps;
			return stream;
		} catch (error) {
			video.removeAttribute("src");
			video.load();
			URL.revokeObjectURL(objectUrl);
			throw error;
		}
	}

	async decode() {
		const stream = await this.open();
		const frames = [];
		for await (const frame of stream) frames.push(frame);
		frames.repeat = stream.repeat;
		return frames;
	}
}

/**
 * Some Android WebViews draw transparent GIFs to canvas with broken alpha:
 * RGB looks correct but getImageData returns a≈0 for almost every pixel.
 * Quantizer then treats the logo as transparent → blank Canvas Output, while
 * MakeCode may still show a few stray non-zero indices.
 *
 * Magenta-matte: fill #FF00FF, draw the image, treat near-magenta as
 * transparent, force every other pixel fully opaque. Works for black and
 * colored logos; pure magenta is extremely rare in pixel-art assets.
 */
function extractDrawableFromImage(img, mimeType) {
	const width = img.naturalWidth || img.width || 0;
	const height = img.naturalHeight || img.height || 0;
	if (!width || !height) return null;
	const frameCanvas = document.createElement("canvas");
	frameCanvas.width = width;
	frameCanvas.height = height;
	const ctx2d = frameCanvas.getContext("2d", { willReadFrequently: true });
	const isGif = String(mimeType || "").toLowerCase().includes("gif");

	if (isGif) {
		ctx2d.globalCompositeOperation = "copy";
		ctx2d.fillStyle = "#FF00FF";
		ctx2d.fillRect(0, 0, width, height);
		ctx2d.globalCompositeOperation = "source-over";
		ctx2d.drawImage(img, 0, 0);
		const imageData = ctx2d.getImageData(0, 0, width, height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (r >= 240 && b >= 240 && g <= 30) {
				data[i] = 0;
				data[i + 1] = 0;
				data[i + 2] = 0;
				data[i + 3] = 0;
			} else {
				data[i + 3] = 255;
			}
		}
		ctx2d.putImageData(imageData, 0, 0);
	} else {
		ctx2d.clearRect(0, 0, width, height);
		ctx2d.drawImage(img, 0, 0);
		try {
			const imageData = ctx2d.getImageData(0, 0, width, height);
			const data = imageData.data;
			let opaque = 0;
			let colored = 0;
			for (let i = 0; i < data.length; i += 16) {
				if (data[i] | data[i + 1] | data[i + 2]) colored += 1;
				if (data[i + 3] >= 128) opaque += 1;
			}
			if (colored > 8 && opaque < Math.max(4, (colored * 0.15) | 0)) {
				for (let i = 0; i < data.length; i += 4) {
					if ((data[i] | data[i + 1] | data[i + 2]) && data[i + 3] < 128) {
						data[i + 3] = 255;
					}
				}
				ctx2d.putImageData(imageData, 0, 0);
			}
		} catch (_) {
			/* getImageData may throw if tainted */
		}
	}

	let imageData = null;
	try {
		imageData = ctx2d.getImageData(0, 0, width, height);
	} catch (_) {
		imageData = null;
	}
	return { canvas: frameCanvas, width, height, imageData };
}

async function decodeStaticImageToFrame(buffer, mimeType) {
	// Native browser decode for still images (static GIF/PNG/JPEG/…).
	// Prefer HTMLImageElement first — more reliable for static GIF with
	// transparency on mobile WebViews than createImageBitmap.
	const blob = new Blob([buffer], { type: mimeType || "image/png" });
	let extracted = null;

	const url = URL.createObjectURL(blob);
	try {
		const img = new Image();
		img.decoding = "sync";
		img.src = url;
		await new Promise((resolve, reject) => {
			img.onload = resolve;
			img.onerror = () => reject(new Error("Unable to decode static image."));
		});
		if (typeof img.decode === "function") {
			try {
				await img.decode();
			} catch (_) {
				/* decode() optional */
			}
		}
		extracted = extractDrawableFromImage(img, mimeType);
	} catch (imageErr) {
		if (typeof createImageBitmap === "function") {
			try {
				const bitmap = await createImageBitmap(blob);
				extracted = extractDrawableFromImage(bitmap, mimeType);
				bitmap.close?.();
			} catch (_) {
				throw imageErr;
			}
		} else {
			throw imageErr;
		}
	} finally {
		URL.revokeObjectURL(url);
	}

	if (!extracted || !extracted.width || !extracted.height) {
		throw new Error("Static image decoded with zero dimensions.");
	}

	let imageData = extracted.imageData || null;
	if (!imageData && extracted.canvas) {
		try {
			imageData = extracted.canvas
				.getContext("2d", { willReadFrequently: true })
				.getImageData(0, 0, extracted.width, extracted.height);
		} catch (_) {
			imageData = null;
		}
	}

	return {
		image: extracted.canvas,
		imageData,
		delay: 100,
		width: extracted.width,
		height: extracted.height,
		rect: {
			x: 0,
			y: 0,
			width: extracted.width,
			height: extracted.height,
		},
		changedOnly: !1,
		composited: !0,
		compositionMode: "replace",
		disposal: 0,
	};
}

async function decodeJXL(e) {
	return [await decodeStaticImageToFrame(e, "image/jxl")];
}

// Source for decoders that return a ready-made list of frames (still images).
// Every open() decodes the frames again. The load-time inspection and the
// palette scan release each frame they receive (canvas size 0, image null), so
// handing the same frame object to the next consumer produced a blank frame.
function frameArraySource(frameCount, decodeFrames) {
	return {
		frameCount: frameCount,
		repeat: null,
		open: async () => {
			const frames = await decodeFrames();
			return (async function* () {
				for (const frame of frames) yield frame;
			})();
		},
	};
}

async function decodeAnimation(e, t) {
	const r = String(t || "").toLowerCase();
	if ("image/gif" === r) {
		// Root path: every GIF (static or animated) goes through GIFDecoder.
		// Do NOT use browser Image/createImageBitmap here — on Android WebView
		// getImageData after drawImage often returns a≈0 for transparent GIFs
		// (blank Canvas Output). GIFDecoder writes alpha=255 itself per pixel.
		// Each open() builds a fresh decoder so releaseFrame between palette
		// sampling and processAnimation cannot destroy the next pass.
		const bytes = new Uint8Array(e);
		const frameCount = countGifImageDescriptors(bytes);
		const repeat = readGifRepeat(bytes);
		const source = {
			frameCount: Math.max(1, frameCount),
			repeat,
			open: async () => {
				const decoder = new GIFDecoder(e);
				return (async function* () {
					let yielded = 0;
					for await (const frame of decoder.stream()) {
						yielded += 1;
						yield frame;
					}
					source.repeat = decoder.repeat;
					if (!yielded) throw new Error("GIF contains no image frames.");
				})();
			},
		};
		return source;
	}
	if ("image/apng" === r || ("image/png" === r && isAnimatedBuffer(e, r))) {
		const t = new PNGDecoder(e);
		return {
			frameCount: t.parseChunks().frames.length,
			repeat: t.playCount,
			open: async () => new PNGDecoder(e).stream(),
		};
	}
	const i = await openImageDecoderStream(e, r);
	if (i) {
		const t = i.frameCount,
			n = i.repeat;
		return (
			await i.return?.(),
			{
				frameCount: t,
				repeat: n,
				open: async () => openImageDecoderStream(e, r),
			}
		);
	}
	if (r.startsWith("video/")) {
		const decoder = new MediaVideoDecoder(e, r);
		const source = {
			frameCount: null,
			repeat: 0,
			duration: null,
			fps: null,
			open: async () => {
				const stream = await decoder.open();
				// Publish timing back so encode can match source speed.
				if (stream.frameCount) source.frameCount = stream.frameCount;
				if (stream.duration != null) source.duration = stream.duration;
				if (stream.fps) source.fps = stream.fps;
				return stream;
			},
		};
		return source;
	}
	if ("image/jxl" === r) return frameArraySource(1, () => decodeJXL(e));
	if ("image/webp" === r) throw new Error("Animated WebP requires browser ImageDecoder support.");
	throw new Error(`Unsupported animation format: ${t}.`);
}
