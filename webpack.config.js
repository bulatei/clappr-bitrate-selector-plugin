const path = require('path')
const webpack = require('webpack')

const pluginName = 'bitrate-selector'
const pluginLibrary = 'BitrateSelector'

let outputFile = ''
let plugins = []

if (process.env.npm_lifecycle_event === 'release') {
  outputFile = `${pluginName}.min.js`
  plugins = [
    new webpack.optimize.UglifyJsPlugin({})
  ]
} else {
  outputFile = `${pluginName}.js`
}

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: outputFile,
    library: pluginLibrary,
    libraryTarget: 'umd'
  },
  externals: {
    'Clappr': 'Clappr',
    'clappr-zepto': 'clappr-zepto'
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js']
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    disableHostCheck: true,
    compress: true,
    host: '127.0.0.1',
    port: 8080,
    open: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            plugins: ['add-module-exports']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [{
          loader: 'css-loader'
        }, {
          loader: 'sass-loader',
          options: {
            includePaths: [
              './node_modules/compass-mixins/lib',
              './node_modules/clappr/src/base/scss',
              './src/base/scss'
            ]
          }
        }]
      },
      {
        test: /\.(html)$/,
        loader: 'html-loader'
      }
    ]
  }
}
