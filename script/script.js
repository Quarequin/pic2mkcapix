/** Auto-concatenated from script/* — do not edit; edit modules instead. */

/* ==== script/init/htm.js ==== */
document.querySelector("body div#preload").remove();
document.querySelector("body").insertAdjacentHTML(
	"beforeend",
	`
<div id="page-loader">
	<h1>Convert Picture to Makecode-arcade or Pixel-art</h1>
	<br />
	<div class="loader-content">
		<progress class="loader-progress" id="page-load-progress" max="100" value="0">0%</progress>
		<div class="loader-text">Loading Page...</div>
		<div class="loader-sub">Preparing Picture Converter Engine.</div>
	</div>
</div>
<div id="info">
	<p>
		Upload your image to convert it into pixel art — with optional ASCII
		output and a fully customizable dynamic color palette.
	</p>
	<hr />
	<dl>
		<dt>note for makecode arcade user:</dt>
		<dd>15 palette colors for <i>makecode arcade</i> compatibility.</dd>
		<dt>note for anti-ai user:</dt>
		<dd>this project use <i>ai</i> to make project but you can fork this to make clean-code-reverse-engineer as human code(if possible) sorry. :(</dd>
	</dl>
	<div id="notification-popup-overlay">
		<div class="popup-error-card">
			<div class="popup-header">
				<span>⚠️ PROCESS EXCEPTION DETECTED</span
				><button class="popup-close-btn" id="popup-close-btn">
					DISMISS
				</button>
			</div>
			<div class="popup-body">
				<p style="margin: 0 0 6px 0">
					<strong>Error Type:</strong
					><span id="popup-err-type">N/A</span>
				</p>
				<p style="margin: 0 0 10px 0">
					<strong>Message:</strong
					><span id="popup-err-message">N/A</span>
				</p>
				<div class="popup-controls">
					<button class="popup-toggle-btn" id="btn-toggle-log">
						Show Full Log ▼
					</button>
				</div>
				<textarea id="popup-err-stack" readonly>
No trace details available.</textarea>
			</div>
		</div>
	</div>
</div>
<div id="status">System Status: Awaiting Image Upload Asset...</div>
<form action="#" method="POST" id="parameters">
	<span><label width="100%">Select Target Source Image:</label><input type="file" id="file" accept="image/*,video/webm,video/mp4,video/x-matroska,video/quicktime,.webm,.mp4,.mkv,.mov" /></span>
	<div id="navbar">
		<button class="size-settings">1.Size setting</button>
		<button class="processing-option">2.Process Edit</button>
		<button class="palette-manager">3.Palette Edit</button>
	</div>
	<div class="settings-group">
		<div class="half">
			<div id="size-settings" class="size-settings-grid">
				<label class="full-row"
					><input
						type="radio"
						name="resize"
						id="original-size"
						checked
						disabled
					/>
					Original Size</label
				><label class="full-row"
					><input
						type="radio"
						name="resize"
						id="full-width"
						disabled
					/>
					Fix Sprite Width (160px)</label
				><label class="full-row"
					><input
						type="radio"
						name="resize"
						id="full-height"
						disabled
					/>
					Fix Sprite Height (120px)</label
				><label class="full-row"
					><input type="radio" name="resize" id="scale" disabled />
					Custom Size</label
				><label style="padding-left: 20px">Scale Factor:</label
				><input
					type="number"
					id="factor"
					value=""
					step="0.1e-9"
					min="0.1e-9"
					max="8"
					disabled
				/><label
					class="full-row"
					style="
						border-top: 1px solid #222;
						margin-top: 8px;
						padding-top: 12px;
					"
					><input type="checkbox" id="ratio" checked disabled /> Keep
					Original Aspect Ratio </label
				><label>Output Width (px):</label
				><input
					type="number"
					id="width"
					value=""
					disabled
					class="custom"
				/><label>Output Height (px):</label
				><input
					type="number"
					id="height"
					value=""
					disabled
					class="custom"
				/>
			</div>
			<div id="processing-option" class="dropdown-selection-group hidden">
				<label for="dithering-option" class="dropdown-label"
					>Dithering Options:</label
				><select id="dithering-option" class="custom-dropdown">
					<option value="solid" selected>Solid (No Dithering)</option>
					<optgroup label="Ordered Dithering (Bayer)">
						<option value="bayer4">Bayer Matrix 4×4</option>
						<option value="bayer8">Bayer Matrix 8×8</option>
						<option value="bayer16">Bayer Matrix 16×16</option>
					</optgroup>
					<optgroup label="Blue Noise Dithering">
						<option value="blue8">Blue Noise 8×8</option>
						<option value="blue16">Blue Noise 16×16</option>
						<option value="blue32">Blue Noise 32×32</option>
						<option value="blue64">Blue Noise 64×64</option>
						<option value="blue128">Blue Noise 128×128</option>
						<option value="blue256">Blue Noise 256×256</option>
					</optgroup>
					<optgroup label="Error Diffusion" id="optgroup-error">
						<option value="error">
							Floyd-Steinberg Error Diffusion
						</option>
					</optgroup>
				</select>
					<hr />
					<label for="render-option" class="dropdown-label">Render Buffer:</label>
					<select id="render-option" class="custom-dropdown">
						<option value="bitmap" selected>Bitmap (full image)</option>
						<option value="auto-tiled">Auto (2^n)×(2^n) Tiled</option>
						<option value="custom-tiled">Custom (2^n)×(2^n) Tiled</option>
						<option value="8x8tiled">8×8 Tiled Buffer</option>
						<option value="16x16tiled">16×16 Tiled Buffer</option>
						<option value="32x32tiled">32×32 Tiled Buffer</option>
						<option value="64x64tiled">64×64 Tiled Buffer</option>
						<option value="128x128tiled">128×128 Tiled Buffer</option>
						<option value="256x256tiled">256×256 Tiled Buffer</option>
					</select>
					<div id="render-custom-options" style="display: none; margin-top: 8px">
						<label for="render-tile-power" class="dropdown-label">Custom tile exponent (2^n):</label>
						<div class="tile-power-slider-row">
							<span class="tile-power-min" aria-hidden="true">3</span>
							<input
								type="range"
								id="render-tile-power"
								class="tile-power-slider"
								min="3"
								max="12"
								value="7"
								step="1"
							/>
							<span class="tile-power-max" aria-hidden="true">12</span>
						</div>
						<small id="render-tile-size-label">n = 7 → Tile size: 128×128</small>
					</div>
				<hr />
				<div id="makecode-options-group">
					<label class="full-row">
						<input type="checkbox" id="makecode-enable" checked /> Enable MakeCode String Output
					</label>
					<small id="makecode-auto-status">MakeCode output is enabled for palettes up to 15 colors.</small>
				</div>
				<div id="video-options-group" class="video-options-group" style="display: none; margin-top: 8px">
					<hr />
					<label class="dropdown-label">Video options:</label>
					<label class="full-row">
						<input type="checkbox" id="video-keep-audio" /> keep original sound
					</label>
					<small id="video-options-hint">Only for video sources (MP4 / MOV / MKV / WebM). When checked, processed video tries to keep the source audio track.</small>
				</div>
				<hr />
				<div id="ascii-options-group">
					<label class="dropdown-label"
						>ASCII Art Output Options:</label
					><label class="full-row"
						><input type="checkbox" id="ascii-enable" /> Enable
						ASCII Output (in Output Tab)
					</label>
					<div
						id="ascii-sub-options"
						style="display: none; margin-top: 8px"
					>
						<label
							for="ascii-charset-select"
							class="dropdown-label"
							style="margin-top: 8px"
							>ASCII Character Set:</label
						><select
							id="ascii-charset-select"
							class="custom-dropdown"
						>
							<option value="standard">
								Standard (█▓▒░ + Symbols)
							</option>
							<option value="block">
								Block Only (█ ▓ ▒ ░ ·)
							</option>
							<option value="alphanumeric">
								Alphanumeric (A-Z, 0-9)
							</option>
							<option value="minimal">
								Minimal ( .:-=+*#%@)
							</option>
							<option value="dense">
								Dense (Full Printable ASCII)
							</option></select
						><label for="ascii-width-input" style="margin-top: 8px"
							>ASCII Columns:</label
						><input
							type="number"
							id="ascii-width-input"
							value="80"
							min="10"
							max="400"
							class="custom"
						/>
					</div>
				</div>
				<hr />
				<label for="engine-select" class="dropdown-label">Processing Engine:</label
				><select id="engine-select" class="custom-dropdown">
					<option value="script" selected>script</option>
					<option value="webgl">webgl</option>
					<option value="wasm">wasm</option>
				</select>
				<small id="wasm-status">WASM is optional; JavaScript fallback is active.</small>
			</div>
		</div>
		<div id="palette-manager" class="colorboard hidden">
			<div class="palette-loader-container">
				<label for="predefined-palette-select"
					>Select Predefined Palette:</label
				><select
					id="predefined-palette-select"
					class="custom-dropdown"
					style="margin-bottom: 10px"
				>
					<option value="custom" class="hidden">Custom</option>
					<optgroup label="Makecode Arcade">
						<option value="arcade" selected>Arcade</option>
						<option value="matte">Matte</option>
						<option value="pastel">Pastel</option>
						<option value="sweet">Sweet</option>
						<option value="poke">Poke</option>
						<option value="adventure">Adventure</option>
						<option value="diy">DIY</option>
						<option value="adafruit">Adafruit</option>
						<option value="still_life">Still Life</option>
						<option value="steam_punk">Steam Punk</option>
						<option value="grayscale">Grayscale</option>
					</optgroup></select
				><label>Import Custom Palette File (.txt, .hex):</label
				><input
					type="file"
					id="palette-file-reader"
					accept=".txt,.hex"
				/>
			</div>
			<div class="palette-header-row">
				<span
					style="font-weight: bold; color: rgb(255, 240, 157)"
					id="palette-count-label"
					>Active Color Registers (1–15):</span
				>
				<div class="palette-action-btns">
					<button
						type="button"
						id="palette-add-btn"
						class="palette-slot-btn"
						title="Add Color Slot"
					>
						+ Add Slot</button
					><button
						type="button"
						id="palette-remove-btn"
						class="palette-slot-btn"
						title="Remove Last Slot"
					>
						- Remove
					</button>
				</div>
			</div>
			<div class="palette-range-controls">
				<label for="palette-limit">Palette capacity (2–65535):</label>
				<input type="number" id="palette-limit" class="custom" min="2" max="65535" value="15" />
				<button type="button" id="palette-prev-btn" class="palette-slot-btn">Previous</button>
				<button type="button" id="palette-next-btn" class="palette-slot-btn">Next</button>
				<span id="palette-range-label">Colors 1–10</span>
			</div>
			<div class="colorpad" id="colorpad">
				<div class="color-pair">
					<label>Color 1</label
					><input type="color" value="#ffffff" /><input
						type="text"
						class="colortext"
						value="#ffffff"
					/>
				</div>
				<div class="color-pair">
					<label>Color 2</label
					><input type="color" value="#ff2121" /><input
						type="text"
						class="colortext"
						value="#ff2121"
					/>
				</div>
				<div class="color-pair">
					<label>Color 3</label
					><input type="color" value="#ff93c4" /><input
						type="text"
						class="colortext"
						value="#ff93c4"
					/>
				</div>
				<div class="color-pair">
					<label>Color 4</label
					><input type="color" value="#ff8135" /><input
						type="text"
						class="colortext"
						value="#ff8135"
					/>
				</div>
				<div class="color-pair">
					<label>Color 5</label
					><input type="color" value="#fff609" /><input
						type="text"
						class="colortext"
						value="#fff609"
					/>
				</div>
				<div class="color-pair">
					<label>Color 6</label
					><input type="color" value="#249ca3" /><input
						type="text"
						class="colortext"
						value="#249ca3"
					/>
				</div>
				<div class="color-pair">
					<label>Color 7</label
					><input type="color" value="#78dc52" /><input
						type="text"
						class="colortext"
						value="#78dc52"
					/>
				</div>
				<div class="color-pair">
					<label>Color 8</label
					><input type="color" value="#003fad" /><input
						type="text"
						class="colortext"
						value="#003fad"
					/>
				</div>
				<div class="color-pair">
					<label>Color 9</label
					><input type="color" value="#87f2ff" /><input
						type="text"
						class="colortext"
						value="#87f2ff"
					/>
				</div>
				<div class="color-pair">
					<label>Color 10</label
					><input type="color" value="#8e2ec4" /><input
						type="text"
						class="colortext"
						value="#8e2ec4"
					/>
				</div>
				<div class="color-pair">
					<label>Color 11</label
					><input type="color" value="#a4839f" /><input
						type="text"
						class="colortext"
						value="#a4839f"
					/>
				</div>
				<div class="color-pair">
					<label>Color 12</label
					><input type="color" value="#5c406c" /><input
						type="text"
						class="colortext"
						value="#5c406c"
					/>
				</div>
				<div class="color-pair">
					<label>Color 13</label
					><input type="color" value="#e5cdc4" /><input
						type="text"
						class="colortext"
						value="#e5cdc4"
					/>
				</div>
				<div class="color-pair">
					<label>Color 14</label
					><input type="color" value="#91463d" /><input
						type="text"
						class="colortext"
						value="#91463d"
					/>
				</div>
				<div class="color-pair">
					<label>Color 15</label
					><input type="color" value="#000000" /><input
						type="text"
						class="colortext"
						value="#000000"
					/>
				</div>
			</div>
		</div>
	</div>
	<div class="action-buttons">
		<button id="run" type="submit" disabled>Convert Graphic</button
		><button id="reset" type="reset">Reset Form</button
		><button id="copy" type="button" disabled>Download Text</button
		><button id="download" type="button" disabled>Download File</button>
	</div>
</form>
<div id="viewer-controls" class="viewer-controls">
	<label class="viewer-toggle full-row">
		<input type="checkbox" id="viewer-image-enable" checked />
		Show image viewers (input + output preview)
	</label>
	<label class="viewer-toggle full-row">
		<input type="checkbox" id="viewer-text-enable" checked />
		Show text viewers (MakeCode + ASCII output)
	</label>
	<small class="viewer-toggle-hint">Hide will not update the viewer until it is restarted — when Convert will automatically close and lock the checkbox and restore it when it is done.</small>

</div>
<div class="image-preview-container" id="image-preview-container">
	<div class="preview-box">
		<h3>Original Input</h3>
		<div id="original-res" class="resolution-info">Size: 0 x 0</div>
		<div id="original-preview-zone"></div>
	</div>
	<div class="preview-box">
		<h3>Canvas Output</h3>
		<div id="canvas-res" class="resolution-info">Size: 0 x 0</div>
		<div class="output">
			<img
				id="output-image"
				alt="Processed image output"
				aria-hidden="true"
				style="
					width: 100%;
					height: auto;
					object-fit: contain;
					image-rendering: pixelated;
					background-image:
						linear-gradient(45deg, #222 25%, transparent 25%),
						linear-gradient(-45deg, #222 25%, transparent 25%),
						linear-gradient(45deg, transparent 75%, #222 75%),
						linear-gradient(-45deg, transparent 75%, #222 75%);
					background-size: 10px 10px;
					background-position:
						0 0,
						0 5px,
						5px -5px,
						-5px 0px;
					background-color: #151515;
					padding: 5px;
					margin: 0 auto;
					display: block;
					visibility: hidden;
				"
			/>
		</div>
	</div>
</div>
<canvas
	id="process-canvas"
	aria-hidden="true"
	style="
		display: block;
		position: absolute;
		margin-left: -100000px;
		margin-top: -100000px;
		width: 1px;
		height: 1px;
		max-width: 1px;
		max-height: 1px;
		box-sizing: border-box;
		padding: 0;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	"
></canvas>
<div class="output-tabs" id="output-tabs">
	<button class="tab-btn active" data-tab="pixelart">
		PixelArt / MakeCode String</button
	><button class="tab-btn" data-tab="ascii" id="ascii-tab-btn" disabled>
		ASCII Output
	</button>
</div>
<div id="tab-pixelart" class="tab-panel active">
	<textarea
		id="output"
		placeholder="The pixel art hex matrix string will be generated here..."
		readonly
	></textarea>
</div>
<div id="tab-ascii" class="tab-panel">
	<textarea
		id="ascii-output"
		placeholder="ASCII art output will appear here after conversion with ASCII mode enabled..."
		readonly
	></textarea>
</div>
`,
);

