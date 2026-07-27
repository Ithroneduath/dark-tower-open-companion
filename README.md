# Dark Tower: Open Companion

An unofficial, noncommercial, open-source companion for playing the 1981 **Dark Tower** board game with modern Windows and tablet hardware.

> This project is not affiliated with or endorsed by Milton Bradley, Hasbro, or Restoration Games. The repository contains original code, original interface assets, and an original paraphrased rules reference. It does not contain scans of the board, manual, logos, original carousel artwork, or original sound recordings.

## Current release: 0.10.0 — Milestone 9 map refinement and native shared display

Version **0.6.0** provides:

- a Windows portable executable;
- a Windows NSIS setup executable;
- an installable iPad/iPhone web app through GitHub Pages;
- the same game engine and rules manual in both versions.

### New in 0.4.0

- searchable in-app Rules Manual with 17 topics;
- contextual **Relevant Rule** button during play;
- corrected Bazaar haggling outcomes;
- corrected endgame requirement for Citadel army doubling;
- counterclockwise frontier enforcement;
- no retreat when only one warrior remains;
- 17 automated tests;
- Node 24-compatible GitHub Actions versions.
- Desktop cache migration: Tauri now uses a dedicated WebView data directory and does not register the PWA service worker inside the Windows app.

### Core features

- one to four local players;
- Levels 1–4 and level-specific Tower defender ranges;
- starting warriors, gold, and food;
- food consumption by army size;
- gold carrying capacity and Beast bonus;
- Safe, Brigands, Dragon, Lost, Plague, and Curse events;
- round-by-round battle with retreat;
- Tomb/Ruin events and treasure;
- Sanctuary aid and home Citadel reinforcement;
- Bazaar offers, buying, and haggling;
- Scout, Healer, Beast, Dragonsword, Pegasus, and Wizard;
- kingdom-aware Brass/Silver/Gold keys;
- frontier restrictions;
- Riddle of the Keys;
- persistent final Tower defenders;
- local autosave, JSON save export/import, and a game chronicle;
- deterministic random seeds for reproducing bugs.

### Still provisional

The surviving manual clearly documents the rules and event types, but not every hidden probability and numeric table in the original firmware. The following remain centralized in `web/js/rules.js` and marked provisional:

- standard movement event weights;
- exact battle-round odds;
- reward weights;
- some Sanctuary gift amounts;
- some Bazaar price details;
- the precise haggling unchanged/closure split.

## Updating an existing GitHub repository

Upload the **contents** of this folder to the repository root and replace files when GitHub prompts. Ensure the new file `web/js/manual.js` is included. Committing the update to `main` automatically starts the Windows build and test workflows.

## Build the Windows app without installing development software

The repository includes a GitHub Actions workflow that builds the `.exe` on a Microsoft-hosted Windows machine. See:

**[docs/FIRST_BUILD_GUIDE.md](docs/FIRST_BUILD_GUIDE.md)**

## Run the engine tests locally

Node.js is the only requirement for tests:

```bash
npm test
```

## Build locally with Tauri

Local native development requires the Tauri prerequisites, Node.js, and Rust:

```bash
npm install
npm run tauri dev
npm run tauri build -- --bundles nsis
```

The native shell embeds the static files in `web/`; no web framework or build step is required.

## Project structure

```text
web/                  Shared Windows/iPad interface and game engine
  js/engine.js        Pure game-state and rules engine
  js/rules.js         Configurable probabilities and numeric rules
  js/manual.js        Original searchable paraphrased rules reference
src-tauri/            Native Windows shell and installer configuration
tests/                Node's built-in automated tests
.github/workflows/     Windows build, release, tests, and iPad deployment
docs/                  Novice setup, testing, research, and roadmap notes
```

## Contributing

Bug reports are especially valuable when they include the seed shown above the Chronicle and the exact sequence of button presses. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Original project code, original project assets, and original paraphrased reference text are released under the MIT License. Third-party names and intellectual property are not licensed by this repository.


## Milestone 3 presentation

Version 0.4.0 adds the original Deluxe Atlas, animated event lighting, synthesized audio, presentation/accessibility settings, and a guided tour. The map is a landmark navigator and intentionally does not copy the original board artwork or replace legal territory-by-territory movement.


## Milestone 4 — tabletop cockpit

Version 0.5.0 places the three main play areas side by side on desktop:

1. Four-Kingdom Atlas
2. Tower controls and display
3. Current Adventurer and Chronicle

The Relevant Rule button now changes its label with the event and opens the exact applicable paragraph or subsection. Examples include Brigand Battles, Bazaar Shopping, Bazaar Haggling, Dragon Attack, Plague and Healer, Lost and Scout, Frontiers and Keys, the Riddle, and the Final Tower Battle.


## Milestone 5 — iPad and shared display

Version 0.6.0 adds:

- tablet portrait tabs for Map, Tower, Player, and Chronicle;
- safe-area and touch-target refinements for iPad and other tablets;
- in-app installation guidance for the GitHub Pages edition;
- Share / Export Save using the device share sheet when supported, with download fallback;
- an optional screen wake lock during games;
- full-screen controls;
- a synchronized display-only Tower window for a second monitor or screen mirroring.

The shared display synchronizes only between windows on the same browser and device. Local-network synchronization remains a future milestone.


## Milestone 6 — full interactive board

Version 0.7.0 replaces the landmark-only atlas with a complete 96-space board graph. It uses original vector terrain artwork while following the vintage board's circular four-quadrant structure, landmark placement, Frontier direction, and movement rules.


## Milestone 7 — adaptive workspace

Version 0.8.0 opens maximized on Windows and treats the game screen as a resizable tabletop cockpit. Drag the dividers to allocate space among the Map, Tower, Dashboard, Current Adventurer, and Chronicle. Layout presets and custom proportions are saved on the current device. The guided tour docks beside the game instead of covering the highlighted content.


## Milestone 8 — board fidelity and heraldry

Version 0.9.0 gives the map the largest default column at 40% of the desktop workspace. Territory boundaries use a dense irregular mesh rather than regular rectangular-looking ring sectors. The board rim is scalloped, special labels rotate and fit to their spaces, and full territory names appear in the status ribbon when hovered or focused.

Four newly drawn heraldic animal shields sit outside the board beside the Citadels: Lion for Arisilon, Griffin for Brynthia, Eagle for Durnin, and Unicorn for Zenon.


## Milestone 9 — native Shared Tower and map refinement

The Windows edition now uses a native second Tauri window for Shared Tower Display, avoiding browser popup blocking. The web/iPad edition retains a normal browser-window fallback.

The board uses a conservative shared-boundary mesh based on the stable Milestone 6 geometry. Special regions are widened, text is hand-positioned by kingdom, each Dark Tower label is split across two lines, and the external Citadel shields use more detailed original heraldic artwork.
