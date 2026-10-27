/**
 * Load modular pic2mkcapix scripts in original section order.
 * Depends on script/require.js (global require).
 */
(function () {
	if (typeof require !== "function") {
		throw new Error("script/require.js must load before script/entry.js");
	}
	var parts = [
		"script/init/htm.js",
		"script/init/error.js",
		"script/init/section.js",
		"script/engine/matrix/cpu.js",
		"script/engine/wasm/pipeline.js",
		"script/engine/matrix/gpu.js",
		"script/engine/media/decoder.js",
		"script/engine/media/encoder.js",
		"script/main.js",
	];
	for (var i = 0; i < parts.length; i++) require(parts[i]);
})();
