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

## Pronunciation follow-up: kol hakavod

- [x] Trace the reported kal/kol error to the recorded praise synthesis input.
- [x] Compare Hila recordings with explicit /o/ vowel inputs against the existing /a/ recording and Israwave phonemes.
- [x] Add a pronunciation-specific regression, keep canonical lesson spelling separate from synthesis hints, and regenerate affected clips.
- [x] Verify playback, full checks, code review, and update PR #3 preview.

The previous waveform checks established audible playback, not correct Hebrew vowels. This follow-up validates the reported vowel contrast directly.

### Pronunciation follow-up evidence

- Original praise matches the explicit kal reference over the first word (PCM cosine 1.0). The regenerated speech-only כֹּל sample closely matches the explicit /o/ reference (first-word cosine 0.953); its vowel formants differ from the original /a/ sample.
- All 171 synthesis inputs audited. Corrected the plural imperative vowel in four choose prompts. The comparison found five affected recordings; the 166 other recordings and browser JavaScript remain byte-identical.
- 53 tests, lint, TypeScript, production build, and diff validation pass. Manifest canonical aliases remain valid, and the five regenerated clips use new URLs. Runtime `526d6fef5139967a86d8`.
- The user explicitly requested merging to production for their child to play. Production deployment verification follows the merge.
- PR #3 merged as `d04fba3`; production at https://aleph-two.vercel.app serves the corrected recordings. Chrome and mobile WebKit verified real speaker playback, complete praise, all 184 cached resources, and offline cold reload with runtime `526d6fef5139967a86d8`. The pronunciation delta's CodeRabbit review completed without findings.

## Reset airplane download without losing progress

- [x] Add a network-only recovery page that old cached versions can open.
- [x] Reset only Hebrew Heroes service-worker/cache storage after verifying network access; preserve local progress and unrelated storage.
- [x] Link the recovery page from parent settings; explain returning online and preparing the download again.
- [ ] Test failure/retry and old-worker recovery in browsers, then merge and verify production as requested.

Use a separate `/reset-offline.html` URL outside the offline asset list so an old service worker cannot trap the reset flow. Require an explicit reset tap and a successful network-only check before clearing the game download. Keep localStorage unchanged. Stop after reset with a clear open-latest-game action and instructions to close other game tabs.

### Reset verification

- 67 tests, lint, TypeScript, production build, and diff validation pass. The recovery HTML and script return `Cache-Control: no-store, max-age=0` and bypass the worker; they are intentionally excluded from the offline asset list.
- Chrome and mobile WebKit verified offline settings refusal without removing the download, online recovery navigation, removal of only the game worker/cache, byte-identical saved progress, preservation of unrelated storage/cache, and a fresh 184-resource download with successful praise playback. Local runtime `3b76f65ef5c3e2bc9911`; no page errors. Reports: `output/playwright/reset-local-{chrome,webkit}-report.json`.
- Production rollout is authorized. Existing production browser contexts retain the previous worker and seeded progress for a live old-download recovery check after deployment.

## iPhone silent audio, mobile fit, and browser translation

- [x] Inspect live production and native audio behavior; reproduce clipped controls in a headless-only browser.
- [x] Request iOS playback audio-session mode before Web Audio initialization/resume; cover unsupported APIs and idle recovery.
- [x] Make narrow headers/content fit and reserve dynamic-viewport safe areas; add translation opt-out directives.
- [x] Verify complete mobile flows, offline reset/re-download, unit checks, lint, types, and build.
- [ ] Complete code review and deploy the authorized fixes; record live evidence on the release PR.

Evidence: the existing player never selected an Audio Session type. WebKit documents that its default ambient category follows Silent Mode even when sources play successfully; the playback category uses media audio. Before the fix, a production 320px viewport placed Parent settings at x294–350, outside the screen. Browser verification uses the dedicated Chromium headless-shell executable with automatic cleanup, avoiding Chrome.app/test popups.

- The user confirmed Silent Mode is enabled on the affected iPhone. Playback is requested before native audio initialization and on subsequent taps; unsupported or rejected Audio Session APIs keep normal playback working. Muted voice remains a settings action through native state changes.
- 76 tests, ESLint, TypeScript, production build, and diff validation pass. Runtime `16604af6eb8543616eae`.
- Hidden native Chromium verified 180 layout scenarios across all 25 lesson previews/first activities at 320px, notched 402px portrait, and 874px landscape with asymmetric safe areas. No controls were outside the usable width; settings remained inside the safe viewport. A follow-up touch audit caught and corrected letter-chip shrinkage; all tested buttons remain at least 56px.
- A same-origin proxy served the complete previous production worker/assets, then switched to the new build: reset preserved exact localStorage and an unrelated cache entry, removed the old worker/download, and reached the latest Ready state with 184 resources. Real speech rendered online and after an offline cold reload (praise 4.293s, RMS peak 0.222); no page errors. This desktop engine verifies rendering, not the iPhone's physical Silent Mode routing. Report: `output/playwright/iphone-flow-report.json`.

### Recording retry review follow-up

- [x] Reproduce the review finding: a page-level unlock dismisses a failed clip's warning without retrying it.
- [x] Preserve failed/interrupted recording actions across unrelated input; distinguish intentional navigation cancellation from recoverable stopping.
- [ ] Verify capture-click retry, exit cancellation, complete checks, review, and production release.

Regression tests failed for incidental input, interruption, and abandoned-lesson replay before the fix, then passed. Intentional unmount uses stopSpeech, which clears the retry target; automatic narration click capture retains stopVoice so the retry button can still replay a failed instruction.

- Follow-up: 79 tests, lint, types, build, and diff checks pass. Hidden Chromium verifies a failed automatic instruction keeps its warning after Tab, its capture-phase retry plays exactly once, and exiting during praise prevents stale replay. No page errors. Runtime `e8c4c1c9848894a1e6dd`; evidence `output/playwright/retry-flow-report.json`.
