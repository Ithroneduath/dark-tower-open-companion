# Update to v0.10.1

This release adds native Apple Silicon macOS support without changing gameplay.

## Verify before uploading

- `package.json` → `0.10.1`
- `src-tauri/Cargo.toml` → `0.10.1`
- `src-tauri/tauri.conf.json` → `0.10.1`
- `web/js/rules.js` → `APP_VERSION = "0.10.1"`
- `.github/workflows/build-windows.yml` → present
- `.github/workflows/build-macos.yml` → present
- `src-tauri/icons/icon.icns` → present

## Mac workflow

The Mac workflow uses `macos-latest`, verifies that `uname -m` reports `arm64`, targets `aarch64-apple-darwin`, and creates both `.app` and `.dmg` artifacts.
