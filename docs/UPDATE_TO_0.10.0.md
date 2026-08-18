# Update to v0.10.0 — Milestone 9

## Shared Tower Display

In the Windows portable or installed app, **Device & iPad → Open Shared Tower Display** should open a native second application window. It should not display “Popup blocked,” and an ad blocker should not affect it.

In the browser/iPad edition, the second display still uses a browser window and may require popup permission.

## Map checks

- Arisilon and Zenon shields should have clear space between the shield and the board edge.
- No tiny sliver territories should appear.
- Zenon Bazaar and Ruin labels should remain inside their spaces.
- Durnin Tomb, Bazaar, and Sanctuary labels should remain inside their spaces.
- Brynthia Sanctuary, Bazaar, and Tomb labels should remain inside their spaces.
- Arisilon Bazaar and Sanctuary labels should remain inside their spaces.
- Every Dark Tower territory should show DARK over TOWER.
- The four crest animals should look more detailed than the Milestone 8 line drawings.

## Repository verification

- `package.json`: `0.10.0`
- `web/js/rules.js`: `APP_VERSION = "0.10.0"`
- `web/js/app.js`: contains `show_shared_display`
- `src-tauri/src/lib.rs`: contains the `show_shared_display` Rust command
- `src-tauri/tauri.conf.json`: contains a hidden `shared-display` window
- `web/index.html`: `Milestone 9 map refinement`
- `web/js/board.js`: stable non-crossing map geometry
- `web/js/atlas.js`: two-line Dark Tower labels and refined heraldry
