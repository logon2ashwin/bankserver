var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
const nodeExternals = require('webpack-node-externals');
const ClosureCompilerPlugin = require('webpack-closure-compiler');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: {
    server: './server.js',
    cronjob: './cronjob.js'
  },
  target: 'node',
  context: path.resolve(__dirname),
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name]-dist.min.js'
  },
  externals: [nodeExternals()],
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  resolve: {
    extensions: [".webpack.js", ".*.js", ".js", ".node"]
  },
  plugins: [
        new ClosureCompilerPlugin({
          compiler: {
            jar: './compilers/closure-compiler/closure-compiler-v20171023.jar',
            language_in: 'ECMASCRIPT6',
            language_out: 'ECMASCRIPT5',
            compilation_level: 'SIMPLE'
          },
          concurrency: 3,
        }),
        new webpack.optimize.UglifyJsPlugin({
          include: /\.min\.js$/,
          minimize: true,
          output: {
        comments: false
    },
compress: {
        warnings: false,
        properties: true,
    sequences: true,
    dead_code: true,
    conditionals: true,
        comparisons: true,
        evaluate: true,
    booleans: true,
    unused: true,
        loops: true,
        hoist_funs: true,
        cascade: true,
    if_return: true,
    join_vars: true,
    //drop_console: true,
        drop_debugger: true,
        negate_iife: true,
        unsafe: true,
        hoist_vars: true,
        //side_effects: true
    }
        })
  ]
}
