const { spawn } = require('child_process');
const path = require('path');

const buildServer = require('./build-server.js');

module.exports = {
  arguments: {
    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, { verbose }) {
    let exitStatus = await buildServer.run([], {
      env: 'production',
      verbose,
    });
    if (exitStatus != 0) {
      return exitStatus;
    }

    return new Promise((resolve, reject) => {
      const gcloud = spawn(
        'gcloud',
        ['app', 'deploy', path.join(__dirname, '../../build/server')],
        { stdio: [process.stdin, process.stdout, process.stderr] }
      );
      gcloud.on('exit', (exitStatus) => {
        if (exitStatus != 0) {
          console.log(`❌ Deploy failed`);
        } else {
          console.log(`✅ Deploy finished`);
        }
        resolve(exitStatus);
      });
    });
  },
};
