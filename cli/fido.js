#!/usr/bin/env node

const minimist = require('minimist');

const Args = require('./commands/shared/args.js');
const {
  logSuccess,
  logWarning,
  logFailure,
} = require('./commands/shared/logging.js');

const COMMANDS = {
  'run-local': () => require('./commands/run-local.js'),
  lint: () => require('./commands/lint.js'),
  build: () => require('./commands/build.js'),
  'build-server': () => require('./commands/build-server.js'),
  'deploy-server': () => require('./commands/deploy-server.js'),
  'pull-secrets': () => require('./commands/pull-secrets.js'),
};

function main(positionalArgs, keywordArgs) {
  if (positionalArgs[0] == 'help') {
    positionalArgs = positionalArgs.slice(1);
    keywordArgs['help'] = true;
  }

  if (positionalArgs.length == 0 || !(positionalArgs[0] in COMMANDS)) {
    console.log();
    console.log('Usage: fido <command>');
    console.log();
    console.log('where <command> is one of:');
    console.log('    ' + Object.keys(COMMANDS).join(', '));
    process.exit(1);
  }

  const commandName = positionalArgs[0];
  const command = COMMANDS[commandName]();

  if (keywordArgs['help'] || positionalArgs[1] == 'help') {
    console.log();
    console.log(`Usage: fido ${commandName}`);
    console.log();
    Args.printHelp(command.arguments || {});
    process.exit(1);
  }

  command
    .run(positionalArgs.slice(1), keywordArgs)
    .then((message) => {
      if (message) {
        logSuccess(message);
      } else {
        logWarning('Command exited successfully without any output');
      }
    })
    .catch((error) => {
      logFailure(error);
      process.exit(1);
    });
}

(() => {
  const args = minimist(process.argv.slice(2));
  const positionalArgs = args._;
  delete args._;

  try {
    main(positionalArgs, args);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
