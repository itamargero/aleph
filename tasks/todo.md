# Hebrew Heroes: offline play and pre-reader usability

## Design
The child should be able to open the app, tap a prominent play control, listen to Hebrew, and learn by matching pictures and copying letters without reading English. Preserve the colorful mascot and illustrated worlds. Use responsive layouts with real touch targets in iPad portrait and landscape. Keep parent instructions in settings.

Keep the existing data-driven React exercise engine and bundle its source at build time. Serve every resource from this origin, including local fonts and pre-generated Hebrew voice clips. A versioned service worker atomically caches the complete resource list on the first visit, reports progress and readiness, handles both entry URLs offline, and supports audio range requests. Do not report ready until every resource is cached. Keep the last working cache until a new version finishes installing.

Complete all eight worlds using supported exercise types, visual story scenes, vowel matching, listening, everyday phrases, and review without time pressure. Add a model for word and sentence ordering so children can copy from right to left. Spoken names accompany letter teaching. Audio-answer activities use picture choices and text remains supplemental. Remove prototype tweaks from the production interface. Guard saved data and avoid late callbacks after exit.

## Plan
- [x] Inspect repository, prototype, curriculum, dependencies, and current branch.
- [x] Isolate changes and preserve the existing package-lock edit.
- [ ] Complete all worlds and validate curriculum references and solutions.
- [ ] Replace scaled screens with responsive child-friendly navigation and exercises.
- [ ] Bundle dependencies locally, generate all audio, and cache the complete game.
- [ ] Verify offline cold launch, full curriculum completion, audio, progress, and iPad layouts.
- [ ] Run build, TypeScript, meaningful tests, and code review; fix material findings.
- [ ] Merge to main and verify the named production deployment and offline artifacts.

## Verification
Pending.

### Research decisions
- Apple Safari requires a user gesture to start audio; use a persistent Web Audio context unlocked by play/speaker taps. Local recordings avoid dependence on an installed speech voice.
- WebKit can evict unused website storage; request persistence and give parents a concrete preflight reopen/speaker check. Prepare the Home Screen app separately because its storage may differ from Safari.
- Keep the existing source engine and build locally rather than introduce a new backend or speech service. Upgrade the small Next.js shell to 16 and remove browser Babel/CDNs.
