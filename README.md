# Dark Tower: Open Companion

An unofficial, noncommercial, open-source companion for playing the 1981 **Dark Tower** board game with modern Windows and tablet hardware.

> This project is not affiliated with or endorsed by Milton Bradley, Hasbro, or Restoration Games. The repository contains original code, original interface assets, and an original paraphrased rules reference. It does not contain scans of the board, manual, logos, original carousel artwork, or original sound recordings.

## Current release: 0.5.0 — Milestone 3 deluxe presentation

Version **0.5.0** provides:

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
