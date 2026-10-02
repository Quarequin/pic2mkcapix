# Humanized / Readable rewrite notes

This package contains a cleaned version of `script.js` from pic2mkcapix.

## What was done

1. **Preserved all original section markers** exactly:
   - `//script/init/htm.js` … `//end`
   - `//script/init/error.js` … `//end`
   - `//script/init/section.js` … `//end`
   - `//script/engine/matrix/cpu.js` … `//end`
   - `//script/engine/matrix/gpu.js` … `//end`
   - `//script/engine/media/decoder.js` … `//end`
   - `//script/engine/media/encoder.js` … `//end`
   - `//script/main.js` … `//end`

2. **Global safe de-minification**
   - `!0` → `true`
   - `!1` → `false`
   - `void 0` → `undefined`
   - common scientific numbers expanded

3. **Fully rewritten modules (human-friendly)**
   - `error.js` – descriptive function & variable names, sequential statements
   - `cpu.js` – complete rewrite with JSDoc, clear parameter names
     (`r,g,b,palette,indexMap,onProgress` …), no dense comma operators,
     explicit control flow

4. **Structure documentation**
   - Top-of-file header explaining the modular layout so future human
     contributors know where to look / edit.

5. **Still AI-origin but now more forkable**
   - Remaining short locals mainly live inside `decoder.js`, `encoder.js`
     and the large `main.js` UI pipeline. They can be renamed incrementally
     without breaking the section markers.

## How to use

Open `pic2mkcapix-main/index.htm` in a browser (or serve the folder).
The modular `script.js` is the cleaned engine.


## Bugfix (2026-10-02)

- Fixed SyntaxError caused by actual newline characters inside double-quoted
  strings (`"..."`). Double-quoted strings only accept newlines via the
  escape sequence `\n`. The affected lines in the rewritten CPU dithering
  helpers were corrected to use `"\n"` properly.
- Verified with `node --check` that the entire script.js is now syntactically
  valid.

## Bugfix – ReferenceError + full restore (2026-10-02 later)

- Restored the original `cpu.js` engine (with only safe true/false/undefined
  replacements) because the previous full rewrite of the CPU module removed
  `runConversionPipeline`, `runTileCore` and related APIs that `main.js`
  depends on. This fixed:
    ReferenceError: runConversionPipeline is not defined
- Rebuilt the entire script.js cleanly to avoid any leftover corrupted
  sections from earlier edits.
- Verified with `node --check` that the file is syntactically valid and that
  the required functions exist.
