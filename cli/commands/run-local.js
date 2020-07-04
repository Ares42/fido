const Server = require('webpack-dev-server');
const createLogger = require('webpack-dev-server/lib/utils/createLogger');
const path = require('path');
const { spawn } = require('child_process');
const webpack = require('webpack');

const webpackHelpers = require('./shared/webpack.js');

function startRedis({ verbose }) {
  return new Promise((resolve, reject) => {
    const redis = spawn('redis-server');

    redis.once('error', (error) => {
      console.log(error.stack);
      console.error('❌ [redis] Refused to start! Is redis-server installed?');
      process.exit(1);
    });

    redis.once('exit', (exitStatus) => {
      if (exitStatus != 0) {
        console.error('❌ [redis] Crashed!');
        process.exit(1);
      } else {
        console.error('🤔 [redis] Exited... successfully?');
      }
    });

    redis.stdout.on('data', (data) => {
      if (verbose) {
        console.log(`[redis] ${data.toString()}`);
      }
      if (data.toString().indexOf('Ready to accept connections') != -1) {
        console.log('✅ [redis] Ready');
        resolve();
      }
    });
  });
}

function assertNoWebpackErrors(error) {
  if (!webpackHelpers.webpackOk(error)) {
    webpackHelpers.logWebpackError(error);
    process.exit(1);
  }
}

function watchAndRunServer({ port, verbose }) {
  const { ServerConfig } = require('../../webpack.config');
  const compiler = webpack(ServerConfig);

  compiler.hooks.watchRun.tap('fido', () => {
    webpackHelpers.logChangedFiles(compiler, { namespace: 'server' });
  });
  compiler.hooks.done.tap('fido', (stats) => {
    webpackHelpers.logBuildStats(stats, { verbose, namespace: 'server' });
  });

  let server;
  compiler.watch({ ignored: [/node_modules/] }, (error, stats) => {
    assertNoWebpackErrors(error);

    // Is the build failed, but we're still watching, don't restart the server.
    // Wait for a passing build.
    if (!webpackHelpers.buildOk(stats)) return;

    if (server) {
      console.log('🔄 [server] Restarting the server');
      server.kill();
    }
    server = spawn(
      'node',
      [path.join(compiler.outputPath, 'server.bundle.js'), '--port', port],
      { stdio: [process.stdin, process.stdout, process.stderr] }
    );
  });
}

function startFido({ host, port, verbose }) {
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

  compiler.hooks.watchRun.tap('fido', () => {
    webpackHelpers.logChangedFiles(compiler, { namespace: 'fido' });
  });
  compiler.hooks.done.tap('fido', (stats) => {
    webpackHelpers.logBuildStats(stats, { verbose, namespace: 'fido' });
  });

  server.listen(port, host, (error) => {
    assertNoWebpackErrors(error);
    console.log(`👂 [fido] Serving on ${host}:${port}`);
  });
}

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['local', 'production'],
      default: 'local',
    },

    host: {
      type: String,
      default: 'localhost',
    },

    'server-port': {
      type: Number,
      default: 3000,
    },

    'fido-port': {
      type: Number,
      default: 8080,
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, args) {
    process.env.NODE_ENV = args.env;
    process.fido = {
      flags: {
        server: `http://${args.host}:${args['server-port']}`,
      },
    };

    await startRedis({ verbose: args.verbose });

    watchAndRunServer({
      port: args['server-port'],
      verbose: args.verbose,
    });
    startFido({
      host: args.host,
      port: args['fido-port'],
      verbose: args.verbose,
    });

    return new Promise(() => {});
  },
};
