const Duration = require('format-duration-time').default;
const Server = require('webpack-dev-server');
const createLogger = require('webpack-dev-server/lib/utils/createLogger');
const webpack = require('webpack');

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['dev', 'prod'],
      default: 'dev',
    },

    host: {
      type: String,
      default: 'localhost',
    },

    port: {
      type: Number,
      default: 8080,
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  run(_, { env, host, port, verbose }) {
    process.env.NODE_ENV = {
      prod: 'production',
      dev: 'development',
    }[env];

    const { DevServerConfig } = require('../../webpack.config');
    const compiler = webpack(DevServerConfig);

    const options = { hot: true, host, port };
    if (!verbose) {
      options.stats = 'minimal';
    }

    const server = new Server(
      compiler,
      options,
      createLogger({ noInfo: !verbose })
    );

    compiler.hooks.done.tap('fido', (stats) => {
      const elapsedMilliseconds = stats.endTime - stats.startTime;
      const elapsedString = Duration(elapsedMilliseconds).format('m[m] s[s]');
      if (stats.hasErrors()) {
        console.log(`❌ Build failed [${elapsedString}]`);
      } else {
        console.log(`✅ Built successfully [${elapsedString}]`);
      }
    });

    console.log(`👂 Listening on ${host}:${port}`);
    server.listen(port, host, (error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
    });
  },
};
