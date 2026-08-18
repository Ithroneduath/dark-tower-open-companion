# Windows update review: v0.3.3

## Confirmed problems in the earlier packages

1. The v0.3.2 full repository contains the Milestone 2 files, but the small v0.3.2 hotfix was not a complete upgrade from v0.2.0. It omitted `web/js/app.js`, `web/js/engine.js`, `web/js/manual.js`, `web/styles.css`, and the updated tests.

2. The v0.2.0 Windows app registered a service worker. That worker can intercept the initial app navigation and return the cached v0.2.0 HTML and JavaScript before newer cleanup code gets a chance to run.

3. The v0.3.2 workflow verified source files, but `BUILD_INFO.txt` did not prove what the WebView displayed at runtime.

4. The artifact preserved the entire `src-tauri/target/release` folder tree, which made it harder to identify the intended executable.

## Protections added in v0.3.3

- Uses a new HTTPS custom-protocol origin on Windows.
- Uses a milestone-specific application identifier.
- Uses a version-specific WebView data directory.
- Opens `index.html?v=0.3.3`.
- Places `Native v0.3.3` in the Windows title bar, outside the cached web page.
- Produces a flat artifact with versioned filenames.
- Includes the source/configuration files beside the executable for verification.

## Expected artifact contents

- `Dark-Tower-Open-Companion-v0.3.3-portable.exe`
- `Dark-Tower-Open-Companion-v0.3.3-setup.exe`
- `READ-ME-FIRST.txt`
- `SOURCE-index.html`
- `SOURCE-rules.js`
- `SOURCE-tauri.conf.json`
