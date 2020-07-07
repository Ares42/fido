const child_process = require('child_process');

async function getCachedFileObjectHash(file) {
  return new Promise((resolve, reject) => {
    child_process.exec(
      `git ls-files --stage '${file}'`,
      {},
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          throw `Error getting hash for ${file}`;
        }

        if (stderr) {
          console.error(stderr);
          throw `Error getting hash for ${file}`;
        }

        if (!stdout) {
          resolve(null);
          return;
        }

        const hash = stdout.split(' ')[1];
        resolve(hash);
      }
    );
  });
}

async function readCachedObject(hash) {
  return new Promise((resolve, reject) => {
    child_process.exec(
      `git cat-file -p '${hash}'`,
      {},
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          throw `Error reading cached object ${hash}`;
        }

        if (stderr) {
          console.error(stderr);
          throw `Error reading cached object ${hash}`;
        }

        resolve(stdout);
      }
    );
  });
}

// Reads the cached contents of the provided file
async function readCachedFile(file) {
  const hash = await getCachedFileObjectHash(file);
  if (!hash) return null;
  return readCachedObject(hash);
}

async function listCachedFiles() {
  return new Promise((resolve, reject) => {
    child_process.exec(
      'git diff --name-only --cached',
      {},
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          throw 'Error listing cached files';
        }

        if (stderr) {
          console.error(stderr);
          throw 'Error listing cached files';
        }

        if (!stdout) {
          resolve([]);
          return;
        }

        resolve(stdout.trim().split('\n'));
      }
    );
  });
}

module.exports = {
  readCachedFile,
  listCachedFiles,
};
