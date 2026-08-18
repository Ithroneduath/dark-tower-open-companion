import { KINGDOMS } from "./rules.js";
import {
  BOARD_CENTER,
  BOARD_RIM_RADIUS,
  BOARD_SPACES,
  BOARD_SPACE_IDS,
  BOARD_VIEWBOX,
  citadelSpaceId,
  scallopedCirclePath,
  spaceById,
} from "./board.js";

export const KINGDOM_STYLE = Object.freeze({
  Arisilon: { shield: "#b12f2f", metal: "#f2cc58", symbol: "Lion", angle: 45 },
  Brynthia: { shield: "#3272a6", metal: "#f0d378", symbol: "Winged Lion", angle: -45 },
  Durnin: { shield: "#dfb238", metal: "#2b2119", symbol: "Double Eagle", angle: -135 },
  Zenon: { shield: "#398665", metal: "#fff8df", symbol: "Unicorn", angle: 135 },
});

const TERRAIN_COLORS = Object.freeze({
  Arisilon: { forest: "#768f62", plains: "#9caf72", water: "#7399a0", mountains: "#97867a", moor: "#7c768b", fields: "#b4a56d", desert: "#aa8c66", towerland: "#756b78" },
  Brynthia: { forest: "#6f916f", plains: "#91ad7a", water: "#759eae", mountains: "#878997", moor: "#797c99", fields: "#a8ad76", desert: "#b39b6f", towerland: "#6e7187" },
  Durnin: { forest: "#7f9868", plains: "#a3b27b", water: "#80a1a5", mountains: "#999078", moor: "#8b7b8b", fields: "#b9a96b", desert: "#b49a68", towerland: "#7a7377" },
  Zenon: { forest: "#6e9068", plains: "#91ad72", water: "#719aa3", mountains: "#8b858a", moor: "#817792", fields: "#aaa574", desert: "#ae946b", towerland: "#706d80" },
});

export function atlasActionLabel(action) {
  return ({ move: "ordinary territory", bazaar: "Bazaar", tomb: "Tomb or Ruin", sanctuary: "Sanctuary or Citadel", frontier: "Frontier", darktower: "Dark Tower" })[action] || action;
}

