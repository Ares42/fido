const webpack = require('webpack');
const Server = require('webpack-dev-server');
const createLogger = require('webpack-dev-server/lib/utils/createLogger');

const webpackHelpers = require('./shared/webpack.js');

async function runDevServer(compiler, args) {
  const options = { hot: true, port: args['dev-server-port'] };
  if (!args.verbose) {
    options.stats = 'minimal';
  }

  const server = new Server(
    compiler,
    options,
    createLogger({ noInfo: !args.verbose })
  );

  compiler.hooks.watchRun.tap('fido', () => {
    webpackHelpers.logChangedFiles(compiler, { namespace: 'fido' });
  });
  compiler.hooks.done.tap('fido', (stats) => {
    webpackHelpers.logBuildStats(stats, {
      verbose: args.verbose,
      namespace: 'fido',
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(args['dev-server-port'], 'localhost', (error) => {
      if (!webpackHelpers.webpackOk(error)) {
        webpackHelpers.logWebpackError(error);
        resolve(1);
      } else {
        console.log(
          `👂 [fido] Serving on localhost:${args['dev-server-port']}`
        );
      }
    });
  });
}

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['local', 'production'],
      default: 'local',
    },

    'server-override': {
      type: String,
      default: null,
    },

    watch: {
      type: Boolean,
      default: false,
    },

    'dev-server': {
      type: Boolean,
      default: false,
    },

    'dev-server-port': {
      type: Number,
      default: 8080,
    },

    run: {
      type: Boolean,
      default: false,
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, args) {
    const configs = require('../../webpack.config');
    const config = args['dev-server']
      ? configs.DevServerConfig
      : configs.FidoConfig;
    const buildFlags = {
      server:
        args['server-override'] ||
        {
          production: 'https://terrace-fido.uc.r.appspot.com',
          local: 'http://localhost:3000',
        }[args.env],
    };

    const compiler = webpack(config(args.env, buildFlags));

    if (args.run) {
      if (!args['dev-server']) {
        console.log('❌ --run cannot be used without --dev-server');
        return 1;
      } else {
        return runDevServer(compiler, args);
      }
    }

    return args.watch
      ? webpackHelpers.watch(compiler, {
          verbose: args.verbose,
          namespace: 'fido',
        })
      : webpackHelpers.run(compiler, {
          verbose: args.verbose,
          namespace: 'fido',
        });
  },
};
