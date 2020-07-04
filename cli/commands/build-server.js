const webpack = require('webpack');

const webpackHelpers = require('./shared/webpack.js');

module.exports = {
  arguments: {
    env: {
      type: String,
      values: ['local', 'production'],
      default: 'local',
    },

    verbose: {
      type: Boolean,
      default: false,
    },
  },

  async run(_, { env, verbose }) {
    process.env.NODE_ENV = env;

    const { ServerConfig } = require('../../webpack.config');
    const compiler = webpack(ServerConfig);
    return webpackHelpers.run(compiler, { verbose });
  },
};
