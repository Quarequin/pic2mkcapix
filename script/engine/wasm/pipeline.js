// WASM produces the indexed image while onRow streams each completed row to
// the MakeCode/ASCII writers. DOM and textarea updates remain JavaScript-only.
const WASM_ERROR_CODE = Object.freeze({
	SUCCESS: 0,
	INVALID_ARGUMENT: 1,
	MISSING_ERROR_BUFFER: 2,
	MEMORY_RANGE: 3,
	UNSUPPORTED_MODE: 4,
	DIMENSION_OVERFLOW: 5,
	UNKNOWN: 255,
});

const WASM_ERROR_CODES = Object.freeze({
	0: "success",
	1: "invalid argument",
	2: "missing error buffer",
	3: "memory range is out of bounds",
	4: "unsupported processing mode",
	5: "image dimensions overflow the 32-bit buffer limit",
	255: "unknown WASM error",
});

function createWasmError(code, detail) {
	const errorCode = Number(code) & 255;
	const error = new Error(`${detail} (WASM errorCode ${errorCode}: ${WASM_ERROR_CODES[errorCode] || "unknown error"})`);
	error.name = "WasmPipelineError";
	error.errorCode = errorCode;
	error.wasmReason = WASM_ERROR_CODES[errorCode] || "unknown error";
	return error;
}

// Used only when the module does not export comp_heap_base(): this lies above
// the static tables and the C stack of every comp.wasm build.
const WASM_FALLBACK_HEAP_BASE = 131072;
const WASM_PAGE_BYTES = 65536;
const WASM_MAX_ADDRESS = 0xffffffff;

function alignUp(value, alignment) {
	return Math.ceil(value / alignment) * alignment;
}

// Lays out source, palette, output and error buffers above the module's
// static data/stack and grows memory to fit. Returns null when it cannot.
function prepareWasmMemory(instance, width, height, sourceBytes, paletteBytes, matrixBytes = 0) {
	const memory = instance.exports.memory;
	const heapBase = typeof instance.exports.comp_heap_base === "function"
		? instance.exports.comp_heap_base()
		: WASM_FALLBACK_HEAP_BASE;
	const outputBytes = width * height * 2;
	const errorBytes = width * 3 * 2 * 4;
	const sourceOffset = alignUp(heapBase, 16);
	const paletteOffset = alignUp(sourceOffset + sourceBytes, 16);
	const outputOffset = alignUp(paletteOffset + paletteBytes, 16);
	const errorOffset = alignUp(outputOffset + outputBytes, 16);
	// Host blue-noise matrix (modes 8–10) is placed after the FS error buffer region.
	const matrixOffset = alignUp(errorOffset + errorBytes, 16);
	const requiredBytes = matrixOffset + matrixBytes + WASM_PAGE_BYTES;
	if (requiredBytes > WASM_MAX_ADDRESS) return null;
	const missingPages = Math.ceil(requiredBytes / WASM_PAGE_BYTES) - memory.buffer.byteLength / WASM_PAGE_BYTES;
	if (missingPages > 0) {
		try {
			memory.grow(missingPages);
		} catch {
			return null;
		}
	}
	if (memory.buffer.byteLength < requiredBytes) return null;
	return { memory, sourceOffset, paletteOffset, outputOffset, errorOffset, matrixOffset };
}

