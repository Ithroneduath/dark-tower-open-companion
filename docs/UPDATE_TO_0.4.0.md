# Update to v0.4.0 — Milestone 3

Use the complete repository package for this update. It includes every changed frontend file and the verified Windows workflow.

## Upload

Upload the contents of the unzipped folder into the repository root and replace existing files. Windows may hide `.github`; a duplicate copy of each workflow is included in `workflow-files/` so it can be uploaded manually into `.github/workflows`.

## Build

1. Open **Actions → Build Windows App**.
2. Run the workflow on `main`.
3. Confirm **Verify v0.4.0 source and cache isolation** succeeds.
4. Download the flat artifact named `dark-tower-open-companion-v0.4.0-windows-run-…`.
5. Open `READ-ME-FIRST.txt`, then launch `Dark-Tower-Open-Companion-v0.4.0-portable.exe`.

## First playtest

- Start in Deluxe 2026 mode.
- Confirm the Four-Kingdom Atlas appears.
- Click a landmark in the current kingdom.
- Open Settings and test Classic mode, sound, reduced motion, high contrast, and larger text.
- Run the Guided Tour.
- Verify the title bar and setup page both show v0.4.0.
