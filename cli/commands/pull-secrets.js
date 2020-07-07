const chalk = require('chalk');
const { spawnSync } = require('child_process');
const path = require('path');

const Args = require('./shared/args.js');

module.exports = {
  arguments: {
    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, args) {
    args = Args.parse(this.arguments, args);

    const command = [
      'gsutil',
      'cp',
      'gs://fido-secrets/secrets.json',
      path.join(__dirname, '../../secrets.json'),
    ];

    if (args.verbose) {
      console.log(chalk.gray(`👟 ${command.join(' ')}`));
    }

    return new Promise((resolve, reject) => {
      const { status } = spawnSync(command[0], command.slice(1), {
        stdio: [process.stdin, process.stdout, process.stderr],
      });

      if (status == null) {
        throw 'Pull cancelled by signal. Is gcloud installed?';
      } else if (status != 0) {
        throw 'Failed to pull secrets';
      } else {
        resolve('Secrets stored locally');
      }
    });

    return 0;
  },
};
