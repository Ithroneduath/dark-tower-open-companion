# Updating the GitHub Project to v0.3.0

This update adds the in-app Rules Manual and the first Milestone 2 rules corrections.

## Before updating

1. Keep the existing repository; do not delete it.
2. Download and unzip the v0.3.0 project package.
3. In Windows File Explorer, open the unzipped folder until you can directly see `web`, `src-tauri`, `tests`, `docs`, and `package.json`.

## Upload the application update

1. Open the GitHub repository's **Code** tab at the repository root.
2. Select **Add file → Upload files**.
3. Drag these visible items from the unzipped folder into the upload area:
   - `web`
   - `src-tauri`
   - `tests`
   - `docs`
   - `package.json`
   - `README.md`
   - `CHANGELOG.md`
4. Commit directly to `main` with a message such as:

   `Milestone 2 rules manual and corrections`

GitHub will replace matching files and add the new `web/js/manual.js` file. The Build Windows App and Test Game Engine workflows should start automatically.

## Optional: remove the Node.js 20 warning

The v0.3.0 package updates the workflow actions. Because `.github` is hidden in Windows, it may not upload with the other folders. The app will still build with the old workflows, but the warning will remain.

To update manually, edit the workflow files under `.github/workflows` and use:

```yaml
uses: actions/checkout@v6
uses: actions/setup-node@v6
uses: actions/upload-artifact@v6
```

Only `build-windows.yml` contains `upload-artifact`.

## Download the new Windows build

1. Open **Actions → Build Windows App**.
2. Wait for a green checkmark.
3. Open the completed run.
4. Download the `dark-tower-open-companion-windows` artifact.
5. Unzip the artifact and run the new setup executable or portable executable.

The application's setup screen should display version **0.3.0**, and the top bar should include **Rules Manual**.
