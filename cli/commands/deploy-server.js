const chalk = require('chalk');
const { spawnSync } = require('child_process');
const path = require('path');
const Confirm = require('prompt-confirm');

const Args = require('./shared/args.js');
const buildServer = require('./build-server.js');

function gitUpdateIndex() {
  const { status } = spawnSync('git', ['update-index', '-q', '--refresh'], {
    stdio: [process.stdin, process.stdout, process.stderr],
  });

  if (status == null) {
    console.error('❌  Process cancelled by signal');
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
    {
      stdio: [process.stdin, null, process.stderr],
    }
  );

  if (status == null) {
    console.error('❌  Process cancelled by signal');
    return null;
  } else if (status != 0) {
    console.error('❌ Failed to locate changed files in git');
    return null;
  }

  return stdout;
}

async function confirmCleanBuild() {
  const exitStatus = gitUpdateIndex();
  if (exitStatus != 0) return exitStatus;

  const changedFiles = gitGetChangedFiles();
  if (changedFiles == null) return 1;

  if (changedFiles.length > 0) {
    console.warn('⚠️  Build contains local changes!');
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

    let exitStatus = await confirmCleanBuild();
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
