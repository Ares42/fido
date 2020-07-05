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

  async run(_, { verbose }) {
    args = Args.parse(this.arguments, args);

    const command = [
      'gsutil',
      'cp',
      'gs://fido-secrets/secrets.json',
      path.join(__dirname, '../../secrets.json'),
    ];

    if (verbose) {
      console.log(chalk.gray(`👟 ${command.join(' ')}`));
    }

    return new Promise((resolve, reject) => {
      const { status } = spawnSync(command[0], command.slice(1), {
        stdio: [process.stdin, process.stdout, process.stderr],
      });

      if (status == null) {
        console.error('❌ Pull cancelled by signal');
        resolve(1);
      } else if (status != 0) {
        console.error('❌ Failed to pull secrets');
        resolve(status);
      } else {
        console.log('✅ Secrets stored locally');
        resolve(0);
      }
    });

    return 0;
  },
};
