import test from "node:test";
import assert from "node:assert/strict";
import {
  installMessage,
  isAppleMobile,
  isStandalone,
  parseSharedDisplay,
  saveFilename,
  sharedDisplaySnapshot,
} from "../web/js/platform.js";

test("iPad detection supports classic and desktop-style iPad user agents", () => {
  assert.equal(isAppleMobile({ userAgent: "Mozilla iPad", platform: "iPad", maxTouchPoints: 5 }), true);
  assert.equal(isAppleMobile({ userAgent: "Mozilla Macintosh", platform: "MacIntel", maxTouchPoints: 5 }), true);
  assert.equal(isAppleMobile({ userAgent: "Mozilla Windows", platform: "Win32", maxTouchPoints: 0 }), false);
});

test("standalone detection recognizes Home Screen and desktop app modes", () => {
  assert.equal(isStandalone({ navigatorLike: { standalone: true } }), true);
  assert.equal(isStandalone({ isTauri: true }), true);
  assert.equal(isStandalone({ navigatorLike: {}, matchMediaFn: () => ({ matches: false }) }), false);
});

test("save filenames include date and turn", () => {
  assert.equal(saveFilename({ turn: 12 }, new Date("2026-07-27T12:00:00Z")), "dark-tower-save-2026-07-27-turn-12.json");
});

test("shared display snapshots round-trip safely", () => {
  const game = { turn: 4, status: "playing", level: 1, enhancedMode: true, towerDefenders: 27, display: { icon: "⚔", title: "BRIGANDS", number: "8", text: "Fight or retreat." } };
  const player = { id: 2, name: "Ari", currentKingdom: "Durnin", warriors: 11, gold: 22, food: 17, keys: { brass: true, silver: false, gold: false }, frontiersCrossed: 2 };
  const snapshot = sharedDisplaySnapshot(game, player, "battle");
  assert.equal(snapshot.player.keys, 1);
  assert.equal(snapshot.display.effect, "battle");
  assert.deepEqual(parseSharedDisplay(JSON.stringify(snapshot)), snapshot);
  assert.equal(parseSharedDisplay("not json"), null);
});

test("installation guidance distinguishes iPad and installed modes", () => {
  assert.match(installMessage({ appleMobile: true }), /Safari/);
  assert.match(installMessage({ standalone: true }), /already/);
  assert.match(installMessage({ desktopApp: true }), /Windows/);
});


test("Milestone 9 desktop source invokes the native Shared Tower command", async () => {
  const { readFile } = await import("node:fs/promises");
  const appSource = await readFile(new URL("../web/js/app.js", import.meta.url), "utf8");
  const rustSource = await readFile(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
  const config = JSON.parse(await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
  assert.match(appSource, /nativeInvoke\("show_shared_display"\)/);
  assert.match(rustSource, /async fn show_shared_display/);
  assert.ok(config.app.withGlobalTauri);
  assert.ok(config.app.windows.some((window) => window.label === "shared-display" && window.visible === false));
});
