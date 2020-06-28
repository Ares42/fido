const Duration = require('format-duration-time').default;
const webpack = require('webpack');

function buildCallback(error, stats, { verbose }) {
  if (error) {
    console.error(error.stack || error);
    if (error.details) {
      console.error(error.details);
    }
    process.exit(1);
  }

  if (stats.hasErrors() || stats.hasWarnings() || verbose) {
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

    config: {
      type: String,
      default: 'Fido',
      values: ['Fido', 'DevServer'],
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  run(_, { env, watch, config: configName, verbose }) {
    process.env.NODE_ENV = {
      prod: 'production',
      dev: 'development',
    }[env];

    const config = require('../../webpack.config')[`${configName}Config`];
    const compiler = webpack(config);

    const buildCallbackClosure = (error, stats) => {
      return buildCallback(error, stats, { verbose });
    };

    if (watch) {
      compiler.hooks.watchRun.tap('fido', watchRunCallback);
      compiler.watch({ ignored: [/node_modules/] }, buildCallbackClosure);
    } else {
      compiler.run(buildCallbackClosure);
    }
  },
};
