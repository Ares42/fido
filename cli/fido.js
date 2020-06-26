#!/usr/bin/env node

const minimist = require('minimist');

const Args = require('./args.js');

const COMMANDS = {
  build: () => require('./commands/build.js'),
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

  command.run(
    positionalArgs.slice(1),
    Args.parse(command.arguments || {}, keywordArgs)
  );
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
