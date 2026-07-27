# Update to v0.8.0 — Milestone 7

## Test checklist

1. The Windows app opens maximized, with the normal title bar and taskbar available.
2. Resizing the native window causes the workspace and its contents to adapt.
3. Drag all three dividers and reopen the app to confirm the proportions persist.
4. Try all five Layout presets.
5. Run the Guided Tour; on desktop it should dock at the right and shrink the game instead of covering it.
6. Narrow the window below about 1180 pixels; drag handles should disappear and responsive tablet/stacked behavior should take over.

## Upload verification

- `package.json`: `0.8.0`
- `web/js/rules.js`: `APP_VERSION = "0.8.0"`
- `web/js/layout.js`: present
- `web/index.html`: `Milestone 7 adaptive workspace`
- `src-tauri/tauri.conf.json`: `"maximized": true`

If Windows hides `.github`, upload the separate workflow while viewing `.github/workflows`, then name it `build-windows.yml`.
