function isValidHexRGB(e) {
	return (
		/^#[0-9A-Fa-f]{8}$/.test(e) || /^#[0-9A-Fa-f]{6}$/.test(e) || /^#[0-9A-Fa-f]{3,4}$/.test(e)
	);
}

function hexToRgba(e) {
	const t = e.replace("#", ""),
		a = (e) => parseInt(e, 16),
		n = (e) => (e << 4) | e;
	if (3 === t.length || 4 === t.length) {
		const e = 4 === t.length ? n(a(t[3])) : 255;
		return {
			r: n(a(t[0])),
			g: n(a(t[1])),
			b: n(a(t[2])),
			a: e,
		};
	}
	const i = 8 === t.length ? parseInt(t.substring(6, 8), 16) : 255;
	return {
		r: parseInt(t.substring(0, 2), 16),
		g: parseInt(t.substring(2, 4), 16),
		b: parseInt(t.substring(4, 6), 16),
		a: Number.isNaN(i) ? 255 : i,
	};
}

function hexRgbOnly(e) {
	const { r: t, g: a, b: n } = hexToRgba(e),
		i = (e) => e.toString(16).padStart(2, "0");
	return `#${i(t)}${i(a)}${i(n)}`;
}

function addToSessionLog(e, t, a) {
	const n = `[${new Date().toISOString().split("T")[1].substring(0, 8)}] [${e}] ${t}${a ? "\nDetail: " + a : ""}`;
	(htmlLog.push(n), console.log(n));
}

function detectWebGL() {
	try {
		const e = document.createElement("canvas");
		return !!(
			e.getContext("webgl2") ||
			e.getContext("webgl") ||
			e.getContext("experimental-webgl")
		);
	} catch (e) {
		return !1;
	}
}

addToSessionLog("SYSTEM", "Application initialized successfully.");

const webglSupported = detectWebGL();

// These two strings are the authoritative output values. The textareas only
// contain a viewport projection with newline placeholders outside the view.
let makecodeStringOutput = "";
let asciiTtyStringOutput = "";

const outputViewStates = {
	makecode: {
		textarea,
		lineStarts: [],
		visualLineCounts: [],
		visualLayoutKey: "",
		followTail: false,
		rendering: false,
		renderScheduled: false,
		lastScrollRatio: 0,
	},
	ascii: {
		textarea: asciiOutputTA,
		lineStarts: [],
		visualLineCounts: [],
		visualLayoutKey: "",
		followTail: false,
		rendering: false,
		renderScheduled: false,
		lastScrollRatio: 0,
	},
};

function getOutputState(name) {
	return outputViewStates[name];
}

function getOutputString(name) {
	return "makecode" === name ? makecodeStringOutput : asciiTtyStringOutput;
}

function setOutputString(name, value) {
	if ("makecode" === name) {
		makecodeStringOutput = value;
	} else {
		asciiTtyStringOutput = value;
	}
}

function resetOutputString(name, initial = "") {
	const state = getOutputState(name);
	const value = String(initial);
	state.lineStarts.length = 0;
	state.visualLineCounts.length = 0;
	state.visualLayoutKey = "";
	state.lastScrollRatio = 0;
	setOutputString(name, value);
	if (value) {
		state.lineStarts.push(0);
		for (
			let cursor = value.indexOf("\n");
			cursor >= 0;
			cursor = value.indexOf("\n", cursor + 1)
		) {
			state.lineStarts.push(cursor + 1);
		}
	}
}
function appendOutputLine(name, line) {
	const state = getOutputState(name);
	const cleanLine = String(line ?? "").replace(/[\r\n]+/g, "");
	let value = getOutputString(name);
	if (state.lineStarts.length) {
		value += "\n";
	}
	state.lineStarts.push(value.length);
	value += cleanLine;
	setOutputString(name, value);
}

function getOutputLineEnd(value, lineStart) {
	const newline = value.indexOf("\n", lineStart);
	return newline < 0 ? value.length : newline;
}

// --- Blank-line "sector" pool ----------------------------------------------
// The hidden part of the output (above/below the visible window) is
// represented as bare newlines so the textarea's real scrollHeight still
// matches the full line count. The previous implementation built that
// padding with a fresh "\n".repeat(bigNumber) on every scroll event AND on
// every appended line, so a large conversion (many rows / many animation
// frames) meant repeatedly allocating a brand-new multi-thousand-character
// string from scratch just to redraw invisible whitespace. Instead we grow
// one shared pool in small fixed-size sectors and hand out padding with
// slice(), so the padding is only ever built once and reused after that.
const VIEWPORT_SECTOR_LINES = 256;
let blankLinePool = "";

function ensureBlankPoolCovers(lineCount) {
	if (lineCount <= blankLinePool.length) {
		return;
	}
	const missing = lineCount - blankLinePool.length;
	const sectors = Math.ceil(missing / VIEWPORT_SECTOR_LINES);
	blankLinePool += "\n".repeat(sectors * VIEWPORT_SECTOR_LINES);
}

function getBlankLines(lineCount) {
	if (lineCount <= 0) {
		return "";
	}
	ensureBlankPoolCovers(lineCount);
	return blankLinePool.slice(0, lineCount);
}

function getOutputViewportMetrics(textareaElement) {
	const style = getComputedStyle(textareaElement);
	const fontSize = parseFloat(style.fontSize) || 13;
	const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
	const rect = textareaElement.getBoundingClientRect();
	const width =
		Number(textareaElement.width) ||
		textareaElement.clientWidth ||
		rect.width ||
		parseFloat(style.width) ||
		320;
	const height =
		Number(textareaElement.height) ||
		textareaElement.clientHeight ||
		rect.height ||
		parseFloat(style.height) ||
		320;
	const paddingLeft = parseFloat(style.paddingLeft) || 0;
	const paddingRight = parseFloat(style.paddingRight) || 0;
	const paddingTop = parseFloat(style.paddingTop) || 0;
	const paddingBottom = parseFloat(style.paddingBottom) || 0;
	const contentWidth = Math.max(1, width - paddingLeft - paddingRight);
	const contentHeight = Math.max(lineHeight, height - paddingTop - paddingBottom);
	const averageCharWidth = Math.max(1, fontSize * 0.6);
	const visibleColumns = Math.max(1, Math.floor(contentWidth / averageCharWidth));
	return {
		width,
		height,
		contentWidth,
		contentHeight,
		lineHeight,
		visibleColumns,
		visibleLines: Math.max(1, Math.ceil(contentHeight / lineHeight) + 2),
	};
}

function getOutputVisualLayout(name, value, metrics) {
	const state = getOutputState(name);
	const key = `${metrics.width}|${metrics.height}|${metrics.contentWidth}|${metrics.lineHeight}|${state.lineStarts.length}|${value.length}`;
	if (
		state.visualLayoutKey === key &&
		state.visualLineCounts.length === state.lineStarts.length
	) {
		return state.visualLineCounts;
	}
	// The stylesheet intentionally uses white-space: pre, so a source line
	// does not wrap vertically. Counting estimated width wraps here would add
	// phantom rows and make the first visible text appear halfway down.
	const counts = new Array(state.lineStarts.length).fill(1);
	state.visualLineCounts = counts;
	state.visualLayoutKey = key;
	return counts;
}
function getTextareaScrollRatio(textareaElement, fallback = 0) {
	const maxScrollTop = Math.max(0, textareaElement.scrollHeight - textareaElement.clientHeight);
	if (!maxScrollTop) {
		return fallback;
	}
	return Math.max(0, Math.min(1, textareaElement.scrollTop / maxScrollTop));
}

function renderOutputViewport(name) {
	if (!isTextViewerEnabled()) return;

	const state = getOutputState(name);
	const textareaElement = state.textarea;
	if (!textareaElement) return;
	const value = getOutputString(name);
	const totalLines = state.lineStarts.length;
	if (state.rendering) {
		return;
	}
	if (!totalLines) {
		state.rendering = true;
		state.lastScrollRatio = 0;
		textareaElement.value = "";
		textareaElement.scrollTop = 0;
		state.rendering = false;
		return;
	}

	const previousRatio = state.followTail
		? 1
		: getTextareaScrollRatio(textareaElement, state.lastScrollRatio);

	// Full string for moderate outputs — the blank-line virtual window often
	// desyncs scrollHeight (especially after the text viewer was display:none
	// during convert), leaving the textarea looking empty or half-blank.
	const FULL_RENDER_LINE_LIMIT = 8000;
	if (totalLines <= FULL_RENDER_LINE_LIMIT) {
		state.rendering = true;
		textareaElement.value = value;
		const maxScrollTop = Math.max(0, textareaElement.scrollHeight - textareaElement.clientHeight);
		textareaElement.scrollTop = previousRatio * maxScrollTop;
		state.lastScrollRatio = getTextareaScrollRatio(textareaElement, previousRatio);
		state.rendering = false;
		return;
	}

	const metrics = getOutputViewportMetrics(textareaElement);
	const visualLineCounts = getOutputVisualLayout(name, value, metrics);
	const totalVisualLines = visualLineCounts.reduce((sum, count) => sum + count, 0);
	state.lastScrollRatio = previousRatio;
	const maxVisualFirstLine = Math.max(0, totalVisualLines - metrics.visibleLines);
	const requestedVisualFirstLine = Math.round(previousRatio * maxVisualFirstLine);
	let firstLine = 0;
	let visualBeforeFirst = 0;
	while (
		firstLine < totalLines &&
		visualBeforeFirst + visualLineCounts[firstLine] <= requestedVisualFirstLine
	) {
		visualBeforeFirst += visualLineCounts[firstLine];
		firstLine += 1;
	}
	const targetVisualEnd = requestedVisualFirstLine + metrics.visibleLines;
	let lastLine = firstLine;
	let visualThroughLast = visualBeforeFirst;
	while (lastLine < totalLines && visualThroughLast < targetVisualEnd) {
		visualThroughLast += visualLineCounts[lastLine];
		lastLine += 1;
	}
	const visibleParts = [];
	for (let line = firstLine; line < lastLine; line += 1) {
		const start = state.lineStarts[line];
		const end = getOutputLineEnd(value, start);
		visibleParts.push(value.slice(start, end));
	}
	const visibleText = visibleParts.join("\n");
	const renderedValue =
		getBlankLines(visualBeforeFirst) +
		visibleText +
		getBlankLines(Math.max(0, totalVisualLines - visualThroughLast));
	state.rendering = true;
	textareaElement.value = renderedValue;
	const maxScrollTop = Math.max(0, textareaElement.scrollHeight - textareaElement.clientHeight);
	textareaElement.scrollTop = previousRatio * maxScrollTop;
	state.lastScrollRatio = getTextareaScrollRatio(textareaElement, previousRatio);
	state.rendering = false;
}

function renderOutputViewports() {
	if (!isTextViewerEnabled()) return;
	renderOutputViewport("makecode");
	renderOutputViewport("ascii");
}

function finishOutputViewports() {
	for (const name of ["makecode", "ascii"]) {
		const state = getOutputState(name);
		state.followTail = false;
		state.visualLayoutKey = "";
		state.lastScrollRatio = 0;
	}
	if (isTextViewerEnabled()) {
		renderOutputViewports();
		for (const name of ["makecode", "ascii"]) {
			const state = getOutputState(name);
			if (state.textarea) state.textarea.scrollTop = 0;
		}
		renderOutputViewports();
	}
}

