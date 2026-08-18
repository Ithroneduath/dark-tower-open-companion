# Update to v0.9.0 — Milestone 8

## Primary visual checks

1. At full desktop size, the default columns should be approximately 40% Map, 30% Tower, and 30% Dashboard.
2. Territory boundaries should appear wavy and organic rather than rectangular.
3. The board's outside edge should be scalloped.
4. SANCTUARY should fit inside each territory. Hover or keyboard-focus any territory to see its full name in the status ribbon.
5. Citadel shields should appear outside the board next to their matching Citadel territories.
6. The four shields should show an original Lion, Griffin, Eagle, and Unicorn.

## Repository verification

- `package.json`: `0.9.0`
- `web/js/rules.js`: `APP_VERSION = "0.9.0"`
- `web/js/board.js`: contains `scallopedCirclePath`
- `web/js/atlas.js`: contains `houseBadge`
- `web/js/layout.js`: balanced preset is `40 / 30 / 30`
- `web/index.html`: `Milestone 8 board fidelity`
- `src-tauri/tauri.conf.json`: `Native v0.9.0`

If Windows hides `.github`, upload the separate workflow file directly to `.github/workflows` and name it `build-windows.yml`.
