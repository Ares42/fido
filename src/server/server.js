import cors from 'cors';
import express from 'express';
import minimist from 'minimist';

import { createEnvironment } from '@/src/server/environment.js';

import * as patreonInfo from '@/src/server/apis/patreonInfo.js';
import * as favicon from '@/src/server/apis/favicon.js';

const routes = {
  '/api/v1/patreonInfo': patreonInfo,
  '/api/v1/favicon': favicon,
};

async function main(positionalArgs, keywordArgs) {
  // process.env.PORT is supplied by the GAE runtime.
  const port = process.env.PORT || keywordArgs.port || 8080;

  const environment = await createEnvironment();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  const attachController = (method, path, controller) => {
    app[method](path, async (request, response, next) => {
      controller(environment, request, response).catch((error) => {
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

  main(positionalArgs, args).catch((error) => {
    console.error(error);
    process.exit(1);
  });
})();
