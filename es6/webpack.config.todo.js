var path = require("path")
var webpack = require("webpack")

module.exports = {
    devtool: "cheap-module-eval-source-map",
    entry: [
        "./todo.js"
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
        }, {
            test: /\.css$/,
            loader: "style-loader!css-loader"
        }]
    },
    devServer: {
        contentBase: "./",
        hot: true,
        port: 9002
    }
}