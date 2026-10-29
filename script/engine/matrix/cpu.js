const clamp = (t) => (t < 0 ? 0 : t > 255 ? 255 : t),
	COLOR_CACHE_LIMIT = 262144;

function createIndexMap(length) {
	return rgbPalette.length <= 256 ? new Uint8Array(length) : new Uint16Array(length);
}

/**
 * sRGB (0..255) ↔ linear light. Error diffusion in linear space keeps local
 * average colour closer to the original 24-bit sample (true-colour fidelity).
 */
function srgb8ToLinear(c) {
	const s = c / 255;
	return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function linearToSrgb8(v) {
	const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
	return clamp((c * 255 + 0.5) | 0);
}

/**
 * Redmean perceptual distance (Compuphase). Stronger true-colour match than
 * fixed 2/4/3 weights — used by every dither path (ordered + FS + solid).
 */
function colorDistanceSq(red, green, blue, color) {
	const rmean = (red + color.r) >> 1;
	const dr = red - color.r;
	const dg = green - color.g;
	const db = blue - color.b;
	return (((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8);
}

/** Ordered-dither residual carry: keep more quantisation error in-row so the
 * spatial average stays nearer the original 24-bit sample (was 0.6). */
const ORDERED_RESIDUAL = 0.85;

function findNearestColor(red, green, blue, palette) {
	let bestDistance = Infinity;
	let bestIndex = 1;
	for (let index = 1; index < palette.length; index += 1) {
		const color = palette[index];
		if ((color.a ?? 255) < 128) continue;
		const distance = colorDistanceSq(red, green, blue, color);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestIndex = index;
			if (distance === 0) break;
		}
	}
	return bestIndex;
}

function cachedFindNearest(red, green, blue, palette, cache) {
	const key = ((255 & red) << 16) | ((255 & green) << 8) | (255 & blue);
	let index = cache.get(key);
	if (index === undefined) {
		index = findNearestColor(red, green, blue, palette);
		if (cache.size >= COLOR_CACHE_LIMIT) cache.clear();
		cache.set(key, index);
	}
	return index;
}

const ASCII_CHARSETS = {
	standard: [" ", "·", "░", "▒", "▓", "█", "■", "▪", "●", "#", "@"],
	block: [" ", "·", "░", "▒", "▓", "█"],
	alphanumeric: [" ", ".", ":", "i", "l", "c", "o", "v", "x", "X", "M", "W", "#", "&", "@"],
	minimal: [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"],
	dense: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$".split(""),
};

function makeAsciiLumaTable(palette) {
	const table = new Float32Array(palette.length);
	for (let index = 1; index < palette.length; index += 1) {
		const color = palette[index];
		table[index] = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
	}
	return table;
}

function buildAsciiLine(asciiRow, imageWidth, imageHeight, indexMap, palette, charsetName, asciiColumns, lumaTable) {
	const charset = ASCII_CHARSETS[charsetName] || ASCII_CHARSETS.standard;
	const lastChar = charset.length - 1;
	const columns = Math.max(1, Math.min(asciiColumns, imageWidth));
	const sampleWidth = imageWidth / columns;
	const sampleHeight = 2 * sampleWidth;
	const luma = lumaTable || makeAsciiLumaTable(palette);
	let line = "";
	for (let column = 0; column < columns; column += 1) {
		const x0 = (column * sampleWidth) | 0;
		const y0 = (asciiRow * sampleHeight) | 0;
		const x1 = Math.min(imageWidth, Math.ceil((column + 1) * sampleWidth));
		const y1 = Math.min(imageHeight, Math.ceil((asciiRow + 1) * sampleHeight));
		let lumaSum = 0;
		let sampleCount = 0;
		let hasOpaque = false;
		for (let y = y0; y < y1; y += 1) {
			const rowOffset = y * imageWidth;
			for (let x = x0; x < x1; x += 1) {
				const paletteIndex = indexMap[rowOffset + x];
				if (paletteIndex) {
					lumaSum += luma[paletteIndex];
					hasOpaque = true;
				}
				sampleCount += 1;
			}
		}
		line += hasOpaque
			? charset[Math.round((lumaSum / sampleCount / 255) * lastChar)]
			: " ";
	}
	return line;
}

function buildRowString(row, width, indexMap, outputPixels, palette, charTable, hasAlpha) {
	const rowStart = row * width;
	let line = "";
	for (let x = 0; x < width; x += 1) {
		const pixelIndex = rowStart + x;
		const paletteIndex = indexMap[pixelIndex];
		line += charTable[paletteIndex];
		const byteOffset = pixelIndex << 2;
		const color = palette[paletteIndex];
		if (!color) {
			outputPixels[byteOffset] = 0;
			outputPixels[byteOffset + 1] = 0;
			outputPixels[byteOffset + 2] = 0;
			outputPixels[byteOffset + 3] = 0;
			continue;
		}
		if (hasAlpha && color.a === 0) {
			outputPixels[byteOffset] = 0;
			outputPixels[byteOffset + 1] = 0;
			outputPixels[byteOffset + 2] = 0;
			outputPixels[byteOffset + 3] = 0;
			continue;
		}
		outputPixels[byteOffset] = color.r;
		outputPixels[byteOffset + 1] = color.g;
		outputPixels[byteOffset + 2] = color.b;
		outputPixels[byteOffset + 3] =
			hasAlpha && color.a !== undefined ? color.a : 255;
	}
	return line;
}

/**
 * Ordered dither (Bayer / Blue-noise) with a light residual carry.
 * Progress / onRow are batched so typical frames stay under a few seconds.
 */
async function modeDither(
	sourceData,
	width,
	height,
	palette,
	outputPixels,
	onProgress,
	charTable,
	progressStep,
	matrix,
	matrixSize,
	matrixDivisor,
	amplitude,
	onRow,
	hasAlpha,
) {
	const indexMap = createIndexMap(width * height);
	const colorCache = new Map();
	const useMatrix = matrix !== null;
	const matrixMask = matrixSize - 1;
	const inverseDivisor = 1 / matrixDivisor;
	const needText = typeof onRow === "function";
	// Fast path: few UI ticks (≤4) so progress awaits do not dominate sub-2s frames.
	const uiStride = Math.max(progressStep, Math.ceil(height / 4), 1);
	const rowBatch = Math.max(64, Math.ceil(height / 8));
	let hexString = "";
	let pendingRow = null;

	for (let y = 0; y < height; y += 1) {
		const rowStart = y * width;
		const matrixRow = (y & matrixMask) * matrixSize;
		let residualR = 0;
		let residualG = 0;
		let residualB = 0;

		for (let x = 0; x < width; x += 1) {
			const pixelIndex = rowStart + x;
			const byteOffset = pixelIndex << 2;
			if (sourceData[byteOffset + 3] < 128) {
				if (useMatrix) residualR = residualG = residualB = 0;
				continue;
			}

			let red = sourceData[byteOffset];
			let green = sourceData[byteOffset + 1];
			let blue = sourceData[byteOffset + 2];

			if (useMatrix) {
				// Match WebGL: factor = matrix/levels - 0.5; delta = factor * amplitude
				const threshold =
					(matrix[matrixRow + (x & matrixMask)] * inverseDivisor - 0.5) * amplitude;
				red = clamp(red + residualR + threshold);
				green = clamp(green + residualG + threshold);
				blue = clamp(blue + residualB + threshold);
			}

			const selected = cachedFindNearest(red, green, blue, palette, colorCache);
			indexMap[pixelIndex] = selected;

			if (useMatrix) {
				const color = palette[selected];
				residualR = ORDERED_RESIDUAL * (red - color.r);
				residualG = ORDERED_RESIDUAL * (green - color.g);
				residualB = ORDERED_RESIDUAL * (blue - color.b);
			}
		}

		if (needText) {
			const line = buildRowString(
				y,
				width,
				indexMap,
				outputPixels,
				palette,
				charTable,
				hasAlpha,
			);
			pendingRow = onRow(y, line, indexMap.subarray(rowStart, rowStart + width));
			if ((y + 1) % rowBatch === 0) {
				await pendingRow;
				pendingRow = null;
			}
		} else if (outputPixels) {
			// Write palette RGBA into out buffer without building text lines.
			for (let x = 0; x < width; x += 1) {
				const pixelIndex = rowStart + x;
				const byteOffset = pixelIndex << 2;
				const color = palette[indexMap[pixelIndex]];
				if (!color || (hasAlpha && (color.a ?? 255) < 128) || (sourceData && sourceData[byteOffset + 3] < 128)) {
					outputPixels[byteOffset] = 0;
					outputPixels[byteOffset + 1] = 0;
					outputPixels[byteOffset + 2] = 0;
					outputPixels[byteOffset + 3] = 0;
					continue;
				}
				outputPixels[byteOffset] = color.r;
				outputPixels[byteOffset + 1] = color.g;
				outputPixels[byteOffset + 2] = color.b;
				outputPixels[byteOffset + 3] = hasAlpha && color.a !== undefined ? color.a : 255;
			}
		}
		if ((y + 1) % uiStride === 0 || y === height - 1) {
			if (pendingRow) {
				await pendingRow;
				pendingRow = null;
			}
			await onProgress(((100 * (y + 1)) / height).toFixed(2));
		}
	}
	if (pendingRow) await pendingRow;

	return {
		hexString: "",
		indexMap,
	};
}

/**
 * Floyd–Steinberg, serpentine, in linear light.
 * Diffuse quantisation error in linear space so neighbourhood averages track
 * the original 24-bit sample; nearest lookup still uses Redmean in sRGB.
 */
async function modeFloydSteinberg(
	sourceData,
	width,
	height,
	palette,
	outputPixels,
	onProgress,
	charTable,
	progressStep,
	onRow,
	hasAlpha,
) {
	const indexMap = createIndexMap(width * height);
	const pixelCount = width * height;
	// working holds linear RGB for opaque pixels; alpha channel stays sRGB byte.
	const working = new Float32Array(pixelCount * 4);
	for (let i = 0; i < pixelCount; i += 1) {
		const o = i << 2;
		working[o] = srgb8ToLinear(sourceData[o]);
		working[o + 1] = srgb8ToLinear(sourceData[o + 1]);
		working[o + 2] = srgb8ToLinear(sourceData[o + 2]);
		working[o + 3] = sourceData[o + 3];
	}
	const paletteLinear = palette.map((c) =>
		c
			? {
					r: srgb8ToLinear(c.r),
					g: srgb8ToLinear(c.g),
					b: srgb8ToLinear(c.b),
					a: c.a,
				}
			: c,
	);
	const colorCache = new Map();
	const needText = typeof onRow === "function";
	const uiStride = Math.max(progressStep, Math.ceil(height / 4), 1);
	const rowBatch = Math.max(64, Math.ceil(height / 8));
	let hexString = "";
	let pendingRow = null;

	const diffuse = (wx, wy, errR, errG, errB, w) => {
		if (wx < 0 || wx >= width || wy < 0 || wy >= height) return;
		const o = (wy * width + wx) << 2;
		if (working[o + 3] < 128) return;
		working[o] += w * errR;
		working[o + 1] += w * errG;
		working[o + 2] += w * errB;
	};

	for (let y = 0; y < height; y += 1) {
		const rowStart = y * width;
		const leftToRight = (y & 1) === 0;
		const xStart = leftToRight ? 0 : width - 1;
		const xEnd = leftToRight ? width : -1;
		const xStep = leftToRight ? 1 : -1;

		for (let x = xStart; x !== xEnd; x += xStep) {
			const pixelIndex = rowStart + x;
			const byteOffset = pixelIndex << 2;
			if (working[byteOffset + 3] < 128) continue;

			const linR = working[byteOffset];
			const linG = working[byteOffset + 1];
			const linB = working[byteOffset + 2];
			const red = linearToSrgb8(linR);
			const green = linearToSrgb8(linG);
			const blue = linearToSrgb8(linB);
			const selected = cachedFindNearest(red, green, blue, palette, colorCache);
			indexMap[pixelIndex] = selected;

			const pl = paletteLinear[selected];
			const errR = linR - pl.r;
			const errG = linG - pl.g;
			const errB = linB - pl.b;

			// Classic FS weights in linear space: 7/16, 3/16, 5/16, 1/16
			const ahead = leftToRight ? 1 : -1;
			diffuse(x + ahead, y, errR, errG, errB, 0.4375);
			diffuse(x - ahead, y + 1, errR, errG, errB, 0.1875);
			diffuse(x, y + 1, errR, errG, errB, 0.3125);
			diffuse(x + ahead, y + 1, errR, errG, errB, 0.0625);
		}

		if (needText) {
			const line = buildRowString(
				y,
				width,
				indexMap,
				outputPixels,
				palette,
				charTable,
				hasAlpha,
			);
			pendingRow = onRow(y, line, indexMap.subarray(rowStart, rowStart + width));
			if ((y + 1) % rowBatch === 0) {
				await pendingRow;
				pendingRow = null;
			}
		} else if (outputPixels) {
			for (let x = 0; x < width; x += 1) {
				const pixelIndex = rowStart + x;
				const byteOffset = pixelIndex << 2;
				const color = palette[indexMap[pixelIndex]];
				if (!color || working[byteOffset + 3] < 128) {
					outputPixels[byteOffset] = 0;
					outputPixels[byteOffset + 1] = 0;
					outputPixels[byteOffset + 2] = 0;
					outputPixels[byteOffset + 3] = 0;
					continue;
				}
				outputPixels[byteOffset] = color.r;
				outputPixels[byteOffset + 1] = color.g;
				outputPixels[byteOffset + 2] = color.b;
				outputPixels[byteOffset + 3] = hasAlpha && color.a !== undefined ? color.a : 255;
			}
		}
		if ((y + 1) % uiStride === 0 || y === height - 1) {
			if (pendingRow) {
				await pendingRow;
				pendingRow = null;
			}
			await onProgress(((100 * (y + 1)) / height).toFixed(2));
		}
	}
	if (pendingRow) await pendingRow;

	return {
		hexString: "",
		indexMap,
	};
}

const DITHER_MODES = {
	// Aligned with WebGL u_spread: threshold = (matrix / levels - 0.5) * amplitude
	// Bayer levels = n² (16/64/256). Residual = ORDERED_RESIDUAL (0.85).
	// Amplitudes tuned so ordered patterns reconstruct intermediate 24-bit tones.
	bayer4: [BAYER4, 4, 16, 136],
	bayer8: [BAYER8, 8, 64, 152],
	bayer16: [BAYER16, 16, 256, 168],
	blue8: [BLUE8, 8, 255, 136],
	blue16: [BLUE16, 16, 255, 152],
	blue32: [BLUE32, 32, 255, 168],
	blue64: [BLUE64, 64, 255, 176],
	blue128: [BLUE128, 128, 255, 184],
	blue256: [BLUE256, 256, 255, 192],
};

async function runTileCore({
	data,
	w: width,
	h: height,
	mode,
	rgbPalette: palette,
	outImgData,
	onProgress,
	onRow,
	hasAlpha,
}) {
	throwIfStopRequested();
	const outputPixels = outImgData.data;
	const charTable = CHAR_TABLE;
	const progressStep = (1 + Math.sqrt(height + width) * (height / width)) | 0;
	const orderedMode = DITHER_MODES[mode];
	if (orderedMode) {
		return modeDither(
			data,
			width,
			height,
			palette,
			outputPixels,
			onProgress,
			charTable,
			progressStep,
			orderedMode[0],
			orderedMode[1],
			orderedMode[2],
			orderedMode[3],
			onRow,
			hasAlpha,
		);
	}
	if (mode === "error") {
		return modeFloydSteinberg(
			data,
			width,
			height,
			palette,
			outputPixels,
			onProgress,
			charTable,
			progressStep,
			onRow,
			hasAlpha,
		);
	}
	// Solid quantize (no dither matrix).
	return modeDither(
		data,
		width,
		height,
		palette,
		outputPixels,
		onProgress,
		charTable,
		progressStep,
		null,
		1,
		1,
		0,
		onRow,
		hasAlpha,
	);
}

function renderTileSize(width, height) {
	const value = renderSelect.value;
	if (value === "auto-tiled") {
		const exponent = Math.max(3, Math.min(10, Math.ceil(Math.log2(Math.max(width, height) / 4))));
		return 2 ** exponent;
	}
	if (value === "custom-tiled") {
		const exponent = Math.max(3, Math.min(12, Number.parseInt(renderTilePowerInput.value, 10) || 7));
		return 2 ** exponent;
	}
	if (value === "8x8tiled") return 8;
	if (value === "16x16tiled") return 16;
	if (value === "32x32tiled") return 32;
	if (value === "64x64tiled") return 64;
	if (value === "128x128tiled") return 128;
	if (value === "256x256tiled") return 256;
	return Math.max(width, height);
}

function createDitheringBuffer(data) {
	return new Uint8ClampedArray(data);
}

const WASM_PIPELINE_BASE64 = "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IDNqIjQgNCgCACAQQQVswUEQbcFqNgIAICEgM2oiMyAzKAIAIAhBBWzBQRBtwWo2AgAgMg0AIBogMUEMbCIxaiIyIDIoAgAgCcFBEG3BajYCACAiIDFqIgkgCSgCACAQwUEQbcFqNgIAICEgMWoiCSAJKAIAIAjBQRBtwWo2AgALIB4gIGoiHiAfRw0ACwtBACAcIB0bIRhBACEJIBkgBEYNAgwACwtBAiEJCyAJCwuoGgEAQYAIC6AaAAAIAAIACgAMAAQADgAGAAMACwABAAkADwAHAA0ABQAAACAACAAoAAIAIgAKACoAMAAQADgAGAAyABIAOgAaAAwALAAEACQADgAuAAYAJgA8ABwANAAUAD4AHgA2ABYAAwAjAAsAKwABACEACQApADMAEwA7ABsAMQARADkAGQAPAC8ABwAnAA0ALQAFACUAPwAfADcAFwA9AB0ANQAVAAAAgAAgAKAACACIACgAqAACAIIAIgCiAAoAigAqAKoAwABAAOAAYADIAEgA6ABoAMIAQgDiAGIAygBKAOoAagAwALAAEACQADgAuAAYAJgAMgCyABIAkgA6ALoAGgCaAPAAcADQAFAA+AB4ANgAWADyAHIA0gBSAPoAegDaAFoADACMACwArAAEAIQAJACkAA4AjgAuAK4ABgCGACYApgDMAEwA7ABsAMQARADkAGQAzgBOAO4AbgDGAEYA5gBmADwAvAAcAJwANAC0ABQAlAA+AL4AHgCeADYAtgAWAJYA/AB8ANwAXAD0AHQA1ABUAP4AfgDeAF4A9gB2ANYAVgADAIMAIwCjAAsAiwArAKsAAQCBACEAoQAJAIkAKQCpAMMAQwDjAGMAywBLAOsAawDBAEEA4QBhAMkASQDpAGkAMwCzABMAkwA7ALsAGwCbADEAsQARAJEAOQC5ABkAmQDzAHMA0wBTAPsAewDbAFsA8QBxANEAUQD5AHkA2QBZAA8AjwAvAK8ABwCHACcApwANAI0ALQCtAAUAhQAlAKUAzwBPAO8AbwDHAEcA5wBnAM0ATQDtAG0AxQBFAOUAZQA/AL8AHwCfADcAtwAXAJcAPQC9AB0AnQA1ALUAFQCVAP8AfwDfAF8A9wB3ANcAVwD9AH0A3QBdAPUAdQDVAFUAjQC6AJUANABlALYAiQBpAKoAcQDOABQA8gCZAMoA9gBAAN4AUAAgAHUADABZACgAEAAwAKEA0gCyADwAGAAAAOYAXQD6AJEASADqAL4AbQA4AAQAeQDGAJ0AfQAkANYARAAIACwArgCFAP8AVQAcAOIAYQDuAEwA2gCBAMIApQDjAI0AgQDsAKAAhgBHAB4AogDrAGMA0QBsAMAAXgCbAE4AvgCZADUAVgDgALIAlABdACoAtwCQABoASQAKACkAiwADAPgAcwDIAA0APwD5AKoAfgDVADgApgDoAHYAzAA7ANwArABwACEAmgD1AFgAwwAOADAAaAC5AAYAlgBQAIMA8QBgABUAtABGAIkAFgDtAFQAJgDKAAEAQwDeAHoA/AAuAKQAgAD/AGsANAC/AI8A2gALAJ4AWwCwACgAzwARAG4ASgDpAC0AxgAZAHgAPAD3AGUAHQCGADIA8ACoAFIAxQAFALsAnwBNANQAIwCtAAgAcgBFAOIAkwATAF4A6gCIADoAtQAOAFwA+gAsANMAhAA2AMEADABWAN8AaQAxAKsAbQAcAPMAfQBEAJwABAC2AGEAJAD+AJcAQADYAL0AHwDuAFMApwAvAM4AdAD0ABEAkgBPAMcAKgB1AOYAAgChAGQAEwCMAN0AOQC5AGYASADXAAoAfwD9AFkAsgBLANAAKwD7AG8ABgCjACIAvACBAD0A7wAYAKUANwDEAJEAGwB8AF8A5gCYAFEA9gAPAHEAMACvAMwAJQCOAAkA2wBCAMIAEgBMAIcAFwBqAOcAMwC3AAcAeQD3AGcA1gA+AKkAAACVANIAVwDJACcAqABiACEAngAUAOQAjQC4AJoAtQAqABQATwAiAG0AEgBfAIcAvgBUAMoAgAC+AEQAIgABABcAVADtAEYA4QCQAO0ApQAxAGYA7QBtALoARgAJAHQA3AD4AKMA/QCTANQANwD1AA4ApwAmADkACwDpAJgAxQCLAK4ANgB6AA4AXAA/AA0AxQC0ABoAjgA7ANkAgwDMAFgANACJAGUAHADCAOYAdwCwAPQAYADWAJwALgBvAFEA2wAgAPEAoADOAIQA4wB4APsAWQDCAAUAZwCoACQArQAPAOUAQAC5AO8ASQAEADIAFQB+ACMATgC/AIoAHACVAEAAcQARAEgAJgCxADAAmwAhAEMA2gChAE4AFQDzAGkAxwA6AN4ADACeAFsAqQDJAI8AOwD5ABEAagDfALYAXwDsAAYAlwBkANMACgBTAMkAewDyAAwAhQDmAC8AUAApAPoAfAAnAKsAMACGAP8AbgBSALwAKACBAEcAwwA1AKQAFAB/AL0ALACIAP4AHQCsADQAawC7AF4AGQDRANgAkQAbALcAYADrAE0AEwA9AOIAlwAIAKYAXQD3AB8AcwBLAMYAOgDoAFEAEwB1AN8AKQCeAEwA/wA5AJYAcgA+AOgAcAAHANUANQCNAMsAfQAlAGgAxQAxALMADQBVAPAALgCCAPMADwCpAD4AkgBgALUACADHACMAfgDNAFgArwACAMEAQgCcAB4AZgD3AFYArQAVAEQAnQDdAGwAwgA8AJkACwBXALgAgADsADMAhgDcAEUAlADyABAALACzAHYA5QAvAIsACwDgAEMAtQAqAPoAkQAhAFQABgDuAEoApQBlANkAKwBjABgAowBPAAsA/ABqAB8AqwBTAMUAeQA2AKEAZAD/AEoAvQB0AAUAnwBhADYA0gB/AC0AoQAdANQAOACMAL8ARgDQAC0AvgCTADwAtwDgADcAjAAKAOwAzwAXAIQAUQDWAC4AmADnABMAiABNALoA/QB2AMsANAAiAHsA4gAFAJsAJQByAOoAHABfANcAKACBAPkASAClACYAuwAOAKwAPACBAPUAbAA/AMwAHABcAJAAQwAMALAA9wBbADAAqgBmAPoAVAAGAK0AgwAzAMcAFgBoALwANQCPAEQA5ABdAMkAJgARAE4AqABxAPIAOAC5AOYAWQApAJ4AFgCHADsA2gCNAMEAegA5APYAbgBQAJoAJQDnAGIA+wB6ADEAwwAIAKYA3AAsAIkAAgBLAJUAFwBpAP4AkwBOAMwAIQB0AD8AtAAdAJ8AZAAVAKQA6wAwANUAdQAHABAAsQBqACIAnQBVADYAwAB1AOoAKwCiAMYAPQCAABMAuwAxAOEAXgDVAC4AfgDNAEkAkQAeAHAAvwA+AIgA2wC2AEEA8AANAG8AywAaAFsADgCzAGUAJgBRAKwAOADdAA4AqABNAJcAIwBsAPQAEQCcAFgAzwAqAH0A/gAUAGAALADRAHwAMgCtAAcAlAA/APYAeAA1ANEAHACPAF8AIgDAAHMAOgDmAAwAuQBHAIoAMgDxAKkAHAC1AEoAnwAuAOkAHACeAFYAxQAkAOEAgwBIABMAoAD3AG4AQAC7APwAagAsAMcAUgCnADYA2wBhAAoAxAB5AEAA6QAIAI8AbwBmADcA7AATAI0A+gBeACsAvABTAOYADwBMAJsAKgCAAEkAoQAbAHEA7QCBACAAsABVANoALwCZAGYAwgA5APgApwBOANkAPAAgAHMAsQA5AMwAhgAwAKsA3gAJAMYAPQDWAIgAXQC1ABQAPwCWAPIAJgB/AP8ARgCJAB0A4gBUAA0AwgBuAJMA5QBEABUApQBkACYAdADDADQAjAAYAFMALwCsACYA+ABpAMgAWQAZAK4AOgDTAF8AEwCmADMAewCRACoA/wBcAAUAtwBtAO0ATwCbAP0ARQCjAO0AdQAtAJwAHQB3AEQA1gAwAIUAPQDeAJEAIwC9APUAbADIAEsAIwCsAE8AFQChADYAgAAuANYADABYAJIAHwBmAL0A/gBhALgANADjAAsAowBOAOwAZwAeAJgAUQARAIQAPgDuAMwAdgA1AMYAcQD0ACEAvwCYAEMAtAApAM8ASgCIABUAPACNAPkAEABeAIAALAC/ADgA3ACAAMIAWgD3ACsAnAALAOYAjQAlAFYAEgCcAGAAGQB7AMkAOgCVAOgAOQCmAM0ATwAiAHUArQA3ANIAewCnAAwARwC5ADYAdADLAB8AYwBAAL0A9gCpAEwA0gCLAN4AMQBVAK0AKABzAP0AWAAuAJcA3wA+AIsAAgBQAJ4A5QBhAJIAJgDbALEACQBEAJgAGQBrAA4AOgDBAC0A6wCiAGoAJQCaAPUAEgCDAEgAugBlADYAwQAcAHMA7QAxAH4A1QBBAPsAhQAoAF8AtgDbAFIArwCAAOcAAwB4AEcADgDHAH4APQBgALMAKwDSAIEAEQCkAFgAzgBGAJgAIgC1ADkAcAAdAJ4A4ABNAJAAMADJACgAWwClAIYAMwC7APoAXACQABwARACXAOoAOQDyAH0ASQDDACoAgQDfAFsAFACKAPYAVAC/ADUAeQAAAHQAOADVAB4AlQBQAM0AbgA1AKgAIwBxAMoAVAATAKAAZwAwANQAJACaAPcAQgCvAGwAIACqAD8A6wCTABoAxgBDALQADADxAGgA4gA/ABMAjwDaAEwAtwAvAIQA+wBfACYAqwA7AIwA2gBlAC0AhQDxAJsAVwDHACwAbgCzAPoAAFIEbmFtZQAKCWNvbXAud2FzbQEfAgAOY29tcF9oZWFwX2Jhc2UBDGNvbXBfcHJvY2VzcwcSAQAPX19zdGFja19wb2ludGVyCQoBAAcucm9kYXRhACYJcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkBBWNsYW5nBjIxLjEuOACUAQ90YXJnZXRfZmVhdHVyZXMIKwtidWxrLW1lbW9yeSsPYnVsay1tZW1vcnktb3B0KxZjYWxsLWluZGlyZWN0LW92ZXJsb25nKwptdWx0aXZhbHVlKw9tdXRhYmxlLWdsb2JhbHMrE25vbnRyYXBwaW5nLWZwdG9pbnQrD3JlZmVyZW5jZS10eXBlcysIc2lnbi1leHQ=";
let wasmRuntimePromise = null;

function wasmBytesFromBase64(value) {
	const bytes =
		typeof decodeBase64ToBytes === "function"
			? decodeBase64ToBytes(value)
			: (() => {
					const binary = typeof safeAtob === "function" ? safeAtob(value) : null;
					if (!binary) throw new Error("Embedded WASM base64 is not valid (archive/proxy mangling?).");
					const out = new Uint8Array(binary.length);
					for (let index = 0; index < binary.length; index += 1) out[index] = binary.charCodeAt(index);
					return out;
				})();
	if (!bytes || !bytes.length)
		throw new Error("Embedded WASM base64 is not valid (archive/proxy mangling?).");
	return bytes;
}

async function instantiateWasmBytes(bytes) {
	const result = await WebAssembly.instantiate(bytes, {});
	const exportsList = result.instance.exports;
	if (!exportsList.memory || typeof exportsList.comp_process !== "function")
		throw new Error("comp.wasm does not export memory and comp_process.");
	return result;
}

async function loadWasmRuntime() {
	if (typeof WebAssembly === "undefined") throw new Error("WebAssembly is not supported by this browser.");
	// A separate comp.wasm is preferred when it can be fetched and is valid.
	// Standalone pages opened from file:// (or a stale/invalid comp.wasm)
	// use the embedded copy, which is always built from the same comp.c.
	try {
		const response = await fetch("comp/comp.wasm", { cache: "no-store" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return await instantiateWasmBytes(await response.arrayBuffer());
	} catch {
		return instantiateWasmBytes(wasmBytesFromBase64(WASM_PIPELINE_BASE64));
	}
}
async function ensureWasmRuntime() {
	if (engineSelect.value !== "wasm") return null;
	if (!wasmRuntimePromise) wasmRuntimePromise = loadWasmRuntime();
	try {
		const result = await wasmRuntimePromise;
		wasmStatus.textContent = "WASM C quantizer ready; JavaScript/GPU fallback remains available.";
		return result.instance;
	} catch (error) {
		wasmRuntimePromise = null;
		engineSelect.value = "script";
		wasmStatus.textContent = `WASM unavailable; JavaScript fallback active (${error.message}).`;
		return null;
	}
}

async function runConversionPipeline({
	data,
	w,
	h,
	mode,
	rgbPalette,
	outImgData,
	onProgress,
	onRow,
	hasAlpha,
	engine = "script",
	wasmFrame = null,
}) {
	throwIfStopRequested();
	const tileSize = renderTileSize(w, h);
	if (engineSelect.value === "wasm") {
			const wasmResult = await runWasmPipeline(data, w, h, mode, outImgData, onProgress, onRow, hasAlpha, wasmFrame);
		if (wasmResult) return wasmResult;
	}
	if (tileSize >= Math.max(w, h)) {
		return engine === "webgl"
			? runGLPipeline({
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
				})
			: runTileCore({
					data,
					w,
					h,
					mode,
					rgbPalette,
					outImgData,
					onProgress,
					onRow,
					hasAlpha,
				});
	}
	const fullIndexMap = createIndexMap(w * h);
	const rowParts = Array.from({ length: h }, () => []);
	const tilesX = Math.ceil(w / tileSize);
	const tilesY = Math.ceil(h / tileSize);
	let completed = 0;
	for (let tileY = 0; tileY < h; tileY += tileSize) {
		for (let tileX = 0; tileX < w; tileX += tileSize) {
			throwIfStopRequested();
			const tileW = Math.min(tileSize, w - tileX);
			const tileH = Math.min(tileSize, h - tileY);
			const tileData = new Uint8ClampedArray(tileW * tileH * 4);
			for (let y = 0; y < tileH; y += 1) {
				const sourceStart = ((tileY + y) * w + tileX) * 4;
				tileData.set(data.subarray(sourceStart, sourceStart + tileW * 4), y * tileW * 4);
			}
			const ditheringBuffer = createDitheringBuffer(tileData);
			const tileOutput = { data: new Uint8ClampedArray(tileW * tileH * 4) };
			const tileProcessor = engine === "webgl" ? runGLPipeline : runTileCore;
			const tileMap = await tileProcessor({
				data: ditheringBuffer,
				w: tileW,
				h: tileH,
				mode,
				rgbPalette,
				outImgData: tileOutput,
				onProgress: async (progress) => {
					const overall = (
						((completed + Number(progress) / 100) / (tilesX * tilesY)) *
						100
					).toFixed(2);
					await onProgress(overall);
				},
				onRow: async (localY, line, localMap) => {
					const globalY = tileY + localY;
					rowParts[globalY][tileX / tileSize] = line;
					for (let x = 0; x < tileW; x += 1)
						fullIndexMap[globalY * w + tileX + x] = localMap[localY * tileW + x];
				},
				hasAlpha,
				canvas,
				yieldFrames: false,
			});
			for (let y = 0; y < tileH; y += 1) {
				fullIndexMap.set(
					tileMap.indexMap.subarray(y * tileW, (y + 1) * tileW),
					(tileY + y) * w + tileX,
				);
			}
			for (let y = 0; y < tileH; y += 1) {
				const outputStart = ((tileY + y) * w + tileX) * 4;
				outImgData.data.set(
					tileOutput.data.subarray(y * tileW * 4, (y + 1) * tileW * 4),
					outputStart,
				);
			}
			completed += 1;
		}
	}
	if (onRow)
		for (let y = 0; y < h; y += 1)
			await onRow(y, rowParts[y].join(""), fullIndexMap.subarray(y * w, (y + 1) * w));
	return { hexString: "", indexMap: fullIndexMap };
}
