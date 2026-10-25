# pix2mkcapix
## Convert Picture to Makecode-arcade or Pixel-art

<center><p align="center"><a href="https://arcade.makecode.com/S51805-37097-94553-76715"><img width="70%" alt="[makecode arcade] tested anim picture: rickroll meme" src="pictest1.gif"></a></p></center>

visit at [page](https://quarequin.github.io/pic2mkcapix)

download offline at [here](https://github.com/Quarequin/pic2mkcapix/releases/latest/download/PIC2MKCA.htm)

download source at [here](https://github.com/Quarequin/pic2mkcapix/raw/refs/heads/main/pack/PIC2MKCA.zip)

<dl>
    <dt>note for anti-ai user:</dt>
    <dd>this project use <i>ai</i> to make project but you can fork this to make clean-code-reverse-engineer as human code(if possible) sorry. :(</dd>
</dl>

---

Offline picture-to-MakeCode/pixel-art converter with modular source files and a standalone build.

Open `index.htm` for the modular version or `IM2MKCAS.htm`/`IM2MKCA.htm` for the self-contained standalone version.

Animated GIF, APNG, WebP, and WebM sources are decoded into composited frames. Frames whose file data updates only a rectangle are composited over the latest full frame before conversion. Downloading a converted animation exports a GIF containing the processed frames.

## Video input/output support

The converter accepts `.mp4`, `.mkv`, and `.mov` files in addition to the existing image and WebM inputs. Video decoding uses the browser's native `<video>` decoder, so the installed browser must support both the container and its codec. Frames are sampled at 30 FPS when the browser does not expose a frame index, and the processed output keeps the selected source extension.

For output, the application only emits a video when `MediaRecorder` reports support for the exact requested container MIME. MP4 may work in browsers that expose `video/mp4`; MKV and MOV are commonly unsupported for in-browser recording. The app refuses to silently rename WebM data to `.mp4`, `.mkv`, or `.mov`; if the browser cannot preserve the requested container, conversion stops with an explicit message.

## Optional WebAssembly mode

The processing panel now includes `Run in WASM`. When enabled, the application loads `source/wasm/pipeline.wasm` and uses the compiled C quantizer in `source/comp.c` and `source/comp.wasm` for solid and ordered/blue-noise quantization before JavaScript creates text output; Error Diffusion and tiled rendering retain the JavaScript fallback for algorithmic fidelity. If WebAssembly, the binary, or the browser's fetch context is unavailable, the switch is cleared and processing falls back to JavaScript without changing the output format.

The CPU/GPU selector is presented as adjacent switches. CPU and GPU are mutually exclusive; selecting `Error Diffusion` automatically selects CPU and disables GPU until a non-error-diffusion dithering mode is chosen.

The CPU, GPU, and WASM choices are now one dropdown. Error Diffusion disables GPU and WASM choices by forcing CPU; other dithering modes can use GPU or the C/WASM quantizer. `comp.c` and `comp.wasm` are stored at the project root, while the standalone embeds the WASM binary.

## Engine dropdown and C/WASM layout

CPU, GPU, and `Run in WASM (C/WASM)` are selected from one dropdown. `comp.c` and the compiled `comp.wasm` are stored at the project root. The standalone HTML embeds the same compiled module as Base64, then uses the external root module when served as a normal project. HTML/DOM orchestration remains JavaScript because WebAssembly cannot directly manipulate the browser DOM; image quantization is executed by the C/WASM `comp_process` ABI when WASM mode is selected.

WASM mode now supports Floyd–Steinberg Error Diffusion (`mode 2`) through a two-row RGB error buffer in `comp.wasm`. Selecting WASM with Error Diffusion no longer falls back to CPU; the C/WASM full-frame path is used.

`runWasmPipeline()` now covers both image and text stages: `comp.wasm` produces the indexed RGBA result, then each completed row is streamed immediately through the existing MakeCode/ASCII writers via `onRow`. This avoids a separate post-image text pass. String assembly and DOM/textarea rendering stay in JavaScript because they require browser APIs.

The processing-engine dropdown values are now exactly `script`, `webgl`, and `wasm`; internal pipeline dispatch uses the same values.

The C/WASM quantizer now has separate real matrix paths for Bayer 4×4, 8×8, 16×16 and Blue Noise 8×8, 16×16, 32×32; JavaScript maps each dithering option to its matching WASM mode ID.

## Video output fix (crash during processing)

Root causes fixed: the MediaRecorder writer waited on a frame queue that was only drained after processing finished (permanent hang after ~32-64 frames) and kept every frame as an ImageBitmap (out-of-memory on long clips). WebM/MKV output without audio is now encoded frame-by-frame with WebCodecs `VideoEncoder` (explicit timestamps, faster than real time) and a built-in Matroska muxer. MP4/MOV (H.264 + AAC, or Opus when AAC is unavailable) and "keep original sound" (Opus in WebM/MKV) are also encoded by WebCodecs with built-in ISO-BMFF/Matroska muxers; audio is decoded once and encoded at finish, faster than real time. Support is checked with `isConfigSupported` first. When the browser cannot encode the requested codec/container, the MediaRecorder fallback is used (logged in the session log) and never renames the container. That fallback now stores frames as small PNG blobs and never waits on its own queue. Seeking no longer gives up silently after 250 ms, and encoders are released on error. The local class `VideoDecoder` was renamed `MediaVideoDecoder` to stop shadowing the WebCodecs global.

## Audio/video sync fixes

Seeking now waits for the new frame to be presented (`requestVideoFrameCallback`) and samples the middle of each frame slot on the same grid as the output timeline, so frames are never one step late. WebCodecs timestamps accumulate exactly (no per-frame rounding drift). The MediaRecorder fallback plays audio through a scheduled `AudioBufferSourceNode` and anchors the frame timeline to that start instant instead of measuring time after `play()` returned.
