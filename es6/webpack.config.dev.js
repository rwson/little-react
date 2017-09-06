var path = require("path")
var webpack = require("webpack")

module.exports = {
    devtool: "cheap-module-eval-source-map",
    entry: [
        "./index.js"
    ],
    output: {
        path: path.join(__dirname, "build"),
        filename: "bundle.js"
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: "babel-loader"
        }]
    },
    devServer: {
        contentBase: "./",
        hot: true
    }
}