async function runWasmPipeline(data, width, height, mode, output, onProgress, onRow, hasAlpha, frameInfo = null) {
	const instance = await ensureWasmRuntime();
	if (!instance?.exports?.memory || !instance.exports.comp_process) return null;
	const frameLabel = frameInfo?.total ? `Frame ${frameInfo.current}/${frameInfo.total}` : "Frame";
	setProcessingStatusLine("graphics", `WASM ${frameLabel}: Preparing...`);
	runButton.textContent = `WASM ${frameLabel}: Preparing...`;
	if (!rgbPalette.slice(1).some((color) => (color?.a ?? 255) >= 128)) {
		setProcessingStatusLine("graphics", "WASM: no opaque palette color; using Script fallback...");
		return null;
	}
	// comp_process indexes the palette with 16 bits, so larger palettes cannot run in WASM.
	if (rgbPalette.length > 65536 || data.length < width * height * 4) {
		setProcessingStatusLine("graphics", "WASM: frame or palette is not supported; using Script fallback...");
		return null;
	}
	const sourceBytes = width * height * 4;
	const paletteBytes = rgbPalette.length * 4;
	const largeBlue = {
		blue64: { modeId: 8, size: 64, data: typeof BLUE64_U8 !== "undefined" ? BLUE64_U8 : null },
		blue128: { modeId: 9, size: 128, data: typeof BLUE128_U8 !== "undefined" ? BLUE128_U8 : null },
		blue256: { modeId: 10, size: 256, data: typeof BLUE256_U8 !== "undefined" ? BLUE256_U8 : null },
	}[mode];
	const matrixBytes = largeBlue ? largeBlue.size * largeBlue.size : 0;
	const layout = prepareWasmMemory(instance, width, height, sourceBytes, paletteBytes, matrixBytes);
	if (!layout) {
		setProcessingStatusLine("graphics", "WASM: not enough memory for this frame; using Script fallback...");
		return null;
	}
	const { memory, sourceOffset, paletteOffset, outputOffset, errorOffset, matrixOffset } = layout;
	// Create the views only after memory.grow(), which detaches older buffers.
	const bytes = new Uint8Array(memory.buffer);
	bytes.set(new Uint8Array(data.buffer, data.byteOffset, sourceBytes), sourceOffset);
	for (let index = 0; index < rgbPalette.length; index += 1) {
		const color = rgbPalette[index];
		const offset = paletteOffset + index * 4;
		bytes[offset] = color.r;
		bytes[offset + 1] = color.g;
		bytes[offset + 2] = color.b;
		bytes[offset + 3] = color.a ?? 255;
	}
	const modeIdMap = {
		solid: 0,
		bayer4: 1,
		bayer8: 2,
		bayer16: 3,
		blue8: 4,
		blue16: 5,
		blue32: 6,
		error: 7,
		blue64: 8,
		blue128: 9,
		blue256: 10,
	};
	const modeId = modeIdMap[mode] ?? 0;
	// Host matrix for blue64/128/256 is passed through error_ptr (see comp.c modes 8–10).
	let processErrorPtr = errorOffset;
	if (largeBlue) {
		if (!largeBlue.data || largeBlue.data.length < matrixBytes) {
			setProcessingStatusLine("graphics", "WASM: large blue-noise matrix missing.");
			return null;
		}
		bytes.set(largeBlue.data.subarray(0, matrixBytes), matrixOffset);
		processErrorPtr = matrixOffset;
	}
	const result = instance.exports.comp_process(
		sourceOffset,
		paletteOffset,
		outputOffset,
		width,
		height,
		rgbPalette.length,
		modeId,
		processErrorPtr,
		memory.buffer.byteLength,
	);
	if (result !== 0)
		throw createWasmError(result, `WASM quantizer rejected the ${width}×${height} frame.`);
	const indexMap = new Uint16Array(width * height);
	indexMap.set(new Uint16Array(memory.buffer, outputOffset, width * height));
	const sampledStep = Math.max(4, Math.floor(indexMap.length / 4096) * 4);
	const usedIndices = new Set();
	let sourceMinimum = 255;
	let sourceMaximum = 0;
	for (let offset = 0; offset < data.length; offset += sampledStep) {
		sourceMinimum = Math.min(sourceMinimum, data[offset], data[offset + 1], data[offset + 2]);
		sourceMaximum = Math.max(sourceMaximum, data[offset], data[offset + 1], data[offset + 2]);
		usedIndices.add(indexMap[offset >> 2]);
		if (usedIndices.size > 1) break;
	}
	if (usedIndices.size <= 1 && sourceMaximum - sourceMinimum > 24 && rgbPalette.length > 2) {
		setProcessingStatusLine("graphics", "WASM: invalid index map; using Script fallback...");
		return null;
	}
	const progressStep = Math.max(1, Math.ceil(height / 4));
	const rowBatch = Math.max(64, Math.ceil(height / 8));
	let pendingRow = null;
	// When text output is off, skip per-row string build — indices already from WASM.
	if (!onRow) {
		for (let row = 0; row < height; row += progressStep) {
			throwIfStopRequested();
			const at = Math.min(height, row + progressStep);
			const progress = ((at / height) * 100).toFixed(2);
			await onProgress(progress);
		}
		await onProgress("100.00");
	} else {
		for (let row = 0; row < height; row += 1) {
			throwIfStopRequested();
			const line = buildRowString(row, width, indexMap, output.data, rgbPalette, CHAR_TABLE, hasAlpha);
			pendingRow = onRow(row, line, indexMap.subarray(row * width, (row + 1) * width));
			if ((row + 1) % rowBatch === 0) {
				await pendingRow;
				pendingRow = null;
			}
			if ((row + 1) % progressStep === 0 || row === height - 1) {
				if (pendingRow) {
					await pendingRow;
					pendingRow = null;
				}
				const progress = (((row + 1) / height) * 100).toFixed(2);
				await onProgress(progress);
				setProcessingStatusLine("graphics", `WASM ${frameLabel}: Processing ${progress}%`);
				runButton.textContent = `WASM ${frameLabel}: ${progress}%`;
			}
		}
		if (pendingRow) await pendingRow;
	}
	setProcessingStatusLine("graphics", `WASM ${frameLabel}: Finalize 100%`);
	runButton.textContent = `WASM ${frameLabel}: Finalize 100%`;
	return { hexString: "", indexMap };
}
