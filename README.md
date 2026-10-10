# Aleph — Hebrew Heroes

A Hebrew adventure for children who are learning their letters. Pictures, recorded Hebrew, guided letter and sentence building, and a sticker collection help children play without reading English.

All eight worlds and 25 lessons are available from the start. The big play button recommends the next unfinished lesson; children can also choose any world and lesson themselves.

## Play offline on an iPad

1. Open the production site in Safari while connected to Wi-Fi.
2. Keep it open until the airplane badge shows **Ready for airplane**. All worlds, Hebrew recordings, fonts, and game code are downloaded together.
3. Use **Share → Add to Home Screen**. Open the new icon while online and wait for its green airplane check too, since Safari and the installed app can have separate storage.
4. Switch on airplane mode, reopen the game from that icon, and tap a speaker before your trip.

Tap a play button to enable sound on Safari. Progress is saved on the same device. Clearing website data removes the download and saved stars. Parent settings include download retry, sound and movement controls, and a guarded progress reset.

## Development

```sh
npm ci
npm run dev
```

The app source remains in `public/` and is compiled into a local production React bundle by `scripts/build-offline.mjs`. No CDN scripts, browser Babel compilation, external fonts, or speech service is needed at runtime. The Next.js App Router redirects `/` to `/hebrew-heroes.html`; the service worker serves the cached game for both URLs offline.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

The build hashes the complete runtime resource list and generates a service worker. A new worker activates when the previous app is closed, avoiding changes in the middle of a lesson. The old complete cache remains available if a new download fails. Offline readiness is checked against the complete resource list.

Hebrew recordings are committed assets so Vercel builds require no speech service. After changing spoken curriculum content, regenerate them on macOS with the installed Hebrew Carmit voice and ffmpeg:

```sh
npm run audio:generate
npm run build
```

Production deploys through the GitHub integration when reviewed changes merge into `main`.
