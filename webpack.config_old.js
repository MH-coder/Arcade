const path = require("path");
const MergeIntoFile = require("webpack-merge-and-include-globally");

var config = {
  module: {},
};

var studioConfig = Object.assign({}, config, {
  entry: path.resolve(__dirname, "public/js/editor/ArcadeStudioMain.js"),
  output: {
    filename: "studio.min.js",
    path: path.resolve(__dirname, "public/js"),
  },
  plugins: [
    new MergeIntoFile({
      files: {
        "vendor.min.js": [
          path.resolve(
            __dirname,
            "public/js/editor/libs/color-picker/color-picker.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/loading-bar/loading-bar.min.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/logicblock/settings.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/logicblock/publish-subscribe.js"
          ),
          path.resolve(__dirname, "public/js/editor/libs/logicblock/cursor.js"),
          path.resolve(
            __dirname,
            "public/js/editor/libs/logicblock/block.ui.element.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/logicblock/block.ui.js"
          ),
          path.resolve(__dirname, "public/js/editor/libs/logicblock/block.js"),
          path.resolve(__dirname, "public/js/editor/libs/logicblock/search.js"),
          path.resolve(__dirname, "public/js/editor/libs/logicblock/logic.js"),
          path.resolve(__dirname, "public/js/editor/libs/esprima.js"),
          path.resolve(__dirname, "public/js/editor/libs/jsonlint.js"),
          path.resolve(
            __dirname,
            "public/js/editor/libs/codemirror/codemirror.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/codemirror/mode/javascript.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/codemirror/mode/glsl.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/codemirror/addon/dialog.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/codemirror/addon/show-hint.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/codemirror/addon/tern.js"
          ),
          path.resolve(__dirname, "public/js/editor/libs/acorn/acorn.js"),
          path.resolve(__dirname, "public/js/editor/libs/acorn/acorn_loose.js"),
          path.resolve(__dirname, "public/js/editor/libs/acorn/walk.js"),
          path.resolve(__dirname, "public/js/editor/libs/ternjs/polyfill.js"),
          path.resolve(__dirname, "public/js/editor/libs/ternjs/signal.js"),
          path.resolve(__dirname, "public/js/editor/libs/ternjs/tern.js"),
          path.resolve(__dirname, "public/js/editor/libs/ternjs/def.js"),
          path.resolve(__dirname, "public/js/editor/libs/ternjs/comment.js"),
          path.resolve(__dirname, "public/js/editor/libs/ternjs/infer.js"),
          path.resolve(
            __dirname,
            "public/js/editor/libs/ternjs/doc_comment.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/libs/tern-threejs/threejs.js"
          ),
          path.resolve(__dirname, "public/js/editor/libs/signals.min.js"),
          path.resolve(
            __dirname,
            "public/js/editor/libs/infinite-scroll.pkgd.min.js"
          ),
          path.resolve(__dirname, "public/js/editor/libs/progressbar.min.js"),
          path.resolve(__dirname, "public/js/editor/libs/filesize.min.js"),
          path.resolve(__dirname, "public/js/editor/libs/timeliner_gui.js"),
          path.resolve(__dirname, "public/js/editor/libs/tween.umd.js"),
          path.resolve(__dirname, "public/js/editor/input/KeyboardState.js"),
          path.resolve(__dirname, "public/js/editor/input/MouseState.js"),
          path.resolve(
            __dirname,
            "public/js/editor/controls/ObjectControls.js"
          ),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Utils.js"),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Filter.js"),
          path.resolve(
            __dirname,
            "public/js/editor/helpers/Helpers.Geometry.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/helpers/Helpers.Material.js"
          ),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Scene.js"),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Script.js"),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Media.js"),
        ],
      },
      transform: {
        "vendor.min.js": (code) => require("uglify-es").minify(code).code,
      },
    }),
  ],
});

var appConfig = Object.assign({}, config, {
  entry: path.resolve(__dirname, "public/js/editor/ArcadeStudioApp.js"),
  output: {
    filename: "app.min.js",
    path: path.resolve(__dirname, "public/js/app/js"),
  },
  plugins: [
    new MergeIntoFile({
      files: {
        "vendor.min.js": [
          path.resolve(
            __dirname,
            "public/js/editor/libs/loading-bar/loading-bar.min.js"
          ),
          path.resolve(__dirname, "public/js/editor/libs/signals.min.js"),
          path.resolve(__dirname, "public/js/editor/libs/tween.umd.js"),
          path.resolve(__dirname, "public/js/editor/libs/timeliner_gui.js"),
          path.resolve(__dirname, "public/js/editor/input/KeyboardState.js"),
          path.resolve(__dirname, "public/js/editor/input/MouseState.js"),
          path.resolve(
            __dirname,
            "public/js/editor/controls/ObjectControls.js"
          ),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Utils.js"),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Filter.js"),
          path.resolve(
            __dirname,
            "public/js/editor/helpers/Helpers.Geometry.js"
          ),
          path.resolve(
            __dirname,
            "public/js/editor/helpers/Helpers.Material.js"
          ),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Scene.js"),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Script.js"),
          path.resolve(__dirname, "public/js/editor/helpers/Helpers.Media.js"),
        ],
      },
      transform: {
        "vendor.min.js": (code) => require("uglify-es").minify(code).code,
      },
    }),
  ],
});

var webappConfig = Object.assign({}, config, {
  entry: path.resolve(__dirname, "public/js/editor/ArcadeStudioWebApp.js"),
  output: {
    filename: "webapp.min.js",
    path: path.resolve(__dirname, "public/js/"),
  },
});

module.exports = [studioConfig, appConfig, webappConfig];