/* ==== script/init/error.js ==== */
(function () {
	const getElement = (id) => document.getElementById(id);
	const overlay = getElement("notification-popup-overlay");

	function displayErrorPopup(errorType, message, stackTrace) {
		getElement("popup-err-type").textContent = errorType || "Runtime Error";
		getElement("popup-err-message").textContent = message || "Unknown error.";
		getElement("popup-err-stack").value = stackTrace || "No call stack trace records.";
		getElement("popup-err-stack").style.display = "none";
		getElement("btn-toggle-log").textContent = "Show Full Log ▼";
		if (overlay) {
			overlay.style.display = "block";
		}
	}

	function toggleErrorLog() {
		const stackTextarea = getElement("popup-err-stack");
		const isCurrentlyHidden =
			stackTextarea.style.display === "none" || !stackTextarea.style.display;
		stackTextarea.style.display = isCurrentlyHidden ? "block" : "none";
		getElement("btn-toggle-log").textContent = isCurrentlyHidden
			? "Hide Full Log ▲"
			: "Show Full Log ▼";
	}

	function closeErrorPopup() {
		if (overlay) {
			overlay.style.display = "none";
		}
	}

	// Expose to global scope for use by the rest of the application
	window.displayErrorPopup = displayErrorPopup;
	window.toggleErrorLog = toggleErrorLog;
	window.closeErrorPopup = closeErrorPopup;

	getElement("popup-close-btn")?.addEventListener("click", closeErrorPopup);
	getElement("btn-toggle-log")?.addEventListener("click", toggleErrorLog);

	window.addEventListener("error", (event) => {
		displayErrorPopup(
			"Uncaught Runtime Exception",
			event.message,
			event.error?.stack
		);
	});

	window.addEventListener("unhandledrejection", (event) => {
		const reason =
			event.reason instanceof Error
				? event.reason
				: new Error(String(event.reason));
		displayErrorPopup(
			"Unhandled Promise Rejection",
			reason.message,
			reason.stack
		);
	});
})();

