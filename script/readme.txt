pic2mkcapix — browser script modules
====================================

Layout
------
  script/
    init/
      htm.js            UI markup injection (forms, previews, engine select, palette shell)
      error.js          error popup helpers
      section.js        shared state, CHAR_TABLE, predefinedPalettes, Bayer helpers
    engine/
      matrix/
        cpu.js          CPU quantizer + WASM load/instantiate + tile pipeline
      wasm/
        pipeline.js     WASM row streaming / mode mapping helpers
      media/
        decoder.js      image / animation / video decode
        encoder.js      static + animation + video encode (WebCodecs / fallback)
    main.js             app orchestration, palette UI, convert loop, downloads
    require.js          classic (non-module) script loader
    entry.js            loads modules in fixed order via require()
    boot.js             single-entry loader (archive-safe)
    concat.mjs          builds concatenated es.js from the module list
    es.js               AUTO: concatenated modern build (do not hand-edit)
    es3.js              AUTO: Babel ES3-oriented transpile of es.js (do not hand-edit)
    readme.txt          this file

  (removed from runtime) engine/matrix/gpu.js — WebGL path retired; engines are script + wasm only


Processing engines
------------------
  script    JavaScript CPU path (runTileCore / tiled buffer)
  wasm      C quantizer in comp/comp.wasm (embedded base64 fallback in cpu.js)

  UI control: #engine-select in init/htm.js
  Values are exactly: script | wasm


Palette panel (summary)
-----------------------
  - 16 fixed DOM rows recycled by page scroll (Previous / Next)
  - Per colour: EnableColor checkbox, N. label, colour + hex, move steps, ^ / v, Remove
  - Entry record: { value, enabled, moveSteps } — reorder keeps all three
  - Unchecked colours are skipped in quantize without renumbering MakeCode indices
  - Conversion aborts if fewer than 2 colours are enabled
  - Default predefined scheme: Arcade (Makecode Arcade group)


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
  es.js     Modern concatenated source for modular testing and IM2MKCAS.htm embed.
            Edit modules only, then re-run concat.mjs.

  es3.js    Babel ES3-oriented transpile of es.js (preferred over Closure-Compiler
            for standalone media codecs / WebCodecs paths).

            Why Babel (not Closure WHITESPACE_ONLY / ADVANCED) for es3.js:
              Closure rewrites can break some standalone media codec / WebCodecs
              code paths used by decoder.js and encoder.js. Babel preset-env with
              an IE8 target keeps semantics closer to the source while downleveling
              syntax (const/let, classes, arrow functions, async → generators, etc.).


How to install Babel (ES3-oriented transpile)
---------------------------------------------
  Requires Node.js + npm. Work in an empty folder or the project root; do not
  commit node_modules into the release zip.

  Recommended (Babel 7 — actively maintained, IE8 target ≈ ES3-oriented output):

    npm install --no-save \
      @babel/core@7 \
      @babel/preset-env@7 \
      @babel/plugin-transform-member-expression-literals@7 \
      @babel/plugin-transform-property-literals@7 \
      @babel/plugin-transform-reserved-words@7

  Optional historical toolchain (Babel 6 — older, still ES5/ES3-oriented plugins):

    npm install --no-save \
      babel-core@6 \
      babel-preset-es2015@6 \
      babel-plugin-transform-es3-member-expression-literals@6 \
      babel-plugin-transform-es3-property-literals@6

  Babel 6 example command:

    npx babel script/es.js \
      --presets es2015 \
      --plugins transform-es3-member-expression-literals,transform-es3-property-literals \
      --no-babelrc \
      -o script/es3.js


How to compile es.js → es3.js (Babel 7)
---------------------------------------
  1) Refresh the concat bundle:

       node script/concat.mjs

  2) Transpile (from project root; adjust NODE_PATH if babel is installed elsewhere):

       node -e "
       const fs = require('fs');
       const babel = require('@babel/core');
       const input = fs.readFileSync('script/es.js', 'utf8');
       const result = babel.transformSync(input, {
         filename: 'script/es.js',
         presets: [['@babel/preset-env', {
           targets: { ie: '8' },
           modules: false,
           bugfixes: true,
           forceAllTransforms: true
         }]],
         plugins: [
           '@babel/plugin-transform-member-expression-literals',
           '@babel/plugin-transform-property-literals',
           '@babel/plugin-transform-reserved-words'
         ],
         compact: false,
         comments: true,
         babelrc: false,
         configFile: false
       });
       const header =
         '// Auto-transpiled ES3-oriented build from script/es.js via Babel.\\n' +
         '// Do not edit; edit modules + concat, then re-transpile. See script/readme.txt.\\n\\n';
       fs.writeFileSync('script/es3.js', header + result.code);
       console.log('wrote script/es3.js', (header + result.code).length);
       "

  Notes:
  - targets ie:8 forces broad syntax downlevel (ES3-oriented).
  - async/await become generators; very old browsers may still need regenerator-runtime
    if you actually execute es3.js there. Modern browsers run es.js or the Babel
    output without that helper for most paths used here.
  - Prefer es.js for day-to-day modular debugging; use es3.js for old-web portable.


How pages load scripts
----------------------
  Modular (index.htm):
    <script src="script/es3.js"></script>
    (or require.js + entry.js / boot.js for unbundled module loading)

  Portable standalone (pack/PIC2MKCA/portable/):
    IM2MKCAS.htm  — style.css + es.js  inlined (full / modern)
    IM2MKCAB.htm  — style.css + es3.js inlined (Babel ES3-oriented)
    WASM uses embedded WASM_PIPELINE_BASE64 when comp/comp.wasm cannot be fetched


Related trees
-------------
  comp/           C quantizer → comp.wasm (see comp/readme.txt)
  pack/           release zip: modular script/ + portable single-file HTML
  style.css       shared stylesheet (also inlined into portable)


Notes
-----
  - Do not edit es.js or es3.js by hand; change modules, then concat / transpile.
  - WebGL (webgl engine option + gpu.js) is removed from the runtime load list.
  - Tab indentation is intentional project style.
