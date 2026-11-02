pic2mkcapix — browser script modules
====================================

Layout
------
  script/
    init/
      htm.js            UI markup injection (forms, previews, engine select)
      error.js          error popup helpers
      section.js        shared section state / Bayer scale helpers
    engine/
      matrix/
        cpu.js          CPU quantizer + WASM load/instantiate + tile pipeline
      wasm/
        pipeline.js     WASM row streaming / mode mapping helpers
      media/
        decoder.js      image / animation / video decode
        encoder.js      static + animation + video encode (WebCodecs / fallback)
    main.js             app orchestration, convert loop, downloads, session log
    require.js          classic (non-module) script loader for modular index.htm
    entry.js            loads modules in fixed order via require()
    boot.js             single-entry loader (require + module list; archive-safe)
    concat.mjs          builds concatenated es.js from the module list
    es.js               AUTO: concatenated modern build (do not hand-edit)
    es3.js              AUTO: Babel ES3-oriented transpile of es.js (do not hand-edit)
    readme.txt          this file

  (removed) engine/matrix/gpu.js — WebGL path retired; engines are script + wasm only


Processing engines
------------------
  script    JavaScript CPU path (runTileCore / tiled buffer)
  wasm      C quantizer in comp/comp.wasm (embedded base64 fallback in cpu.js)

  UI control: #engine-select in init/htm.js
  Values are exactly: script | wasm


Concat order (fixed — keep in sync across concat.mjs, boot.js, entry.js)
-----------------------------------------------------------------------
  init/htm.js
  init/error.js
  init/section.js
  engine/matrix/cpu.js
  engine/wasm/pipeline.js
  engine/media/decoder.js
  engine/media/encoder.js
  main.js

  node script/concat.mjs
  → writes script/es.js


Build outputs
-------------
  es.js     Modern concatenated source for index.htm and portable embed.
            Edit modules only, then re-run concat.mjs.

  es3.js    Transpiled from es.js (Babel preset-env, IE8 / ES3-oriented
            property & member literal plugins). Regenerate after concat:

              npx --yes @babel/core ...   (or project-local Babel)
              input:  script/es.js
              output: script/es3.js

            Header line marks the file as auto-generated.
            Async is downleveled to generators; very old browsers may still
            need a regenerator runtime if you actually run es3.js there.


How pages load scripts
----------------------
  Modular (index.htm):
    <script src="script/es.js"></script>
    (or require.js + entry.js / boot.js for unbundled module loading)

  Portable standalone (pack/.../portable/IM2MKCAS.htm , pack/.../portable/IM2MKCAB.htm):
    single HTML file with style.css + es.js inlined
    WASM uses embedded WASM_PIPELINE_BASE64 when comp/comp.wasm cannot be fetched


Related trees
-------------
  comp/           C quantizer → comp.wasm (see comp/readme.txt)
  pack/           release zip: modular script/ + portable single-file HTML
  style.css       shared stylesheet (also inlined into portable)


Notes
-----
  - Do not edit es.js or es3.js by hand; change modules, then concat / transpile.
  - WebGL (webgl engine option + gpu.js) has been removed from the whole script
    tree; pack modular script and portable rebuilds follow the same rule.
  - Tab indentation is intentional project style.
