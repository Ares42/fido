import { promisify } from 'util';

import redis from 'redis';
import redisCommands from 'redis-commands';

async function connectRedisClient() {
  const redisHost = process.env.REDISHOST || 'localhost';
  const redisPort = process.env.REDISPORT || process.fido.flags.redisPort;

  return new Promise((resolve, reject) => {
    const client = redis.createClient(redisPort, redisHost);

    client.on('error', (error) => {
      if (error.stack) {
        console.error(error.stack);
      } else {
        console.error(error);
      }
      reject('Failed to connect to Redis');
    });

    client.once('ready', () => {
      resolve(client);
    });
  });
}

// See https://github.com/NodeRedis/node-redis#promises
function createAsyncRedisClient(syncClient) {
  const asyncClient = {};
  for (const command of redisCommands.list) {
    if (command != 'multi') {
      asyncClient[command] = promisify(syncClient[command]).bind(syncClient);
    }
  }
  return asyncClient;
}

export async function createEnvironment() {
  return {
    redis: createAsyncRedisClient(await connectRedisClient()),
  };
}
