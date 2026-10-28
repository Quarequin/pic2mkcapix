/**
 * Concatenate modular C parts into comp/comp.c (single translation unit for clang).
 * Order matches the legendary layout: core/quantize.c >> main.c
 *
 * Usage (from repo root or from comp/):
 *   node comp/concat.mjs
 *   node concat.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const parts = ["core/quantize.c", "main.c"];

let out =
	"// Auto-concatenated from comp — do not edit; edit modules then run node comp/concat.mjs\n";
for (const p of parts) {
	out += `\n/* ==== ${p} ==== */\n`;
	out += readFileSync(join(here, p), "utf8");
	if (!out.endsWith("\n")) out += "\n";
}
writeFileSync(join(here, "comp.c"), out);
console.log("wrote comp/comp.c", out.length, "bytes from", parts.join(" >> "));
