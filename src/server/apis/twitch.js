import { cacheGuard } from '@/src/server/apis/shared/caching';

async function getChannelSummary(environment, username) {
  const user = await environment.twitch.helix.users.getUserByName(username);
  if (!user) {
    return { user, stream: null };
  }

  const stream = await user.getStream();
  const game = stream ? await stream.getGame() : null;

  return {
    user: {
      name: user.displayName,
      logo: user.profilePictureUrl,
      description: user.description.trim() || null,
    },
    stream: stream
      ? {
          thumbnail: stream.thumbnailUrl
            .replace('{width}', 512)
            .replace('{height}', 288),
          viewers: stream.viewers,
          startDate: stream.startDate,
          title: stream.title,
          game: game ? game.name : null,
        }
      : null,
  };
}

export async function get(environment, request, response) {
  const url = new URL(request.query.url);
  const username = url.pathname.split('/')[1];

  response.json(
    await cacheGuard(
      environment,
      `twitch:user:${username}`,
      async () => getChannelSummary(environment, username),
      { ttl: 1 * 60 * 1000 }
    )
  );
}
