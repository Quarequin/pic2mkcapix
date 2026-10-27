const clamp = (t) => (t < 0 ? 0 : t > 255 ? 255 : t),
	COLOR_CACHE_LIMIT = 16384;

function createIndexMap(length) {
	return rgbPalette.length <= 256 ? new Uint8Array(length) : new Uint16Array(length);
}

function findNearestColor(red, green, blue, palette) {
	let bestDistance = Infinity;
	let bestIndex = 1;
	for (let index = 1; index < palette.length; index += 1) {
		const color = palette[index];
		if ((color.a ?? 255) < 128) continue;
		const dr = red - color.r;
		const dg = green - color.g;
		const db = blue - color.b;
		const distance = dr * dr + dg * dg + db * db;
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
	// Cap UI work: ~12 progress ticks and yield about every 24–48 rows.
	const uiStride = Math.max(progressStep, Math.ceil(height / 12), 1);
	const rowBatch = Math.max(24, Math.ceil(height / 20));
	let hexString = needText ? "" : "img`\n";
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
				residualR = 0.6 * (red - color.r);
				residualG = 0.6 * (green - color.g);
				residualB = 0.6 * (blue - color.b);
			}
		}

		const line = buildRowString(
			y,
			width,
			indexMap,
			outputPixels,
			palette,
			charTable,
			hasAlpha,
		);
		if (needText) {
			// Fire onRow without awaiting every row; await in batches for responsiveness.
			pendingRow = onRow(y, line, indexMap.subarray(rowStart, rowStart + width));
			if ((y + 1) % rowBatch === 0) {
				await pendingRow;
				pendingRow = null;
			}
		} else {
			hexString += line + "\n";
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
		hexString: needText ? "" : hexString + "`",
		indexMap,
	};
}

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
	const working = new Float32Array(sourceData);
	const colorCache = new Map();
	const needText = typeof onRow === "function";
	const uiStride = Math.max(progressStep, Math.ceil(height / 12), 1);
	const rowBatch = Math.max(24, Math.ceil(height / 20));
	let hexString = needText ? "" : "img`\n";
	let pendingRow = null;

	for (let y = 0; y < height; y += 1) {
		const rowStart = y * width;
		for (let x = 0; x < width; x += 1) {
			const pixelIndex = rowStart + x;
			const byteOffset = pixelIndex << 2;
			if (working[byteOffset + 3] < 128) continue;

			const red = clamp(working[byteOffset]);
			const green = clamp(working[byteOffset + 1]);
			const blue = clamp(working[byteOffset + 2]);
			const selected = cachedFindNearest(red, green, blue, palette, colorCache);
			indexMap[pixelIndex] = selected;

			const color = palette[selected];
			const errR = red - color.r;
			const errG = green - color.g;
			const errB = blue - color.b;

			if (x + 1 < width) {
				working[byteOffset + 4] += 0.4375 * errR;
				working[byteOffset + 5] += 0.4375 * errG;
				working[byteOffset + 6] += 0.4375 * errB;
			}
			if (y + 1 < height) {
				if (x > 0) {
					const belowLeft = ((y + 1) * width + x - 1) << 2;
					working[belowLeft] += 0.1875 * errR;
					working[belowLeft + 1] += 0.1875 * errG;
					working[belowLeft + 2] += 0.1875 * errB;
				}
				const below = ((y + 1) * width + x) << 2;
				working[below] += 0.3125 * errR;
				working[below + 1] += 0.3125 * errG;
				working[below + 2] += 0.3125 * errB;
				if (x + 1 < width) {
					working[below + 4] += 0.0625 * errR;
					working[below + 5] += 0.0625 * errG;
					working[below + 6] += 0.0625 * errB;
				}
			}
		}

		const line = buildRowString(
			y,
			width,
			indexMap,
			outputPixels,
			palette,
			charTable,
			hasAlpha,
		);
		if (needText) {
			pendingRow = onRow(y, line, indexMap.subarray(rowStart, rowStart + width));
			if ((y + 1) % rowBatch === 0) {
				await pendingRow;
				pendingRow = null;
			}
		} else {
			hexString += line + "\n";
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
		hexString: needText ? "" : hexString + "`",
		indexMap,
	};
}

