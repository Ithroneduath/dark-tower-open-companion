import { KEY_NAMES, KINGDOMS, nextKingdom } from "./rules.js";

export const BOARD_SIZE = 1000;
export const BOARD_CENTER = 500;
export const BOARD_RIM_RADIUS = 462;
export const BOARD_TOWER_RADIUS = 142;
export const BOARD_VIEWBOX = Object.freeze({ x: -135, y: -135, width: 1270, height: 1270 });

const DEG = Math.PI / 180;
export const KINGDOM_CONFIG = Object.freeze({
  Arisilon: { angle: 45, color: "#b12f2f", accent: "#f1c55b", symbol: "Lion" },
  Brynthia: { angle: -45, color: "#3272a6", accent: "#f0d378", symbol: "Winged Lion" },
  Durnin: { angle: -135, color: "#d6a933", accent: "#2b2119", symbol: "Double Eagle" },
  Zenon: { angle: 135, color: "#398665", accent: "#f6f0d9", symbol: "Unicorn" },
});

const RINGS = Object.freeze([
  { inner: 146, outer: 216, count: 3, fractions: [0, .28, .69, 1] },
  { inner: 216, outer: 292, count: 5, fractions: [0, .14, .40, .58, .84, 1] },
  { inner: 292, outer: 370, count: 7, fractions: [0, .13, .27, .41, .56, .70, .85, 1] },
  { inner: 370, outer: 440, count: 8, fractions: [0, .095, .275, .385, .49, .61, .72, .91, 1] },
]);

const SPECIAL = Object.freeze({
  "0:1": "darktower",
  "1:1": "bazaar",
  "1:3": "ruin",
  "3:1": "sanctuary",
  "3:4": "citadel",
  "3:6": "tomb",
});

const TERRAIN_CYCLE = ["forest", "plains", "water", "mountains", "moor", "fields"];

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function polar(radius, angleDegrees) {
  const angle = angleDegrees * DEG;
  return [BOARD_CENTER + Math.cos(angle) * radius, BOARD_CENTER + Math.sin(angle) * radius];
}
function pointString([x, y]) {
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}
function hashNoise(a, b, c = 0) {
  const value = Math.sin((a + 1) * 12.9898 + (b + 1) * 78.233 + (c + 1) * 37.719) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}
