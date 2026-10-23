# Humanized / Readable rewrite notes

This package contains a cleaned version of `script.js` from pic2mkcapix.

## What was done

1. **Preserved all original section markers** exactly:
   - `//script/init/htm.js` … `//end`
   - `//script/init/error.js` … `//end`
   - `//script/init/section.js` … `//end`
   - `//script/engine/matrix/cpu.js` … `//end`
   - `//script/engine/wasm/pipeline.js` (nested) … `//end`
   - `//script/engine/matrix/gpu.js` … `//end`
   - `//script/engine/media/decoder.js` … `//end`
   - `//script/engine/media/encoder.js` … `//end`
   - `//script/main.js` … `//end`

2. **CPU quantizer humanized** (`//script/engine/matrix/cpu.js`)
   - `findNearestColor`, `cachedFindNearest`, `buildAsciiLine`, `buildRowString`
   - `modeDither`, `modeFloydSteinberg`, `runTileCore`
   - Descriptive parameter names, sequential statements, no dense comma operators

3. **Behaviour preserved**
   - Same dither amplitudes / blue-noise maps / WASM ABI
   - Tab indentation kept
   - UI / CSS untouched

4. **Dead code**
   - No top-level unused functions were removed (reference scan found none safe to delete)
   - Avoided aggressive deletions that could break runtime paths

## How to use

Open `index.htm` (modular) or `pack/PIC2MKCA/portable/PIC2MKCA.htm` (standalone).
