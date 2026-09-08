# Conversations around Follow the Money

A small, link-centred view of public conversations around stories from [Follow the Money Netherlands](https://www.ftm.nl/) and [Follow the Money Europe](https://www.ftm.eu/) on ATProto.

The site collects public `app.bsky.feed.post` records through ATProto Jetstream and groups them by canonical `ftm.nl` or `ftm.eu` URL. A story appears only when:

1. at least two different accounts have shared it independently;
2. at least one of those posts has received a reply;
3. the activity occurred within the last 24 hours.

Posts in every language are included. No automated language detection, topic classification or summarisation is used. The homepage contains at most twenty stories and is ordered by the most recent share or reply.

## How it works

GitHub Actions catches up with Jetstream every fifteen minutes, stores its rolling 24-hour collection state as an Actions artifact, builds `docs/feed.json`, and deploys the static site to GitHub Pages. Visitors all see the same snapshot and do not trigger data collection.

## Run locally

Open `docs/index.html` directly to see a local design example. To collect live data, use Node.js 22 or newer:

```bash
node scripts/collect.mjs
```

## License

The software is available under the MIT License. External articles and public ATProto records remain the property and responsibility of their respective owners.
