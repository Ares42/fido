const { spawn } = require('child_process');

const buildFido = require('./build.js');
const buildServer = require('./build-server.js');

function startRedis({ port, verbose }) {
  return new Promise((resolve, reject) => {
    const redis = spawn('redis-server', ['--port', port]);

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

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['local', 'production'],
      default: 'local',
    },

    'fido-port': {
      type: Number,
      default: 8080,
    },

    'server-port': {
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

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, args) {
    process.env.NODE_ENV = args.env;
    process.fido = {
      flags: {
        fido: {
          server: `http://localhost:${args['server-port']}`,
        },
        server: {
          redisPort: args['redis-port'],
          disableApiCache: !args['api-cache'],
        },
      },
    };

    await startRedis({
      port: args['redis-port'],
      verbose: args.verbose,
    });

    buildServer.run([], {
      env: args.env,
      verbose: args.verbose,
      watch: true,
      run: true,
      port: args['server-port'],
      'api-cache': args['api-cache'],
      'redis-port': args['redis-port'],
    });

    buildFido.run([], {
      env: args.env,
      verbose: args.verbose,
      run: true,
      'dev-server': true,
      'dev-server-port': args['fido-port'],
      'server-override': `http://localhost:${args['server-port']}`,
    });

    return new Promise(() => {});
  },
};
