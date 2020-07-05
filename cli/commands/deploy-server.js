const chalk = require('chalk');
const { spawnSync } = require('child_process');
const path = require('path');
const Confirm = require('prompt-confirm');

const Args = require('./shared/args.js');
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

  if (status == null) {
    console.error('❌  Process cancelled by signal');
    return 1;
  } else if (status != 0) {
    console.error('❌ Failed to fetch origin/master');
    return status;
  }

  return 0;
}

function gitUpdateIndex() {
  const { status } = spawnSync('git', ['update-index', '-q', '--refresh'], {
    stdio: [process.stdin, process.stdout, process.stderr],
  });

  if (status == null) {
    console.error('❌ Process cancelled by signal');
    return 1;
  } else if (status != 0) {
    console.error('❌ Failed to `git update-index`');
    return status;
  }

  return 0;
}

function gitGetChangedFiles() {
  const { status, stdout } = spawnSync(
    'git',
    ['diff-index', '--name-only', 'origin/master'],
    { stdio: [process.stdin, null, process.stderr] }
  );

  if (status == null) {
    console.error('❌ Process cancelled by signal');
    return null;
  } else if (status != 0) {
    console.error('❌ Failed to locate changed files in git');
    return null;
  }

  return stdout;
}

async function confirmCleanBuild({ verbose }) {
  let exitStatus = gitFetchOriginMaster({ verbose });
  if (exitStatus != 0) {
    return exitStatus;
  }

  exitStatus = gitUpdateIndex();
  if (exitStatus != 0) {
    return exitStatus;
  }

  const changedFiles = gitGetChangedFiles();
  if (changedFiles == null) {
    return 1;
  }

  if (changedFiles.length > 0) {
    console.warn('⚠️  Source differs from origin/master!');
    process.stdout.write(chalk.gray(changedFiles));
    return new Confirm({ name: 'Deploy with local changes?', default: false })
      .run()
      .then((answer) => {
        if (!answer) {
          console.log('🚫 Deploy cancelled');
          return 1;
        }

        return 0;
      });
  }

  return 0;
}

function getRemoteSecrets() {
  const { status, stdout } = spawnSync(
    'gsutil',
    ['cat', 'gs://fido-secrets/secrets.json'],
    { stdio: [process.stdin, null, process.stderr] }
  );

  if (status == null) {
    console.error('❌ Process cancelled by signal');
    return null;
  } else if (status != 0) {
    console.error('❌ Failed to download secrets from GCP bucket');
    return null;
  }

  return JSON.parse(stdout.toString());
}

function getLocalSecrets() {
  try {
    return require('../../secrets.json');
  } catch (error) {
    if (error.code == 'MODULE_NOT_FOUND') {
      console.error('❌ You need to run `cli/fido.js pull-secrets`');
    } else {
      console.error(error);
    }
    return null;
  }
}

async function confirmCleanSecrets() {
  const expected = getRemoteSecrets();
  if (!expected) {
    return 1;
  }

  const observed = getLocalSecrets();
  if (!observed) {
    return 1;
  }

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
    console.warn('⚠️  Local and remote secrets differ!');
    console.log(chalk.gray(differences.join('\n')));
    return new Confirm({ name: 'Deploy with local changes?', default: false })
      .run()
      .then((answer) => {
        if (!answer) {
          console.log('🚫 Deploy cancelled');
          return 1;
        }

        return 0;
      });
  }

  return 0;
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

  return status == null ? 1 : status;
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

    let exitStatus = await confirmCleanBuild({ verbose: args.verbose });
    if (exitStatus != 0) {
      return exitStatus;
    }

    exitStatus = await confirmCleanSecrets();
    if (exitStatus != 0) {
      return exitStatus;
    }

    exitStatus = await buildServer.run([], {
      env: 'production',
      verbose: args.verbose,
    });
    if (exitStatus != 0) {
      return exitStatus;
    }

    if (args.dry) {
      console.log('🚫 As per --dry, skipping actual deploy');
      return 0;
    }

    exitStatus = gcloudDeploy();
    if (exitStatus != 0) {
      console.log(`❌ Deploy failed`);
    } else {
      console.log(`✅ Deploy finished`);
    }
    return exitStatus;
  },
};
