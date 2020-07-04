import getFavicons from 'get-website-favicon';

import { cacheGuard } from '@/src/server/apis/shared/caching';

async function getFavicon(url) {
  const { icons } = await getFavicons(url);
  if (!icons.length) {
    return null;
  }
  return icons[0].src;
}

export async function get(environment, request, response) {
  const url = new URL(request.query.url);

  response.json(
    await cacheGuard(
      environment,
      `favicon:${url.host}`,
      async () => ({ src: await getFavicon(url.origin) }),
      { ttl: 30 * 60 * 1000 }
    )
  );
}
