const Duration = require('format-duration-time').default;
const webpack = require('webpack');

function buildCallback(error, stats) {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  if (stats.hasErrors() || stats.hasWarnings()) {
    console.log(stats.toString({ colors: true }));
  }

  const elapsedMilliseconds = stats.endTime - stats.startTime;
  const elapsedString = Duration(elapsedMilliseconds).format('m[m] s[s]');
  if (stats.hasErrors()) {
    console.log(`❌ Build failed [${elapsedString}]`);
  } else {
    console.log(`✅ Built successfully [${elapsedString}]`);
  }
}

function watchRunCallback(compiler) {
  for (const fileName of Object.keys(compiler.watchFileSystem.watcher.mtimes)) {
    console.log(`⏰ ${fileName}`);
  }
}

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['dev', 'prod'],
      default: 'dev',
    },

    watch: {
      type: Boolean,
      default: false,
    },
  },

  run(_, { env, watch }) {
    process.env.NODE_ENV = {
      prod: 'production',
      dev: 'development',
    }[env];

    const config = require('../../../webpack.config');
    const compiler = webpack(config);

    if (watch) {
      compiler.hooks.watchRun.tap('Fido WatchRun', watchRunCallback);
      compiler.watch({}, buildCallback);
    } else {
      compiler.run(buildCallback);
    }
  },
};
