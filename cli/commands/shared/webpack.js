const Duration = require('format-duration-time').default;

// Logs errors, warnings, and a result summary given compilation statistics.
function logBuildStats(stats, { verbose, namespace }) {
  if (stats.hasErrors() || stats.hasWarnings() || verbose) {
    console.log(stats.toString({ colors: true }));
  }

  const elapsedMilliseconds = stats.endTime - stats.startTime;
  const elapsedString = Duration(elapsedMilliseconds).format('m[m] s[s]');
  const namespaceString = namespace ? `[${namespace}] ` : '';
  if (stats.hasErrors()) {
    console.log(`❌ ${namespaceString}Build failed [${elapsedString}]`);
  } else {
    console.log(`✅ ${namespaceString}Built successfully [${elapsedString}]`);
  }
}

// Logs any files that have changed since the last execution during watches.
//
// Example:
//
// ```js
// const compiler = webpack(config);
//
// compiler.hooks.watchRun.tap('fido', () => {
//   logChangedFiles(compiler);
// });
//
// compiler.watch(...);
// ```
function logChangedFiles(compiler, { namespace }) {
  const namespaceString = namespace ? `[${namespace}] ` : '';
  for (const fileName of Object.keys(compiler.watchFileSystem.watcher.mtimes)) {
    console.log(`⏰ ${namespaceString}${fileName}`);
  }
}

// Logs any errors that occured in webpack. These are NOT build errors and are
// often fatal. See the related helpers `webpackOk` and `buildOk`.
function logWebpackError(error) {
  console.error(error.stack || error);
  if (error.details) {
    console.error(error.details);
  }
}

function webpackOk(error) {
  return !error;
}

function buildOk(stats) {
  return !stats.hasErrors();
}

// Executes the provided webpack compiler while logging errors + stats.
//
// Asynchronously returns a command line exit status (0 for pass, 1 for fail).
async function run(compiler, { verbose, namespace }) {
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (!webpackOk(error)) {
        logWebpackError(error);
        resolve(1);
        return;
      }

      logBuildStats(stats, { verbose, namespace });
      resolve(buildOk(stats) ? 0 : 1);
    });
  });
}

// Variant of `run` which watches for subsequent changes and re-compiles.
//
// Asynchronously returns a command line exit status (0 for pass, 1 for fail).
async function watch(compiler, { verbose, namespace }) {
  return new Promise((resolve, reject) => {
    compiler.hooks.watchRun.tap('fido', () => {
      logChangedFiles(compiler, { namespace });
    });
    compiler.hooks.done.tap('fido', (stats) => {
      logBuildStats(stats, { verbose, namespace });
    });

    compiler.watch({ ignored: [/node_modules/] }, (error, stats) => {
      if (!webpackOk(error)) {
        logWebpackError(error);
        resolve(1);
      }
    });
  });
}

module.exports = {
  logBuildStats,
  logChangedFiles,
  logWebpackError,
  webpackOk,
  buildOk,
  run,
  watch,
};
