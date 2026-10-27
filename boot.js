/**
 * Single HTML entry for pic2mkcapix (no type="module").
 * index.htm must reference only this file so crawlers (e.g. Internet Archive)
 * cannot fetch sibling scripts out of order from the HTML markup.
 *
 * Loads modular parts via classic-script injection in fixed order.
 */
(function (global) {
	var cache = Object.create(null);

	function pageBase() {
		var href = global.location && global.location.href ? global.location.href : "";
		return href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
	}

	function resolve(path) {
		path = String(path).replace(/^\.\//, "");
		if (/^https?:\/\//i.test(path) || path.charAt(0) === "/") return path;
		return pageBase() + path;
	}

	function require(path) {
		var key = String(path).replace(/^\.\//, "");
		if (cache[key]) return cache[key];
		var url = resolve(key);
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send(null);
		if (xhr.status !== 0 && xhr.status !== 200) {
			throw new Error("require() failed: " + url + " (HTTP " + xhr.status + ")");
		}
		var script = global.document.createElement("script");
		script.type = "text/javascript";
		script.text = xhr.responseText + "\n//# sourceURL=" + url + "\n";
		(global.document.head || global.document.documentElement).appendChild(script);
		cache[key] = true;
		return true;
	}

	require.cache = cache;
	require.resolve = resolve;
	global.require = require;

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
})(typeof window !== "undefined" ? window : this);
