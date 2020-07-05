import getFavicons from 'get-website-favicon';

import { cacheGuard } from '@/src/server/apis/shared/caching';

export async function get(environment, request, response) {
  const url = request.query.url;
  const title = request.query.title;
  const artist = request.query.artist;

  const rawLyrics = await environment.genius.getLyrics({
    url,
    title,
    artist,
  });

  response.json({
    lyrics: rawLyrics.split('\n'),
  });
}