/* ==== script/init/section.js ==== */
const CHAR_TABLE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/#",
	BAYER4_SRC = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
	BAYER8_SRC = [
		0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38,
		60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
		15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
	],
	BAYER16_SRC = [
		0, 128, 32, 160, 8, 136, 40, 168, 2, 130, 34, 162, 10, 138, 42, 170, 192, 64, 224, 96, 200,
		72, 232, 104, 194, 66, 226, 98, 202, 74, 234, 106, 48, 176, 16, 144, 56, 184, 24, 152, 50,
		178, 18, 146, 58, 186, 26, 154, 240, 112, 208, 80, 248, 120, 216, 88, 242, 114, 210, 82,
		250, 122, 218, 90, 12, 140, 44, 172, 4, 132, 36, 164, 14, 142, 46, 174, 6, 134, 38, 166,
		204, 76, 236, 108, 196, 68, 228, 100, 206, 78, 238, 110, 198, 70, 230, 102, 60, 188, 28,
		156, 52, 180, 20, 148, 62, 190, 30, 158, 54, 182, 22, 150, 252, 124, 220, 92, 244, 116, 212,
		84, 254, 126, 222, 94, 246, 118, 214, 86, 3, 131, 35, 163, 11, 139, 43, 171, 1, 129, 33,
		161, 9, 137, 41, 169, 195, 67, 227, 99, 203, 75, 235, 107, 193, 65, 225, 97, 201, 73, 233,
		105, 51, 179, 19, 147, 59, 187, 27, 155, 49, 177, 17, 145, 57, 185, 25, 153, 243, 115, 211,
		83, 251, 123, 219, 91, 241, 113, 209, 81, 249, 121, 217, 89, 15, 143, 47, 175, 7, 135, 39,
		167, 13, 141, 45, 173, 5, 133, 37, 165, 207, 79, 239, 111, 199, 71, 231, 103, 205, 77, 237,
		109, 197, 69, 229, 101, 63, 191, 31, 159, 55, 183, 23, 151, 61, 189, 29, 157, 53, 181, 21,
		149, 255, 127, 223, 95, 247, 119, 215, 87, 253, 125, 221, 93, 245, 117, 213, 85,
	],
	BLUE8_SRC = [
		141, 186, 149, 52, 101, 182, 137, 105, 170, 113, 206, 20, 242, 153, 202, 246, 64, 222, 80,
		32, 117, 12, 89, 40, 16, 48, 161, 210, 178, 60, 24, 0, 230, 93, 250, 145, 72, 234, 190, 109,
		56, 4, 121, 198, 157, 125, 36, 214, 68, 8, 44, 174, 133, 255, 85, 28, 226, 97, 238, 76, 218,
		129, 194, 165,
	],
	BLUE16_SRC = [
		227, 141, 129, 236, 160, 134, 71, 30, 162, 235, 99, 209, 108, 192, 94, 155, 78, 190, 153,
		53, 86, 224, 178, 148, 93, 42, 183, 144, 26, 73, 10, 41, 139, 3, 248, 115, 200, 13, 63, 249,
		170, 126, 213, 56, 166, 232, 118, 204, 59, 220, 172, 112, 33, 154, 245, 88, 195, 14, 48,
		104, 185, 6, 150, 80, 131, 241, 96, 21, 180, 70, 137, 22, 237, 84, 38, 202, 1, 67, 222, 122,
		252, 46, 164, 128, 255, 107, 52, 191, 143, 218, 11, 158, 91, 176, 40, 207, 17, 110, 74, 233,
		45, 198, 25, 120, 60, 247, 101, 29, 134, 50, 240, 168, 82, 197, 5, 187, 159, 77, 212, 35,
		173, 8, 114, 69, 226, 147, 19, 94, 234, 136, 58, 181, 14, 92, 250, 44, 211, 132, 54, 193,
		12, 86, 223, 105, 49, 171, 109, 28, 243, 125, 68, 156, 4, 182, 97, 36, 254, 151, 64, 216,
		189, 31, 238, 83, 167, 47, 206, 116, 244, 17, 146, 79, 199, 42, 117, 230, 2, 161, 100, 19,
		140, 221, 57, 185, 102, 72, 215, 10, 127, 253, 89, 178, 75, 208, 43, 251, 111, 6, 163, 34,
		188, 129, 61, 239, 24, 165, 55, 196, 145, 27, 124, 95, 230, 152, 81, 246, 15, 113, 48, 175,
		204, 37, 142, 9, 219, 66, 194, 18, 76, 135, 23, 106, 231, 51, 183, 7, 121, 247, 103, 214,
		62, 169, 0, 149, 210, 87, 201, 39, 168, 98, 33, 158, 20, 228, 141, 184,
	],
	BLUE32_SRC = [
		154, 181, 42, 20, 79, 34, 109, 18, 95, 135, 190, 84, 202, 128, 190, 68, 34, 1, 23, 84, 237,
		70, 225, 144, 237, 165, 49, 102, 237, 109, 186, 70, 9, 116, 220, 248, 163, 253, 147, 212,
		55, 245, 14, 167, 38, 57, 11, 233, 152, 197, 139, 174, 54, 122, 14, 92, 63, 13, 197, 180,
		26, 142, 59, 217, 131, 204, 88, 52, 137, 101, 28, 194, 230, 119, 176, 244, 96, 214, 156, 46,
		111, 81, 219, 32, 241, 160, 206, 132, 227, 120, 251, 89, 194, 5, 103, 168, 36, 173, 15, 229,
		64, 185, 239, 73, 4, 50, 21, 126, 35, 78, 191, 138, 28, 149, 64, 113, 17, 72, 38, 177, 48,
		155, 33, 67, 218, 161, 78, 21, 243, 105, 199, 58, 222, 12, 158, 91, 169, 201, 143, 59, 249,
		17, 106, 223, 182, 95, 236, 6, 151, 100, 211, 10, 83, 201, 123, 242, 12, 133, 230, 47, 80,
		41, 250, 124, 39, 171, 48, 134, 255, 110, 82, 188, 40, 129, 71, 195, 53, 164, 20, 127, 189,
		44, 136, 254, 29, 172, 52, 107, 187, 94, 25, 209, 216, 145, 27, 183, 96, 235, 77, 19, 61,
		226, 151, 8, 166, 93, 247, 31, 115, 75, 198, 58, 232, 81, 19, 117, 223, 41, 158, 76, 255,
		57, 150, 114, 62, 232, 112, 7, 213, 53, 141, 203, 125, 37, 104, 197, 49, 179, 13, 85, 240,
		46, 130, 243, 15, 169, 62, 146, 96, 181, 8, 199, 35, 126, 205, 88, 175, 2, 193, 66, 156, 30,
		102, 247, 86, 173, 21, 68, 157, 221, 108, 194, 60, 153, 11, 87, 184, 128, 236, 51, 134, 220,
		69, 148, 242, 16, 44, 179, 118, 229, 47, 139, 11, 224, 67, 181, 42, 250, 145, 33, 84, 6,
		238, 74, 165, 101, 217, 43, 99, 24, 163, 79, 11, 252, 106, 31, 171, 83, 197, 121, 54, 161,
		100, 255, 74, 189, 116, 5, 159, 97, 54, 210, 127, 45, 161, 29, 212, 56, 140, 191, 70, 208,
		45, 190, 147, 60, 183, 224, 55, 140, 10, 236, 207, 23, 132, 81, 214, 46, 152, 231, 19, 136,
		77, 186, 253, 118, 203, 52, 34, 123, 226, 5, 155, 37, 114, 234, 28, 95, 215, 40, 129, 249,
		72, 165, 38, 187, 14, 172, 60, 129, 245, 108, 63, 204, 28, 92, 144, 67, 12, 176, 247, 91,
		48, 170, 102, 250, 84, 6, 173, 131, 51, 199, 22, 104, 188, 53, 143, 68, 228, 93, 201, 38,
		17, 78, 168, 113, 242, 56, 185, 230, 89, 41, 158, 22, 135, 59, 218, 141, 193, 122, 57, 246,
		110, 80, 154, 37, 231, 98, 251, 122, 49, 195, 8, 166, 220, 44, 137, 2, 75, 149, 23, 105,
		254, 147, 78, 204, 33, 116, 63, 180, 29, 159, 100, 21, 164, 235, 48, 213, 117, 7, 16, 177,
		106, 34, 157, 85, 54, 192, 117, 234, 43, 162, 198, 61, 128, 19, 187, 49, 225, 94, 213, 46,
		126, 205, 73, 145, 30, 112, 191, 62, 136, 219, 182, 65, 240, 13, 111, 203, 26, 91, 14, 179,
		101, 38, 81, 172, 56, 221, 14, 168, 77, 151, 35, 108, 244, 17, 156, 88, 207, 42, 125, 254,
		20, 96, 44, 209, 124, 50, 173, 7, 148, 63, 246, 120, 53, 209, 28, 143, 95, 34, 192, 115, 58,
		230, 12, 185, 71, 138, 50, 241, 169, 28, 181, 74, 159, 46, 233, 28, 158, 86, 197, 36, 225,
		131, 72, 19, 160, 247, 110, 64, 187, 252, 106, 44, 199, 82, 167, 54, 219, 97, 10, 196, 121,
		64, 233, 8, 143, 111, 102, 55, 236, 19, 141, 250, 94, 43, 188, 83, 230, 15, 76, 155, 42,
		128, 73, 161, 27, 113, 237, 129, 32, 176, 85, 218, 47, 153, 102, 194, 57, 248, 167, 78, 217,
		60, 32, 115, 177, 57, 204, 134, 48, 171, 222, 9, 198, 61, 214, 136, 93, 181, 20, 63, 150,
		242, 38, 127, 255, 70, 137, 29, 226, 84, 13, 194, 110, 147, 229, 68, 21, 165, 100, 38, 116,
		195, 52, 140, 24, 83, 47, 172, 38, 248, 105, 200, 89, 25, 174, 58, 211, 95, 19, 166, 51,
		123, 145, 42, 255, 92, 5, 183, 109, 237, 79, 155, 253, 69, 163, 237, 117, 45, 156, 29, 119,
		68, 214, 48, 133, 61, 222, 145, 35, 189, 245, 108, 200, 75, 35, 172, 79, 21, 161, 54, 128,
		46, 214, 12, 88, 146, 31, 102, 189, 254, 97, 184, 52, 227, 11, 163, 78, 236, 103, 30, 152,
		81, 17, 132, 62, 238, 204, 118, 53, 198, 113, 244, 33, 191, 152, 67, 180, 41, 207, 74, 136,
		21, 60, 141, 249, 16, 94, 128, 44, 191, 56, 220, 128, 194, 90, 247, 43, 156, 11, 230, 141,
		37, 86, 18, 156, 96, 25, 123, 201, 58, 149, 232, 57, 166, 205, 79, 34, 117, 173, 55, 210,
		123, 167, 12, 71, 185, 54, 116, 203, 31, 99, 64, 189, 246, 169, 76, 210, 139, 222, 49, 85,
		173, 40, 115, 253, 88, 46, 151, 223, 62, 139, 2, 80, 158, 229, 97, 146, 38, 219, 177, 9, 68,
		152, 25, 107, 14, 58, 193, 45, 235, 162, 106, 37, 154, 245, 18, 131, 72, 186, 101, 54, 193,
		28, 115, 237, 49, 126, 213, 65, 251, 133, 40, 95, 182, 219, 82, 175, 128, 231, 3, 120, 71,
		14, 199, 126, 61, 96, 179, 43, 210, 129, 17, 164, 88, 206, 70, 152, 34, 181, 57, 112, 29,
		158, 224, 77, 144, 48, 201, 40, 91, 165, 134, 51, 187, 250, 92, 144, 28, 68, 151, 234, 57,
		242, 125, 73, 195, 42, 129, 223, 91, 20, 138, 246, 84, 191, 53, 121, 0, 116, 56, 213, 30,
		149, 80, 205, 110, 53, 168, 35, 113, 202, 84, 19, 160, 103, 48, 212, 36, 154, 247, 66, 175,
		108, 32, 170, 63, 235, 147, 26, 198, 67, 180, 12, 241, 104, 226, 63, 19, 143, 218, 76, 183,
		47, 132, 251, 95, 38, 171, 59, 140, 218, 101, 45, 133, 241, 155, 87, 199, 44, 110, 179, 250,
	],
	BAYER4 = new Uint8Array(BAYER4_SRC),
	BAYER8 = new Uint8Array(BAYER8_SRC),
	BAYER16 = new Uint8Array(BAYER16_SRC),
	BLUE8 = new Uint8Array(BLUE8_SRC),
	BLUE16 = new Uint8Array(BLUE16_SRC),
	BLUE32 = new Uint8Array(BLUE32_SRC),
	// Full-screen quad: x,y,u,v per vertex (TRIANGLE_STRIP)
	QUAD_VERTICES = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);

