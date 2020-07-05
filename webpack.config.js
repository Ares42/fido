const merge = require('webpack-merge');
const path = require('path');
const sharp = require('sharp');
const stripJsonComments = require('strip-json-comments');
const webpack = require('webpack');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GeneratePackageJsonPlugin = require('generate-package-json-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const WriteFilePlugin = require('write-file-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const ZipPlugin = require('zip-webpack-plugin');

const secrets = (() => {
  try {
    return require('./secrets.json');
  } catch (error) {
    if (error.code == 'MODULE_NOT_FOUND') {
      console.error('❌ You need to run `cli/fido.js pull-secrets`');
    } else {
      console.error(error);
    }

    process.exit(1);
  }
})();

function injectSecrets(text) {
  for (const [key, value] of Object.entries(secrets)) {
    text = text.replace(new RegExp(`__secret:${key}__`, 'g'), value);
  }
  return text;
}

function envSelector(env, options) {
  if (!(env in options)) {
    throw `Missing environment option for label: ${env}`;
  }
  return options[env];
}

const BaseConfig = (env, flags) => ({
  mode: envSelector(env, {
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
    minimize: envSelector(env, {
      production: true,
      local: false,
    }),
    removeAvailableModules: true,
    removeEmptyChunks: true,
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
                    localIdentName: envSelector(env, {
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
          name: envSelector(env, {
            production: 'static/images/[hash:base64].[ext]',
            local: 'static/images/[name].[hash:base64].[ext]',
          }),
        },
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(
        envSelector(env, {
          production: 'production',
          local: 'development',
        })
      ),
    }),
    new webpack.DefinePlugin({
      'process.fido.secrets': JSON.stringify(secrets),
    }),
    new webpack.DefinePlugin({ 'process.fido.flags': JSON.stringify(flags) }),
    new VueLoaderPlugin(),
    new WriteFilePlugin(),
  ],
});

const FidoConfig = (env, flags) =>
  merge(BaseConfig(env, flags), {
    entry: {
      injector: path.join(__dirname, 'src/fido/injector.js'),
      background: path.join(__dirname, 'src/fido/background.js'),
    },

    output: {
      path: path.join(__dirname, 'build/fido'),
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'src/fido/manifest.json'),
            transform(content) {
              return JSON.stringify(
                JSON.parse(stripJsonComments(content.toString()))
              );
            },
          },
          ...[16, 32, 48, 64, 128, 256].map((size) => ({
            from: path.join(__dirname, 'src/fido/icon.png'),
            to: `icons/${size}.png`,
            transform(content) {
              return sharp(content).resize(size, size).toBuffer();
            },
          })),
        ],
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: path.join(__dirname, 'src/fido/background.html') }],
      }),
      new ZipPlugin({
        filename: 'fido.zip',
        path: '../',
      }),
    ],
  });

const DevServerConfig = (env, flags) =>
  merge(BaseConfig(env, flags), {
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

const ServerConfig = (env, flags) =>
  merge(BaseConfig(env, flags), {
    entry: {
      server: path.join(__dirname, 'src/server/server.js'),
    },

    output: {
      path: path.join(__dirname, 'build/server'),
    },

    target: 'node',
    externals: [
      nodeExternals({
        modulesDir: path.join(__dirname, 'node_modules'),
      }),
    ],

    plugins: [
      new GeneratePackageJsonPlugin(
        {
          name: 'fido-server',
          scripts: {
            start: 'node server.bundle.js',
          },
          engines: {
            node: '10.x',
          },
        },
        path.join(__dirname, 'package.json')
      ),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, 'src/server/app.yaml'),
            transform(content) {
              return injectSecrets(content.toString());
            },
          },
        ],
      }),
    ],
  });

module.exports = {
  FidoConfig,
  DevServerConfig,
  ServerConfig,
};
