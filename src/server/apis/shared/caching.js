// Caches the results of the async function in Redis.
//
// __Note:__ the ttl argument is optional and specified in milliseconds.
export async function cacheGuard(environment, key, asyncFunction, { ttl }) {
  if (process.fido.flags.disableApiCache) {
    return asyncFunction();
  }

  const cacheResponse = await environment.redis.get(key);
  if (cacheResponse) {
    return JSON.parse(cacheResponse);
  }

  const response = await asyncFunction();
  if (ttl !== undefined) {
    environment.redis.set(key, JSON.stringify(response), 'PX', ttl);
  } else {
    environment.redis.set(key, JSON.stringify(response));
  }
  return response;
}