/** Scale integer Bayer ranks 0..levels-1 into 0..255 for WebGL LUMINANCE textures. */
function matrixToU8(src, levels) {
	const out = new Uint8Array(src.length);
	for (let i = 0; i < src.length; i += 1) {
		out[i] = Math.round((255 * src[i]) / levels);
	}
	return out;
}

const BAYER4_U8 = matrixToU8(BAYER4_SRC, 16),
	BAYER8_U8 = matrixToU8(BAYER8_SRC, 64),
	BAYER16_U8 = matrixToU8(BAYER16_SRC, 256),
	// Blue-noise tables are already 0..255 ranks
	BLUE8_U8 = new Uint8Array(BLUE8_SRC),
	BLUE16_U8 = new Uint8Array(BLUE16_SRC),
	BLUE32_U8 = new Uint8Array(BLUE32_SRC),
	// Large blue-noise maps (void-and-cluster), decoded once from compact base64.
	BLUE64_U8 = (() => {
		const binary = atob("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");
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
		return bytes;
	})(),
	BLUE128_U8 = (() => {
		const binary = atob("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");
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
		return bytes;
	})(),
	BLUE256_U8 = (() => {
		const binary = atob("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");
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
		return bytes;
	})(),
	BLUE64 = BLUE64_U8,
	BLUE128 = BLUE128_U8,
	BLUE256 = BLUE256_U8,
	htmlLog = [];

