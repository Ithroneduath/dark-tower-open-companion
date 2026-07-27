# v0.3.2 clean-build correction

This update addresses a stale compiled executable produced by the Windows workflow.

## Upload these files

Upload the contents of this hotfix into the repository root, replacing existing files:

- `.github/workflows/build-windows.yml`
- `src-tauri/build.rs`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `web/index.html`
- `web/js/rules.js`
- `web/sw.js`
- `package.json`
- `CHANGELOG.md`

Because Windows treats `.github` as hidden, upload `build-windows.yml` directly while viewing the repository's `.github/workflows` folder.

## Build

1. Commit the files to `main`.
2. Open **Actions → Build Windows App**.
3. Click **Run workflow** and select `main`.
4. Open the new run.
5. Confirm the step **Verify checked-out source version** prints `0.3.2`.
6. Download the uniquely named artifact ending in `v0.3.2-run-<number>`.
7. Open `BUILD_INFO.txt` inside the extracted artifact.
8. Launch the portable executable from that same extracted folder.

The workflow deletes all earlier Tauri build output before compiling. It will fail rather than silently build if GitHub still contains an older version.
