# Update to v0.6.0 — Milestone 5

This is a complete repository package. Since a fresh repository upload has been the most reliable method, you may continue using that workflow.

## Upload

1. Unzip the package.
2. Upload the contents—not the enclosing folder—to the repository root.
3. If `.github` is hidden, open `.github/workflows` in GitHub and upload the separate `build-windows-v0.6.0.yml` file. Rename it to `build-windows.yml`.
4. Enable GitHub Pages with **Settings → Pages → Source: GitHub Actions** for the iPad edition.

## Verify before building

- `package.json` shows `0.6.0`.
- `web/js/rules.js` shows `APP_VERSION = "0.6.0"`.
- `web/index.html` contains `Milestone 5 tablet build`.
- `web/display.html` exists.
- `web/js/platform.js` exists.

## Playtest focus

- At a browser width below 900 pixels, use the four bottom panel tabs.
- Open Device & iPad and test installation guidance.
- Share / Export a save and import it again.
- Toggle Keep Screen Awake.
- Open Shared Tower Display, then perform actions in the main app and confirm it updates.
