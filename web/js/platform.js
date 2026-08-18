export const SHARED_DISPLAY_KEY = "darkTowerOpenCompanion.sharedDisplay.v1";
export const SHARED_DISPLAY_CHANNEL = "darkTowerOpenCompanion.display.v1";

export function isAppleMobile(navigatorLike = globalThis.navigator) {
  const userAgent = String(navigatorLike?.userAgent || "");
  const platform = String(navigatorLike?.platform || "");
  const touchPoints = Number(navigatorLike?.maxTouchPoints || 0);
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1);
}

export function isStandalone({ navigatorLike = globalThis.navigator, matchMediaFn = globalThis.matchMedia, isTauri = false } = {}) {
  if (isTauri) return true;
  if (navigatorLike?.standalone === true) return true;
  try { return Boolean(matchMediaFn?.("(display-mode: standalone)")?.matches); } catch { return false; }
}

export function saveFilename(game, now = new Date()) {
  const turn = Math.max(1, Number(game?.turn) || 1);
  const stamp = now.toISOString().slice(0, 10);
  return `dark-tower-save-${stamp}-turn-${turn}.json`;
}

export function sharedDisplaySnapshot(game, player, effect = "idle") {
  if (!game || !player) return null;
  return {
    schema: 1,
    updatedAt: new Date().toISOString(),
    game: {
      turn: Number(game.turn) || 1,
      status: String(game.status || "playing"),
      level: Number(game.level) || 1,
      towerDefenders: game.enhancedMode ? game.towerDefenders : null,
    },
    display: {
      icon: String(game.display?.icon || "◆"),
      title: String(game.display?.title || "THE TOWER WAITS"),
      number: String(game.display?.number ?? "--"),
      text: String(game.display?.text || "Waiting for the next action."),
      effect: String(effect || "idle"),
    },
    player: {
      id: Number(player.id) || 1,
      name: String(player.name || "Player 1"),
      kingdom: String(player.currentKingdom || player.homeKingdom || ""),
      spaceId: String(player.currentSpaceId || ""),
      warriors: Number(player.warriors) || 0,
      gold: Number(player.gold) || 0,
      food: Number(player.food) || 0,
      keys: Object.values(player.keys || {}).filter(Boolean).length,
      frontiers: Number(player.frontiersCrossed) || 0,
    },
  };
}

export function parseSharedDisplay(raw) {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!value || value.schema !== 1 || !value.display || !value.player) return null;
    return value;
  } catch { return null; }
}

export function installMessage({ appleMobile = false, standalone = false, installPromptAvailable = false, desktopApp = false } = {}) {
  if (desktopApp) return "You are using the installed Windows desktop app.";
  if (standalone) return "This device is already running the installed Home Screen app.";
  if (installPromptAvailable) return "This browser can install the companion as an app.";
  if (appleMobile) return "In Safari, tap Share, choose Add to Home Screen, then open the new icon.";
  return "Use your browser's Install app or Create shortcut command when available.";
}
