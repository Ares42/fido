import fetch from 'node-fetch';
import safeEval from 'safe-eval';
import stripHtml from 'string-strip-html';

import { cacheGuard } from '@/src/server/apis/shared/caching';

async function getPatreonBootstrap(url) {
  const page = await fetch(url).then((response) => response.text());

  const boostrapIndex = page.indexOf(
    'Object.assign(window.patreon.bootstrap, '
  );
  const scriptStartIndex = 8 + page.lastIndexOf('<script>', boostrapIndex);
  const scriptEndIndex = page.indexOf('</script>', boostrapIndex);
  const scriptContent = page.substring(scriptStartIndex, scriptEndIndex);

  const context = { window: {} };
  safeEval(scriptContent, context);

  const bootstrap = context.window.patreon.bootstrap;
  if (!bootstrap.campaign) {
    throw 'Page does not contain a patreon user';
  }

  return bootstrap;
}

function getLatestGoal(bootstrap) {
  const goals = bootstrap.campaign.included.filter(
    ({ type }) => type == 'goal' || type == 'patron_goal'
  );
  if (!goals.length) {
    return null;
  }

  // Reorder the goals in descending order of completion progress. We always
  // want to show the user the goal that's closest to completion.
  goals.sort(
    (a, b) =>
      b.attributes.completed_percentage - a.attributes.completed_percentage
  );

  // Try and find the latest incomplete goal, fallback to the latest completed goal.
  const goal =
    goals.find((goal) => goal.attributes.completed_percentage < 100) ||
    goals[goals.length - 1];

  return {
    progress: goal.attributes.completed_percentage / 100,
    description: stripHtml(goal.attributes.description),
  };
}

export async function get(environment, request, response) {
  const url = request.query.url;

  response.json(
    await cacheGuard(
      environment,
      `patreon:${url}`,
      async () => {
        const bootstrap = await getPatreonBootstrap(url);
        return { goal: getLatestGoal(bootstrap) };
      },
      { ttl: 5 * 60 * 1000 }
    )
  );
}
