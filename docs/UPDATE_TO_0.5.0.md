# Update to v0.5.0 — Milestone 4

This is a complete repository package.

## Recommended upload method

Because replacing an existing repository has been unreliable in browser uploads, it is reasonable to create a fresh repository and upload the contents of the unzipped folder directly.

At the repository root, confirm that you can see:

- `web`
- `src-tauri`
- `tests`
- `docs`
- `package.json`
- `README.md`
- `CHANGELOG.md`

GitHub may hide `.github` during the upload. If so:

1. Open or create `.github/workflows` in GitHub.
2. Upload the separately provided `build-windows-v0.5.0.yml`.
3. Rename it to `build-windows.yml` if GitHub preserves the downloaded filename.

## Verify before building

- `package.json` must show `0.5.0`.
- `web/js/rules.js` must show `APP_VERSION = "0.5.0"`.
- `src-tauri/tauri.conf.json` must show `Native v0.5.0`.
- `web/js/manual.js` must contain `contextualManualTarget`.

The Windows artifact should contain clearly named portable and installer executables at its top level.