export function atlasMarkup({ game = null, players = [], currentPlayerId = null, legalSpaceIds = [], pegasusSpaceIds = [], interactive = true } = {}) {
  const legal = new Set(legalSpaceIds);
  const flight = new Set(pegasusSpaceIds);
  const activePlayers = game?.players || players;
  const currentPlayer = activePlayers.find((player) => player.id === currentPlayerId) || null;
  const dragonSpaceId = game?.board?.dragonSpaceId || null;

  const spaces = BOARD_SPACE_IDS.map((id) => {
    const space = BOARD_SPACES[id];
    const current = currentPlayer?.currentSpaceId === id;
    const classes = ["board-space", `terrain-${space.terrain}`, `type-${space.type}`];
    if (legal.has(id)) classes.push("legal");
    if (flight.has(id)) classes.push("flight-target");
    if (current) classes.push("current-space");
    if (dragonSpaceId === id) classes.push("dragon-blocked");
    if (!interactive && !space.type.match(/bazaar|tomb|ruin|sanctuary|citadel|darktower|frontier/)) classes.push("map-passive");

    const color = space.type === "frontier"
      ? "#c99a58"
      : TERRAIN_COLORS[space.kingdom]?.[space.terrain] || "#849173";

    return `<g class="space-group type-${space.type}" data-space-group="${id}">
      <path class="${classes.join(" ")}" data-space-id="${id}" data-space-label="${escapeXml(space.label)}" data-map-action="${space.action}" data-kingdom="${space.kingdom}" d="${space.path}" fill="${color}" role="button" tabindex="0" aria-label="${escapeXml(space.label)}" aria-disabled="${String(!(legal.has(id) || flight.has(id) || current))}"><title>${escapeXml(space.label)}</title></path>
      <path class="terrain-overlay" d="${space.path}" fill="url(#${terrainPattern(space.terrain)})" aria-hidden="true"/>
      ${specialLabel(space)}
    </g>`;
  }).join("");

  const tokens = activePlayers.map((player, index, list) => {
    const space = spaceById(player.currentSpaceId)
      || Object.values(BOARD_SPACES).find((candidate) => candidate.kingdom === player.currentKingdom && candidate.type === "citadel");
    if (!space) return "";
    const same = list.filter((other) => other.currentSpaceId === player.currentSpaceId);
    const position = Math.max(0, same.findIndex((other) => other.id === player.id));
    const angle = (position * (360 / Math.max(1, same.length)) - 90) * Math.PI / 180;
    const offset = same.length > 1 ? 13 : 0;
    const x = space.centroid[0] + Math.cos(angle) * offset;
    const y = space.centroid[1] + Math.sin(angle) * offset;
    const active = player.id === currentPlayerId ? " active" : "";
    return `<g class="map-player${active}" data-map-player="${player.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="15"/><text text-anchor="middle" y="4.5">P${player.id}</text><title>${escapeXml(player.name)} — ${escapeXml(space.label)}</title></g>`;
  }).join("");

  const dragon = dragonSpaceId && spaceById(dragonSpaceId) ? (() => {
    const [x, y] = spaceById(dragonSpaceId).centroid;
    return `<g class="dragon-token" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="M-18 10 Q-22-8-7-12 Q2-30 17-17 Q29-9 17 2 Q12 12-1 8 Q-8 18-18 10Z"/><text y="5" text-anchor="middle">D</text><title>Dragon blocks ${escapeXml(spaceById(dragonSpaceId).label)}</title></g>`;
  })() : "";

  const heraldry = KINGDOMS.map(houseBadge).join("");
  const rimPath = scallopedCirclePath(BOARD_RIM_RADIUS + 9, 28, 5);
  const paperPath = scallopedCirclePath(BOARD_RIM_RADIUS - 1, 28, 3);

  return `<svg class="atlas-svg full-board-svg" viewBox="${BOARD_VIEWBOX.x} ${BOARD_VIEWBOX.y} ${BOARD_VIEWBOX.width} ${BOARD_VIEWBOX.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Four-kingdom interactive board reconstructed from the original territory layout">
    <defs>
      <pattern id="patternForest" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M5 19l5-9 5 9M14 22l4-7 4 7" fill="none" stroke="#263e2e" stroke-opacity=".24" stroke-width="1.7"/></pattern>
      <pattern id="patternPlains" width="26" height="18" patternUnits="userSpaceOnUse"><path d="M1 14Q7 8 13 14T25 14" fill="none" stroke="#e4d8a4" stroke-opacity=".22" stroke-width="2"/></pattern>
      <pattern id="patternWater" width="30" height="18" patternUnits="userSpaceOnUse"><path d="M0 6Q7 1 15 6T30 6M0 14Q7 9 15 14T30 14" fill="none" stroke="#d5edf0" stroke-opacity=".28" stroke-width="2"/></pattern>
      <pattern id="patternMountains" width="34" height="28" patternUnits="userSpaceOnUse"><path d="M1 25L10 8l8 17M12 25L24 3l9 22" fill="none" stroke="#382f34" stroke-opacity=".26" stroke-width="2"/></pattern>
      <pattern id="patternMoor" width="28" height="22" patternUnits="userSpaceOnUse"><path d="M2 18q7-9 13 0t12 0" fill="none" stroke="#3f354b" stroke-opacity=".22" stroke-width="2"/></pattern>
      <pattern id="patternFields" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0 7h26M0 18h26M7 0v26M18 0v26" stroke="#6e5830" stroke-opacity=".18" stroke-width="1.4"/></pattern>
      <pattern id="patternDesert" width="32" height="22" patternUnits="userSpaceOnUse"><path d="M0 17Q8 9 16 17T32 17" fill="none" stroke="#f2dfad" stroke-opacity=".25" stroke-width="2"/></pattern>
      <pattern id="patternTower" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 22L22 0M-8 22L14 0M8 22L30 0" stroke="#211c28" stroke-opacity=".24" stroke-width="3"/></pattern>
      <pattern id="patternFrontier" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 8h16" stroke="#ffe2a4" stroke-opacity=".24" stroke-width="2"/></pattern>
      <radialGradient id="towerVoid"><stop offset="0" stop-color="#d96e32" stop-opacity=".5"/><stop offset=".42" stop-color="#352020"/><stop offset="1" stop-color="#0b0909"/></radialGradient>
      <filter id="tokenShadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".8"/></filter>
    </defs>
    <path class="atlas-rim scalloped-rim" d="${rimPath}" fill="#b38b4f" stroke="#211b13" stroke-width="6"/>
    <path class="map-paper scalloped-paper" d="${paperPath}" fill="#bca671" stroke="#d6b97a" stroke-width="5"/>
    ${spaces}
    <circle class="tower-base" cx="500" cy="500" r="138" fill="url(#towerVoid)"/>
    <path class="tower-silhouette" d="M445 570V430h23v-40h27v40h10v-40h27v40h23v140z"/>
    <text class="tower-label" x="500" y="600" text-anchor="middle">DARK TOWER</text>
    ${heraldry}
    ${tokens}
    ${dragon}
    <path class="atlas-outline scalloped-outline" d="${rimPath}" fill="none" stroke="#211b13" stroke-width="4.5" pointer-events="none"/>
  </svg>`;
}

