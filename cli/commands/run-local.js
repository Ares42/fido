const Duration = require('format-duration-time').default;
const Server = require('webpack-dev-server');
const createLogger = require('webpack-dev-server/lib/utils/createLogger');
const path = require('path');
const { spawn } = require('child_process');
const webpack = require('webpack');

function createBuildCallback(name, { verbose }) {
  return (stats) => {
    if (stats.hasErrors() || stats.hasWarnings() || verbose) {
      console.log(stats.toString({ colors: true }));
    }

    const elapsedMilliseconds = stats.endTime - stats.startTime;
    const elapsedString = Duration(elapsedMilliseconds).format('m[m] s[s]');
    if (stats.hasErrors()) {
      console.log(`❌ [${name}] Build failed [${elapsedString}]`);
    } else {
      console.log(`✅ [${name}] Built successfully [${elapsedString}]`);
    }
  };
}

function createRunCallback(name) {
  return (compiler) => {
    for (const fileName of Object.keys(
      compiler.watchFileSystem.watcher.mtimes
    )) {
      console.log(`⏰ [${name}] ${fileName}`);
    }
  };
}

function assertNoWebpackErrors(error) {
  if (error) {
    console.error(error.stack || error);
    if (error.details) {
      console.error(error.details);
    }
    process.exit(1);
  }
}

function watchAndRunServer({ port, verbose }) {
  const { ServerConfig } = require('../../webpack.config');
  const compiler = webpack(ServerConfig);

  compiler.hooks.watchRun.tap('fido', createRunCallback('server'));
  compiler.hooks.done.tap('fido', createBuildCallback('server', { verbose }));

  let server;
  compiler.watch({ ignored: [/node_modules/] }, (error, stats) => {
    assertNoWebpackErrors(error);

    // Is the build failed, but we're still watching, don't restart the server.
    // Wait for a passing build.
    if (!stats.hasErrors()) return;

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

  compiler.hooks.watchRun.tap('fido', createRunCallback('fido'));
  compiler.hooks.done.tap('fido', createBuildCallback('fido', { verbose }));

  server.listen(port, host, (error) => {
    assertNoWebpackErrors(error);
    console.log(`👂 [fido] Serving on ${host}:${port}`);
  });
}

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

  run(_, args) {
    process.env.NODE_ENV = {
      prod: 'production',
      dev: 'development',
    }[args.env];

    process.fido = {
      flags: {
        server: `http://${args.host}:${args['server-port']}`,
      },
    };

    watchAndRunServer({
      port: args['server-port'],
      verbose: args.verbose,
    });
    startFido({
      host: args.host,
      port: args['fido-port'],
      verbose: args.verbose,
    });
  },
};