let lastIndexMap = null,
	lastW = 0,
	lastH = 0,
	animSource = null,
	processedAnimation = null;

const mediaFileInput = document.getElementById("file"),
	palettemediaFileInput = document.getElementById("palette-file-reader"),
	predefinedPaletteSelect = document.getElementById("predefined-palette-select"),
	ditheringSelect = document.getElementById("dithering-option"),
	renderSelect = document.getElementById("render-option"),
	renderCustomOptions = document.getElementById("render-custom-options"),
	renderTilePowerInput = document.getElementById("render-tile-power"),
	renderTileSizeLabel = document.getElementById("render-tile-size-label"),
	engineSelect = document.getElementById("engine-select"),
	wasmStatus = document.getElementById("wasm-status"),
	makecodeEnableCheck = document.getElementById("makecode-enable"),
	makecodeAutoStatus = document.getElementById("makecode-auto-status"),
	videoOptionsGroup = document.getElementById("video-options-group"),
	videoKeepAudioCheck = document.getElementById("video-keep-audio"),
	asciiEnableCheck = document.getElementById("ascii-enable"),
	asciiSubOptions = document.getElementById("ascii-sub-options"),
	asciiCharsetSelect = document.getElementById("ascii-charset-select"),
	asciiWidthInput = document.getElementById("ascii-width-input"),
	asciiTabBtn = document.getElementById("ascii-tab-btn"),
	asciiOutputTA = document.getElementById("ascii-output"),
	runButton = document.getElementById("run"),
	resetButton = document.getElementById("reset"),
	downloadTextButton = document.getElementById("copy"),
	downloadMediaButton = document.getElementById("download"),
	statusDiv = document.getElementById("status"),
	textarea = document.getElementById("output"),
	previewContainer = document.getElementById("image-preview-container") || document.querySelector(".image-preview-container"),
	viewerImageEnable = document.getElementById("viewer-image-enable"),
	viewerTextEnable = document.getElementById("viewer-text-enable"),
	outputTabs = document.getElementById("output-tabs"),
	tabPixelart = document.getElementById("tab-pixelart"),
	tabAscii = document.getElementById("tab-ascii"),
	outputImage = document.getElementById("output-image"),
	canvas = document.getElementById("process-canvas"),
	ctx = canvas.getContext("2d", {
		willReadFrequently: !0,
	}),
	inputWidth = document.getElementById("width"),
	inputHeight = document.getElementById("height"),
	inputFactor = document.getElementById("factor"),
	inputRatio = document.getElementById("ratio"),
	parametersForm = document.getElementById("parameters"),
	colorpad = document.getElementById("colorpad"),
	paletteAddBtn = document.getElementById("palette-add-btn"),
	paletteRemoveBtn = document.getElementById("palette-remove-btn"),
	paletteCountLbl = document.getElementById("palette-count-label"),
	paletteLimitInput = document.getElementById("palette-limit"),
	palettePrevBtn = document.getElementById("palette-prev-btn"),
	paletteNextBtn = document.getElementById("palette-next-btn"),
	paletteRangeLabel = document.getElementById("palette-range-label");

