# Hebrew Heroes: offline play and pre-reader usability

## Design
The child should be able to open the app, tap a prominent play control, listen to Hebrew, and learn by matching pictures and copying letters without reading English. Preserve the colorful mascot and illustrated worlds. Use responsive layouts with real touch targets in iPad portrait and landscape. Keep parent instructions in settings.

Keep the existing data-driven React exercise engine and bundle its source at build time. Serve every resource from this origin, including local fonts and pre-generated Hebrew voice clips. A versioned service worker atomically caches the complete resource list on the first visit, reports progress and readiness, handles both entry URLs offline, and supports audio range requests. Do not report ready until every resource is cached. Keep the last working cache until a new version finishes installing.

Complete all eight worlds using supported exercise types, visual story scenes, vowel matching, listening, everyday phrases, and review without time pressure. Every world and lesson is available from the start, as requested in the follow-up; keep stars and stickers as completion rewards. Add a model for word and sentence ordering so children can copy from right to left. Spoken names accompany letter teaching. Audio-answer activities use picture choices and text remains supplemental. Remove prototype tweaks from the production interface. Guard saved data and avoid late callbacks after exit.

## Plan
- [x] Inspect repository, prototype, curriculum, dependencies, and current branch.
- [x] Isolate changes and preserve the existing package-lock edit.
- [x] Complete all worlds and validate curriculum references and solutions.
- [x] Replace scaled screens with responsive child-friendly navigation and exercises.
- [x] Bundle dependencies locally, generate all audio, and cache the complete game.
- [x] Verify offline cold launch, full curriculum completion, audio, progress, and iPad layouts.
- [x] Run build, TypeScript, meaningful tests, and code review; fix material findings.
- [x] Merge to main and verify the named production deployment and offline artifacts.

## Verification
- All eight worlds contain 25 playable levels and 114 activities, all unlocked from the first visit. Browser clicks completed every activity with the network disabled; the resulting 75 stars, 25 stickers, and 945 coins survived an offline reload. After the unlock-all change, WebKit confirmed every world and lesson was enabled and started the final lesson of each world offline without earning any prerequisite stars.
- The full download contains 184 resources (2.37 MiB), including 171 MP3 recordings and both local fonts. WebKit decoded every recording offline and returned a valid 206 response for an audio byte range; three unused metadata recordings were subsequently removed.
- WebKit with the iPad device profile reopened a fresh page at `/` offline, played recorded teaching audio, and migrated a legacy save without losing stars, coins, stickers, or previously unlocked worlds. The first released runtime version was `feb7d8f430aa48c7037d`; this cold launch produced no page errors or failed network requests.
- Portrait, landscape, and narrow layouts (768×1024, 1024×768, 390×844) had no horizontal overflow or enabled game buttons smaller than 56 CSS pixels. Wrong-answer hints worked, and rapid correct taps followed by exit did not advance or award a lesson after leaving.
- `npm test`: 27 tests passed across curriculum, saved progress, audio coverage, offline client retries, and the generated service worker. Tests cover unlock-all behavior and invalid indexes, partial/corrupt downloads, old-cache preservation, eviction and repair, offline routes, audio ranges, and bounded native registration/lookup waits. Lint, TypeScript, production build, and `git diff --check` passed.
- CodeRabbit completed its review against `main` after the implementation commit, with two minor findings. Removed the audio retry button's overriding status role and guarded registration/worker listeners with WeakSets. A fresh WebKit check verified the button's native role and five download retries with one listener per object.
- Its second completed review found three unused recordings made from parent-facing English metadata containing Hebrew examples. Excluded those fields from speech collection, removed the unused recordings, and added a regression test retaining child-facing speech fields.
- PR #1 merged as `334edb95cb05229a52c6bd0763180aaf0512dcff`. Production deployment `dpl_Sm2byPuijw5bWZBeUBssVjVLnzVs` was Ready at https://aleph-two.vercel.app. Live HTML and service-worker hashes matched the checked build. A fresh WebKit iPad page reopened the public root offline, accessed all 25 lessons, started the final lesson of every world without prerequisite stars, and played Hebrew with no page errors or failed network requests. All 171 production recordings decoded offline and the range response returned 206/256 bytes.
- An additional online-retry probe exposed a pending native re-registration call on WebKit. The follow-up reuses an existing registration first, checks cached readiness directly, leaves updates in the background, and gives native lookup/initial registration bounded deadlines. Four regression tests prove cached online retries complete despite a pending native update and that timed-out setup/lookup can be retried.
- These browser checks emulate an iPad; the daughter's physical iPad and Home Screen installation still need the documented preflight before travel.

### Research decisions
- Apple Safari requires a user gesture to start audio; use a persistent Web Audio context unlocked by play/speaker taps. Local recordings avoid dependence on an installed speech voice.
- WebKit can evict unused website storage; request persistence and give parents a concrete preflight reopen/speaker check. Prepare the Home Screen app separately because its storage may differ from Safari.
- Keep the existing source engine and build locally rather than introduce a new backend or speech service. Upgrade the small Next.js shell to 16 and remove browser Babel/CDNs.


# Web audio and Hebrew pronunciation repair

- [x] Preserve the original checkout and establish a clean current-main baseline (27 tests pass).
- [x] Reproduce audio recovery failures and identify the failed playback boundary (fresh deployed profiles played; suspended/closed contexts exposed recovery defects).
- [x] Verify Hila neural Hebrew; compare Israwave samples; user selected Hila. Correct vowel models and labels.
- [x] Add regression coverage, repair playback, and regenerate all 171 bundled recordings.
- [x] Verify Chromium, WebKit, offline playback, lint, types, production build, and review.

## Approach

Keep committed recordings and offline support. Trace audible sample data and browser playback separately. Replace the generation voice only after proving it produces usable Hebrew recordings. Preserve progress and curriculum access.

## Review

- 50 Vitest checks, ESLint, TypeScript, production build, and diff validation pass.
- Chromium and mobile WebKit decode all 171 Hila recordings with nonzero signal; recorded words/instructions and offline cold reload/playback work with all 184 assets ready.
- Reproduced and repaired closed/suspended context recovery, pending activation retry, queued state-change cancellation, retry gesture ordering, stale muted status, and praise truncation. Automatic narration yields to child interactions.
- CodeRabbit initial review completed with one minor missing-tool diagnostic; fixed by checking ffmpeg/ffprobe before synthesis, with regression coverage.
- Final browser verification: 13/13 checks pass in Chrome and mobile WebKit (26 total), with zero page/console errors or failed requests. A correct answer 4.3 ms after Start preserves the complete praise recording; the recording ends naturally after about 4.345 seconds before advancement. Exiting during praise leaves the level list and saved progress unchanged.
- Consolidated local browser evidence: `output/playwright/hila-browser-verification-summary.json`. Final runtime: `4d1a6a8d10588c353459` (184 resources, 3.44 MiB).
- Committed CodeRabbit review completed with two minor findings and no blockers. Fixed completed clips being replayed after idle suspension; focused browser checks verify interrupted speech retries fully while idle resume starts no stale clip. The other finding concerns provisioning ffmpeg/ffprobe for tests: these are documented development prerequisites, intentionally required for actual audio validation; this repository has no separate CI test environment to provision.
- Vercel preview is Ready for PR #3. Authenticated inspection confirms Hila and all 171 referenced clips. The original checkout's lockfile edit is preserved; production has not been changed.
