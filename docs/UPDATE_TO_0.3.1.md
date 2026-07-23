# Updating to v0.3.1

Version 0.3.1 fixes a Windows-only stale-cache problem. The v0.3.0 source files were correctly versioned, but the desktop app registered the same service worker used by the iPad web edition. WebView2 could therefore keep serving cached v0.2.0 files even when the newly built executable contained v0.3.0.

## Repository update

Upload and replace the contents of the v0.3.1 project in the repository root, then run **Build Windows App** on the `main` branch. Download the artifact from that new run.

## Testing

Run the newly extracted portable executable directly. The setup screen should display **v0.3.1** and include the **Rules Manual** button. The new desktop WebView profile is intentionally clean, so an autosave from the early v0.2.0 prototype may not appear.

## Old installed copy

If Windows still opens an old Start-menu shortcut, uninstall the older copy under **Settings → Apps → Installed apps**, then install the new `-setup.exe`, or launch the portable executable directly from the newly extracted artifact folder.