let originalImageSize = {
		width: 0,
		height: 0,
	},
	originalMimeType = "image/png",
	sourceExtension = "png",
	canvasName = "pic2pa.png",
	outputBlob = null,
	outputObjectUrl = null,
	originalPreviewObjectUrl = null,
	outputVideo = null,
	rgbPalette = [],
	primaryPalette = [],
	uploadedFileBuffer = null,
	isTextProcessing = !1,
	stopTextProcessingFlag = !1,
	curResizeMode = "=",
	nextResizeMode = "-";

const predefinedPalettes = {
	arcade: [
		"#ffffff",
		"#ff2121",
		"#ff93c4",
		"#ff8135",
		"#fff609",
		"#249ca3",
		"#78dc52",
		"#003fad",
		"#87f2ff",
		"#8e2ec4",
		"#a4839f",
		"#5c406c",
		"#e5cdc4",
		"#91463d",
		"#000000",
	],
	matte: [
		"#ffffff",
		"#ff455a",
		"#ffaebc",
		"#ffab3c",
		"#fffa40",
		"#278c3f",
		"#37e650",
		"#5e70d4",
		"#99d5e5",
		"#a845ff",
		"#cfa4ff",
		"#7a4a8b",
		"#ffcca4",
		"#bd7f47",
		"#41344e",
	],
	pastel: [
		"#ffffff",
		"#ffb0a1",
		"#ffd6ec",
		"#ffdca1",
		"#fffda1",
		"#a1ffe1",
		"#baffc1",
		"#a1d6ff",
		"#e1ffff",
		"#d6a1ff",
		"#eaccff",
		"#bdb0d6",
		"#fff0e1",
		"#d6a1a1",
		"#696a6a",
	],
	sweet: [
		"#ffffff",
		"#803d41",
		"#9ad46a",
		"#eb8b4a",
		"#f6d86e",
		"#18544a",
		"#31a477",
		"#365f91",
		"#6bd0ff",
		"#653780",
		"#9f7bb1",
		"#d6b8c0",
		"#e7d7c1",
		"#ac896e",
		"#4f455a",
	],
	poke: [
		"#ffffff",
		"#e4595d",
		"#f7a171",
		"#fced8c",
		"#69d8af",
		"#71aa6a",
		"#2c6eb7",
		"#5196d8",
		"#8aa7cc",
		"#b070cc",
		"#dea3ea",
		"#ace6a2",
		"#e7ccae",
		"#9a6d5f",
		"#454545",
	],
	adventure: [
		"#ffffff",
		"#e9d4a9",
		"#c57e7d",
		"#a74e5a",
		"#f8ae49",
		"#9d9d5a",
		"#557d4a",
		"#0f4a6d",
		"#3b83a1",
		"#4d5061",
		"#6e81a1",
		"#a1acbd",
		"#e7e7e7",
		"#714a47",
		"#1c1f21",
	],
	diy: [
		"#ffffff",
		"#ff0000",
		"#ff99aa",
		"#ffcc00",
		"#ffff00",
		"#00ff00",
		"#00cc00",
		"#000000",
		"#00ffff",
		"#aa00ff",
		"#cc99ff",
		"#aaaaaa",
		"#eebbaa",
		"#884400",
		"#000000",
	],
	adafruit: [
		"#ffffff",
		"#ff0000",
		"#ff5500",
		"#ffaa00",
		"#ffff00",
		"#00ff00",
		"#00aa55",
		"#000000",
		"#00aaff",
		"#aa00ff",
		"#ff00ff",
		"#aaaaaa",
		"#555555",
		"#ff55aa",
		"#000000",
	],
	still_life: [
		"#ffffff",
		"#9be2de",
		"#ff6f5a",
		"#e0946a",
		"#e8c466",
		"#adcdd5",
		"#69b477",
		"#54818e",
		"#61a4c4",
		"#9d94d1",
		"#6b5a83",
		"#8d796e",
		"#c7ae9e",
		"#706059",
		"#3d3a4f",
	],
	steam_punk: [
		"#ffffff",
		"#b4dad6",
		"#3b3740",
		"#664d49",
		"#9f6751",
		"#737156",
		"#9f0866",
		"#647d87",
		"#8aa1ab",
		"#7d7187",
		"#a392a5",
		"#bdbdc5",
		"#e4e7ea",
		"#a59487",
		"#59555a",
	],
	grayscale: [
		"#ffffff",
		"#f7f7f7",
		"#e1e1e1",
		"#cccccc",
		"#b8b8b8",
		"#a3a3a3",
		"#8e8e8e",
		"#7a7a7a",
		"#666666",
		"#515151",
		"#3d3d3d",
		"#292929",
		"#141414",
		"#000000",
		"#000000",
	],
};

