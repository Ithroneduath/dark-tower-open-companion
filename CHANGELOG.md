# Changelog

## 0.5.0 — Milestone 4 tabletop layout and contextual rules

- Reworked the desktop game screen into three side-by-side columns: atlas, Tower, and player/Chronicle.
- Added responsive two-column and single-column fallbacks for smaller screens.
- Made the layout automatically collapse to Tower plus dashboard when the map is hidden.
- Replaced the generic Relevant Rule link with event-specific labels and deep links.
- Added highlighted manual anchors for battles, Bazaar shopping, haggling, Dragon attacks, Plague, Lost, Sanctuary, Citadel, frontiers, treasures, the Riddle, and the final battle.
- Removed the duplicate `workflow-files` folder from the repository package.

## 0.4.0 — Milestone 3 deluxe presentation

- Added an original interactive four-kingdom landmark atlas.
- Added animated tower-window effects for battles, dragons, treasure, danger, and victory.
- Added original synthesized sound cues and an optional ambient drone using the Web Audio API.
- Added Classic 1981 and Deluxe 2026 presentation modes.
- Added reduced motion, high contrast, larger text, sound, volume, music, and map controls.
- Added a guided interface tutorial and keyboard shortcuts.
- Added four automated presentation tests, bringing the suite to 21 tests.
- Fixed duplicate Sanctuary/Citadel log entries.
- Preserved the v0.3.3 Windows cache-isolation and flat artifact workflow.

## 0.3.3 — reviewed Windows update correction

- Replaces the incomplete hotfix strategy with a complete repository package.
- Isolates the Windows WebView from the old v0.2 service worker using a new HTTPS origin, app identifier, versioned data directory, and versioned initial URL.
- Adds a native title-bar version marker.
- Produces a flat, clearly named Windows artifact.

## 0.3.2 — Guaranteed clean Windows build

- Removed Rust build caching from the Windows workflow.
- Deletes `src-tauri/target` before every Windows compilation.
- Explicitly tells Cargo to rebuild when any file under `web/` changes.
- Adds a static v0.3.2 marker in `web/index.html`.
- Adds a source-version verification step that stops the workflow if GitHub did not receive the v0.3.2 files.
- Includes `BUILD_INFO.txt`, `web/index.html`, and `web/js/rules.js` in the downloaded artifact for verification.

## 0.3.1 — Windows stale-cache hotfix

- Prevented the Windows desktop app from registering the browser/PWA service worker.
- Added a dedicated desktop WebView data directory so old cached v0.2.0 assets cannot override a newer executable.
- Improved browser/iPad service-worker updating with `skipWaiting`, `clients.claim`, and network-first navigation.
- Updated all application version markers to 0.3.1.

## 0.3.0 — Milestone 2 rules reference and corrections

- Added a searchable, offline in-app Rules Manual with 17 sections.
- Added a **Relevant Rule** button that opens the section matching the current Tower prompt.
- Kept the rules reference entirely original and paraphrased; no manual scans or copied artwork are distributed.
- Corrected Bazaar haggling so an attempt may lower the price, leave it unchanged, or anger the merchant and close the Bazaar.
- Corrected Citadel reinforcement so doubling requires all three keys, four frontier crossings, and a return home.
- Enforced counterclockwise frontier travel.
- Prevented retreat when only one warrior remains.
- Expanded the automated rules suite from 8 to 17 tests.
- Updated GitHub Actions checkout, Node setup, and artifact upload actions to Node 24-compatible major versions.
- Updated Windows and web application versions to 0.3.0.

## 0.2.0 — Milestone 1 repository foundation

- Added a shared deterministic game engine.
- Corrected battle flow to round-by-round resolution: one warrior is lost on a failed round; the brigand force is halved on a successful round.
- Added kingdom-aware keys and frontier restrictions.
- Added a complete Bazaar interaction state.
- Added Citadel reinforcement, Sanctuary aid, Wizard curse, Pegasus travel, and the Riddle of the Keys.
- Added autosave plus JSON import/export.
- Added eight automated tests.
- Added Tauri 2 Windows packaging.
- Added GitHub Actions for Windows builds, releases, testing, and GitHub Pages deployment.
- Added original application icons and an explicit fan-project disclaimer.

## 0.1.0 — Browser proof of concept

- Initial single-page prototype.
