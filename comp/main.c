/**
 * pic2mkcapix WASM quantizer — modular entry
 *
 * Source order (concat → comp.c):
 *   1. core/quantize.c
 *   2. main.c
 *
 * Build the concatenated unit (from repo root):
 *   node comp/concat.mjs
 *   clang --target=wasm32 -O3 -nostdlib \
 *     -Wl,--no-entry \
 *     -Wl,--export=comp_process \
 *     -Wl,--export=comp_heap_base \
 *     -Wl,--export=memory \
 *     -o comp/comp.wasm \
 *     comp/comp.c
 *
 * Exports (implemented in core/quantize.c):
 *   memory, comp_process, comp_heap_base
 */
