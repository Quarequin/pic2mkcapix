pic2mkcapix — compile quantizer C → WebAssembly
================================================

Layout (modular C, same idea as script/boot.js + concat.mjs)
------------------------------------------------------------
  comp/
    core/
      quantize.c        nearest + ordered dither + Floyd–Steinberg
    main.c              entry banner / build notes (concat tail)
    concat.mjs          builds single translation unit
    comp.c              AUTO: core/quantize.c >> main.c  (do not hand-edit)
    comp.wasm           output binary
    readme.txt          this file

Concat order (fixed):
  core/quantize.c  >>  main.c  →  comp.c

  node comp/concat.mjs


Exports required by the host (script/engine/matrix/cpu.js + wasm/pipeline.js)
----------------------------------------------------------------------------
  memory              linear memory (WebAssembly.Memory)
  comp_process        quantize one frame
  comp_heap_base      optional; first free byte above static data / stack
                      (host falls back to 131072 if missing)

ABI (comp_process)
------------------
  uint32_t comp_process(
    uint32_t src_ptr,       /* RGBA8 source, width*height*4 bytes */
    uint32_t palette_ptr,   /* RGBA8 palette, count*4 bytes */
    uint32_t out_ptr,       /* uint16 index map, width*height*2 bytes */
    uint32_t width,
    uint32_t height,
    uint32_t palette_count, /* 1 .. 65536 */
    uint32_t mode,          /* 0 solid, 1-3 Bayer, 4-6 Blue 8/16/32,
                               7 Floyd–Steinberg, 8-10 Blue 64/128/256 */
    uint32_t error_ptr      /* FS: int32 error rows (width*3*2*4 bytes);
                               modes 8-10: host blue-noise matrix bytes */
  );
  Return: 0 = success; non-zero = status code (see quantize.c).

  All pointers must be >= comp_heap_base() (or the fallback). The host
  grows memory as needed before the call.


1) Recommended: clang → wasm32 (no WASI, no libc)
-------------------------------------------------
Needs: clang with wasm32 target + wasm-ld (from LLVM / lld).

  # from repository root (pic2mkcapix-main/)
  node comp/concat.mjs
  clang --target=wasm32 -O3 -nostdlib \
    -Wl,--no-entry \
    -Wl,--export-memory \
    -Wl,--export=comp_process \
    -Wl,--export=comp_heap_base \
    -o comp/comp.wasm \
    comp/comp.c

Notes:
  - Edit only core/quantize.c and/or main.c, then re-run concat.mjs
  - -nostdlib: freestanding (stdint + local memset only)
  - --no-entry: library module, no _start
  - Export memory so JS can write source/palette and read indices

Check exports:

  llvm-objdump -x comp/comp.wasm | head
  # or
  wasm-objdump -x comp/comp.wasm   # from wabt, if installed


2) clang + wasi-sdk (optional)
------------------------------
  /path/to/wasi-sdk/bin/clang --target=wasm32-wasi -O3 -nostdlib \
    -Wl,--no-entry \
    -Wl,--export=comp_process \
    -Wl,--export=comp_heap_base \
    -Wl,--export=memory \
    -o comp/comp.wasm comp/comp.c

Avoid linking wasi-libc; the JS host instantiates with imports {}.


3) Other toolchains
-------------------
  Stock gcc has no wasm32 target. Alternatives:

  zig cc -target wasm32-freestanding -O3 -nostdlib \
    -Wl,--no-entry \
    -Wl,--export=comp_process \
    -Wl,--export=comp_heap_base \
    -Wl,--export=memory \
    -o comp/comp.wasm comp/comp.c

  emcc is possible but export/memory wiring differs; prefer clang/zig
  for the bare WebAssembly.instantiate(bytes, {}) host used here.


4) After a successful build
---------------------------
  Modular page (index.htm + boot.js):
    place/replace  comp/comp.wasm

  Update embedded JS fallback (when fetch of comp.wasm fails):

    base64 -w0 comp/comp.wasm > /tmp/comp.b64
    # paste into WASM_PIPELINE_BASE64 in script/engine/matrix/cpu.js
    node script/concat.mjs


5) Quick sanity check in the browser console
--------------------------------------------
  const r = await fetch('comp/comp.wasm');
  const buf = await r.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(buf, {});
  console.log(Object.keys(instance.exports));
  // expect: memory, comp_process, and ideally comp_heap_base


6) Common failures
------------------
  "wasm-ld not found"
    Install LLVM lld so clang --target=wasm32 can link.

  Host falls back to Script engine
    Binary missing, wrong path, or exports incomplete.

  Stale comp.c
    You edited quantize.c/main.c but forgot node comp/concat.mjs


Filename note
-------------
  core/quantize.c  (not quantizer.c) — short legendary-style name.
  comp.c is always the concatenated build input, never the hand-edited source.
