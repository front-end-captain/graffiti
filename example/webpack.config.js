const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const BUILD_PATH = path.resolve(__dirname, "./../build");
const ASSETS_PATH = "/assets/";

module.exports = {
  devtool: "cheap-module-source-map",
  mode: "development",
  entry: {
    app: path.resolve(__dirname, "./base/index.tsx"),
  },

  output: {
    path: BUILD_PATH,
    filename: "[name]-[hash:8].js",
    publicPath: ASSETS_PATH,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts[x]?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: true,
            },
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              importLoaders: 2,
              modules: false,
            },
          },
          {
            loader: "less-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.png/,
        use: [
          {
            loader: "url-loader",
          },
        ],
      },
    ],
  },

  devServer: {
    open: false,
    host: "0.0.0.0",
    port: "8000",
    contentBase: BUILD_PATH,
    hot: true,
    publicPath: ASSETS_PATH,
    historyApiFallback: {
      index: ASSETS_PATH + "index.html",
    },
    stats: {
      version: true,
      timings: true,
      colors: true,
      modules: false,
      children: false,
    },
  },

  plugins: [
    new CleanWebpackPlugin({
      verbose: true,
      dry: false,
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./index.html"),
    }),
  ],
};