/* ==== script/engine/matrix/cpu.js ==== */
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

/* ==== script/engine/wasm/pipeline.js ==== */
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
	const progressStep = Math.max(1, Math.ceil(height / 12));
	const rowBatch = Math.max(24, Math.ceil(height / 20));
	let pendingRow = null;
	for (let row = 0; row < height; row += 1) {
		throwIfStopRequested();
		const line = buildRowString(row, width, indexMap, output.data, rgbPalette, CHAR_TABLE, hasAlpha);
		if (onRow) {
			pendingRow = onRow(row, line, indexMap.subarray(row * width, (row + 1) * width));
			if ((row + 1) % rowBatch === 0) {
				await pendingRow;
				pendingRow = null;
			}
		}
		if ((row + 1) % progressStep === 0 || row === height - 1) {
			if (pendingRow) {
				await pendingRow;
				pendingRow = null;
			}
			const progress = ((row + 1) / height * 100).toFixed(2);
			await onProgress(progress);
			setProcessingStatusLine("graphics", `WASM ${frameLabel}: Processing ${progress}%`);
			runButton.textContent = `WASM ${frameLabel}: ${progress}%`;
		}
	}
	if (pendingRow) await pendingRow;
	setProcessingStatusLine("graphics", `WASM ${frameLabel}: Finalize 100%`);
	runButton.textContent = `WASM ${frameLabel}: Finalize 100%`;
	return { hexString: "", indexMap };
}

