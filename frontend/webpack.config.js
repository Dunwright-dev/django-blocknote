const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isProduction = process.env.NODE_ENV === 'production';
const shouldAnalyze = process.argv.includes('--analyze');

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    blocknote: './src/editor.js',
    widget: './src/widget.js'
  },
  output: {
    path: path.resolve('../django_blocknote/static/django_blocknote/js/'),
    filename: isProduction ? '[name].min.js' : '[name].js',
    library: 'DjangoBlockNote',
    libraryTarget: 'umd',
    clean: true
  },
  // Enhanced watch configuration
  watchOptions: {
    aggregateTimeout: 300, // Delay rebuild after first change (ms)
    poll: 1000, // Check for changes every second (useful for some file systems)
    ignored: /node_modules/, // Don't watch node_modules
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isProduction ? '../css/[name].min.css' : '../css/[name].css'
    }),
    // Only include analyzer in production when requested
    ...(shouldAnalyze && isProduction ? [new BundleAnalyzerPlugin()] : [])
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
                }
              }],
              '@babel/preset-react'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  // externals: {
  //   react: 'React',
  //   'react-dom': 'ReactDOM'
  // },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction, // Remove console.log in production
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: isProduction ? {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        }
      }
    } : false
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
    // Show timing information
    timings: true,
    // Show what's being watched
    ...(process.argv.includes('--watch') ? {
      assets: true,
      builtAt: true,
    } : {})
  }
};