const DITHER_MODES = {
	// Aligned with WebGL u_spread: threshold = (matrix / levels - 0.5) * amplitude
	// Bayer levels = n² (16/64/256). Residual carry 0.6 matches the GPU quantize pass.
	bayer4: [BAYER4, 4, 16, 112],
	bayer8: [BAYER8, 8, 64, 128],
	bayer16: [BAYER16, 16, 256, 144],
	blue8: [BLUE8, 8, 255, 112],
	blue16: [BLUE16, 16, 255, 128],
	blue32: [BLUE32, 32, 255, 144],
	blue64: [BLUE64, 64, 255, 152],
	blue128: [BLUE128, 128, 255, 160],
	blue256: [BLUE256, 256, 255, 168],
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

const WASM_PIPELINE_BASE64 = "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zQBNAO0AbQDFAEUA5QBlAD8AvwAfAJ8ANwC3ABcAlwA9AL0AHQCdADUAtQAVAJUA/wB/AN8AXwD3AHcA1wBXAP0AfQDdAF0A9QB1ANUAVQCNALoAlQA0AGUAtgCJAGkAqgBxAM4AFADyAJkAygD2AEAA3gBQACAAdQAMAFkAKAAQADAAoQDSALIAPAAYAAAA5gBdAPoAkQBIAOoAvgBtADgABAB5AMYAnQB9ACQA1gBEAAgALACuAIUA/wBVABwA4gBhAO4ATADaAIEAwgClAOMAjQCBAOwAoACGAEcAHgCiAOsAYwDRAGwAwABeAJsATgC+AJkANQBWAOAAsgCUAF0AKgC3AJAAGgBJAAoAKQCLAAMA+ABzAMgADQA/APkAqgB+ANUAOACmAOgAdgDMADsA3ACsAHAAIQCaAPUAWADDAA4AMABoALkABgCWAFAAgwDxAGAAFQC0AEYAiQAWAO0AVAAmAMoAAQBDAN4AegD8AC4ApACAAP8AawA0AL8AjwDaAAsAngBbALAAKADPABEAbgBKAOkALQDGABkAeAA8APcAZQAdAIYAMgDwAKgAUgDFAAUAuwCfAE0A1AAjAK0ACAByAEUA4gCTABMAXgDqAIgAOgC1AA4AXAD6ACwA0wCEADYAwQAMAFYA3wBpADEAqwBtABwA8wB9AEQAnAAEALYAYQAkAP4AlwBAANgAvQAfAO4AUwCnAC8AzgB0APQAEQCSAE8AxwAqAHUA5gACAKEAZAATAIwA3QA5ALkAZgBIANcACgB/AP0AWQCyAEsA0AArAPsAbwAGAKMAIgC8AIEAPQDvABgApQA3AMQAkQAbAHwAXwDmAJgAUQD2AA8AcQAwAK8AzAAlAI4ACQDbAEIAwgASAEwAhwAXAGoA5wAzALcABwB5APcAZwDWAD4AqQAAAJUA0gBXAMkAJwCoAGIAIQCeABQA5ACNALgAmgC1ACoAFABPACIAbQASAF8AhwC+AFQAygCAAL4ARAAiAAEAFwBUAO0ARgDhAJAA7QClADEAZgDtAG0AugBGAAkAdADcAPgAowD9AJMA1AA3APUADgCnACYAOQALAOkAmADFAIsArgA2AHoADgBcAD8ADQDFALQAGgCOADsA2QCDAMwAWAA0AIkAZQAcAMIA5gB3ALAA9ABgANYAnAAuAG8AUQDbACAA8QCgAM4AhADjAHgA+wBZAMIABQBnAKgAJACtAA8A5QBAALkA7wBJAAQAMgAVAH4AIwBOAL8AigAcAJUAQABxABEASAAmALEAMACbACEAQwDaAKEATgAVAPMAaQDHADoA3gAMAJ4AWwCpAMkAjwA7APkAEQBqAN8AtgBfAOwABgCXAGQA0wAKAFMAyQB7APIADACFAOYALwBQACkA+gB8ACcAqwAwAIYA/wBuAFIAvAAoAIEARwDDADUApAAUAH8AvQAsAIgA/gAdAKwANABrALsAXgAZANEA2ACRABsAtwBgAOsATQATAD0A4gCXAAgApgBdAPcAHwBzAEsAxgA6AOgAUQATAHUA3wApAJ4ATAD/ADkAlgByAD4A6ABwAAcA1QA1AI0AywB9ACUAaADFADEAswANAFUA8AAuAIIA8wAPAKkAPgCSAGAAtQAIAMcAIwB+AM0AWACvAAIAwQBCAJwAHgBmAPcAVgCtABUARACdAN0AbADCADwAmQALAFcAuACAAOwAMwCGANwARQCUAPIAEAAsALMAdgDlAC8AiwALAOAAQwC1ACoA+gCRACEAVAAGAO4ASgClAGUA2QArAGMAGACjAE8ACwD8AGoAHwCrAFMAxQB5ADYAoQBkAP8ASgC9AHQABQCfAGEANgDSAH8ALQChAB0A1AA4AIwAvwBGANAALQC+AJMAPAC3AOAANwCMAAoA7ADPABcAhABRANYALgCYAOcAEwCIAE0AugD9AHYAywA0ACIAewDiAAUAmwAlAHIA6gAcAF8A1wAoAIEA+QBIAKUAJgC7AA4ArAA8AIEA9QBsAD8AzAAcAFwAkABDAAwAsAD3AFsAMACqAGYA+gBUAAYArQCDADMAxwAWAGgAvAA1AI8ARADkAF0AyQAmABEATgCoAHEA8gA4ALkA5gBZACkAngAWAIcAOwDaAI0AwQB6ADkA9gBuAFAAmgAlAOcAYgD7AHoAMQDDAAgApgDcACwAiQACAEsAlQAXAGkA/gCTAE4AzAAhAHQAPwC0AB0AnwBkABUApADrADAA1QB1AAcAEACxAGoAIgCdAFUANgDAAHUA6gArAKIAxgA9AIAAEwC7ADEA4QBeANUALgB+AM0ASQCRAB4AcAC/AD4AiADbALYAQQDwAA0AbwDLABoAWwAOALMAZQAmAFEArAA4AN0ADgCoAE0AlwAjAGwA9AARAJwAWADPACoAfQD+ABQAYAAsANEAfAAyAK0ABwCUAD8A9gB4ADUA0QAcAI8AXwAiAMAAcwA6AOYADAC5AEcAigAyAPEAqQAcALUASgCfAC4A6QAcAJ4AVgDFACQA4QCDAEgAEwCgAPcAbgBAALsA/ABqACwAxwBSAKcANgDbAGEACgDEAHkAQADpAAgAjwBvAGYANwDsABMAjQD6AF4AKwC8AFMA5gAPAEwAmwAqAIAASQChABsAcQDtAIEAIACwAFUA2gAvAJkAZgDCADkA+ACnAE4A2QA8ACAAcwCxADkAzACGADAAqwDeAAkAxgA9ANYAiABdALUAFAA/AJYA8gAmAH8A/wBGAIkAHQDiAFQADQDCAG4AkwDlAEQAFQClAGQAJgB0AMMANACMABgAUwAvAKwAJgD4AGkAyABZABkArgA6ANMAXwATAKYAMwB7AJEAKgD/AFwABQC3AG0A7QBPAJsA/QBFAKMA7QB1AC0AnAAdAHcARADWADAAhQA9AN4AkQAjAL0A9QBsAMgASwAjAKwATwAVAKEANgCAAC4A1gAMAFgAkgAfAGYAvQD+AGEAuAA0AOMACwCjAE4A7ABnAB4AmABRABEAhAA+AO4AzAB2ADUAxgBxAPQAIQC/AJgAQwC0ACkAzwBKAIgAFQA8AI0A+QAQAF4AgAAsAL8AOADcAIAAwgBaAPcAKwCcAAsA5gCNACUAVgASAJwAYAAZAHsAyQA6AJUA6AA5AKYAzQBPACIAdQCtADcA0gB7AKcADABHALkANgB0AMsAHwBjAEAAvQD2AKkATADSAIsA3gAxAFUArQAoAHMA/QBYAC4AlwDfAD4AiwACAFAAngDlAGEAkgAmANsAsQAJAEQAmAAZAGsADgA6AMEALQDrAKIAagAlAJoA9QASAIMASAC6AGUANgDBABwAcwDtADEAfgDVAEEA+wCFACgAXwC2ANsAUgCvAIAA5wADAHgARwAOAMcAfgA9AGAAswArANIAgQARAKQAWADOAEYAmAAiALUAOQBwAB0AngDgAE0AkAAwAMkAKABbAKUAhgAzALsA+gBcAJAAHABEAJcA6gA5APIAfQBJAMMAKgCBAN8AWwAUAIoA9gBUAL8ANQB5AAAAdAA4ANUAHgCVAFAAzQBuADUAqAAjAHEAygBUABMAoABnADAA1AAkAJoA9wBCAK8AbAAgAKoAPwDrAJMAGgDGAEMAtAAMAPEAaADiAD8AEwCPANoATAC3AC8AhAD7AF8AJgCrADsAjADaAGUALQCFAPEAmwBXAMcALABuALMA+gAAWgRuYW1lAAoJY29tcC53YXNtAScDAAZtZW1zZXQBDmNvbXBfaGVhcF9iYXNlAgxjb21wX3Byb2Nlc3MHEgEAD19fc3RhY2tfcG9pbnRlcgkKAQAHLnJvZGF0YQB/CXByb2R1Y2VycwEMcHJvY2Vzc2VkLWJ5AQVjbGFuZ18xOC4xLjItd2FzaS1zZGsgKGh0dHBzOi8vZ2l0aHViLmNvbS9sbHZtL2xsdm0tcHJvamVjdCAyNmExZDY2MDFkNzI3YTk2ZjQzMDFkMGQ4NjQ3YjVhNDI3NjBhZTBjKQAsD3RhcmdldF9mZWF0dXJlcwIrD211dGFibGUtZ2xvYmFscysIc2lnbi1leHQ=";
let wasmRuntimePromise = null;

function wasmBytesFromBase64(value) {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
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
