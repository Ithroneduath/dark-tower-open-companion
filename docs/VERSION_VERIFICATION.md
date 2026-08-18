# Version Verification — v0.10.1

This clean repository package was rebuilt and checked for active version consistency.

## Active files verified at v0.10.1

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `web/js/rules.js`
- `web/index.html`
- `web/display.html`
- `web/manifest.webmanifest`
- `web/sw.js`
- `.github/workflows/build-windows.yml`
- `.github/workflows/build-macos.yml`
- `docs/MAP_RECONSTRUCTION.md`
- `.github/ISSUE_TEMPLATE/bug_report.yml`

## Intentional older version references

Historical release notes are preserved in `CHANGELOG.md`, `docs/ROADMAP.md`, and older `docs/UPDATE_TO_*.md` files. Those version numbers describe earlier releases and are not active build declarations.

The `__VERSION__` token in `.github/workflows/release.yml` is intentional. The Tauri GitHub release action replaces that token with the application version when the release workflow runs.
