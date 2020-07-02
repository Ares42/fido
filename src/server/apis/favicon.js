import getFavicons from 'get-website-favicon';

export async function get(request, response) {
  const { icons } = await getFavicons(request.query.url);
  if (!icons.length) {
    response.json({ src: null });
    return;
  }

  response.json({ src: icons[0].src });
}
