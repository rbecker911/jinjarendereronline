const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

// const MonacoEditorSrc = path.join(__dirname, "..", "src");
const MONACO_DIR = path.resolve(__dirname, './node_modules/monaco-editor');
const APP_DIR = path.resolve(__dirname, './src');

module.exports = {
    entry: {
        main: "./src/index.js",
    },
    mode: process.env.NODE_ENV,
    devtool: "source-map",
    output: {
        path: process.env.NODE_ENV === 'production' ? path.resolve(__dirname, "./dist") : path.resolve(__dirname, "../server/static/dist"),
        filename: "[name].bundle.js",
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        minimizer: [new TerserPlugin({extractComments: false})],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-react"],
                            plugins: ["@babel/plugin-proposal-class-properties"],
                        },
                    },
                ],
            }, {
                test: /\.s[ac]ss$/i,
                use: ["style-loader", "css-loader", "sass-loader"],
            }, {
                test: /\.css$/,
                include: APP_DIR,
                use: [{
                    loader: 'style-loader',
                }, {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            namedExport: true
                        }
                    },
                }],
            }, {
                test: /\.css$/,
                include: MONACO_DIR,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(svg|png|jpg|jpeg|gif)$/,
                loader: "file-loader",
            },
        ],
    },
    resolve: {
        extensions: [".js", ".json"],
        // Remove alias until https://github.com/microsoft/monaco-editor-webpack-plugin/issues/68 is fixed
        // alias: { "react-monaco-editor": MonacoEditorSrc }
    },
    plugins: [
        new MonacoWebpackPlugin({
            languages: ["json"],
        }),
        new CleanWebpackPlugin()
    ],
    devServer: {contentBase: "./"},
};