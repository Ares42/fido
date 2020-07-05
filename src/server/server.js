import cors from 'cors';
import express from 'express';

import { createEnvironment } from '@/src/server/environment.js';

import * as patreonInfo from '@/src/server/apis/patreonInfo.js';
import * as favicon from '@/src/server/apis/favicon.js';

const routes = {
  '/api/v1/patreonInfo': patreonInfo,
  '/api/v1/favicon': favicon,
};

async function main() {
  // process.env.PORT is supplied by the GAE runtime.
  const port = process.env.PORT || process.fido.flags.port || 8080;

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

main().catch((error) => {
  console.error(error);
  console.error('Server experienced fatal startup error');
  process.exit(1);
});
