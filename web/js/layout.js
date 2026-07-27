export const WORKSPACE_LAYOUT_KEY = "darkTowerOpenCompanion.workspaceLayout.v2";

export const DEFAULT_WORKSPACE_LAYOUT = Object.freeze({
  atlas: 40,
  tower: 30,
  side: 30,
  player: 58,
  preset: "balanced",
});

export const WORKSPACE_PRESETS = Object.freeze({
  balanced: Object.freeze({ atlas: 40, tower: 30, side: 30, player: 58, preset: "balanced" }),
  map: Object.freeze({ atlas: 50, tower: 27, side: 23, player: 58, preset: "map" }),
  tower: Object.freeze({ atlas: 28, tower: 48, side: 24, player: 58, preset: "tower" }),
  dashboard: Object.freeze({ atlas: 27, tower: 29, side: 44, player: 62, preset: "dashboard" }),
  equal: Object.freeze({ atlas: 34, tower: 33, side: 33, player: 55, preset: "equal" }),
});

const COLUMN_MINIMUMS = Object.freeze({ atlas: 18, tower: 24, side: 18 });
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export function normalizeWorkspaceLayout(value = {}) {
  let atlas = Math.max(COLUMN_MINIMUMS.atlas, finite(value.atlas, DEFAULT_WORKSPACE_LAYOUT.atlas));
  let tower = Math.max(COLUMN_MINIMUMS.tower, finite(value.tower, DEFAULT_WORKSPACE_LAYOUT.tower));
  let side = Math.max(COLUMN_MINIMUMS.side, finite(value.side, DEFAULT_WORKSPACE_LAYOUT.side));
  const total = atlas + tower + side;
  atlas = atlas / total * 100;
  tower = tower / total * 100;
  side = 100 - atlas - tower;
  if (atlas < COLUMN_MINIMUMS.atlas || tower < COLUMN_MINIMUMS.tower || side < COLUMN_MINIMUMS.side) {
    ({ atlas, tower, side } = DEFAULT_WORKSPACE_LAYOUT);
  }
  const roundedAtlas = Number(atlas.toFixed(2));
  const roundedTower = Number(tower.toFixed(2));
  const roundedSide = Number((100 - roundedAtlas - roundedTower).toFixed(2));
  return {
    atlas: roundedAtlas,
    tower: roundedTower,
    side: roundedSide,
    player: Number(clamp(finite(value.player, DEFAULT_WORKSPACE_LAYOUT.player), 34, 76).toFixed(2)),
    preset: typeof value.preset === "string" ? value.preset : "custom",
  };
}

export function workspacePreset(name) {
  return normalizeWorkspaceLayout(WORKSPACE_PRESETS[name] || WORKSPACE_PRESETS.balanced);
}

export function adjustWorkspaceLayout(layout, handle, deltaPercent) {
  const current = normalizeWorkspaceLayout(layout);
  const delta = finite(deltaPercent, 0);
  if (handle === "atlas-tower") {
    const pair = current.atlas + current.tower;
    const atlas = clamp(current.atlas + delta, COLUMN_MINIMUMS.atlas, pair - COLUMN_MINIMUMS.tower);
    return normalizeWorkspaceLayout({ ...current, atlas, tower: pair - atlas, preset: "custom" });
  }
  if (handle === "tower-side") {
    const pair = current.tower + current.side;
    const tower = clamp(current.tower + delta, COLUMN_MINIMUMS.tower, pair - COLUMN_MINIMUMS.side);
    return normalizeWorkspaceLayout({ ...current, tower, side: pair - tower, preset: "custom" });
  }
  if (handle === "player-log") {
    return normalizeWorkspaceLayout({ ...current, player: clamp(current.player + delta, 34, 76), preset: "custom" });
  }
  return current;
}

export function loadWorkspaceLayout(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(WORKSPACE_LAYOUT_KEY);
    return normalizeWorkspaceLayout(raw ? JSON.parse(raw) : DEFAULT_WORKSPACE_LAYOUT);
  } catch {
    return normalizeWorkspaceLayout(DEFAULT_WORKSPACE_LAYOUT);
  }
}

export function saveWorkspaceLayout(layout, storage = globalThis.localStorage) {
  const normalized = normalizeWorkspaceLayout(layout);
  try { storage?.setItem?.(WORKSPACE_LAYOUT_KEY, JSON.stringify(normalized)); } catch {}
  return normalized;
}

export function layoutReadout(layout) {
  const normalized = normalizeWorkspaceLayout(layout);
  return `Map ${Math.round(normalized.atlas)}% · Tower ${Math.round(normalized.tower)}% · Dashboard ${Math.round(normalized.side)}% · Player ${Math.round(normalized.player)}%`;
}
