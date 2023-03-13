const path = require("path");
const MergeIntoFile = require("webpack-merge-and-include-globally");

var config = {
  resolve: {
		extensions: ['.ts', '.js'],
	},
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
				test: /\.html$/,
				exclude: /node_modules/,
				loader: 'html-loader',
			},
			{
				test: /\.s?[ac]ss$/i,
				use: [
					'style-loader',
					'css-loader',
					'sass-loader',
				],
			},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
    ]
  },
};

var studioConfig = Object.assign({}, config, {
  entry: path.resolve(__dirname, "public/js/editor/ArcadeStudioMain.js"),
  output: {
    filename: "studio.min.js",
    path: path.resolve(__dirname, "public/js"),
    hotUpdateChunkFilename: './hot/hot-update.js',
		hotUpdateMainFilename: './hot/hot-update.json',
  },
  optimization: {
    minimize: false
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
          
        ],
      },
      transform: {
      //  "vendor.min.js": (code) => require("uglify-es").minify(code).code,
        "vendor.min.js": (code) => code,
      },
    }),
  ],
});

var appConfig = Object.assign({}, config, {
  entry: path.resolve(__dirname, "public/js/editor/ArcadeStudioApp.js"),
  output: {
    filename: "app.min.js",
    path: path.resolve(__dirname, "public/js/app/js"),
    hotUpdateChunkFilename: '../../hot/hot-update-ArcadeStudioApp.js',
		hotUpdateMainFilename: '../../hot/hot-update-ArcadeStudioApp.json',
  },
  optimization: {
    minimize: false
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
    hotUpdateChunkFilename: './hot/hot-update-ArcadeStudioWebApp.js',
		hotUpdateMainFilename: './hot/hot-update-ArcadeStudioWebApp.json',
  },
  optimization: {
    minimize: false
  },
});



module.exports = [studioConfig, appConfig, webappConfig];
