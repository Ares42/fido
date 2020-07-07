const chalk = require('chalk');
const fs = require('promise-fs');
const glob = require('fast-glob');
const path = require('path');
const prettier = require('prettier');
const wildcardMatch = require('wildcard-match');

const Args = require('./shared/args.js');

const githubHelpers = require('./shared/github.js');

async function getFilesToLint({ cached }) {
  const ignoredFilePatterns = [
    '.DS_Store',
    '.git/**',
    'build/**',
    '**/package-lock.json',
    '**/node_modules/**',
    'secrets.json',
  ];

  if (cached) {
    const files = await githubHelpers.listCachedFiles();
    return files.filter((file) => {
      for (const pattern of ignoredFilePatterns) {
        if (wildcardMatch(pattern, '/')(file)) {
          return false;
        }
      }
      return true;
    });
  }

  const root = path.join(__dirname, '../../');
  const files = await glob('**', {
    ignore: ignoredFilePatterns,
    dot: true,
    cwd: root,
  });
  return files;
}

async function runPrettier(
  { rootRelativePath, absolutePath, extension, contents },
  { fix }
) {
  const options = {
    arrowParens: 'always',
    endOfLine: 'lf',
    printWidth: 80,
    singleQuote: true,
    trailingComma: 'es5',
    parser: {
      js: 'babel',
      json: 'json',
      html: 'html',
      vue: 'vue',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
      yaml: 'yaml',
    }[extension],
  };

  if (!options.parser) {
    throw `Unknown extension ${extension}`;
  }

  if (fix) {
    const formatted = prettier.format(contents, options);
    if (contents != formatted) {
      await fs.writeFile(absolutePath, formatted);
      return false;
    }
    return true;
  }

  return prettier.check(contents, options);
}

module.exports = {
  arguments: {
    fix: {
      type: Boolean,
      default: false,
    },

    cached: {
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

    if (args.cached && args.fix) {
      // If we were to allow this, files would be formatted based on their
      // cached contents and then overwrite uncached changes... Meaning devs
      // would lose their work in an unrecoverable way!
      throw '--fix and --cached cannot be used together';
    }

    const linters = [
      {
        linter: runPrettier,
        extensions: ['js', 'json', 'html', 'vue', 'css', 'scss', 'md', 'yaml'],
      },
    ];

    let allFilesPassed = true;

    const files = await getFilesToLint({ cached: args.cached });
    for (const rootRelativePath of files) {
      const root = path.join(__dirname, '../../');
      const absolutePath = path.join(root, rootRelativePath);
      const extension = path
        .extname(rootRelativePath)
        .substring(1)
        .toLowerCase();
      const contents = args.cached
        ? await githubHelpers.readCachedFile(absolutePath)
        : (await fs.readFile(absolutePath)).toString();

      if (contents == null) {
        continue;
      }

      const summary = {
        rootRelativePath,
        absolutePath,
        extension,
        contents,
      };

      let filePassed = true;
      for (const linter of linters) {
        if (linter.extensions.indexOf(extension) >= 0) {
          if (!(await linter.linter(summary, { fix: args.fix }))) {
            filePassed = false;
            allFilesPassed = false;
          }
        }
      }

      if (filePassed) {
        if (args.verbose) {
          console.log(`${chalk.green('PASS')} ${rootRelativePath}`);
        }
      } else {
        if (args.fix) {
          console.log(`${chalk.yellow('FIXED')} ${rootRelativePath}`);
        } else {
          console.log(`${chalk.red('FAIL')} ${rootRelativePath}`);
        }
      }
    }

    if (!allFilesPassed) {
      if (args.fix) {
        return 'Files fixed';
      } else {
        console.log();
        console.log(
          chalk.gray('Run `cli/fido.js lint --fix` to auto-format files')
        );
        console.log();
        throw 'Lint failed';
      }
    }

    return 'Lint passed';
  },
};