function specialLabel(space) {
  if (space.type === "ordinary" || space.type === "frontier" || space.type === "citadel") return "";
  const geometry = space.labelGeometry || {
    x: space.centroid[0],
    y: space.centroid[1],
    rotation: 0,
    maxWidth: 72,
    fontSize: 11,
  };
  const lines = geometry.lines || [({
    darktower: "DARK TOWER",
    bazaar: "BAZAAR",
    ruin: "RUIN",
    tomb: "TOMB",
    sanctuary: "SANCTUARY",
  })[space.type] || space.type.toUpperCase()];
  const lineHeight = geometry.fontSize * 1.05;
  const firstY = -((lines.length - 1) * lineHeight) / 2;
  const content = lines.map((line, index) => {
    const estimatedWidth = line.length * geometry.fontSize * .66;
    const fit = estimatedWidth > geometry.maxWidth
      ? ` textLength="${geometry.maxWidth.toFixed(1)}" lengthAdjust="spacingAndGlyphs"`
      : "";
    return `<tspan x="0" y="${(firstY + index * lineHeight).toFixed(1)}"${fit}>${line}</tspan>`;
  }).join("");

  return `<g class="space-label-group type-${space.type}" transform="translate(${geometry.x.toFixed(1)} ${geometry.y.toFixed(1)}) rotate(${geometry.rotation.toFixed(1)})">
    <text class="space-label" data-location-label="${lines.join(" ")}" text-anchor="middle" dominant-baseline="middle" style="font-size:${geometry.fontSize}px">${content}</text>
  </g>`;
}

function houseBadge(kingdom) {
  const style = KINGDOM_STYLE[kingdom];
  const citadel = spaceById(citadelSpaceId(kingdom));
  if (!citadel) return "";
  const dx = citadel.centroid[0] - BOARD_CENTER;
  const dy = citadel.centroid[1] - BOARD_CENTER;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const [lineStartX, lineStartY] = polar(BOARD_RIM_RADIUS + 3, angle);
  const [lineEndX, lineEndY] = polar(BOARD_RIM_RADIUS + 43, angle);
  const [x, y] = polar(BOARD_RIM_RADIUS + 112, angle);

  return `<g class="house-badge" data-kingdom-label="${kingdom}" aria-label="Citadel of ${kingdom}, house of the ${style.symbol}">
    <line class="citadel-leader" x1="${lineStartX.toFixed(1)}" y1="${lineStartY.toFixed(1)}" x2="${lineEndX.toFixed(1)}" y2="${lineEndY.toFixed(1)}"/>
    <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <path class="house-shield-shadow" d="M-54-49 Q0-67 54-49 V8 Q39 49 0 64 Q-39 49-54 8Z"/>
      <path class="house-shield" d="M-50-47 Q0-63 50-47 V7 Q36 45 0 59 Q-36 45-50 7Z" fill="${style.shield}" stroke="#f4dfad"/>
      <path class="house-shield-inner" d="M-43-40 Q0-53 43-40 V5 Q31 36 0 49 Q-31 36-43 5Z" fill="none" stroke="${style.metal}"/>
      <text class="house-kicker" text-anchor="middle" y="-39" textLength="74" lengthAdjust="spacingAndGlyphs">CITADEL OF</text>
      ${houseAnimal(style.symbol, style.metal)}
      <path class="house-banner" d="M-47 34 Q0 45 47 34 L42 52 Q0 62-42 52Z" fill="#f5e4b7" stroke="#2b2118"/>
      <text class="house-name" text-anchor="middle" y="50" textLength="76" lengthAdjust="spacingAndGlyphs">${kingdom.toUpperCase()}</text>
      <title>Citadel of ${kingdom} — ${style.symbol}</title>
    </g>
  </g>`;
}

