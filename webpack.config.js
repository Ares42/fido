const merge = require('webpack-merge');
const path = require('path');
const sharp = require('sharp');
const stripJsonComments = require('strip-json-comments');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const WriteFilePlugin = require('write-file-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

function envSelector(options) {
  if (!(process.env.NODE_ENV in options)) {
    throw 'Missing environment option for label: ' + process.env.NODE_ENV;
  }
  return options[process.env.NODE_ENV];
}

const BaseConfig = {
  mode: envSelector({
    production: 'production',
    local: 'development',
  }),

  output: {
    publicPath: '/',
    filename: '[name].bundle.js',
  },

  resolve: {
    extensions: ['.js', '.vue', '.json', '.css', '.scss'],
    alias: {
      '@': __dirname,
    },
  },

  optimization: {
    minimize: envSelector({
      production: true,
      local: false,
    }),
    removeAvailableModules: true,
    removeEmptyChunks: true,
    splitChunks: {
      chunks: 'all',
    },
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.js$/,
        include: [path.join(__dirname, 'src')],
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          plugins: ['@babel/plugin-transform-runtime'],
          presets: ['@babel/preset-env'],
        },
      },
      {
        oneOf: [
          {
            test: /\.(css|sass)$/,
            resourceQuery: /^\?raw$/,
            use: [
              'vue-style-loader',
              'css-loader',
              'postcss-loader',
              'sass-loader',
            ],
          },
          {
            test: /\.(css|sass)$/,
            use: [
              'vue-style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: envSelector({
                      production: '[hash:base64]',
                      local: '[path][name]__[local]',
                    }),
                  },
                },
              },
              'postcss-loader',
              'sass-loader',
            ],
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: envSelector({
            production: 'static/images/[hash:base64].[ext]',
            local: 'static/images/[name].[hash:base64].[ext]',
          }),
        },
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.DefinePlugin({ 'process.fido': JSON.stringify(process.fido) }),
    new VueLoaderPlugin(),
    new WriteFilePlugin(),
  ],
};

const FidoConfig = merge(BaseConfig, {
  entry: {
    injector: path.join(__dirname, 'src/injector.js'),
    background: path.join(__dirname, 'src/background.js'),
  },

  output: {
    path: path.join(__dirname, 'build/fido'),
  },

  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest/manifest.json',
          transform(content) {
            return JSON.stringify(
              JSON.parse(stripJsonComments(content.toString()))
            );
          },
        },
        ...[16, 32, 48, 64, 128, 256].map((size) => ({
          from: 'src/manifest/icon.png',
          to: `icons/${size}.png`,
          transform(content) {
            return sharp(content).resize(size, size).toBuffer();
          },
        })),
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/background.html' }],
    }),
  ],
});

const DevServerConfig = merge(BaseConfig, {
  devtool: 'source-map',

  entry: {
    'dev-server': path.join(__dirname, 'src/dev-server/main.js'),
  },

  output: {
    path: path.join(__dirname, 'build/dev-server'),
  },

  plugins: [
    new HtmlWebpackPlugin({
      inject: false,
      template: require('html-webpack-template'),
      title: 'Fido Dev Server',
      mobile: true,
      hash: true,
      lang: 'en-US',
      appMountId: 'app',
      chunks: ['dev-server'],
      inject: true,
    }),
  ],
});

const ServerConfig = merge(BaseConfig, {
  entry: {
    server: path.join(__dirname, 'src/server/server.js'),
  },

  output: {
    path: path.join(__dirname, 'build/server'),
  },

  target: 'node',
  externals: [nodeExternals()],
});

module.exports = {
  FidoConfig,
  DevServerConfig,
  ServerConfig,
};
