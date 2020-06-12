const webpack = require('webpack');

const config = require('../webpack.config');

const compiler = webpack(config);

compiler.watch({}, (error, stats) => {
  if (error) {
    console.error(error);
    return;
  }

  console.log(
    stats.toString({
      // Shows colors in the console
      colors: true,
    })
  );
});