function normalizeTextRotation(value) {
  let rotation = ((value + 180) % 360 + 360) % 360 - 180;
  if (rotation > 90) rotation -= 180;
  if (rotation < -90) rotation += 180;
  return rotation;
}
function angleBounds(kingdomIndex, ringIndex, sectorIndex) {
  const kingdom = KINGDOMS[kingdomIndex];
  const center = KINGDOM_CONFIG[kingdom].angle;
  const ring = RINGS[ringIndex];
  const low = center - 40;
  const boundary = (index) => {
    const fraction = ring.fractions[index];
    if (index === 0 || index === ring.count) return low + fraction * 80;
    // The same angle is used at the inner and outer end of a boundary, so
    // adjacent lines can bend but can never cross and create sliver spaces.
    return low + fraction * 80 + hashNoise(kingdomIndex, ringIndex, index) * .72;
  };
  return [boundary(sectorIndex), boundary(sectorIndex + 1)];
}
function boundaryRadius(base, kingdomIndex, boundaryIndex, angle) {
  if (boundaryIndex === 0 || boundaryIndex === RINGS.length) return base;
  return base + hashNoise(kingdomIndex, boundaryIndex, Math.round(angle * 4)) * 3.2;
}
function cellPath(kingdomIndex, ringIndex, sectorIndex) {
  const ring = RINGS[ringIndex];
  const [a0, a1] = angleBounds(kingdomIndex, ringIndex, sectorIndex);
  const inner0 = boundaryRadius(ring.inner, kingdomIndex, ringIndex, a0);
  const inner1 = boundaryRadius(ring.inner, kingdomIndex, ringIndex, a1);
  const outer0 = boundaryRadius(ring.outer, kingdomIndex, ringIndex + 1, a0);
  const outer1 = boundaryRadius(ring.outer, kingdomIndex, ringIndex + 1, a1);

  const p0 = polar(inner0, a0);
  const p1 = polar(outer0, a0);
  const p2 = polar(outer1, a1);
  const p3 = polar(inner1, a1);
  const outerControl = polar(ring.outer + 2.5 + hashNoise(kingdomIndex, ringIndex, sectorIndex) * 2, (a0 + a1) / 2);
  const innerControl = polar(ring.inner - 2.5 + hashNoise(kingdomIndex, ringIndex, sectorIndex + 17) * 2, (a0 + a1) / 2);
  const leftControl = polar((ring.inner + ring.outer) / 2, a0 + hashNoise(kingdomIndex, ringIndex, sectorIndex + 31) * 1.4);
  const rightControl = polar((ring.inner + ring.outer) / 2, a1 + hashNoise(kingdomIndex, ringIndex, sectorIndex + 47) * 1.4);

  return [
    `M${pointString(p0)}`,
    `Q${pointString(leftControl)} ${pointString(p1)}`,
    `Q${pointString(outerControl)} ${pointString(p2)}`,
    `Q${pointString(rightControl)} ${pointString(p3)}`,
    `Q${pointString(innerControl)} ${pointString(p0)}`,
    "Z",
  ].join(" ");
}
function cellCentroid(kingdomIndex, ringIndex, sectorIndex) {
  const ring = RINGS[ringIndex];
  const [a0, a1] = angleBounds(kingdomIndex, ringIndex, sectorIndex);
  return polar((ring.inner + ring.outer) / 2, (a0 + a1) / 2);
}
function labelGeometry(kingdom, kingdomIndex, ringIndex, sectorIndex, type) {
  const centroid = cellCentroid(kingdomIndex, ringIndex, sectorIndex);
  const [a0, a1] = angleBounds(kingdomIndex, ringIndex, sectorIndex);
  const centerAngle = (a0 + a1) / 2;
  const span = Math.max(4, a1 - a0);
  const ring = RINGS[ringIndex];
  const arcWidth = ((ring.inner + ring.outer) / 2) * span * DEG * .82;
  const base = {
    x: centroid[0],
    y: centroid[1],
    rotation: normalizeTextRotation(centerAngle + 90),
    maxWidth: Math.max(42, Math.min(118, arcWidth)),
    fontSize: type === "sanctuary" ? 10.5 : type === "darktower" ? 9.4 : 11.2,
    lines: type === "darktower" ? ["DARK", "TOWER"] : null,
  };

  const overrides = {
    "Zenon:bazaar": { dx: 7, dy: -2, rotation: 32, maxWidth: 78, fontSize: 10.8 },
    "Zenon:ruin": { dx: 0, dy: 0, rotation: -42, maxWidth: 54, fontSize: 10.2 },
    "Durnin:tomb": { dx: 5, dy: 0, rotation: 24, maxWidth: 68, fontSize: 10.8 },
    "Durnin:bazaar": { dx: 5, dy: 1, rotation: -28, maxWidth: 78, fontSize: 10.8 },
    "Durnin:sanctuary": { dx: 2, dy: -1, rotation: 23, maxWidth: 94, fontSize: 9.8 },
    "Brynthia:sanctuary": { dx: -2, dy: 0, rotation: -23, maxWidth: 96, fontSize: 9.8 },
    "Brynthia:bazaar": { dx: -4, dy: 0, rotation: 28, maxWidth: 82, fontSize: 10.8 },
    "Brynthia:tomb": { dx: -3, dy: 0, rotation: -24, maxWidth: 66, fontSize: 10.6 },
    "Arisilon:bazaar": { dx: -5, dy: 1, rotation: -31, maxWidth: 80, fontSize: 10.8 },
    "Arisilon:sanctuary": { dx: -2, dy: 0, rotation: 23, maxWidth: 96, fontSize: 9.8 },
  };
  const override = overrides[`${kingdom}:${type}`] || {};
  return {
    ...base,
    x: base.x + (override.dx || 0),
    y: base.y + (override.dy || 0),
    ...Object.fromEntries(Object.entries(override).filter(([key]) => !["dx", "dy"].includes(key))),
  };
}
function terrainFor(kingdomIndex, ringIndex, sectorIndex, type) {
  if (type === "darktower") return "towerland";
  if (type === "citadel") return "fields";
  if (type === "sanctuary") return "plains";
  if (type === "tomb") return kingdomIndex % 2 ? "desert" : "moor";
  if (type === "ruin") return "mountains";
  if (type === "bazaar") return "fields";
  return TERRAIN_CYCLE[(kingdomIndex * 2 + ringIndex + sectorIndex) % TERRAIN_CYCLE.length];
}
function labelFor(type, kingdom, ring, sector) {
  const labels = {
    ordinary: `Territory ${ring + 1}-${sector + 1}`,
    bazaar: "Bazaar",
    ruin: "Ruin",
    tomb: "Tomb",
    sanctuary: "Sanctuary",
    citadel: `Citadel of ${kingdom}`,
    darktower: "Dark Tower Space",
    frontier: "Frontier",
  };
  return labels[type] || type;
}
function actionFor(type) {
  return ({
    ordinary: "move",
    bazaar: "bazaar",
    ruin: "tomb",
    tomb: "tomb",
    sanctuary: "sanctuary",
    citadel: "sanctuary",
    darktower: "darktower",
    frontier: "frontier",
  })[type] || "move";
}
function scallopedPoints(radius = BOARD_RIM_RADIUS + 8, lobes = 28, depth = 5) {
  const points = [];
  for (let index = 0; index < lobes * 2; index += 1) {
    const angle = -90 + index * (180 / lobes);
    points.push(polar(index % 2 === 0 ? radius : radius - depth, angle));
  }
  return points;
}
export function scallopedCirclePath(radius = BOARD_RIM_RADIUS + 8, lobes = 28, depth = 5) {
  return `M${scallopedPoints(radius, lobes, depth).map(pointString).join(" L")} Z`;
}

