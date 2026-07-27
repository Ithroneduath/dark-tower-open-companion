import test from "node:test";
import assert from "node:assert/strict";

import {
  BOARD_RIM_RADIUS,
  BOARD_SPACES,
  BOARD_SPACE_IDS,
  BOARD_TERRITORY_COUNT,
  BOARD_VIEWBOX,
  citadelSpaceId,
  scallopedCirclePath,
} from "../web/js/board.js";
import { atlasMarkup } from "../web/js/atlas.js";
import { KINGDOMS } from "../web/js/rules.js";

test("Milestone 9 retains the 96-space movement graph", () => {
  assert.equal(BOARD_TERRITORY_COUNT, 96);
  assert.equal(BOARD_SPACE_IDS.length, 96);
});

test("every territory path uses one closed, stable curved cell", () => {
  for (const space of Object.values(BOARD_SPACES).filter((candidate) => candidate.type !== "frontier")) {
    assert.match(space.path, /^M/);
    assert.match(space.path, / Z$/);
    assert.equal((space.path.match(/M/g) || []).length, 1);
    assert.ok((space.path.match(/Q/g) || []).length >= 4);
    assert.ok(!space.path.includes("NaN"));
  }
});

test("special locations have readable hand-tuned label geometry", () => {
  const required = new Set(["darktower", "bazaar", "ruin", "tomb", "sanctuary"]);
  for (const space of Object.values(BOARD_SPACES).filter((candidate) => required.has(candidate.type))) {
    assert.ok(Number.isFinite(space.labelGeometry.x));
    assert.ok(Number.isFinite(space.labelGeometry.y));
    assert.ok(Number.isFinite(space.labelGeometry.rotation));
    assert.ok(space.labelGeometry.maxWidth >= 42);
    assert.ok(space.labelGeometry.fontSize >= 9);
  }
});

test("all Dark Tower labels use two lines", () => {
  const spaces = Object.values(BOARD_SPACES).filter((space) => space.type === "darktower");
  assert.equal(spaces.length, 4);
  for (const space of spaces) assert.deepEqual(space.labelGeometry.lines, ["DARK", "TOWER"]);
  const markup = atlasMarkup();
  assert.equal((markup.match(/data-location-label="DARK TOWER"/g) || []).length, 4);
});

test("Citadel badges are outside the map and use refined heraldry", () => {
  const markup = atlasMarkup();
  for (const kingdom of KINGDOMS) {
    assert.ok(citadelSpaceId(kingdom));
    assert.match(markup, new RegExp(`Citadel of ${kingdom}`));
  }
  for (const symbol of ["Lion", "Winged Lion", "Double Eagle", "Unicorn"]) {
    assert.match(markup, new RegExp(symbol));
  }
  assert.match(markup, /house-shield-inner/);
  assert.match(markup, /heraldic-animal/);
});

test("expanded viewBox leaves room around all external shields", () => {
  assert.ok(BOARD_VIEWBOX.x <= -130);
  assert.ok(BOARD_VIEWBOX.width >= 1260);
  assert.match(atlasMarkup(), /viewBox="-135 -135 1270 1270"/);
});

test("the board keeps a subtle scalloped rim", () => {
  const path = scallopedCirclePath(BOARD_RIM_RADIUS + 9, 28, 5);
  assert.ok((path.match(/ L/g) || []).length >= 50);
});

test("all reported label overrides are present", () => {
  const checks = [
    ["Zenon", "bazaar"],
    ["Zenon", "ruin"],
    ["Durnin", "tomb"],
    ["Durnin", "bazaar"],
    ["Durnin", "sanctuary"],
    ["Brynthia", "sanctuary"],
    ["Brynthia", "bazaar"],
    ["Brynthia", "tomb"],
    ["Arisilon", "bazaar"],
    ["Arisilon", "sanctuary"],
  ];
  for (const [kingdom, type] of checks) {
    const space = Object.values(BOARD_SPACES).find((candidate) => candidate.kingdom === kingdom && candidate.type === type);
    assert.ok(space, `${kingdom} ${type} is missing`);
    assert.ok(Math.abs(space.labelGeometry.rotation) >= 20, `${kingdom} ${type} is not diagonally oriented`);
  }
});
