# macOS Build and Test Guide — v0.10.1

## What this build targets

This workflow builds `aarch64-apple-darwin`, the native architecture for Apple Silicon Macs.

GitHub Actions should produce:

- `Dark-Tower-Open-Companion-v0.10.1-arm64.dmg`
- `Dark-Tower-Open-Companion-v0.10.1-arm64.app.zip`
- `READ-ME-FIRST.txt`

## GitHub setup

If `.github` is hidden during browser upload:

1. Open the repository on GitHub.
2. Open or create `.github/workflows`.
3. Upload `build-macos-v0.10.1.yml`.
4. Rename it to `build-macos.yml`.

Keep `build-windows.yml` as well.

## Build

Open **Actions → Build macOS App → Run workflow**.

The job first verifies that GitHub assigned an ARM64 macOS runner, then runs the JavaScript tests, checks the Rust target, and builds the `.app` and `.dmg`.

## Install on an Apple Silicon Mac

1. Download the macOS artifact from the completed Action.
2. Unzip the artifact.
3. Open the `.dmg`.
4. Drag **Dark Tower Open Companion** to **Applications**.
5. Open it from Applications.

This build is ad-hoc signed but not notarized. If macOS blocks the first launch, open **System Settings → Privacy & Security**, locate the blocked-app message, and choose **Open Anyway**, then confirm.

## Shared Tower Display

The macOS app uses the same native secondary Tauri window as the Windows build. It does not rely on a browser popup or ad-blocker setting.
