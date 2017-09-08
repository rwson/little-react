var path = require("path")
var webpack = require("webpack")

module.exports = {
    devtool: "source-map",
    entry: "./src/react.js",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "tiny-react.js"
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("production")
        })
    ],
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loader: "babel-loader"
        }]
    }
}