const chalk = require('chalk');
const { spawnSync } = require('child_process');
const path = require('path');
const Confirm = require('prompt-confirm');

const Args = require('./shared/args.js');
const { logSuccess, logWarning } = require('./shared/logging.js');
const buildServer = require('./build-server.js');

function gitFetchOriginMaster({ verbose }) {
  const command = ['git', 'fetch', 'origin', 'master'];
  if (verbose) {
    console.log(chalk.gray(`👟 ${command.join(' ')}`));
  }

  const { status } = spawnSync(command[0], command.slice(1), {
    stdio: [
      process.stdin,
      verbose ? process.stdout : null,
      verbose ? process.stderr : null,
    ],
  });

  if (status == null || status != 0) {
    throw 'Failed to fetch origin/master';
  }
}

function gitUpdateIndex() {
  const { status } = spawnSync('git', ['update-index', '-q', '--refresh'], {
    stdio: [process.stdin, process.stdout, process.stderr],
  });

  if (status == null || status != 0) {
    throw 'Failed to `git update-index`';
  }
}

function gitGetChangedFiles() {
  const { status, stdout } = spawnSync(
    'git',
    ['diff-index', '--name-only', 'origin/master'],
    { stdio: [process.stdin, null, process.stderr] }
  );

  if (status == null || status != 0) {
    throw 'Failed to locate changed files in git';
  }

  return stdout;
}

async function confirmCleanBuild({ verbose }) {
  gitFetchOriginMaster({ verbose });
  gitUpdateIndex();

  const changedFiles = gitGetChangedFiles();
  if (changedFiles.length > 0) {
    logWarning('Source differs from origin/master!');
    process.stdout.write(chalk.gray(changedFiles));
    return new Confirm({ name: 'Deploy with local changes?', default: false })
      .run()
      .then((answer) => {
        if (!answer) {
          throw 'Deploy cancelled';
        }
      });
  }
}

function getRemoteSecrets() {
  const { status, stdout } = spawnSync(
    'gsutil',
    ['cat', 'gs://fido-secrets/secrets.json'],
    { stdio: [process.stdin, null, process.stderr] }
  );

  if (status == null || status != 0) {
    throw 'Failed to download secrets from GCP bucket';
  }

  return JSON.parse(stdout.toString());
}

function getLocalSecrets() {
  try {
    return require('../../secrets.json');
  } catch (error) {
    if (error.code == 'MODULE_NOT_FOUND') {
      throw 'You need to run `cli/fido.js pull-secrets`';
    } else {
      throw error;
    }
  }
}

async function confirmCleanSecrets() {
  const expected = getRemoteSecrets();
  const observed = getLocalSecrets();

  const differences = [];
  for (const key of Object.keys(expected)) {
    if (!(key in observed)) {
      differences.push(`Local secrets missing "${key}"`);
    } else if (observed[key] !== expected[key]) {
      differences.push(`Local and remote secrets differ for "${key}"`);
      differences.push(`  Observed: ${observed[key]}`);
      differences.push(`  Expected: ${expected[key]}`);
    }
  }
  for (const key of Object.keys(observed)) {
    if (!(key in expected)) {
      differences.push(`Local secrets contains untracked key "${key}"`);
    }
  }

  if (differences.length) {
    logWarning('Local and remote secrets differ!');
    console.log(chalk.gray(differences.join('\n')));
    return new Confirm({ name: 'Deploy with local changes?', default: false })
      .run()
      .then((answer) => {
        if (!answer) {
          throw 'Deploy cancelled';
        }
      });
  }
}

function gcloudDeploy() {
  const { status } = spawnSync(
    'gcloud',
    [
      'app',
      'deploy',
      path.join(__dirname, '../../build/server'),
      '--project',
      'terrace-fido',
      '--quiet',
    ],
    { stdio: [process.stdin, process.stdout, process.stderr] }
  );

  if (status == null || status != 0) {
    throw 'Deploy failed';
  }
}

module.exports = {
  arguments: {
    dry: {
      type: Boolean,
      default: false,
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, args) {
    args = Args.parse(this.arguments, args);

    await confirmCleanBuild({ verbose: args.verbose });
    await confirmCleanSecrets();

    logSuccess(
      await buildServer.run([], {
        env: 'production',
        verbose: args.verbose,
      })
    );

    if (args.dry) {
      throw 'As per --dry, skipping actual deploy';
    }

    gcloudDeploy();
    return 'Deploy finished';
  },
};