function createStringOutputWriter(name) {
	return {
		reset(initial = "") {
			resetOutputString(name, initial);
		},
		appendLine(line) {
			appendOutputLine(name, line);
		},
	};
}

// Scroll fires far more often than the display can actually repaint (a fast
// trackpad/wheel gesture can queue dozens of events before the next frame).
// Re-slicing the visible window and rewriting textarea.value on every single
// one of those events is wasted work and is what made the original viewport
// feel choppy while scrolling. Coalesce bursts into one render per frame.
function scheduleViewportRender(name) {
	const state = getOutputState(name);
	if (state.renderScheduled) {
		return;
	}
	state.renderScheduled = true;
	requestAnimationFrame(() => {
		state.renderScheduled = false;
		renderOutputViewport(name);
	});
}

for (const [name, state] of Object.entries(outputViewStates)) {
	state.textarea.addEventListener("scroll", () => {
		if (state.rendering) {
			return;
		}
		state.followTail = false;
		state.lastScrollRatio = getTextareaScrollRatio(state.textarea, state.lastScrollRatio);
		scheduleViewportRender(name);
	});
	// visibleLines depends on the textarea's rendered height, which changes on
	// window resize / orientation change / layout reflow — none of which the
	// original viewport ever re-measured for, so it could drift out of sync
	// with what was actually on screen until the next scroll. Watch it directly.
	if ("function" == typeof ResizeObserver) {
		new ResizeObserver(() => {
			if (!state.rendering) {
				scheduleViewportRender(name);
			}
		}).observe(state.textarea);
	}
}

document.querySelectorAll(".tab-btn").forEach((button) => {
	button.addEventListener("click", function () {
		document.querySelectorAll(".tab-btn").forEach((tab) => tab.classList.remove("active"));
		document.querySelectorAll(".tab-panel").forEach((panel) => {
			panel.classList.remove("active");
			// Drop any leftover inline display from convert lock / viewer hide.
			panel.style.display = "";
		});
		this.classList.add("active");
		const panel = document.getElementById("tab-" + this.dataset.tab);
		if (panel) {
			panel.classList.add("active");
			panel.style.display = "";
		}
		renderOutputViewports();
	});
});

asciiEnableCheck.addEventListener("change", function () {
	asciiSubOptions.style.display = this.checked ? "block" : "none";
	asciiTabBtn.disabled = !this.checked;
	if (!this.checked) {
		resetOutputString("ascii");
		renderOutputViewport("ascii");
		const asciiTab = document.querySelector('.tab-btn[data-tab="ascii"]');
		asciiTab &&
			asciiTab.classList.contains("active") &&
			document.querySelector('.tab-btn[data-tab="pixelart"]').click();
	}
	addToSessionLog("ASCII", `ASCII output ${this.checked ? "enabled" : "disabled"}.`);
	updateTextDownloadState();
});

function updateEngineAvailability() {
	const errorDiffusion = ditheringSelect.value === "error";
	const gpuOption = engineSelect.querySelector('option[value="webgl"]');
	const wasmOption = engineSelect.querySelector('option[value="wasm"]');
	if (gpuOption) gpuOption.disabled = errorDiffusion || !webglSupported;
	if (errorDiffusion && engineSelect.value === "webgl") {
		engineSelect.value = "script";
		addToSessionLog("ENGINE", "Error Diffusion requires CPU; GPU option disabled.");
	}
	if (!webglSupported && engineSelect.value === "webgl") engineSelect.value = "script";
	if (engineSelect.value === "wasm") {
		wasmStatus.textContent = "Loading WASM C quantizer...";
		ensureWasmRuntime().then((instance) => {
			if (!instance?.exports?.comp_process) {
				engineSelect.value = "script";
				wasmStatus.textContent = "WASM unavailable; CPU JavaScript fallback active.";
			} else wasmStatus.textContent = "WASM C quantizer ready.";
		});
	} else wasmStatus.textContent = "WASM is inactive; selected JavaScript engine is active.";
	if (wasmOption) wasmOption.disabled = false;
}

engineSelect.addEventListener("change", function () {
	if (this.value === "webgl" && !webglSupported) {
		this.value = "script";
		displayErrorPopup("WebGL Not Supported", "Your browser or device does not support WebGL.", "Falling back to CPU mode.");
	}
	updateEngineAvailability();
	addToSessionLog("ENGINE", `Switched to ${this.value.toUpperCase()} processing mode.`);
});
ditheringSelect.addEventListener("change", updateEngineAvailability);
if (!webglSupported) addToSessionLog("SYSTEM", "WebGL not detected. GPU option disabled.");
updateEngineAvailability();

let processingStatusActive = false;

const BUTTON_STATES = Object.freeze({
	noImage: {
		run: !0,
		copy: !0,
		dl: !0,
		copyText: "Download Text",
		text: "Convert Graphic",
	},
	imageLoaded: {
		run: !1,
		copy: !0,
		dl: !0,
		copyText: "Download Text",
		text: "Convert Graphic",
	},
	processing: {
		run: !0,
		copy: !0,
		dl: !0,
		copyText: "Download Text",
		text: "Converting...",
	},
	almost: {
		run: !0,
		copy: !1,
		dl: !1,
		copyText: "Stop Processing",
		text: "Almost There...",
	},
	done: {
		run: !1,
		copy: !1,
		dl: !1,
		copyText: "Download Text",
		text: "Convert Graphic",
	},
});

function setButtonState(e) {
	const t = BUTTON_STATES[e] || BUTTON_STATES.noImage;
	((runButton.disabled = t.run),
		(downloadTextButton.disabled = t.copy || !(makecodeEnableCheck.checked || asciiEnableCheck.checked)),
		(downloadMediaButton.disabled = t.dl),
		(downloadTextButton.textContent = t.copyText),
		(resetButton.textContent = "processing" === e ? "Stop" : "Reset Form"),
		(resetButton.type = "processing" === e ? "button" : "reset"),
		processingStatusActive && ("processing" === e || "almost" === e)
			? ((runButton.style.whiteSpace = "pre-wrap"), (runButton.textContent = statusDiv.textContent))
			: "processing" !== e && ((runButton.style.whiteSpace = ""), (runButton.textContent = t.text)));
}

resetButton.addEventListener("click", function(e) {
	if (resetButton.type !== "button") return;
	e.preventDefault();
	stopTextProcessingFlag = true;
	statusDiv.textContent = "Stopping image conversion...";
	addToSessionLog("ENGINE", "Stop requested by user.");
});

function updateRenderOptionControls() {
	const custom = renderSelect.value === "custom-tiled";
	renderCustomOptions.style.display = custom ? "block" : "none";
	const exponent = Math.max(3, Math.min(12, Number.parseInt(renderTilePowerInput.value, 10) || 7));
	renderTilePowerInput.value = String(exponent);
	const tile = 2 ** exponent;
	renderTileSizeLabel.textContent = `n = ${exponent} → Tile size: ${tile}×${tile}`;
}

renderSelect.addEventListener("change", updateRenderOptionControls);
renderTilePowerInput.addEventListener("input", updateRenderOptionControls);
updateRenderOptionControls();


function isImageViewerEnabled() {
	return !viewerImageEnable || viewerImageEnable.checked;
}

function isTextViewerEnabled() {
	return !viewerTextEnable || viewerTextEnable.checked;
}

/** User preference captured right before a convert; restored when it finishes. */
let viewerPrefsBeforeProcess = { image: true, text: true };
let viewersLockedForProcess = false;

function applyViewerVisibility() {
	const showImage = isImageViewerEnabled();
	const showText = isTextViewerEnabled();
	// Must use explicit "block" — empty string falls back to stylesheet display:none
	// and was hiding the graphics review panel after the checkbox panel was added.
	if (previewContainer) {
		previewContainer.style.display = showImage ? "block" : "none";
		previewContainer.classList.toggle("is-visible", showImage);
		previewContainer.setAttribute("aria-hidden", showImage ? "false" : "true");
	}
	if (outputTabs) {
		outputTabs.style.display = showText ? "" : "none";
		outputTabs.setAttribute("aria-hidden", showText ? "false" : "true");
	}
	if (!showText) {
		// Hide both panels while text viewers are off (convert lock or user toggle).
		if (tabPixelart) tabPixelart.style.display = "none";
		if (tabAscii) tabAscii.style.display = "none";
	} else {
		// Clear inline display so .tab-panel / .tab-panel.active CSS can work again.
		// Previous code forced style.display = "block"|"none" on each panel, which
		// overrode class-based tab switching — text appeared once after convert then
		// the other tab (or later updates) stayed blank.
		if (tabPixelart) tabPixelart.style.display = "";
		if (tabAscii) tabAscii.style.display = "";
		const asciiOnly =
			asciiEnableCheck?.checked && makecodeEnableCheck && !makecodeEnableCheck.checked;
		let activeTab = document.querySelector(".tab-btn.active")?.dataset?.tab || "pixelart";
		if (asciiOnly) activeTab = "ascii";
		document.querySelectorAll(".tab-btn").forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.tab === activeTab);
		});
		if (tabPixelart) tabPixelart.classList.toggle("active", activeTab === "pixelart");
		if (tabAscii) tabAscii.classList.toggle("active", activeTab === "ascii");
		renderOutputViewports();
	}
	if (showImage && outputObjectUrl && outputImage) {
		if (outputImage.getAttribute("src") !== outputObjectUrl) {
			outputImage.src = outputObjectUrl;
		}
		outputImage.style.display = "block";
		outputImage.style.visibility = "visible";
		outputImage.setAttribute("aria-hidden", "false");
	}
}

/** Hide + lock viewer toggles for the duration of a convert. */
function lockViewersForProcess() {
	viewerPrefsBeforeProcess = {
		image: !viewerImageEnable || viewerImageEnable.checked,
		text: !viewerTextEnable || viewerTextEnable.checked,
	};
	viewersLockedForProcess = true;
	if (viewerImageEnable) {
		viewerImageEnable.checked = false;
		viewerImageEnable.disabled = true;
	}
	if (viewerTextEnable) {
		viewerTextEnable.checked = false;
		viewerTextEnable.disabled = true;
	}
	applyViewerVisibility();
}

/** Restore pre-convert checkbox state and unlock. */
function unlockViewersAfterProcess() {
	viewersLockedForProcess = false;
	if (viewerImageEnable) {
		viewerImageEnable.disabled = false;
		viewerImageEnable.checked = !!viewerPrefsBeforeProcess.image;
	}
	if (viewerTextEnable) {
		viewerTextEnable.disabled = false;
		viewerTextEnable.checked = !!viewerPrefsBeforeProcess.text;
	}
	applyViewerVisibility();
	// Second paint after layout so textareas regain real clientHeight (they were
	// display:none while locked) and the virtual/full text viewer fills correctly.
	if (isTextViewerEnabled()) {
		requestAnimationFrame(() => {
			renderOutputViewports();
		});
	}
}

if (viewerImageEnable) {
	viewerImageEnable.addEventListener("change", () => {
		if (!viewersLockedForProcess) applyViewerVisibility();
	});
}
if (viewerTextEnable) {
	viewerTextEnable.addEventListener("change", () => {
		if (!viewersLockedForProcess) applyViewerVisibility();
	});
}
applyViewerVisibility();

setButtonState("noImage");

const MIN_PALETTE_SLOTS = 2;
const MAX_PALETTE_SLOTS = 65535;
const VISIBLE_PALETTE_SLOTS = 20;
const MAKECODE_PALETTE_LIMIT = 15;
let paletteValues = [];
let palettePageStart = 0;

