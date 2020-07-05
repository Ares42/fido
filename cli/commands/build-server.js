const { spawn } = require('child_process');
const path = require('path');
const webpack = require('webpack');

const webpackHelpers = require('./shared/webpack.js');

function spawnServer(compiler) {
  const subprocess = spawn(
    'node',
    [path.join(compiler.outputPath, 'server.bundle.js')],
    { stdio: [process.stdin, process.stdout, process.stderr] }
  );

  waitForExit(subprocess).then(({ cause }) => {
    if (cause == 'external') {
      console.log('❌ [server] Died');
    }
  });

  return subprocess;
}

async function waitForExit(subprocess) {
  return new Promise((resolve, reject) => {
    subprocess.once('exit', (code) => {
      resolve({
        cause: subprocess.killed ? 'internal' : 'external',
        code: code,
      });
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

    port: {
      type: Number,
      default: 3000,
    },

    'redis-port': {
      type: Number,
      default: 6379,
    },

    'api-cache': {
      type: Boolean,
      default: true,
    },

    watch: {
      type: Boolean,
      default: false,
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
    const { ServerConfig } = require('../../webpack.config');
    const buildFlags = {
      port: args.port,
      redisPort: '' + args['redis-port'],
      disableApiCache: !args['api-cache'],
    };
    const compiler = webpack(ServerConfig(args.env, buildFlags));

    if (args.watch) {
      if (args.run) {
        let server;
        compiler.hooks.done.tap('fido', (stats) => {
          // Is the build failed, but we're still watching, don't restart the server.
          // Wait for a passing build.
          if (!webpackHelpers.buildOk(stats)) return;

          if (server) {
            console.log('🔄 [server] Restarting the server');
            server.kill();
          }

          server = spawnServer(compiler);
          waitForExit(server).then(({ cause }) => {
            if (cause == 'external') {
              server = null;
            }
          });
        });
      }

      return webpackHelpers.watch(compiler, {
        verbose: args.verbose,
        namespace: 'server',
      });
    } else {
      const exitStatus = await webpackHelpers.run(compiler, {
        verbose: args.verbose,
        namespace: 'server',
      });
      if (exitStatus != 0) {
        return exitStatus;
      }

      if (args.run) {
        await waitForExit(spawnServer(compiler));
      } else {
        return 0;
      }
    }
  },
};