function buildBoard() {
  const spaces = {};
  const intervals = {};

  KINGDOMS.forEach((kingdom, kingdomIndex) => {
    RINGS.forEach((ring, ringIndex) => {
      for (let sector = 0; sector < ring.count; sector += 1) {
        const id = `${slug(kingdom)}-r${ringIndex + 1}-s${sector + 1}`;
        const type = SPECIAL[`${ringIndex}:${sector}`] || "ordinary";
        const angles = angleBounds(kingdomIndex, ringIndex, sector);
        spaces[id] = {
          id,
          kingdom,
          type,
          action: actionFor(type),
          ring: ringIndex,
          sector,
          label: labelFor(type, kingdom, ringIndex, sector),
          terrain: terrainFor(kingdomIndex, ringIndex, sector, type),
          path: cellPath(kingdomIndex, ringIndex, sector),
          centroid: cellCentroid(kingdomIndex, ringIndex, sector),
          labelGeometry: labelGeometry(kingdom, kingdomIndex, ringIndex, sector, type),
          neighbors: [],
        };
        intervals[id] = angles;
      }
    });
  });

  KINGDOMS.forEach((kingdom) => {
    RINGS.forEach((ring, ringIndex) => {
      for (let sector = 0; sector < ring.count; sector += 1) {
        const id = `${slug(kingdom)}-r${ringIndex + 1}-s${sector + 1}`;
        const neighbors = new Set();
        if (sector > 0) neighbors.add(`${slug(kingdom)}-r${ringIndex + 1}-s${sector}`);
        if (sector < ring.count - 1) neighbors.add(`${slug(kingdom)}-r${ringIndex + 1}-s${sector + 2}`);

        for (const adjacentRing of [ringIndex - 1, ringIndex + 1]) {
          if (adjacentRing < 0 || adjacentRing >= RINGS.length) continue;
          const otherRing = RINGS[adjacentRing];
          for (let otherSector = 0; otherSector < otherRing.count; otherSector += 1) {
            const otherId = `${slug(kingdom)}-r${adjacentRing + 1}-s${otherSector + 1}`;
            const [a0, a1] = intervals[id];
            const [b0, b1] = intervals[otherId];
            if (Math.min(a1, b1) - Math.max(a0, b0) > 1.15) neighbors.add(otherId);
          }
        }
        spaces[id].neighbors = [...neighbors];
      }
    });
  });

  KINGDOMS.forEach((from) => {
    const to = nextKingdom(from);
    const boundary = KINGDOM_CONFIG[from].angle - 45;
    const id = `frontier-${slug(from)}-${slug(to)}`;
    const half = 4.8;
    const p0 = polar(143, boundary - half);
    const p1 = polar(444, boundary - half);
    const p2 = polar(444, boundary + half);
    const p3 = polar(143, boundary + half);

    spaces[id] = {
      id,
      kingdom: to,
      from,
      to,
      type: "frontier",
      action: "frontier",
      ring: -1,
      sector: -1,
      label: `${from}–${to} Frontier`,
      terrain: "frontier",
      path: `M${pointString(p0)} Q${pointString(polar(294, boundary - half - .8))} ${pointString(p1)} Q${pointString(polar(452, boundary))} ${pointString(p2)} Q${pointString(polar(294, boundary + half + .8))} ${pointString(p3)} Q${pointString(polar(137, boundary))} ${pointString(p0)} Z`,
      centroid: polar(300, boundary),
      labelGeometry: {
        x: polar(300, boundary)[0],
        y: polar(300, boundary)[1],
        rotation: normalizeTextRotation(boundary),
        maxWidth: 150,
        fontSize: 10,
      },
      neighbors: [],
    };

    const fromSlug = slug(from);
    const toSlug = slug(to);
    RINGS.forEach((ring, ringIndex) => {
      spaces[id].neighbors.push(`${fromSlug}-r${ringIndex + 1}-s1`);
      spaces[id].neighbors.push(`${toSlug}-r${ringIndex + 1}-s${ring.count}`);
    });
    spaces[id].neighbors = [...new Set(spaces[id].neighbors)];
    for (const neighborId of spaces[id].neighbors) spaces[neighborId].neighbors.push(id);
  });

  for (const space of Object.values(spaces)) space.neighbors = [...new Set(space.neighbors)];
  return Object.freeze(spaces);
}