function lastPalettePageStart() {
	return paletteValues.length
		? Math.floor((paletteValues.length - 1) / VISIBLE_PALETTE_SLOTS) * VISIBLE_PALETTE_SLOTS
		: 0;
}

function paletteCapacity() {
	const requested = Number.parseInt(paletteLimitInput.value, 10);
	return Math.max(
		MIN_PALETTE_SLOTS,
		Math.min(
			MAX_PALETTE_SLOTS,
			Number.isFinite(requested) ? requested : MAKECODE_PALETTE_LIMIT,
		),
	);
}

function updateTextDownloadState() {
	downloadTextButton.disabled = !(makecodeEnableCheck.checked || asciiEnableCheck.checked);
}

function updateMakeCodeAvailability() {
	const count = paletteValues.length;
	const overLimit = count > MAKECODE_PALETTE_LIMIT;
	if (overLimit) {
		makecodeEnableCheck.checked = false;
		makecodeEnableCheck.disabled = true;
		makecodeAutoStatus.textContent = `MakeCode output was disabled automatically: ${count} palette colors exceed the 15-color limit.`;
	} else {
		makecodeEnableCheck.disabled = false;
		makecodeAutoStatus.textContent = makecodeEnableCheck.checked
			? `MakeCode output is enabled (${count}/15 colors).`
			: "MakeCode output is disabled by user.";
	}
	updateTextDownloadState();
}

function updatePaletteCountLabel() {
	const count = paletteValues.length;
	const visibleEnd = Math.min(count, palettePageStart + VISIBLE_PALETTE_SLOTS);
	paletteCountLbl.textContent = `Active Color Registers (1–${count}):`;
	paletteRangeLabel.textContent = count
		? `Colors ${palettePageStart + 1}–${visibleEnd}`
		: "No colors";
	paletteRemoveBtn.disabled = count <= MIN_PALETTE_SLOTS;
	paletteAddBtn.disabled = count >= paletteCapacity() || count >= MAX_PALETTE_SLOTS;
	palettePrevBtn.disabled = palettePageStart <= 0;
	paletteNextBtn.disabled = visibleEnd >= count;
	updateMakeCodeAvailability();
}

function makeCustomPaletteLabel() {
	predefinedPaletteSelect.querySelector('option[value="custom"]').classList.remove("hidden");
	predefinedPaletteSelect.value = "custom";
}

function createPalettePair(index, value = "#888888", placeholder = false) {
	const pair = document.createElement("div");
	pair.className = "color-pair";
	pair.dataset.placeholder = placeholder ? "true" : "false";
	if (placeholder) {
		pair.style.position = "absolute";
		pair.style.left = "-999999px";
		pair.style.top = "-999999px";
	}
	const label = document.createElement("label");
	const colorInput = document.createElement("input");
	const textInput = document.createElement("input");
	if (placeholder) {
		label.textContent = " ";
		colorInput.type = "color";
		colorInput.disabled = true;
		textInput.type = "text";
		textInput.className = "colortext";
		textInput.value = "";
		textInput.disabled = true;
	} else {
		label.textContent = `Color ${index + 1}`;
		colorInput.type = "color";
		colorInput.value = hexRgbOnly(value);
		textInput.type = "text";
		textInput.className = "colortext";
		textInput.value = value;
	}
	pair.append(label, colorInput, textInput);
	colorpad.appendChild(pair);
	if (!placeholder) bindColorPairEvents(pair, index);
	return pair;
}

function renderPalettePage() {
	const visibleValues = paletteValues.slice(
		palettePageStart,
		palettePageStart + VISIBLE_PALETTE_SLOTS,
	);
	colorpad.replaceChildren();
	visibleValues.forEach((value, offset) => createPalettePair(palettePageStart + offset, value));
	for (let offset = visibleValues.length; offset < VISIBLE_PALETTE_SLOTS; offset += 1) {
		createPalettePair(palettePageStart + offset, "#888888", true);
	}
	updatePaletteCountLabel();
}

function setPaletteValues(values) {
	const capacity = paletteCapacity();
	paletteValues = values
		.slice(0, capacity)
		.map((value) => (isValidHexRGB(value) ? value.toLowerCase() : "#888888"));
	palettePageStart = Math.min(palettePageStart, lastPalettePageStart());
	renderPalettePage();
}


function updatePaletteValue(index, value) {
	if (index < 0 || index >= paletteValues.length) return;
	paletteValues[index] = value;
	makeCustomPaletteLabel();
}

function bindColorPairEvents(pair, index) {
	const colorInput = pair.querySelector('input[type="color"]');
	const textInput = pair.querySelector(".colortext");
	const originalValue = paletteValues[index];
	pair.dataset.alpha = String(hexToRgba(originalValue).a);
	colorInput.addEventListener("input", function () {
		textInput.value = this.value;
		pair.dataset.alpha = "255";
		updatePaletteValue(index, this.value);
	});
	textInput.addEventListener("change", function () {
		let value = this.value.trim();
		if (!value.startsWith("#")) value = `#${value}`;
		if (!isValidHexRGB(value)) {
			displayErrorPopup(
				"Invalid Color HEX Input",
				`The color code "${value}" is invalid.`,
				"Please use Hexadecimal format such as #FFF, #FFFF, #FFFFFF or #FFFFFFFF only.",
			);
			this.value = paletteValues[index];
			return;
		}
		this.value = value;
		colorInput.value = hexRgbOnly(value);
		pair.dataset.alpha = String(hexToRgba(value).a);
		updatePaletteValue(index, value);
		addToSessionLog("PALETTE", `Color slot ${index + 1} updated to ${value}`);
	});
}


function parseCurrentPalette() {
	rgbPalette = [{ r: 0, g: 0, b: 0, a: 0 }].concat(
		paletteValues.map((value) => {
			const color = hexToRgba(value);
			return { r: color.r, g: color.g, b: color.b, a: color.a };
		}),
	);
}

let temporaryPaletteIndices = null;

function temporaryPaletteLimit() {
	return sourceExtension === "gif" ||
		sourceExtension === "apng" ||
		(sourceExtension === "png" && animSource)
		? 256
		: 65535;
}

function finalizeTemporaryPalette(mainPalette, usedMainIndices) {
	const selected = Array.from(usedMainIndices).sort((left, right) => left - right);
	const limit = temporaryPaletteLimit();
	if (selected.length > limit) selected.length = limit;
	if (!selected.includes(0)) selected.unshift(0);
	temporaryPaletteIndices = selected;
	rgbPalette = temporaryPaletteIndices.map((mainIndex) => mainPalette[mainIndex]);
}

function selectTemporaryPaletteFromPixels(data) {
	const mainPalette = rgbPalette;
	const usedMainIndices = new Set([0]);
	const cache = new Map();
	for (let offset = 0; offset < data.length; offset += 4) {
		if (data[offset + 3] >= 128)
			usedMainIndices.add(
				cachedFindNearest(
					data[offset],
					data[offset + 1],
					data[offset + 2],
					mainPalette,
					cache,
				),
			);
	}
	finalizeTemporaryPalette(mainPalette, usedMainIndices);
}

function accumulatePaletteFromPixels(pixels, usedMainIndices, mainPalette, cache) {
	const step = Math.max(4, Math.floor(pixels.length / 4 / 4000) * 4);
	for (let offset = 0; offset < pixels.length; offset += step) {
		if (pixels[offset + 3] >= 128)
			usedMainIndices.add(
				cachedFindNearest(
					pixels[offset],
					pixels[offset + 1],
					pixels[offset + 2],
					mainPalette,
					cache,
				),
			);
	}
}

/** Video palette prep: seek only to sparse timestamps (avoids decoding every frame twice). */
async function sampleVideoPaletteSparse(buffer, mimeType, width, height) {
	const objectUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
	const video = document.createElement("video");
	video.src = objectUrl;
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	const usedMainIndices = new Set([0]);
	const mainPalette = rgbPalette;
	const cache = new Map();
	try {
		await new Promise((resolve, reject) => {
			video.addEventListener("loadedmetadata", resolve, { once: true });
			video.addEventListener(
				"error",
				() => reject(new Error("Unable to open video for palette sampling.")),
				{ once: true },
			);
		});
		const duration =
			Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
		const samples = duration > 0 ? 32 : 1;
		for (let i = 0; i < samples; i += 1) {
			const t = duration ? Math.min((i / samples) * duration, Math.max(0, duration - 0.001)) : 0;
			await MediaVideoDecoder.waitSeek(video, t);
			const drawn = MediaVideoDecoder.drawFrame(video, width, height);
			accumulatePaletteFromPixels(drawn.imageData.data, usedMainIndices, mainPalette, cache);
			// Drop temporary canvas immediately.
			drawn.image.width = 0;
			drawn.image.height = 0;
			if (i % 4 === 0) await yieldOutputFrame();
		}
	} finally {
		video.pause();
		video.removeAttribute("src");
		video.load();
		URL.revokeObjectURL(objectUrl);
	}
	finalizeTemporaryPalette(mainPalette, usedMainIndices);
}

async function selectTemporaryPaletteFromAnimation(source, width, height) {
	// Video: sparse seeks only — full frame walks here duplicated processAnimation and felt like a hang.
	if (
		uploadedFileBuffer &&
		String(originalMimeType || "").startsWith("video/")
	) {
		await sampleVideoPaletteSparse(
			uploadedFileBuffer,
			originalMimeType,
			width,
			height,
		);
		return;
	}

	const stream = await source.open();
	if (!stream) throw new Error("Unable to open animation while preparing its temporary palette.");
	const usedMainIndices = new Set([0]);
	const mainPalette = rgbPalette;
	const cache = new Map();
	const total = stream.frameCount || source.frameCount || 0;
	const targetSamples = 32;
	const stride = total > targetSamples ? Math.max(1, Math.floor(total / targetSamples)) : 1;
	let index = 0;
	let sampled = 0;
	for await (const frame of stream) {
		if (index % stride === 0) {
			try {
				const buf = frameToImageData(frame, width, height);
				accumulatePaletteFromPixels(buf.data, usedMainIndices, mainPalette, cache);
				sampled += 1;
			} catch (_) {
				/* skip undecodeable sample frame */
			}
		}
		releaseFrame(frame);
		index += 1;
		if (sampled > 0 && sampled % 4 === 0) await yieldOutputFrame();
	}
	finalizeTemporaryPalette(mainPalette, usedMainIndices);
}

