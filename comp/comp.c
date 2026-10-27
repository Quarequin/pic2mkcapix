/**
 * pic2mkcapix WASM quantizer — modular C entry
 *
 * Parts (included below):
 *   comp/core/quantizer.c
 *
 * Build example:
 *   clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export=comp_process -Wl,--export=memory \
 *     -o comp.wasm comp.c
 */
#include <stdint.h>
#include "comp/core/quantizer.c"
