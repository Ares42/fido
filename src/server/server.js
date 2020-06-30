import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import minimist from 'minimist';

import * as patreonInfo from './apis/patreonInfo.js';

const routes = {
  '/api/v1/patreonInfo': patreonInfo,
};

function main(positionalArgs, keywordArgs) {
  // process.env.PORT is supplied by the GAE runtime.
  const port = process.env.PORT || keywordArgs.port || 8080;

  const app = express();
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(express.json());

  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  const attachController = (method, path, controller) => {
    app[method](path, async (request, response, next) => {
      Promise.resolve(controller(request, response, next)).catch((error) => {
        console.error(error);
        response.status(500);
        response.json({ error });
      });
    });
  };
  for (const [path, module] of Object.entries(routes)) {
    for (const method of methods) {
      if (module[method]) {
        attachController(method, path, module[method]);
      }
    }
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
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