paletteValues = Array.from(colorpad.querySelectorAll(".color-pair")).map(
	(pair) => pair.querySelector(".colortext").value,
);
renderPalettePage();
paletteAddBtn.addEventListener("click", function () {
	if (paletteValues.length >= paletteCapacity()) return;
	paletteValues.push("#888888");
	palettePageStart = lastPalettePageStart();
	makeCustomPaletteLabel();
	renderPalettePage();
	addToSessionLog("PALETTE", `Added color slot ${paletteValues.length}.`);
});
paletteRemoveBtn.addEventListener("click", function () {
	if (paletteValues.length <= MIN_PALETTE_SLOTS) return;
	paletteValues.pop();
	palettePageStart = Math.min(palettePageStart, lastPalettePageStart());
	makeCustomPaletteLabel();
	renderPalettePage();
	addToSessionLog("PALETTE", `Removed last color slot (now ${paletteValues.length} slots).`);
});
palettePrevBtn.addEventListener("click", function () {
	palettePageStart = Math.max(0, palettePageStart - VISIBLE_PALETTE_SLOTS);
	renderPalettePage();
});
paletteNextBtn.addEventListener("click", function () {
	palettePageStart = Math.min(lastPalettePageStart(), palettePageStart + VISIBLE_PALETTE_SLOTS);
	renderPalettePage();
});
paletteLimitInput.addEventListener("change", function () {
	this.value = String(paletteCapacity());
	if (paletteValues.length > paletteCapacity()) paletteValues.length = paletteCapacity();
	palettePageStart = Math.min(palettePageStart, lastPalettePageStart());
	renderPalettePage();
	addToSessionLog("PALETTE", `Palette capacity set to ${paletteCapacity()} colors.`);
});
makecodeEnableCheck.addEventListener("change", () => {
	updateMakeCodeAvailability();
	updateTextDownloadState();
});
updateTextDownloadState();
predefinedPaletteSelect.addEventListener("change", function () {
	if (this.value === "custom" || !predefinedPalettes[this.value]) return;
	this.querySelector('option[value="custom"]').classList.add("hidden");
	setPaletteValues(predefinedPalettes[this.value]);
	statusDiv.textContent = `System: Loaded predefined "${this.value}" palette schema.`;
	addToSessionLog("PALETTE", `Switched layout to predefined scheme: ${this.value}`);
});
palettemediaFileInput.addEventListener("change", function (event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onerror = () =>
		displayErrorPopup(
			"Palette File IO Exception",
			"An error occurred while reading the palette source file.",
			reader.error ? reader.error.message : "Unknown fault.",
		);
	reader.onload = function (loadEvent) {
		try {
			const values = [];
			loadEvent.target.result.split(/\r?\n/).forEach((line) => {
				const token = line.trim().replace(/;.*$/, "").trim();
				const match =
					token.match(/#?([0-9A-Fa-f]{8})/) ||
					token.match(/#?([0-9A-Fa-f]{6})/) ||
					token.match(/#?([0-9A-Fa-f]{3,4})/);
				if (match) values.push(`#${match[1].toLowerCase()}`);
			});
			if (!values.length)
				throw new Error("No valid Hexadecimal color codes found in this file.");
			setPaletteValues(values);
			makeCustomPaletteLabel();
			statusDiv.textContent = `System: Loaded ${Math.min(values.length, paletteCapacity())} of ${values.length} colors from palette file.`;
			addToSessionLog("PALETTE", `Imported external palette from ${file.name}.`);
		} catch (error) {
			displayErrorPopup("Palette Processor Runtime Fault", error.message, error.stack);
		}
	};
	reader.readAsText(file);
});

mediaFileInput.addEventListener("change", async function () {
	resetLoadedState();
	const e = mediaFileInput.files[0];
	if (!e)
		return void (statusDiv.textContent =
			"Invalid: No image file. Try selecting PNG, JPG, GIF, APNG, WebP, WebM, MP4, MKV, or MOV.");
	const t = sourceMime(e);
	if (/^image\//.test(t) || /^video\//.test(t)) {
		((statusDiv.textContent = `System: Loading asset of "${e.name}".`),
			(originalMimeType = t),
			(sourceExtension = sourceExtensionOf(e)),
			(uploadedFileBuffer = await e.arrayBuffer()));
		try {
			if (/^video\//.test(t) || isAnimatedBuffer(uploadedFileBuffer, t)) {
				const a = await decodeAnimation(uploadedFileBuffer, t),
					n = await inspectAnimationSource(a);
				if (!n.first) throw new Error("No decodable animation frames were found.");
				const i = createOriginalReviewElement(e),
					o = n.frameCount || a.frameCount || 0;
				(n.visuallyStatic
					? // Keep GIF (and any non-video animation source) on the
						// animation pipeline even when frames are identical.
						// Dropping animSource forced the static <img> path,
						// which produced blank output for many static GIFs.
						((animSource = a),
						showLoadedPreview(i, n.first.width, n.first.height, o || 1),
						updateVideoOptionsVisibility(/^video\//.test(t)),
						(statusDiv.textContent =
							o <= 1
								? `Ready: "${e.name}" Loaded as a static image (1 frame).`
								: `Ready: "${e.name}" Loaded as static output (${o} identical frame(s)).`),
						addToSessionLog(
							"IMAGE",
							`Loaded "${t}" as static output (${o || 1} visually identical frame(s)).`,
						))
					: ((animSource = a),
						showLoadedPreview(i, n.first.width, n.first.height, o),
						(statusDiv.textContent = formatAnimReadyStatus(e.name, o, n.duration || 0)),
						updateVideoOptionsVisibility(/^video\//.test(t)),
						addToSessionLog(
							"ANIM",
							`Loaded "${t}" as a streaming animation source${o ? ` with ${o} frame(s)` : ""}.`,
						)),
					releaseFrame(n.first));
			} else {
				const a = createOriginalReviewElement(e);
				const onLoaded = () => {
					const width = a.videoWidth || a.naturalWidth;
					const height = a.videoHeight || a.naturalHeight;
					showLoadedPreview(a, width, height);
					updateVideoOptionsVisibility(false);
					statusDiv.textContent = `Ready: "${e.name}" Loaded Successfully.`;
					addToSessionLog("IMAGE", `Loaded "${t}" source image.`);
				};
				a.addEventListener("loadedmetadata", onLoaded, { once: true });
				a.addEventListener("load", onLoaded, { once: true });
				a.addEventListener(
					"error",
					() => {
						displayErrorPopup(
							"Image Decoding Exception",
							"Unable to decode this image file.",
							"The file may be corrupted or unsupported.",
						);
					},
					{ once: true },
				);
			}
		} catch (e) {
			(displayErrorPopup("Animation Decode Error", e.message, e.stack), resetLoadedState());
		}
	} else statusDiv.textContent = `Invalid: "${e.name}" is not a supported image or video file.`;
});

function revokeOutputObjectUrl() {
	(outputObjectUrl && URL.revokeObjectURL(outputObjectUrl), (outputObjectUrl = null));
}

function setOutputBlob(e) {
	if (!e) return;
	revokeOutputObjectUrl();
	outputBlob = e;
	outputObjectUrl = URL.createObjectURL(e);
	if (e.type.startsWith("video/")) {
		outputImage.style.display = "none";
		outputImage.style.visibility = "hidden";
		outputImage.setAttribute("aria-hidden", "true");
		if (!outputVideo) {
			outputVideo = document.createElement("video");
			outputVideo.controls = true;
			outputVideo.muted = true;
			outputVideo.loop = true;
			outputVideo.playsInline = true;
			outputVideo.className = "output-video-preview";
			// Size is controlled by CSS (max-width/max-height + object-fit: contain).
			outputVideo.style.width = "auto";
			outputVideo.style.height = "auto";
			outputVideo.style.maxWidth = "100%";
			outputVideo.style.maxHeight = "min(60vh, 480px)";
			outputVideo.style.objectFit = "contain";
			outputImage.parentElement.append(outputVideo);
		}
		outputVideo.src = outputObjectUrl;
		outputVideo.style.display = "block";
		outputVideo.setAttribute("aria-hidden", "false");
		return;
	}
	if (outputVideo) {
		outputVideo.removeAttribute("src");
		outputVideo.load();
		outputVideo.style.display = "none";
		outputVideo.setAttribute("aria-hidden", "true");
	}
	if (isImageViewerEnabled()) {
		// Prefer the live processed canvas for on-screen preview. Encoded
		// GIF/APNG blobs are still kept in outputBlob for Download File.
		// (Text output can succeed while a broken GIF encode looks blank.)
		let previewSrc = outputObjectUrl;
		try {
			if (canvas && canvas.width > 0 && canvas.height > 0) {
				previewSrc = canvas.toDataURL("image/png");
			}
		} catch (_) {
			/* tainted or unavailable — fall back to encoded blob URL */
		}
		outputImage.src = previewSrc;
		outputImage.style.display = "block";
		outputImage.style.visibility = "visible";
		outputImage.setAttribute("aria-hidden", "false");
	} else {
		outputImage.removeAttribute("src");
		outputImage.style.display = "none";
		outputImage.setAttribute("aria-hidden", "true");
	}
}

function revokeOriginalPreviewObjectUrl() {
	if (originalPreviewObjectUrl) {
		URL.revokeObjectURL(originalPreviewObjectUrl);
		originalPreviewObjectUrl = null;
	}
}

function resetLoadedState() {
	revokeOriginalPreviewObjectUrl();
	updateVideoOptionsVisibility(false);
	temporaryPaletteIndices = null;
	resetOutputString("makecode");
	resetOutputString("ascii");
	makecodeStringOutput = "";
	asciiTtyStringOutput = "";
	renderOutputViewports();
	lastIndexMap = null;
	animSource = null;
	processedAnimation = null;
	outputBlob = null;
	indexedOutputPalette = null;
	revokeOutputObjectUrl();
	if (outputImage) {
		outputImage.removeAttribute("src");
		if (outputVideo) {
			outputVideo.removeAttribute("src");
			outputVideo.load();
			outputVideo.style.display = "none";
			outputVideo.setAttribute("aria-hidden", "true");
		}
		outputImage.style.display = "block";
		outputImage.style.visibility = "hidden";
		outputImage.setAttribute("aria-hidden", "true");
	}
	uploadedFileBuffer = null;
	setButtonState("noImage");
}



function updateVideoOptionsVisibility(isVideo) {
	if (!videoOptionsGroup) return;
	videoOptionsGroup.style.display = isVideo ? "block" : "none";
	if (!isVideo && videoKeepAudioCheck) videoKeepAudioCheck.checked = false;
}

function formatAnimReadyStatus(fileName, frameCount, durationSec) {
	const frames = Number(frameCount) || 0;
	const duration = Number(durationSec) || 0;
	let line = `Ready: "${fileName}" Loaded (${frames ? `${frames} ` : ""}frame${frames === 1 ? "" : "s"}).`;
	const longByFrames = frames >= 120;
	const longByTime = duration >= 8;
	if (longByFrames || longByTime) {
		line +=
			"\nThis file may take a long time to process. Please decide carefully before converting.";
	}
	return line;
}

function showLoadedPreview(e, t, a, n = 0) {
	document.getElementById("original-res").textContent =
		`Size: ${t} x ${a} px${n ? ` | Frames: ${n}` : ""}`;
	document.getElementById("original-preview-zone").replaceChildren(e);
	document.querySelectorAll("input[disabled]").forEach((el) => el.removeAttribute("disabled"));
	originalImageSize = { width: t, height: a };
	setButtonState("imageLoaded");
	updateCalculatedDimensions();
	// Respect the image-viewer checkbox (do not force-show when user hid it).
	if (typeof applyViewerVisibility === "function") applyViewerVisibility();
	else if (previewContainer && isImageViewerEnabled()) previewContainer.style.display = "block";
}

function sourceExtensionOf(e) {
	const t = String(e.name || "").match(/\.([^.]+)$/);
	return (
		(t ? t[1] : "").toLowerCase() ||
		{
			"image/png": "png",
			"image/jpeg": "jpg",
			"image/gif": "gif",
			"image/webp": "webp",
			"image/apng": "apng",
			"video/webm": "webm",
			"video/mp4": "mp4",
			"video/x-matroska": "mkv",
			"video/quicktime": "mov",
		}[e.type] ||
		"png"
	);
}

function sourceMime(e) {
	const extension = sourceExtensionOf(e);
	const knownType = {
		gif: "image/gif",
		apng: "image/apng",
		png: "image/png",
		webp: "image/webp",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		jpe: "image/jpeg",
		bmp: "image/bmp",
		jxl: "image/jxl",
		webm: "video/webm",
		mp4: "video/mp4",
		mkv: "video/x-matroska",
		mov: "video/quicktime",
	}[extension] || "";
	return /^image\//.test(e.type) || /^video\//.test(e.type) ? e.type : knownType;
}
function createOriginalReviewElement(file) {
	revokeOriginalPreviewObjectUrl();
	originalPreviewObjectUrl = URL.createObjectURL(file);
	if (sourceMime(file).startsWith("video/")) {
		const video = document.createElement("video");
		video.autoplay = true;
		video.loop = true;
		video.muted = true;
		video.playsInline = true;
		video.setAttribute("aria-label", "Original media preview");
		video.src = originalPreviewObjectUrl;
		return video;
	}
	const image = new Image();
	image.alt = "Original image preview";
	image.src = originalPreviewObjectUrl;
	return image;
}

async function inspectAnimationSource(source) {
	const knownCount = source.frameCount || 0;
	const stream = await source.open();
	if (!stream) {
		return { first: null, frameCount: 0, visuallyStatic: false };
	}
	let first = null;
	let firstPixels = null;
	let seen = 0;
	let visuallyStatic = true;
	// Only probe a few frames for "static" detection — never walk a whole movie here
	// (that was hanging load/convert before the first process frame).
	const probeLimit = 3;
	for await (const frame of stream) {
		seen += 1;
		if (!first) {
			first = frame;
			try {
				firstPixels = frame.image
					.getContext("2d", { willReadFrequently: true })
					.getImageData(0, 0, frame.width, frame.height).data;
			} catch {
				firstPixels = null;
			}
		} else if (seen <= probeLimit && visuallyStatic && firstPixels) {
			if (frame.width !== first.width || frame.height !== first.height) {
				visuallyStatic = false;
			} else {
				try {
					const pixels = frame.image
						.getContext("2d", { willReadFrequently: true })
						.getImageData(0, 0, frame.width, frame.height).data;
					if (pixels.length !== firstPixels.length) visuallyStatic = false;
					else {
						for (let i = 0; i < pixels.length; i += 16) {
							if (pixels[i] !== firstPixels[i]) {
								visuallyStatic = false;
								break;
							}
						}
					}
				} catch {
					visuallyStatic = false;
				}
			}
			releaseFrame(frame);
		} else {
			releaseFrame(frame);
			// Stop probing; leave the generator so its finally{} can clean up.
			break;
		}
	}
	return {
		first,
		frameCount: knownCount || stream.frameCount || seen,
		visuallyStatic: seen <= 1 ? true : visuallyStatic,
		duration: stream.duration || source.duration || 0,
	};
}

function fileStem() {
	return `pic2mkcapix-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function canvasToBlob(e, t = "image/png", a) {
	return new Promise((n, i) => {
		if (e.toBlob)
			e.toBlob((e) => (e ? n(e) : i(new Error("Canvas export returned no data."))), t, a);
		else
			try {
				const i = e.toDataURL(t, a),
					[o, r] = i.split(","),
					s = atob(r),
					l = new Uint8Array(s.length);
				for (let e = 0; e < s.length; e += 1) l[e] = s.charCodeAt(e);
				n(
					new Blob([l], {
						type: o.match(/data:([^;]+)/)?.[1] || t,
					}),
				);
			} catch (e) {
				i(e);
			}
	});
}

const OUTPUT_MIME_TYPES = Object.freeze({
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	jpe: "image/jpeg",
	bmp: "image/bmp",
	gif: "image/gif",
	webp: "image/webp",
	apng: "image/apng",
});

function outputMimeForExtension(e) {
	return OUTPUT_MIME_TYPES[e] || "";
}

function assertBlobType(e, t, a) {
	if (!e || (t && e.type && e.type.toLowerCase() !== t))
		throw new Error(`This browser could not produce a valid ${a.toUpperCase()} output.`);
	return e;
}

async function encodeStaticOutput(e, t, a) {
	throwIfStopRequested();
	indexedOutputPalette = null;
	const indexedMap = prepareIndexedOutput(e.indexMap);
	const indexedInput = { ...e, indexMap: indexedMap };
	if (["jxl", "webm", "mp4", "mkv", "mov"].includes(sourceExtension))
		throw new Error(
			`Animated ${sourceExtension.toUpperCase()} input must be processed through the video encoder.`,
		);
	if ("gif" === sourceExtension)
		return encodeAnimatedGif({
			width: t,
			height: a,
			frames: [
				{
					indexMap: indexedInput.indexMap,
					width: t,
					height: a,
					rect: {
						x: 0,
						y: 0,
						width: t,
						height: a,
					},
					delay: 100,
					disposal: 0,
				},
			],
			repeat: null,
		});
	if ("bmp" === sourceExtension) return encodeBmpFromCanvas(canvas);
	if ("apng" === sourceExtension) {
		const n = createApngStreamWriter({
			width: t,
			height: a,
			frameCount: 1,
			repeat: null,
		});
		return (
			n.add({
				indexMap: indexedInput.indexMap,
				rect: {
					x: 0,
					y: 0,
					width: t,
					height: a,
				},
				delay: 100,
				disposal: 0,
				changedOnly: !1,
			}),
			n.finish()
		);
	}
	const n = outputMimeForExtension(sourceExtension) || "image/png";
	return assertBlobType(await canvasToBlob(canvas, n), n, sourceExtension);
}

function releaseFrame(e) {
	e?.image instanceof HTMLCanvasElement &&
		((e.image.width = 0), (e.image.height = 0), (e.image = null));
}

function updateCalculatedDimensions() {
	if (
		!document.querySelector(
			"#original-preview-zone img, #original-preview-zone video, #original-preview-zone canvas",
		)
	)
		return;
	const e = (e, t) => {
		((inputWidth.disabled = e), (inputHeight.disabled = e), (inputFactor.disabled = t));
	};
	if (document.getElementById("original-size").checked) {
		((nextResizeMode = "original-size"),
			nextResizeMode !== curResizeMode && (inputFactor.value = 1));
		const t = parseFloat(inputFactor.value) || 0.1;
		((inputWidth.value = Math.round(originalImageSize.width * t)),
			(inputHeight.value = Math.round(originalImageSize.height * t)),
			e(!0, !1));
	} else if (document.getElementById("full-width").checked)
		((nextResizeMode = "full-width"),
			nextResizeMode !== curResizeMode && (inputFactor.value = 0),
			(inputWidth.value = 160),
			(inputHeight.value = Math.round(
				originalImageSize.height * (160 / originalImageSize.width),
			)),
			e(!0, !0));
	else if (document.getElementById("full-height").checked)
		((nextResizeMode = "full-height"),
			nextResizeMode !== curResizeMode && (inputFactor.value = 0),
			(inputHeight.value = 120),
			(inputWidth.value = Math.round(
				originalImageSize.width * (120 / originalImageSize.height),
			)),
			e(!0, !0));
	else if (document.getElementById("scale").checked) {
		((nextResizeMode = "scale"),
			nextResizeMode !== curResizeMode && (inputFactor.value = 0.25));
		const t = parseFloat(inputFactor.value) || 0.1;
		((inputWidth.value = Math.round(originalImageSize.width * t)),
			(inputHeight.value = Math.round(originalImageSize.height * t)),
			e(!1, !1));
	}
	((curResizeMode = nextResizeMode),
		(document.getElementById("canvas-res").textContent =
			`Size: ${inputWidth.value} x ${inputHeight.value} px`));
}

function createAsciiRowStream(e, t, a, n, i) {
	if (!n) {
		return {
			beginFrame() {},
			onSourceRow() {},
			finish() {},
		};
	}
	const o = Math.max(1, Math.min(i, e));
	const r = (e / o) * 2;
	const s = Math.max(1, Math.round(t / r));
	const l = asciiCharsetSelect.value;
	const c = makeAsciiLumaTable(rgbPalette);
	const width = e;
	const u = createIndexMap(width * t);
	let d = 0;
	const h = (n) => a.appendLine(buildAsciiLine(n, e, t, u, rgbPalette, l, o, c));
	return {
		beginFrame(e) {
			d = 0;
			u.fill(0);
			if (e) {
				a.appendLine(e);
			}
		},
		onSourceRow(e, a) {
			// Always copy one image row (length === width). Engines must pass a
			// row view; if a full map is supplied, take the matching slice.
			const rowOffset = e * width;
			if (a && a.length >= rowOffset + width && a.length !== width) {
				u.set(a.subarray(rowOffset, rowOffset + width), rowOffset);
			} else if (a && a.length >= width) {
				u.set(a.subarray(0, width), rowOffset);
			}
			while (d < s && !(e + 1 < Math.min(t, Math.ceil((d + 1) * r)))) {
				h(d);
				d += 1;
			}
		},
		finish() {
			while (d < s) {
				h(d);
				d += 1;
			}
		},
	};
}
function throwIfStopRequested() {
	if (!stopTextProcessingFlag) return;
	const error = new Error("Image and text processing stopped by user.");
	error.name = "AbortError";
	throw error;
}

async function yieldOutputFrame() {
	await new Promise((e) => {
		("function" == typeof requestAnimationFrame ? requestAnimationFrame : setTimeout)(e, 0);
	});
	throwIfStopRequested();
}

const processingStatusLines = {
	phase: "",
	graphics: "",
	text: "",
};

const processingProgress = {
	graphics: null,
	text: null,
};

const processingTiming = {
	startedAt: 0,
	/** Whole-job units (1 for static image, N for animation frames). */
	totalUnits: 1,
	/** Fully finished units (frames) before the one currently running. */
	completedUnits: 0,
};

function renderProcessingStatus() {
	statusDiv.style.whiteSpace = "pre-wrap";
	statusDiv.textContent = Object.values(processingStatusLines).filter(Boolean).join("\n");
	if (processingStatusActive) {
		runButton.style.whiteSpace = "pre-wrap";
		runButton.textContent = statusDiv.textContent;
	}
}

/** ETA as HH:MM:SS.MsMs — MsMs is milliseconds at 2 digits (10ms steps). */
function formatEta(seconds) {
	const msTotal = Math.max(0, Number(seconds) || 0) * 1000;
	const hours = Math.floor(msTotal / 3600000);
	const minutes = Math.floor((msTotal % 3600000) / 60000);
	const secs = Math.floor((msTotal % 60000) / 1000);
	// 2-digit ms: 00–99 representing floor(ms / 10) so the display actually ticks.
	const ms2 = Math.floor((msTotal % 1000) / 10);
	const pad2 = (n) => String(n).padStart(2, "0");
	return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}.${pad2(ms2)}`;
}

/** Current process percent with 6 decimal places + ETA over the whole job. */
function currentStatus(percent) {
	const current = Math.max(0, Math.min(100, Number(percent) || 0));
	const currentText = current.toFixed(6);
	if (current >= 100 || !processingTiming.startedAt) {
		return `Current: ${currentText}% - ETA${formatEta(0)}`;
	}
	const elapsedSeconds = Math.max(0, (performance.now() - processingTiming.startedAt) / 1000);
	const etaSeconds = current > 0 ? (elapsedSeconds * (100 - current)) / current : 0;
	return `Current: ${currentText}% - ETA${formatEta(etaSeconds)}`;
}

/**
 * Map channel progress inside the current unit onto whole-job percent.
 * Example: frame 3/10 at 50% graphics → (2 + 0.5) / 10 * 100.
 */
function overallJobPercent() {
	const total = Math.max(1, processingTiming.totalUnits || 1);
	const done = Math.max(0, processingTiming.completedUnits || 0);
	const g = processingProgress.graphics;
	const t = processingProgress.text;
	let unitFrac = 0;
	if (Number.isFinite(g) && Number.isFinite(t)) unitFrac = (g + t) / 200;
	else if (Number.isFinite(g)) unitFrac = g / 100;
	else if (Number.isFinite(t)) unitFrac = t / 100;
	unitFrac = Math.max(0, Math.min(1, unitFrac));
	return Math.max(0, Math.min(100, ((done + unitFrac) / total) * 100));
}

function updateLiveTotalProgress() {
	processingStatusLines.phase = currentStatus(overallJobPercent());
}

function resetProcessingStatusLines(totalUnits = 1) {
	processingStatusLines.phase = "";
	processingStatusLines.graphics = "";
	processingStatusLines.text = "";
	processingProgress.graphics = null;
	processingProgress.text = null;
	processingTiming.startedAt = performance.now();
	processingTiming.totalUnits = Math.max(1, Number(totalUnits) || 1);
	processingTiming.completedUnits = 0;
	renderProcessingStatus();
}

/** Mark the current unit finished and advance the whole-job counter. */
function completeProcessingUnit() {
	processingTiming.completedUnits = Math.min(
		processingTiming.totalUnits,
		(processingTiming.completedUnits || 0) + 1,
	);
	processingProgress.graphics = null;
	processingProgress.text = null;
	updateLiveTotalProgress();
	renderProcessingStatus();
}

function setProcessingStatusLine(channel, message) {
	processingStatusLines[channel] = message;
	if (channel === "graphics" || channel === "text") {
		const match = String(message).match(/(\d+(?:\.\d+)?)%/);
		if (match) {
			processingProgress[channel] = Math.max(0, Math.min(100, Number(match[1])));
			updateLiveTotalProgress();
		}
	}
	renderProcessingStatus();
}

// MakeCode constant name for one conversion run: local date, time and UTC offset,
// with letters, digits and underscores only (e.g. pic_pic2mkca_20261027_054230_UTCp0700).
function makecodeVariableName(date = new Date()) {
	const pad = (value, length = 2) => String(value).padStart(length, "0");
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes >= 0 ? "p" : "m";
	const absOffset = Math.abs(offsetMinutes);
	return (
		`pic_pic2mkca_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
		`_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` +
		`_UTC${sign}${pad(Math.floor(absOffset / 60))}${pad(absOffset % 60)}`
	);
}

function createProcessedTextOutput(width, height, makecodeEnabled, asciiEnabled, asciiWidth) {
	const makecodeWriter = makecodeEnabled ? createStringOutputWriter("makecode") : null;
	const asciiWriter = createStringOutputWriter("ascii");
	const asciiRows = createAsciiRowStream(width, height, asciiWriter, asciiEnabled, asciiWidth);
	const textOutputEnabled = makecodeEnabled || asciiEnabled;
	const makecodeDeclaration = `const ${makecodeVariableName()} = `;
	const textOutputLabel = makecodeEnabled && asciiEnabled ? "Makecode+Ascii" : makecodeEnabled ? "Makecode" : "Ascii";
	let rowsSinceRender = 0;
	const startFollowTail = () => {
		getOutputState("makecode").followTail = true;
		getOutputState("ascii").followTail = true;
	};
	return {
		// Kept for call-site compatibility; engine index rows are the only ASCII source.
		setAsciiSource(_data) {},
		startStatic() {
			if (!textOutputEnabled) return;
			makecodeWriter?.reset();
			asciiWriter.reset();
			makecodeWriter?.appendLine(`${makecodeDeclaration}img\``);
			asciiRows.beginFrame();
			rowsSinceRender = 0;
			startFollowTail();
			renderOutputViewports();
		},
		startAnimation() {
			if (!textOutputEnabled) return;
			makecodeWriter?.reset(`${makecodeDeclaration}[`);
			asciiWriter.reset();
			rowsSinceRender = 0;
			startFollowTail();
			renderOutputViewports();
		},
		beginFrame(frameNumber, frameTotal) {
			if (!textOutputEnabled) return;
			if (frameNumber > 1) {
				makecodeWriter?.appendLine(",");
				asciiEnabled && asciiWriter.appendLine("");
			}
			makecodeWriter?.appendLine("img`");
			asciiRows.beginFrame(`Frame ${frameNumber}${frameTotal ? `/${frameTotal}` : ""}:`);
			rowsSinceRender = 0;
			renderOutputViewports();
		},
		async onRow(row, line, sourceRow) {
			throwIfStopRequested();
			const textProgress = Math.min(100, Math.round(((row + 1) / Math.max(1, height)) * 100));
			if (row === 0 || textProgress % 8 < 1 || row === height - 1) {
				setProcessingStatusLine("text", `Processing Text(${textOutputLabel}): ${textProgress}%...`);
			}
			makecodeWriter?.appendLine(line);
			if (sourceRow) asciiRows.onSourceRow(row, sourceRow);
			rowsSinceRender += 1;
			if (isTextViewerEnabled() && rowsSinceRender >= 40) {
				rowsSinceRender = 0;
				renderOutputViewports();
				await yieldOutputFrame();
			} else if (!isTextViewerEnabled()) {
				rowsSinceRender = 0;
			}
		},
		finishStatic() {
			if (!textOutputEnabled) return;
			makecodeWriter?.appendLine("`");
			asciiRows.finish();
			finishOutputViewports();
		},
		finishFrame() {
			if (!textOutputEnabled) return;
			makecodeWriter?.appendLine("`");
			asciiRows.finish();
			renderOutputViewports();
		},
		finishAnimation() {
			if (!textOutputEnabled) return;
			makecodeWriter?.appendLine("]");
			finishOutputViewports();
		},
	};
}

async function processAnimation(e, t) {
	indexedOutputPalette = null;
	await selectTemporaryPaletteFromAnimation(animSource, e, t);
	const a = animSource,
		n = await a.open();
	if (!n) throw new Error("Unable to open animation frame stream.");
	const i = a.repeat ?? n.repeat ?? null,
		o = a.frameCount || n.frameCount || 0;
	// Whole-job progress spans every frame (not 0–100% reset per frame).
	processingTiming.totalUnits = Math.max(1, o || 1);
	processingTiming.completedUnits = 0;
	processingProgress.graphics = 0;
	processingProgress.text = 0;
	updateLiveTotalProgress();
	const r = createAnimatedOutputWriter(sourceExtension, {
			width: e,
			height: t,
			repeat: i,
			frameCount: o,
			fps: n.fps || a.fps || null,
			duration: n.duration || a.duration || null,
		}),
		s = engineSelect.value,
		l = parseInt(asciiWidthInput.value) || 80,
		textOutputEnabled = makecodeEnableCheck.checked || asciiEnableCheck.checked,
		c = createProcessedTextOutput(
			e,
			t,
			makecodeEnableCheck.checked,
			asciiEnableCheck.checked,
			l,
		);
	// A one-frame source (static GIF/APNG/WebP...) is a normal image value in the
	// MakeCode string output, not a one-element array of images.
	const singleFrameText = o === 1;
	singleFrameText ? c.startStatic() : c.startAnimation();
	let u = null,
		d = 0;
	try {
	for await (const a of n) {
		throwIfStopRequested();
		const n = d + 1,
			i = o ? `/${o}` : "";
		// Unknown length: grow the job denominator so percent stays monotonic.
		if (!o) processingTiming.totalUnits = Math.max(processingTiming.totalUnits, n + 1);
		processingProgress.graphics = 0;
		processingProgress.text = 0;
		singleFrameText || c.beginFrame(n, o);
		// Buffer-first: quantize from ImageData, not from process-canvas pixels.
		const l = frameToImageData(a, e, t);
		const p = new ImageData(e, t),
			h = imageDataHasAlpha(l.data),
			g = c.onRow;
		c.setAsciiSource(l.data);
		const m =
				"webgl" === s && renderSelect.value === "bitmap"
					? await runGLPipeline({
							canvas: canvas,
							data: l.data,
							w: e,
							h: t,
							mode: ditheringSelect.value,
							rgbPalette: rgbPalette,
							outImgData: p,
							hasAlpha: h,
							onRow: textOutputEnabled ? g : null,
							onProgress: async (e) => {
								((runButton.textContent = `Converting frame ${n}${i}: ${e}%`),
									(setProcessingStatusLine("graphics", `Processing frame ${n}${i}: ${e}%`)),
									await yieldOutputFrame());
							},
						})
					: "webgl" === s
						? await runGpuTiledPipeline(
								l,
								e,
								t,
								p,
								`Processing frame ${n}${i}`,
								`Converting frame ${n}${i}`,
								h,
								g,
							)
						: await runCPUPipelineFallback(
								l,
								e,
								t,
								p,
								`Processing frame ${n}${i}`,
								`Converting frame ${n}${i}`,
								h,
								g,
								{ current: n, total: o },
							),
			f =
				m.indexMap instanceof Uint8Array || m.indexMap instanceof Uint16Array
					? m.indexMap
					: createIndexMap(m.indexMap.length),
			w = makeOutputDelta(f, u, e, t, a);
		((u = f),
			presentProcessedImageData(imageDataFromIndexMap(f, e, t, rgbPalette)),
			await r.add({
				...w,
				delay: a.delay,
				disposal: a.disposal ?? 0,
				compositionMode: w.changedOnly ? "overlay" : "replace",
			}),
			await (singleFrameText ? c.finishStatic() : c.finishFrame()),
			(d += 1),
			completeProcessingUnit(),
			(runButton.textContent = `Converting frame ${d}${i}...`),
			(setProcessingStatusLine("graphics", `Processing frame ${d}${i}...`)),
			releaseFrame(a),
			await yieldOutputFrame());
	}
	} catch (failure) {
		r.abort?.();
		throw failure;
	}
	if (!d) throw new Error("Animation stream returned no frames.");
	(singleFrameText || c.finishAnimation(),
		(processingTiming.completedUnits = processingTiming.totalUnits),
		(processingProgress.graphics = 100),
		(processingProgress.text = 100),
		updateLiveTotalProgress(),
		(processedAnimation = {
			mimeType: originalMimeType,
			width: e,
			height: t,
			frameCount: d,
			repeat: i,
			streamed: !0,
			asciiFrames: asciiEnableCheck.checked,
		}),
		throwIfStopRequested(),
		setOutputBlob(await r.finish()),
		(setProcessingStatusLine("phase", currentStatus(100))),
		setButtonState("almost"),
		(isTextProcessing = !1),
		(downloadTextButton.textContent = "Download Text"));
}

function makeOutputDelta(e, t, a, n, i) {
	if (!t || !i.changedOnly)
		return {
			indexMap: e,
			width: a,
			height: n,
			rect: {
				x: 0,
				y: 0,
				width: a,
				height: n,
			},
			changedOnly: !1,
		};
	const o = i.sourceWidth || i.width || a,
		r = i.sourceHeight || i.height || n,
		s = i.rect || {
			x: 0,
			y: 0,
			width: o,
			height: r,
		},
		l = a / o,
		c = n / r;
	let u = Math.max(0, Math.floor(s.x * l)),
		d = Math.max(0, Math.floor(s.y * c)),
		p = Math.min(a, Math.ceil((s.x + s.width) * l)),
		h = Math.min(n, Math.ceil((s.y + s.height) * c)),
		g = !1;
	for (let n = d; n < h; n += 1)
		for (let i = u; i < p; i += 1) {
			const o = n * a + i;
			e[o] !== t[o] &&
				((g = !0),
				(u = Math.min(u, i)),
				(p = Math.max(p, i + 1)),
				(d = Math.min(d, n)),
				(h = Math.max(h, n + 1)));
		}
	g ||
		((u = Math.max(0, Math.min(a - 1, Math.floor(s.x * l)))),
		(d = Math.max(0, Math.min(n - 1, Math.floor(s.y * c)))),
		(p = u + 1),
		(h = d + 1));
	const m = createIndexMap(Math.max(1, p - u) * Math.max(1, h - d));
	let f = 0;
	for (let n = d; n < h; n += 1)
		for (let i = u; i < p; i += 1) {
			const o = n * a + i;
			m[f++] = e[o] === t[o] ? 0 : e[o];
		}
	return {
		indexMap: m,
		width: p - u,
		height: h - d,
		rect: {
			x: u,
			y: d,
			width: p - u,
			height: h - d,
		},
		changedOnly: !0,
	};
}

function imageDataHasAlpha(e) {
	for (let t = 3; t < e.length; t += 4) if (e[t] < 255) return !0;
	return !1;
}

async function runCPUPipelineFallback(e, t, a, n, i, j, o = imageDataHasAlpha(e.data), r, wasmFrame = null) {
	return runConversionPipeline({
		data: e.data,
		w: t,
		h: a,
		mode: ditheringSelect.value,
		rgbPalette: rgbPalette,
		outImgData: n,
		hasAlpha: o,
		onRow: r,
		wasmFrame,
		onProgress: async (e) => {
			const wasmActive = engineSelect.value === "wasm";
			if (renderSelect.value === "bitmap") ctx.putImageData(n, 0, 0);
			if (!wasmActive) {
				runButton.textContent = !!j ? `${j}: ${e}%` : `Converting... ${e}%`;
				setProcessingStatusLine("graphics", !!i ? `${i}: ${e}%` : `Processing CPU pipeline... ${e}%`);
			}
			await new Promise((resolve) => requestAnimationFrame(resolve));
		},
	});
}

async function runGpuTiledPipeline(e, t, a, n, i, j, o = imageDataHasAlpha(e.data), r) {
	if (ditheringSelect.value === "error") return runCPUPipelineFallback(e, t, a, n, i, j, o, r);
	return runConversionPipeline({
		data: e.data,
		w: t,
		h: a,
		mode: ditheringSelect.value,
		rgbPalette,
		outImgData: n,
		hasAlpha: o,
		onRow: r,
		engine: "webgl",
		onProgress: async (progress) => {
			runButton.textContent = j ? `${j}: ${progress}%` : `Converting... ${progress}%`;
			setProcessingStatusLine(
				"graphics",
				i ? `${i}: ${progress}%` : `Processing GPU tile buffer... ${progress}%`,
			);
			await new Promise((resolve) => requestAnimationFrame(resolve));
		},
	});
}


function imageDataFromIndexMap(indexMap, width, height, palette) {
	const imageData = new ImageData(width, height);
	const data = imageData.data;
	for (let i = 0; i < indexMap.length; i += 1) {
		const color = palette[indexMap[i]];
		const o = i << 2;
		if (!color || indexMap[i] === 0 || (color.a ?? 255) < 128) {
			data[o] = data[o + 1] = data[o + 2] = data[o + 3] = 0;
			continue;
		}
		data[o] = color.r;
		data[o + 1] = color.g;
		data[o + 2] = color.b;
		data[o + 3] = 255;
	}
	return imageData;
}

/** Nearest-neighbor scale on pure RGBA buffers (no canvas). */
function scaleImageData(source, destWidth, destHeight) {
	if (!source || !source.data) return new ImageData(destWidth, destHeight);
	if (source.width === destWidth && source.height === destHeight) return source;
	const out = new ImageData(destWidth, destHeight);
	const sw = source.width;
	const sh = source.height;
	const src = source.data;
	const dst = out.data;
	for (let y = 0; y < destHeight; y += 1) {
		const sy = Math.min(sh - 1, ((y * sh) / destHeight) | 0);
		for (let x = 0; x < destWidth; x += 1) {
			const sx = Math.min(sw - 1, ((x * sw) / destWidth) | 0);
			const si = (sy * sw + sx) << 2;
			const di = (y * destWidth + x) << 2;
			dst[di] = src[si];
			dst[di + 1] = src[si + 1];
			dst[di + 2] = src[si + 2];
			dst[di + 3] = src[si + 3];
		}
	}
	return out;
}

/**
 * Resolve a decoded frame to ImageData buffer.
 * Canvas is only a last-resort bridge for sources that have no pixel buffer yet.
 */
function frameToImageData(frame, destWidth, destHeight) {
	if (
		frame?.imageData &&
		frame.imageData.data &&
		frame.imageData.data.length === frame.imageData.width * frame.imageData.height * 4
	) {
		return scaleImageData(frame.imageData, destWidth, destHeight);
	}
	if (!frame?.image) {
		throw new Error("Frame has neither imageData buffer nor drawable image.");
	}
	// Last resort: one-shot read from drawable into a buffer, then abandon canvas path.
	const srcW = frame.width || frame.image.width || destWidth;
	const srcH = frame.height || frame.image.height || destHeight;
	const bridge = document.createElement("canvas");
	bridge.width = srcW;
	bridge.height = srcH;
	const bridgeCtx = bridge.getContext("2d", { willReadFrequently: true });
	bridgeCtx.globalCompositeOperation = "copy";
	bridgeCtx.drawImage(frame.image, 0, 0, srcW, srcH);
	const raw = bridgeCtx.getImageData(0, 0, srcW, srcH);
	return scaleImageData(raw, destWidth, destHeight);
}

/** Present processed pixels: buffer → process canvas (for WebGL/debug) + output <img>. */
function presentProcessedImageData(imageData) {
	if (!imageData) return;
	if (canvas.width !== imageData.width) canvas.width = imageData.width;
	if (canvas.height !== imageData.height) canvas.height = imageData.height;
	ctx.putImageData(imageData, 0, 0);
	if (outputImage && isImageViewerEnabled()) {
		try {
			outputImage.src = canvas.toDataURL("image/png");
			outputImage.style.display = "block";
			outputImage.style.visibility = "visible";
			outputImage.setAttribute("aria-hidden", "false");
		} catch (_) {
			/* export optional */
		}
	}
}

let indexedOutputPalette = null;

function paletteForOutput() {
	if (indexedOutputPalette) {
		return indexedOutputPalette.map((index) => rgbPalette[index] || { r: 0, g: 0, b: 0, a: 0 });
	}
	const palette = rgbPalette.slice(0, 256);
	return (
		(palette.length && palette[0].a === 0) || palette.unshift({ r: 0, g: 0, b: 0, a: 0 }),
		palette
	);
}

function prepareIndexedOutput(indexMap) {
	const used = new Set([0]);
	for (const index of indexMap) used.add(index);
	const sourceIndices = Array.from(used)
		.filter((index) => index < rgbPalette.length)
		.slice(0, 256);
	const remap = new Uint8Array(indexMap.length);
	const map = new Map(sourceIndices.map((index, outputIndex) => [index, outputIndex]));
	for (let index = 0; index < indexMap.length; index += 1) {
		const sourceIndex = indexMap[index];
		remap[index] = map.get(sourceIndex) ?? 0;
	}
	indexedOutputPalette = sourceIndices;
	return remap;
}

function createAnimatedOutputWriter(e, t) {
	if ("gif" === e) return createGifStreamWriter(t);
	if ("apng" === e || "png" === e) return createApngStreamWriter(t);
	if (["webm", "mp4", "mkv", "mov"].includes(e)) {
		const keepAudio = !!(videoKeepAudioCheck && videoKeepAudioCheck.checked);
		return createVideoStreamWriter(e, {
			...t,
			keepAudio,
			audioBuffer: keepAudio ? uploadedFileBuffer : null,
			audioMime: keepAudio ? originalMimeType : null,
		});
	}
	throw new Error(
		`Animated ${e.toUpperCase()} output cannot be encoded safely in this browser without changing the requested extension.`,
	);
}

function downloadBlob(e, t) {
	const a = URL.createObjectURL(e),
		n = document.createElement("a");
	((n.href = a),
		(n.download = t),
		n.click(),
		setTimeout(() => {
			(URL.revokeObjectURL(a), n.remove());
		}, 0));
}

(document.querySelectorAll('input[name="resize"], #factor').forEach((e) => {
	(e.addEventListener("change", updateCalculatedDimensions),
		e.addEventListener("input", updateCalculatedDimensions));
}),
	inputWidth.addEventListener("input", function () {
		(inputRatio.checked &&
			originalImageSize.width > 0 &&
			(inputHeight.value = Math.round(
				(originalImageSize.height * (parseInt(this.value) || 1)) / originalImageSize.width,
			)),
			(document.getElementById("canvas-res").textContent =
				`Size: ${inputWidth.value} x ${inputHeight.value} px`));
	}),
	inputHeight.addEventListener("input", function () {
		(inputRatio.checked &&
			originalImageSize.height > 0 &&
			(inputWidth.value = Math.round(
				(originalImageSize.width * (parseInt(this.value) || 1)) / originalImageSize.height,
			)),
			(document.getElementById("canvas-res").textContent =
				`Size: ${inputWidth.value} x ${inputHeight.value} px`));
	}),
	parametersForm.addEventListener("submit", async function (e) {
		if ((e.preventDefault(), !runButton.disabled)) {
			resetOutputString("makecode");
			renderOutputViewport("makecode");
			const fr = document.getElementById("reset");
			try {
				const e = document.querySelector(
					"#original-preview-zone img, #original-preview-zone video, #original-preview-zone canvas",
				);
				if (!e) return;
				fr.disabled = false;
				isProcessing = true;
				stopTextProcessingFlag = false;
				((canvasName = `${fileStem()}.${sourceExtension}`),
					(processedAnimation = null),
					parseCurrentPalette());
				temporaryPaletteIndices = null;
				indexedOutputPalette = null;
				const t = parseInt(inputWidth.value) || 16,
					a = parseInt(inputHeight.value) || 16;
				if (
					(canvas.width = t),
					(canvas.height = a),
					(processingStatusActive = true),
					lockViewersForProcess(),
					setButtonState("processing"),
					(runButton.textContent = "Converting..."),
					(resetProcessingStatusLines(), setProcessingStatusLine("phase", currentStatus(0))),
					resetOutputString("makecode"),
					renderOutputViewport("makecode"),
					resetOutputString("ascii"),
					renderOutputViewport("ascii"),
					animSource)
					return (
						await processAnimation(t, a),
						(fr.disabled = false),
						(processingStatusActive = false),
						unlockViewersAfterProcess(), setButtonState("done"),
						updateTextDownloadState(),
						void (stopTextProcessingFlag
							? (statusDiv.textContent = "Text output generation stopped by user.")
							: (statusDiv.textContent = "Success: Animation conversion completed!"))
					);
				// Static non-animation path: one bridge draw into a buffer, then quantize on buffers only.
				((ctx.globalCompositeOperation = "copy"),
					ctx.clearRect(0, 0, t, a),
					ctx.drawImage(e, 0, 0, t, a),
					(ctx.globalCompositeOperation = "source-over"));
				const n = ctx.getImageData(0, 0, t, a);
				selectTemporaryPaletteFromPixels(n.data);
				const i = new ImageData(t, a),
					o = engineSelect.value,
					r = parseInt(asciiWidthInput.value) || 80,
					textOutputEnabled = makecodeEnableCheck.checked || asciiEnableCheck.checked,
					s = createProcessedTextOutput(
						t,
						a,
						makecodeEnableCheck.checked,
						asciiEnableCheck.checked,
						r,
					);
				s.setAsciiSource(n.data);
				let l;
				s.startStatic();
				const c = imageDataHasAlpha(n.data);
				("webgl" === o && renderSelect.value === "bitmap"
					? (l = await runGLPipeline({
							canvas: canvas,
							data: n.data,
							w: t,
							h: a,
							mode: ditheringSelect.value,
							rgbPalette: rgbPalette,
							outImgData: i,
							hasAlpha: c,
							onRow: textOutputEnabled ? s.onRow : null,
							onProgress: async (e) => {
								((runButton.textContent = `Converting... ${e}%`),
									setProcessingStatusLine("graphics", `Processing GPU pipeline... ${e}%`),
									await new Promise((e) => requestAnimationFrame(e)));
							},
						}))
					: "webgl" === o
						? (l = await runGpuTiledPipeline(n, t, a, i, null, null, c, textOutputEnabled ? s.onRow : null))
						: (l = await runCPUPipelineFallback(n, t, a, i, null, null, c, textOutputEnabled ? s.onRow : null)),
					presentProcessedImageData(
						imageDataFromIndexMap(l.indexMap, t, a, rgbPalette),
					),
					await s.finishStatic(),
					setButtonState("almost"),
					(lastIndexMap = l.indexMap),
					(lastW = t),
					(lastH = a),
					asciiEnableCheck.checked &&
						addToSessionLog(
							"ASCII",
							`ASCII output generated during image processing (${r} cols, charset: ${asciiCharsetSelect.value}).`,
						),
					(outputBlob = await encodeStaticOutput(l, t, a)),
					setOutputBlob(outputBlob),
					completeProcessingUnit(),
					(setProcessingStatusLine("phase", currentStatus(100))),
					(processingStatusActive = false),
					unlockViewersAfterProcess(), setButtonState("done"),
					updateTextDownloadState(),
					stopTextProcessingFlag
						? (statusDiv.textContent = "Text output generation stopped by user.")
						: (statusDiv.textContent = "Success: Conversion completed successfully!"));
			} catch (e) {
				if (e?.name === "AbortError" || stopTextProcessingFlag) {
					statusDiv.textContent = "Image and text processing stopped by user.";
					unlockViewersAfterProcess();
					setButtonState("imageLoaded");
				} else {
					unlockViewersAfterProcess();
					setButtonState("imageLoaded");
					displayErrorPopup("Pipeline Processing Fatal Exception", e.message, e.stack);
				}
			}
			fr.disabled = false;
		}
	}),
parametersForm.addEventListener("reset", async function (e) {
	e.preventDefault();
	
	// 1. รีเซ็ตข้อความสถานะระบบและเคลียร์ไฟล์ที่อัปโหลด
	document.getElementById("status").textContent = "System Status: Awaiting Image Upload Asset...";
	mediaFileInput.value = "";
	if (palettemediaFileInput) palettemediaFileInput.value = "";

	// 2. เรียกใช้ฟังก์ชันล้างสถานะข้อมูลภาพ/แอนิเมชัน/ผลลัพธ์ที่ประมวลผลไว้
	resetLoadedState();

	// 3. ล้างพรีวิวภาพต้นฉบับและข้อมูลขนาดความละเอียด (Resolution)
	const previewZone = document.getElementById("original-preview-zone");
	if (previewZone) previewZone.replaceChildren();
	const originalRes = document.getElementById("original-res");
	if (originalRes) originalRes.textContent = "Size: 0 x 0";
	const canvasRes = document.getElementById("canvas-res");
	if (canvasRes) canvasRes.textContent = "Size: 0 x 0";

	// 4. รีเซ็ตค่าฟอร์มและตัวเลือกการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้น
	const originalSizeRadio = document.getElementById("original-size");
	if (originalSizeRadio) originalSizeRadio.checked = true;
	const factorInput = document.getElementById("factor");
	if (factorInput) factorInput.value = "";
	const ratioCheck = document.getElementById("ratio");
	if (ratioCheck) ratioCheck.checked = true;
	const widthInput = document.getElementById("width");
	if (widthInput) widthInput.value = "";
	const heightInput = document.getElementById("height");
	if (heightInput) heightInput.value = "";

	// รีเซ็ตค่า Dithering, Render, และ Engine
	if (ditheringSelect) ditheringSelect.value = "solid";
	if (renderSelect) renderSelect.value = "bitmap";
	if (renderTilePowerInput) renderTilePowerInput.value = "7";
	if (typeof updateRenderOptionControls === "function") updateRenderOptionControls();

	if (makecodeEnableCheck) {
		makecodeEnableCheck.checked = true;
		makecodeEnableCheck.disabled = false;
	}
	if (asciiEnableCheck) {
		asciiEnableCheck.checked = false;
		if (asciiSubOptions) asciiSubOptions.style.display = "none";
	}
	if (asciiTabBtn) asciiTabBtn.disabled = true;
	if (asciiCharsetSelect) asciiCharsetSelect.value = "standard";
	if (asciiWidthInput) asciiWidthInput.value = "80";

	if (engineSelect) engineSelect.value = "script";
	if (typeof updateEngineAvailability === "function") updateEngineAvailability();

	if (videoKeepAudioCheck) videoKeepAudioCheck.checked = false;
	if (typeof updateVideoOptionsVisibility === "function") updateVideoOptionsVisibility(false);

	// 5. รีเซ็ตสีพาเลตต์ (Palette) กลับเป็นค่าเริ่มต้น (Arcade)
	if (paletteLimitInput) paletteLimitInput.value = "15";
	if (predefinedPaletteSelect) {
		predefinedPaletteSelect.value = "arcade";
		const customOpt = predefinedPaletteSelect.querySelector('option[value="custom"]');
		if (customOpt) customOpt.classList.add("hidden");
	}
	if (typeof predefinedPalettes !== "undefined" && predefinedPalettes.arcade) {
		setPaletteValues(predefinedPalettes.arcade);
	} else if (typeof setPaletteValues === "function") {
		setPaletteValues([
			"#ffffff", "#ff2121", "#ff93c4", "#ff8135", "#fff609",
			"#249ca3", "#78dc52", "#003fad", "#87f2ff", "#8e2ec4",
			"#a4839f", "#5c406c", "#e5cdc4", "#91463d", "#000000"
		]);
	}

	// 6. สลับหน้าจอแท็บผลลัพธ์กลับมาที่ PixelArt เสมอ
	const pixelartTabBtn = document.querySelector('.tab-btn[data-tab="pixelart"]');
	if (pixelartTabBtn) pixelartTabBtn.click();

	// 7. ล็อค/ปิดการใช้งานฟิลด์ขนาดภาพ (Size settings) จนกว่าจะมีการอัปโหลดรูปใหม่
	document.querySelectorAll("#size-settings input").forEach((el) => {
		el.disabled = true;
	});

	// 8. ปรับสถานะปุ่มทั้งหมดกลับเป็นโหมดไม่มีรูปภาพ (`noImage`)
	setButtonState("noImage");

	// 9. ซ่อนกล่องพรีวิวภาพ
	if (previewContainer) {
		previewContainer.style.display = "none";
		previewContainer.classList.remove("is-visible");
	}
	if (typeof applyViewerVisibility === "function") applyViewerVisibility();

	addToSessionLog("SYSTEM", "Form successfully reset to initial state.");
});

function getActiveOutputName() {
	return document.getElementById("tab-ascii").classList.contains("active") ? "ascii" : "makecode";
}

let curnav = "size-settings";

function changeNavOfFromUI(name) {
	if (curnav === name) return;
	const prevdom = document.querySelector(`div#${curnav}`);
		if (prevdom !== undefined)
			if (!prevdom.classList.contains("hidden"))
				prevdom.classList.add("hidden");
	const newdom = document.querySelector(`div#${name}`);
	if (newdom !== undefined)
		if (newdom.classList.contains("hidden"))
			newdom.classList.remove("hidden"), curnav = name;
}

document.querySelector("div#navbar button.size-settings").addEventListener("click", async function(e) {
	e.preventDefault();
	new Promise(p => changeNavOfFromUI("size-settings"));
}),document.querySelector("div#navbar button.processing-option").addEventListener("click", async function(e) {
	e.preventDefault();
	new Promise(p => changeNavOfFromUI("processing-option"));
}),document.querySelector("div#navbar button.palette-manager").addEventListener("click", async function(e) {
	e.preventDefault();
	new Promise(p => changeNavOfFromUI("palette-manager"));
})

async function downloadOutputString(value, flag) {
	let temporaryBlob = new Blob([value], { type: "text/plain" });
	let temporaryLink = document.createElement("a");
	temporaryLink.href = URL.createObjectURL(temporaryBlob);
	temporaryLink.download = `${flag}_${canvasName.replace(".", "_")}.txt`;
	temporaryLink.click();
	setTimeout(() => {
		(URL.revokeObjectURL(temporaryLink), temporaryLink.remove());
	}, 0);
}

downloadTextButton.addEventListener("click", async function (e) {
	e.preventDefault();
	if (downloadTextButton.disabled) return;
	if (isTextProcessing) {
		stopTextProcessingFlag = !0;
		return;
	}
	try {
		await downloadOutputString(getOutputString(getActiveOutputName()), getActiveOutputName());
		downloadTextButton.textContent = "Text Downloaded!";
		setTimeout(() => {
			downloadTextButton.textContent = "Download Text";
		}, 2e3);
	} catch (e) {
		displayErrorPopup("Text Download Exception", "Unable to download result string", e.message);
	}
});

(downloadMediaButton.addEventListener("click", async function (e) {
	e.preventDefault();
	try {
		if (processedAnimation?.streamed) {
			if (!outputBlob) throw new Error("The streamed animation output is not ready.");
			return (
				downloadBlob(outputBlob, canvasName),
				void addToSessionLog(
					"IO",
					`Downloaded processed animation (${processedAnimation.frameCount} frames).`,
				)
			);
		}
		const e =
			outputBlob ||
			(await encodeStaticOutput(
				{
					indexMap: lastIndexMap,
				},
				lastW,
				lastH,
			));
		(setOutputBlob(e), downloadBlob(e, canvasName));
		downloadMediaButton.textContent = "File Downloaded!";
		setTimeout(() => {
			downloadMediaButton.textContent = "Download File";
		}, 2e3);
	} catch (e) {
		displayErrorPopup("IO Canvas Download Error", e.message, e.stack);
	}
}),
	window.addEventListener("DOMContentLoaded", () => {
		const e = document.getElementById("page-loader");
		const progress = document.getElementById("page-load-progress");
		if (progress) progress.value = 100;
		if (e) setTimeout(() => e.classList.add("hidden"), 400);
	}));

