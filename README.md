# pix2mkcapix
## Convert Picture to Makecode-arcade or Pixel-art

[![[[makecode arcade]] tested anim picture: rickroll meme](pictest1.gif)](https://arcade.makecode.com/S51805-37097-94553-76715)

visit at [page](https://quarequin.github.io/pic2mkcapix)

download offline at [here](https://github.com/Quarequin/pic2mkcapix/releases/latest/download/IM2MKCA.htm)

download source at [here](https://github.com/Quarequin/pic2mkcapix/raw/refs/heads/main/pack/IM2MKCAS.zip)

<dl>
<dt>note for anti-ai user:</dt>
<dd>this project use <i>ai</i> to make project but you can fork this to make as human code sorry. :(</dd>
<dl>

---

Offline picture-to-MakeCode/pixel-art converter with modular source files and a standalone build.

Open `index.htm` for the modular version or `IM2MKCAS.htm`/`IM2MKCA.htm` for the self-contained standalone version.

Animated GIF, APNG, WebP, and WebM sources are decoded into composited frames. Frames whose file data updates only a rectangle are composited over the latest full frame before conversion. Downloading a converted animation exports a GIF containing the processed frames.

---

## update (AI MAKE)

This release adds an optional MakeCode string-output switch and a palette manager designed for large custom palettes. MakeCode output turns off automatically when the active palette contains more than 15 colors and becomes available again at 15 colors or fewer.

The palette capacity can be set from 2 through 65,536 colors. Only twenty palette rows are mounted in the DOM at a time; Previous and Next navigate through the remaining ranges. Imported palettes are capped by the selected capacity. Indexed GIF/APNG output remaps its index table to colors that are actually used by the processed result, subject to the formats’ 256-color limit.

JavaScript remains readable and uses tabs for indentation. The original CSS layout is preserved; only additive rules for the new controls were added.
