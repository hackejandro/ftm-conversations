const dispatchUrl =
  'https://api.github.com/repos/hackejandro/ftm-conversations/actions/workflows/update-feed.yml/dispatches';

async function dispatch(env) {
  const response = await fetch(dispatchUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TRIGGER_TOKEN}`,
      'User-Agent': 'ftm-conversations-scheduler',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main' }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(JSON.stringify({ event: 'github_dispatch_failed', status: response.status, detail }));
    throw new Error(`GitHub dispatch failed with ${response.status}`);
  }

  console.log(JSON.stringify({ event: 'github_feed_update_dispatched', dispatchedAt: new Date().toISOString() }));
}

export default {
  fetch() {
    return Response.json({ ok: true, service: 'ftm-conversations-scheduler' });
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(dispatch(env));
  },
};