/* ==== script/engine/matrix/gpu.js ==== */
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
	bayer4: 112,
	bayer8: 128,
	bayer16: 144,
	blue8: 112,
	blue16: 128,
	blue32: 144,
	blue64: 152,
	blue128: 160,
	blue256: 168,
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
		const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
		let hex = onRow ? "" : "img`\n";

		for (let y = 0; y < h; y += 1) {
			let line = "";
			const rowStart = y * w;
			let resR = 0,
				resG = 0,
				resB = 0;
			for (let x = 0; x < w; x += 1) {
				const i = rowStart + x;
				const o = i << 2;
				if (out[o + 3] < 128) {
					indexMap[i] = 0;
					line += chars[0];
					out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
					resR = resG = resB = 0;
					continue;
				}
				const r = ordered ? clamp8(out[o] + resR) : out[o];
				const g = ordered ? clamp8(out[o + 1] + resG) : out[o + 1];
				const b = ordered ? clamp8(out[o + 2] + resB) : out[o + 2];
				let best = 1;
				let bestD = Infinity;
				for (let p = 1; p < palLen; p += 1) {
					const c = palette[p];
					const dr = r - c.r,
						dg = g - c.g,
						db = b - c.b;
					const d = dr * dr + dg * dg + db * db;
					if (d < bestD) {
						bestD = d;
						best = p;
						if (d === 0) break;
					}
				}
				indexMap[i] = best;
				line += chars[best];
				const c = palette[best];
				if (ordered) {
					resR = 0.6 * (r - c.r);
					resG = 0.6 * (g - c.g);
					resB = 0.6 * (b - c.b);
				}
				out[o] = c.r;
				out[o + 1] = c.g;
				out[o + 2] = c.b;
				out[o + 3] = hasAlpha && c.a !== undefined ? c.a : 255;
			}
			if (onRow) {
				await onRow(y, line, indexMap.subarray(rowStart, rowStart + w));
			} else {
				hex += line + "\n";
			}
		}

		return {
			hexString: onRow ? "" : hex + "`",
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

/* ==== script/engine/media/decoder.js ==== */
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

/* ==== script/engine/media/encoder.js ==== */

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


/* ==== script/main.js ==== */
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
	primaryPalette = [{ r: 0, g: 0, b: 0, a: 0 }].concat(
		paletteValues.map((value) => {
			const color = hexToRgba(value);
			return { r: color.r, g: color.g, b: color.b, a: color.a };
		}),
	);
	rgbPalette = primaryPalette.map((color) => ({ ...color }));
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

function mapMakeCodeRow(sourceRow) {
	if (!sourceRow || !temporaryPaletteIndices?.length || !primaryPalette.length) return "";
	let line = "";
	for (const temporaryIndex of sourceRow) {
		const primaryIndex = temporaryPaletteIndices[temporaryIndex] ?? temporaryIndex;
		line += CHAR_TABLE[primaryIndex] ?? CHAR_TABLE[0];
	}
	return line;
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
			makecodeWriter?.appendLine(
				mapMakeCodeRow(sourceRow) || line,
			);
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
	}),parametersForm.addEventListener("reset", async function (e) {
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
}));

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
