import { KINGDOMS } from "./rules.js";

export const KINGDOM_STYLE = Object.freeze({
  Arisilon: { color: "#a8322b", light: "#e28b63", symbol: "Lion", center: [590, 590] },
  Brynthia: { color: "#2d6e9d", light: "#7bb8d8", symbol: "Griffin", center: [590, 210] },
  Durnin: { color: "#b88725", light: "#e6c66a", symbol: "Eagle", center: [210, 210] },
  Zenon: { color: "#3d7a57", light: "#86bc83", symbol: "Unicorn", center: [210, 590] },
});

const LANDMARKS = Object.freeze({
  Arisilon: [
    ["wilds", 560, 530, "Wilds"], ["bazaar", 485, 605, "Bazaar"], ["tomb", 630, 500, "Tomb / Ruin"],
    ["sanctuary", 610, 685, "Sanctuary"], ["citadel", 715, 650, "Citadel"], ["frontier", 740, 410, "Frontier"],
  ],
  Brynthia: [
    ["wilds", 560, 270, "Wilds"], ["bazaar", 485, 195, "Bazaar"], ["tomb", 630, 300, "Tomb / Ruin"],
    ["sanctuary", 610, 115, "Sanctuary"], ["citadel", 715, 150, "Citadel"], ["frontier", 410, 60, "Frontier"],
  ],
  Durnin: [
    ["wilds", 240, 270, "Wilds"], ["bazaar", 315, 195, "Bazaar"], ["tomb", 170, 300, "Tomb / Ruin"],
    ["sanctuary", 190, 115, "Sanctuary"], ["citadel", 85, 150, "Citadel"], ["frontier", 60, 390, "Frontier"],
  ],
  Zenon: [
    ["wilds", 240, 530, "Wilds"], ["bazaar", 315, 605, "Bazaar"], ["tomb", 170, 500, "Tomb / Ruin"],
    ["sanctuary", 190, 685, "Sanctuary"], ["citadel", 85, 650, "Citadel"], ["frontier", 390, 740, "Frontier"],
  ],
});

const WEDGES = Object.freeze({
  Arisilon: "M400 400 L780 400 A380 380 0 0 1 400 780 Z",
  Brynthia: "M400 400 L400 20 A380 380 0 0 1 780 400 Z",
  Durnin: "M400 400 L20 400 A380 380 0 0 1 400 20 Z",
  Zenon: "M400 400 L400 780 A380 380 0 0 1 20 400 Z",
});

export function atlasActionLabel(action) {
  return ({ wilds: "ordinary territory", bazaar: "Bazaar", tomb: "Tomb or Ruin", sanctuary: "Sanctuary", citadel: "Citadel", frontier: "Frontier", darktower: "Dark Tower" })[action] || action;
}

export function atlasMarkup({ players = [], currentPlayerId = null } = {}) {
  const wedges = KINGDOMS.map((kingdom) => {
    const style = KINGDOM_STYLE[kingdom];
    return `<path class="kingdom-wedge" data-kingdom-wedge="${kingdom}" d="${WEDGES[kingdom]}" fill="${style.color}" />`;
  }).join("");

  const landmarks = KINGDOMS.flatMap((kingdom) => LANDMARKS[kingdom].map(([action, x, y, label]) => `
    <g class="map-location" data-map-action="${action}" data-kingdom="${kingdom}" role="button" tabindex="0" aria-label="${label} in ${kingdom}">
      <circle cx="${x}" cy="${y}" r="25" />
      <text x="${x}" y="${y + 4}" text-anchor="middle">${shortLabel(label)}</text>
      <title>${label} — ${kingdom}</title>
    </g>`)).join("");

  const kingdomLabels = KINGDOMS.map((kingdom) => {
    const [x, y] = KINGDOM_STYLE[kingdom].center;
    return `<g class="kingdom-label" data-kingdom-label="${kingdom}"><text x="${x}" y="${y - 92}" text-anchor="middle">${kingdom}</text><text class="kingdom-symbol" x="${x}" y="${y - 70}" text-anchor="middle">${KINGDOM_STYLE[kingdom].symbol}</text></g>`;
  }).join("");

  const playerTokens = players.map((player, index) => {
    const [cx, cy] = KINGDOM_STYLE[player.currentKingdom]?.center || [400, 400];
    const angle = (-45 + index * 30) * Math.PI / 180;
    const x = cx + Math.cos(angle) * 58;
    const y = cy + Math.sin(angle) * 58;
    const active = player.id === currentPlayerId ? " active" : "";
    return `<g class="map-player${active}" data-map-player="${player.id}" transform="translate(${x} ${y})"><circle r="18"/><text text-anchor="middle" y="5">P${player.id}</text><title>${escapeXml(player.name)} — ${player.currentKingdom}</title></g>`;
  }).join("");

  return `<svg class="atlas-svg" viewBox="0 0 800 800" role="img" aria-label="Original stylized four-kingdom Dark Tower atlas">
    <defs>
      <radialGradient id="towerGlow"><stop offset="0" stop-color="#e7632e" stop-opacity=".85"/><stop offset="1" stop-color="#140b08" stop-opacity=".15"/></radialGradient>
      <filter id="mapShadow"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-opacity=".65"/></filter>
    </defs>
    <circle class="atlas-rim" cx="400" cy="400" r="390"/>
    ${wedges}
    <g class="map-rivers" aria-hidden="true"><path d="M85 400 C210 350 285 450 400 400 S600 350 715 400"/><path d="M400 85 C345 220 450 290 400 400 S350 610 400 715"/></g>
    ${kingdomLabels}
    ${landmarks}
    <g class="map-location map-tower" data-map-action="darktower" data-kingdom="center" role="button" tabindex="0" aria-label="Dark Tower">
      <circle cx="400" cy="400" r="102" fill="url(#towerGlow)"/>
      <path d="M350 455V330h25v-35h30v35h20v-35h30v35h25v125z" />
      <text x="400" y="486" text-anchor="middle">DARK TOWER</text><title>Dark Tower</title>
    </g>
    ${playerTokens}
    <circle class="atlas-outline" cx="400" cy="400" r="390"/>
  </svg>`;
}

function shortLabel(label) {
  return ({ "Tomb / Ruin": "T/R", Sanctuary: "SAN", Citadel: "CIT", Frontier: "FRT", Bazaar: "BAZ", Wilds: "MOVE" })[label] || label;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}
