const webpack = require('webpack');

const webpackHelpers = require('./shared/webpack.js');

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['local', 'production'],
      default: 'local',
    },

    'dev-server': {
      type: Boolean,
      default: false,
    },

    'local-server': {
      type: String,
      default: 'http://localhost:3000',
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, args) {
    process.env.NODE_ENV = args.env;
    process.fido = {
      flags: {
        server: {
          production: 'https://terrace-fido.uc.r.appspot.com',
          local: args['local-server'],
        }[args.env],
      },
    };

    const configs = require('../../webpack.config');
    const config = args['dev-server']
      ? configs.DevServerConfig
      : configs.FidoConfig;

    const compiler = webpack(config);
    return webpackHelpers.run(compiler, { verbose: args.verbose });
  },
};