export const BOARD_SPACES = buildBoard();
export const BOARD_SPACE_IDS = Object.freeze(Object.keys(BOARD_SPACES));
export const BOARD_TERRITORY_COUNT = BOARD_SPACE_IDS.length;

export function spaceById(id) { return BOARD_SPACES[id] || null; }
export function spaceAction(spaceOrId) { const space = typeof spaceOrId === "string" ? spaceById(spaceOrId) : spaceOrId; return space?.action || null; }
export function spaceLabel(id) { return spaceById(id)?.label || "Unknown territory"; }
export function citadelSpaceId(kingdom) { return BOARD_SPACE_IDS.find((id) => BOARD_SPACES[id].kingdom === kingdom && BOARD_SPACES[id].type === "citadel") || null; }
export function darkTowerSpaceId(kingdom) { return BOARD_SPACE_IDS.find((id) => BOARD_SPACES[id].kingdom === kingdom && BOARD_SPACES[id].type === "darktower") || null; }
export function frontierSpaceId(fromKingdom) { return `frontier-${slug(fromKingdom)}-${slug(nextKingdom(fromKingdom))}`; }
export function kingdomForSpace(id, fallback = null) {
  const space = spaceById(id);
  if (!space) return fallback;
  return space.type === "frontier" ? space.to : space.kingdom;
}
export function isSiegeReady(player) { return KEY_NAMES.every((key) => player.keys?.[key]) && player.frontiersCrossed >= 4 && player.currentKingdom === player.homeKingdom; }

