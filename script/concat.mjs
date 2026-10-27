/**
 * Concatenate modular script parts into script/script.js (for portable / file://).
 * Usage: node script/concat.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parts = [
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
let out = "/** Auto-concatenated from script/* — do not edit; edit modules instead. */\n";
for (const p of parts) {
  out += `\n/* ==== ${p} ==== */\n`;
  out += readFileSync(join(root, p), "utf8");
  if (!out.endsWith("\n")) out += "\n";
}
writeFileSync(join(root, "script", "script.js"), out);
console.log("wrote script.js", out.length, "bytes");
