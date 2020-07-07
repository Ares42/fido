const Duration = require('format-duration-time').default;

const { logSuccess, logFailure } = require('./logging.js');

function getBuildSummary(stats, { namespace }) {
  const elapsedMilliseconds = stats.endTime - stats.startTime;
  const elapsedString = Duration(elapsedMilliseconds).format('m[m] s[s]');
  const namespaceString = namespace ? `[${namespace}] ` : '';
  if (stats.hasErrors()) {
    return `${namespaceString}Build failed [${elapsedString}]`;
  } else {
    return `${namespaceString}Built successfully [${elapsedString}]`;
  }
}

function logBuildSummary(stats, { namespace }) {
  const summary = getBuildSummary(stats, { namespace });
  if (buildOk(stats)) {
    logSuccess(summary);
  } else {
    logFailure(summary);
  }
}

// Logs errors, warnings, and a result summary given compilation statistics.
function logBuildStats(stats, { verbose }) {
  if (stats.hasErrors() || stats.hasWarnings() || verbose) {
    console.log(stats.toString({ colors: true }));
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
        throw error;
      }

      logBuildStats(stats, { verbose, namespace });

      const summary = getBuildSummary(stats, { namespace });
      if (buildOk(stats)) {
        resolve(summary);
      } else {
        reject(summary);
      }
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
      logBuildSummary(stats, { namespace });
    });

    compiler.watch({ ignored: [/node_modules/] }, (error, stats) => {
      if (!webpackOk(error)) {
        throw error;
      }
    });
  });
}

module.exports = {
  logBuildStats,
  logChangedFiles,
  getBuildSummary,
  logBuildSummary,
  webpackOk,
  buildOk,
  run,
  watch,
};