export function boardMoveCheck(game, player, destinationId, { pegasus = false, allowStay = true } = {}) {
  const destination = spaceById(destinationId);
  const current = spaceById(player?.currentSpaceId);
  if (!destination || !current) return { ok: false, reason: "The board position is not recognized." };
  if (game?.pending) return { ok: false, reason: `Resolve the pending ${game.pending.type} action first.` };
  if (game?.board?.locationActionUsed) return { ok: false, reason: "This player has already used a location this turn. End the turn before moving again." };
  if (destination.id === current.id) {
    if (!allowStay || destination.type === "frontier") return { ok: false, reason: "You cannot remain on a Frontier and cross it again." };
  } else if (!pegasus && !current.neighbors.includes(destination.id)) {
    return { ok: false, reason: "That territory is not adjacent to the current territory." };
  }
  if (destination.id === game?.board?.dragonSpaceId) return { ok: false, reason: "The Dragon pawn blocks that territory until the next Dragon attack." };
  if (destination.type === "citadel" && destination.kingdom !== player.homeKingdom) return { ok: false, reason: "A player may not enter a foreign Citadel." };
  if (destination.type === "darktower" && !isSiegeReady(player)) return { ok: false, reason: "The Dark Tower space may be entered only after collecting all keys, crossing all four frontiers, and returning home." };

  if (destination.type === "frontier") {
    if (destination.from !== player.currentKingdom) return { ok: false, reason: `Frontiers must be crossed counterclockwise. From ${player.currentKingdom}, the legal frontier leads to ${nextKingdom(player.currentKingdom)}.` };
    if (player.currentKingdom !== player.homeKingdom && !player.keysByKingdom?.[player.currentKingdom]) return { ok: false, reason: `You cannot leave ${player.currentKingdom} until its key is found.` };
  } else if (current.type === "frontier" && destination.kingdom !== current.to) {
    return { ok: false, reason: `After crossing the Frontier, movement must continue into ${current.to}.` };
  } else if (!pegasus && destination.kingdom !== player.currentKingdom) {
    return { ok: false, reason: "Cross into another kingdom through its Frontier territory." };
  }
  return { ok: true, reason: "" };
}

export function legalBoardMoveIds(game, player) {
  const current = spaceById(player?.currentSpaceId);
  if (!current || game?.pending || game?.board?.locationActionUsed) return [];
  const candidates = [current.id, ...current.neighbors];
  return candidates.filter((id) => boardMoveCheck(game, player, id).ok);
}

export function pegasusDestinationIds(game, player) {
  if (!player?.pegasus || game?.pending || game?.board?.locationActionUsed) return [];
  if (player.currentKingdom !== player.homeKingdom && !player.keysByKingdom?.[player.currentKingdom]) return [];
  return BOARD_SPACE_IDS.filter((id) => {
    const space = BOARD_SPACES[id];
    if (space.type === "frontier") return space.from === player.currentKingdom;
    return boardMoveCheck(game, player, id, { pegasus: true }).ok;
  });
}

export function boardSummary() {
  const byKingdom = Object.fromEntries(KINGDOMS.map((kingdom) => [kingdom, BOARD_SPACE_IDS.filter((id) => BOARD_SPACES[id].kingdom === kingdom && BOARD_SPACES[id].type !== "frontier").length]));
  return { totalSpaces: BOARD_SPACE_IDS.length, frontiers: 4, byKingdom };
}
