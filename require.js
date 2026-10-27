/**
 * Browser require() without ES modules / type="module".
 * Paths are relative to the HTML document (page root).
 *
 * Uses classic <script> injection (not eval) so top-level const/let/var
 * share the same global lexical environment across files — required for
 * this codebase's non-modular globals (BAYER4, rgbPalette, etc.).
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
		// sourceURL helps DevTools map errors back to the module path
		script.text = xhr.responseText + "\n//# sourceURL=" + url + "\n";
		(global.document.head || global.document.documentElement).appendChild(script);
		cache[key] = true;
		return true;
	}

	require.cache = cache;
	require.resolve = resolve;
	global.require = require;
})(typeof window !== "undefined" ? window : this);
