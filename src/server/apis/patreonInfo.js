import fetch from 'node-fetch';
import safeEval from 'safe-eval';
import stripHtml from 'string-strip-html';

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

  // Try and find the latest incomplete goal, fallback to the latest completed goal.
  const goal =
    goals.find((goal) => goal.attributes.completed_percentage < 100) ||
    goals[goals.length - 1];

  return {
    progress: goal.attributes.completed_percentage / 100,
    description: stripHtml(goal.attributes.description),
  };
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error(chalk.red('Missing positional arg: <userId>'));
    process.exit(1);
  }
}

export async function get(request, response) {
  const bootstrap = await getPatreonBootstrap(request.query.url);
  response.json({
    goal: getLatestGoal(bootstrap),
  });
}