function houseAnimal(symbol, metal) {
  if (symbol === "Lion") {
    return `<g class="heraldic-animal" fill="${metal}" stroke="#2a1e16">
      <path d="M-7 14Q-20 7-20-6Q-20-18-9-25Q1-31 12-23Q23-14 17-3Q13 4 4 5Q9 10 13 20L3 18L-1 9L-8 22L-17 19Z"/>
      <path d="M-11-18Q-22-29-31-18Q-20-14-15-5M16-14Q27-23 31-12Q22-11 17-4" fill="none" stroke-width="4"/>
      <path d="M-6-19Q1-25 8-19L9-7Q2 0-7-6Z"/>
      <circle cx="-1" cy="-14" r="1.8" fill="#2a1e16" stroke="none"/>
      <path d="M-7-6Q0-2 8-7M1-2V4M-14 5L-27 13M15 2L28 9M4 16L17 25" fill="none" stroke-width="3.4"/>
    </g>`;
  }
  if (symbol === "Winged Lion") {
    return `<g class="heraldic-animal" fill="${metal}" stroke="#2a1e16">
      <path d="M-6 16Q-18 8-18-4Q-17-16-6-21Q5-27 15-18Q23-10 17-1Q12 6 4 5Q10 12 14 20L4 18L-1 9L-8 22L-17 18Z"/>
      <path d="M-8-6Q-23-25-35-16Q-25-3-10 6Q-22-10-28-5Q-18 8-7 12Z"/>
      <path d="M4-8Q19-29 34-18Q27-3 10 5Q23-12 29-6Q21 8 8 12Z"/>
      <path d="M-5-17Q2-23 9-17L9-7Q2 0-6-6Z"/>
      <path d="M-28-13L-14-2M25-14L12-2M-23-6L-10 4M21-7L9 4" fill="none" stroke-width="2.8"/>
      <circle cx="1" cy="-13" r="1.7" fill="#2a1e16" stroke="none"/>
    </g>`;
  }
  if (symbol === "Double Eagle") {
    return `<g class="heraldic-animal" fill="${metal}" stroke="#2a1e16">
      <path d="M0-13Q-5-20-12-17Q-20-15-18-8Q-16-3-9-3Q-18 3-19 15L-8 10L-5 23L0 15L5 23L8 10L19 15Q18 3 9-3Q16-3 18-8Q20-15 12-17Q5-20 0-13Z"/>
      <path d="M-8-7Q-24-17-35-8Q-27 5-11 9Q-27 3-31 13Q-18 18-4 10M8-7Q24-17 35-8Q27 5 11 9Q27 3 31 13Q18 18 4 10Z"/>
      <path d="M-13-13L-23-18M13-13L23-18M-8 11L-20 26M8 11L20 26M-27 26H-14M14 26H27" fill="none" stroke-width="3"/>
      <circle cx="-11" cy="-12" r="1.5" fill="#f5df8d" stroke="none"/>
      <circle cx="11" cy="-12" r="1.5" fill="#f5df8d" stroke="none"/>
    </g>`;
  }
  return `<g class="heraldic-animal" fill="${metal}" stroke="#2a1e16">
    <path d="M-19 16Q-24 4-18-8Q-12-21 3-22Q16-23 23-13Q28-4 20 5Q14 12 5 9Q10 17 5 25L-5 21L-8 10L-14 24L-24 20Z"/>
    <path d="M10-20L23-39L18-16"/>
    <path d="M-10-14Q-23-23-31-12Q-20-8-14 1M12-13Q23-20 29-10Q21-5 14 2" fill="none" stroke-width="3.7"/>
    <path d="M4-17Q10-13 12-7Q7-2 1-5Z"/>
    <circle cx="8" cy="-12" r="1.6" fill="#2a1e16" stroke="none"/>
    <path d="M-6 20L-16 30M7 21L17 30M-22 30H-11M12 30H23" fill="none" stroke-width="3"/>
  </g>`;
}

function terrainPattern(terrain) {
  return ({
    forest: "patternForest",
    plains: "patternPlains",
    water: "patternWater",
    mountains: "patternMountains",
    moor: "patternMoor",
    fields: "patternFields",
    desert: "patternDesert",
    towerland: "patternTower",
    frontier: "patternFrontier",
  })[terrain] || "patternPlains";
}
function polar(radius, angleDegrees) {
  const angle = angleDegrees * Math.PI / 180;
  return [500 + Math.cos(angle) * radius, 500 + Math.sin(angle) * radius];
}
function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}
