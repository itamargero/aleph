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

Hebrew recordings are committed assets so Vercel builds and offline playback require no speech service or installed browser voice. The recording generator uses Microsoft's female Israeli Hebrew `he-IL-HilaNeural` voice through [edge-tts](https://github.com/rany2/edge-tts), at a slightly slower learning pace. The original Carmit recordings have been replaced. Canonical lesson spelling and lookup keys are retained, and letter glyphs resolve to their Hebrew names. Build-time pronunciation hints disambiguate known cases such as כָּל (spoken as kol via כֹּל) without changing the displayed text.

After changing spoken curriculum content, install Python 3.9+ and ffmpeg, then generate the clips (internet access is needed only for this step):

```sh
python3 -m venv .venv-audio
.venv-audio/bin/pip install -r scripts/requirements-audio.txt
EDGE_TTS_BIN="$PWD/.venv-audio/bin/edge-tts" npm run audio:generate
npm run build
```

The generator validates complete decoding, duration, and audible signal before publishing the new manifest. It retains the previous manifest if synthesis fails and changes recording URLs whenever the voice or speaking rate changes. Commit `public/audio/` along with curriculum changes. The build verifies recording coverage; `npm test` uses ffmpeg/ffprobe for generation regression checks.

If sound is paused by the browser, tap the retry banner or any speaker. A muted Hebrew voice is shown explicitly with a link to parent settings. Playback retries native audio activation on each tap and recovers after background interruptions or a closed audio context.

Israwave was tested as a possible local generator, but is not included in the app. Its supplied model has one male voice; the [repository](https://github.com/thewh1teagle/israwave) has no clear license and its [training dataset](https://openslr.org/134/) is marked non-commercial. Hila was selected after comparing samples. Teaching pronunciation, especially isolated syllables, still benefits from a native Hebrew speaker listening review.

Production deploys through the GitHub integration when reviewed changes merge into `main`.
