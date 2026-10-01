# pix2mkcapix
## Convert Picture to Makecode-arcade or Pixel-art

[![[[makecode arcade]] tested anim picture: rickroll meme](pictest1.gif)](https://arcade.makecode.com/S51805-37097-94553-76715)

visit at [page](https://quarequin.github.io/pic2mkcapix)

download offline at [here](https://github.com/Quarequin/pic2mkcapix/releases/latest/download/IM2MKCA.htm)

download source at [here](https://github.com/Quarequin/pic2mkcapix/raw/refs/heads/main/pack/IM2MKCAS.zip)

<dl>
<dt>note for anti-ai user:</dt>
<dd>this project use <i>ai</i> to make project but you can fork this to make clean-code-reverse-engineer as human code(if possible) sorry. :(</dd>
<dl>

---

Offline picture-to-MakeCode/pixel-art converter with modular source files and a standalone build.

Open `index.htm` for the modular version or `IM2MKCAS.htm`/`IM2MKCA.htm` for the self-contained standalone version.

Animated GIF, APNG, WebP, and WebM sources are decoded into composited frames. Frames whose file data updates only a rectangle are composited over the latest full frame before conversion. Downloading a converted animation exports a GIF containing the processed frames.

---

## Update (AI MAKE)

This release adds an optional MakeCode string-output switch and a palette manager designed for large custom palettes. MakeCode output turns off automatically when the active palette contains more than 15 colors and becomes available again at 15 colors or fewer.

The palette capacity can be set from 2 through 65,536 colors. Only twenty palette rows are mounted in the DOM at a time; Previous and Next navigate through the remaining ranges. Imported palettes are capped by the selected capacity. Indexed GIF/APNG output remaps its index table to colors that are actually used by the processed result, subject to the formats’ 256-color limit.

JavaScript remains readable and uses tabs for indentation. The original CSS layout is preserved; only additive rules for the new controls were added.

The processing controls now separate **Dithering Options** from **Render Buffer**. The former selects the dithering algorithm, while the latter selects `bitmap`, `8x8tiled`, `16x16tiled`, or `32x32tiled` rendering.

Tiled rendering uses a tile buffer: the image is divided into bounded tiles, each tile is processed independently, and the resulting pixel buffer, palette indices, and text rows are assembled back into the full output. This keeps large images from requiring one full-size intermediate processing buffer and applies to both still images and animation frames. When a tiled buffer is selected, the CPU tile pipeline is used even if the GPU engine is selected, ensuring the requested tile layout is honored.


The tile renderer now uses a shared DitheringBuffer with the selected RenderBuffer. Tiled modes can run through the GPU path, and the implementation follows a TBDR-style flow: tiles are prepared, processed on the GPU, and deferred into the final image/index buffer before output assembly. Additional RenderBuffer sizes are available at `64x64tiled`, `128x128tiled`, and `256x256tiled`.


The tiled GPU path now preserves the selected dithering mode for every tile; Floyd-Steinberg uses the DitheringBuffer CPU tile path because it requires spatial error propagation, while ordered and blue-noise modes use the GPU shader. Per-tile animation-frame stalls and unnecessary canvas repaints were removed to reduce overhead.


RenderBuffer also provides `Auto (2^n)×(2^n) Tiled` and `Custom (2^n)×(2^n) Tiled` choices beside Bitmap. Auto selects a power-of-two tile size from the image dimensions; Custom exposes an exponent field, where `n=7` means a 128×128 tile.
The animation tiled path uses a dedicated GPU canvas so frame compositing and tile rendering cannot resize or invalidate each other.


Progress UI now reports three explicit phases: `Starting: ${Percentage}%...` for image/tile conversion, `Processing Text(Makecode): ${Percentage}%...`, `Processing Text(Ascii): ${Percentage}%...`, or `Processing Text(Makecode+Ascii): ${Percentage}%...` while text rows are emitted, and `Finalize: ${Percentage}%...` during final encoding.


The progress UI keeps the existing graphics-stage messages, shows `Starting: ${Percentage}%...` only when conversion begins, uses `Processing Text(Makecode+Ascii): ${Percentage}%...` when both text outputs are enabled, and reports `Finalize: ${Percentage}%...` during finalization.


When multiple processing statuses are active, the UI renders them as separate lines in `#status` (phase, graphics, and text) instead of overwriting one status with another.


The first status line now uses `Total: ${Percentage.toFixed(6)}...` for the complete conversion progress. During processing, the Convert button mirrors the complete multiline `#status` content; it returns to its normal label after processing ends.


`Total: ${Percentage.toFixed(6)}...` is recalculated on every graphics or text progress update. With both channels active, Total is the average of their latest percentages; with one channel active, it follows that channel.


The first progress line now uses `Current: ${Percentage.toFixed(2)} - ETA${HH:MM:SS}`. ETA is estimated from elapsed processing time and the latest combined graphics/text progress. Fixed `95%` Finalize progress is no longer emitted.


JavaScript cleanup removes confirmed dead helpers and unused declarations without minifying. The readable section markers such as `//script/** ... //end`, tab indentation, and the existing processing behavior are preserved.


When both `Enable MakeCode String Output` and `Enable ASCII TTY Output` are unchecked, the text-output path is skipped completely: no text callback, text progress line, text viewport work, or text writer lifecycle is executed. Image graphics conversion and media export continue normally.


The page loader now uses a native progress bar instead of the spinner image/animation. The progress bar has no `border-radius` and reaches 100% before the loader is hidden.


`Download Text` is disabled whenever both MakeCode and ASCII output checkboxes are unchecked, and is re-enabled when either text output is selected.


The JS and CSS cleanup removes only confirmed unused code while preserving readable structure, tab indentation, the `//script/** ... //end` section markers, and existing behavior.


After static or animated conversion completes, `Download Text` is explicitly synchronized: it stays disabled when both text outputs are unchecked and becomes enabled when either MakeCode or ASCII output is enabled.
