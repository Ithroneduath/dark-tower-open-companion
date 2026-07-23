import test from "node:test";
import assert from "node:assert/strict";
import {
  awardTreasure,
  bazaarHaggle,
  battleRound,
  beginDarkTower,
  createGame,
  currentPlayer,
  endTurn,
  exportGame,
  foodCost,
  goldCapacity,
  guessRiddleKey,
  importGame,
  keyCount,
  resolveFrontier,
  resolveMove,
  resolveSanctuaryOrCitadel,
  retreatBattle,
  setPlayerKingdom,
  startBattle,
  startBazaar,
} from "../web/js/engine.js";
import { MANUAL_SECTIONS, contextualManualId, contextualManualTarget, searchManual } from "../web/js/manual.js";
import { KINGDOMS, RULE_PROFILE, nextKingdom, towerDefenderRange } from "../web/js/rules.js";
import { atlasActionLabel, atlasMarkup } from "../web/js/atlas.js";
import { classifyDisplay, normalizePreferences } from "../web/js/presentation.js";
import { TUTORIAL_STEPS, tutorialStep } from "../web/js/tutorial.js";

function game1(overrides = {}) {
  return createGame({ playerNames: ["Tester"], level: 1, seed: 12345, ...overrides });
}

test("new games use documented starting resources", () => {
  const game = createGame({ playerNames: ["A", "B"], level: 1, seed: 1 });
  assert.equal(game.players.length, 2);
  for (const player of game.players) {
    assert.equal(player.warriors, 10);
    assert.equal(player.gold, 30);
    assert.equal(player.food, 25);
  }
  assert.ok(game.towerDefenders >= 17 && game.towerDefenders <= 32);
});

test("all level defender ranges are explicit", () => {
  assert.deepEqual(towerDefenderRange(1), [17, 32]);
  assert.deepEqual(towerDefenderRange(2), [33, 64]);
  assert.deepEqual(towerDefenderRange(3), [17, 64]);
  assert.deepEqual(towerDefenderRange(4), [16, 16]);
});

test("food cost increases once per fifteen warriors", () => {
  assert.equal(foodCost(1), 1);
  assert.equal(foodCost(15), 1);
  assert.equal(foodCost(16), 2);
  assert.equal(foodCost(30), 2);
  assert.equal(foodCost(31), 3);
  assert.equal(foodCost(99), 7);
});

test("gold carrying capacity is six per warrior plus fifty for a beast", () => {
  const game = game1();
  const player = currentPlayer(game);
  assert.equal(goldCapacity(player), 60);
  player.beast = true;
  assert.equal(goldCapacity(player), 99);
});

test("foreign kingdom keys are awarded brass, silver, then gold", () => {
  const game = game1();
  const originalRewards = [...RULE_PROFILE.battleRewards];
  RULE_PROFILE.battleRewards.splice(0, RULE_PROFILE.battleRewards.length, "key");
  try {
    setPlayerKingdom(game, "Brynthia");
    const first = awardTreasure(game, { guaranteed: true });
    assert.equal(first.type, "key");
    assert.equal(first.key, "brass");
    assert.equal(keyCount(currentPlayer(game)), 1);

    setPlayerKingdom(game, "Durnin");
    const second = awardTreasure(game, { guaranteed: true });
    assert.equal(second.key, "silver");
  } finally {
    RULE_PROFILE.battleRewards.splice(0, RULE_PROFILE.battleRewards.length, ...originalRewards);
  }
});

test("a player cannot leave a foreign kingdom without its key", () => {
  const game = game1();
  setPlayerKingdom(game, "Brynthia");
  const result = resolveFrontier(game, "Durnin");
  assert.equal(result.type, "blocked");
  assert.equal(currentPlayer(game).currentKingdom, "Brynthia");
});

test("frontier travel is counterclockwise", () => {
  for (let index = 0; index < KINGDOMS.length; index += 1) {
    assert.equal(nextKingdom(KINGDOMS[index]), KINGDOMS[(index + 1) % KINGDOMS.length]);
  }
  const game = game1();
  const result = resolveFrontier(game, "Durnin");
  assert.equal(result.type, "wrongDirection");
  assert.equal(result.expectedDestination, "Brynthia");
  assert.equal(game.pending.type, "illegalMove");
});

test("winning a battle round halves brigands", () => {
  const game = game1();
  const originalChance = RULE_PROFILE.battleRoundPlayerWinChance;
  RULE_PROFILE.battleRoundPlayerWinChance = 1;
  try {
    startBattle(game, { enemyCount: 9, rewardEligible: false });
    const result = battleRound(game);
    assert.equal(result.type, "roundWon");
    assert.equal(game.pending.brigands, 4);
  } finally {
    RULE_PROFILE.battleRoundPlayerWinChance = originalChance;
  }
});

test("retreat is unavailable with one warrior", () => {
  const game = game1();
  currentPlayer(game).warriors = 1;
  startBattle(game, { enemyCount: 8, rewardEligible: false });
  const result = retreatBattle(game);
  assert.equal(result.type, "retreatUnavailable");
  assert.equal(game.pending.type, "battle");
  assert.equal(currentPlayer(game).warriors, 1);
});

test("a scout converts Lost into an extra turn", () => {
  const game = game1();
  const player = currentPlayer(game);
  player.scout = true;
  const original = [...RULE_PROFILE.moveEvents];
  RULE_PROFILE.moveEvents.splice(0, RULE_PROFILE.moveEvents.length, "lost");
  try {
    const result = resolveMove(game);
    assert.equal(result.type, "scout");
    assert.equal(player.extraTurn, true);
    const ended = endTurn(game);
    assert.equal(ended.type, "extraTurn");
    assert.equal(currentPlayer(game).id, player.id);
  } finally {
    RULE_PROFILE.moveEvents.splice(0, RULE_PROFILE.moveEvents.length, ...original);
  }
});

test("home Citadel does not double an army before endgame requirements", () => {
  const game = game1();
  const result = resolveSanctuaryOrCitadel(game, "citadel");
  assert.notEqual(result.type, "citadelDouble");
  assert.equal(currentPlayer(game).warriors, 10);
});

test("home Citadel doubles 5 to 24 warriors once the player is ready for the siege", () => {
  const game = game1();
  const player = currentPlayer(game);
  player.keys.brass = player.keys.silver = player.keys.gold = true;
  player.frontiersCrossed = 4;
  player.warriors = 12;
  const result = resolveSanctuaryOrCitadel(game, "citadel");
  assert.equal(result.type, "citadelDouble");
  assert.equal(player.warriors, 24);
});

test("haggling can leave the price unchanged without closing the Bazaar", () => {
  const game = game1();
  const original = [...RULE_PROFILE.haggleOutcomes];
  RULE_PROFILE.haggleOutcomes.splice(0, RULE_PROFILE.haggleOutcomes.length, "unchanged");
  try {
    startBazaar(game);
    const price = game.pending.price;
    const result = bazaarHaggle(game);
    assert.equal(result.type, "unchanged");
    assert.equal(game.pending.type, "bazaar");
    assert.equal(game.pending.price, price);
  } finally {
    RULE_PROFILE.haggleOutcomes.splice(0, RULE_PROFILE.haggleOutcomes.length, ...original);
  }
});

test("haggling may anger the merchant and close the Bazaar", () => {
  const game = game1();
  const original = [...RULE_PROFILE.haggleOutcomes];
  RULE_PROFILE.haggleOutcomes.splice(0, RULE_PROFILE.haggleOutcomes.length, "closed");
  try {
    startBazaar(game);
    const result = bazaarHaggle(game);
    assert.equal(result.type, "closed");
    assert.equal(game.pending, null);
  } finally {
    RULE_PROFILE.haggleOutcomes.splice(0, RULE_PROFILE.haggleOutcomes.length, ...original);
  }
});

test("correct first two riddle keys start the final battle", () => {
  const game = game1();
  const player = currentPlayer(game);
  player.keys.brass = player.keys.silver = player.keys.gold = true;
  player.frontiersCrossed = 4;
  player.currentKingdom = player.homeKingdom;
  assert.equal(beginDarkTower(game).type, "riddle");
  assert.equal(guessRiddleKey(game, game.keyOrder[0]).type, "correct");
  const result = guessRiddleKey(game, game.keyOrder[1]);
  assert.equal(result.type, "battle");
  assert.equal(game.pending.final, true);
  assert.equal(game.pending.brigands, game.towerDefenders);
});

test("save export and import preserve deterministic state", () => {
  const game = game1();
  resolveMove(game);
  const restored = importGame(exportGame(game));
  assert.equal(restored.seed, game.seed);
  assert.equal(restored.rngState, game.rngState);
  assert.deepEqual(restored.players, game.players);
  assert.deepEqual(restored.display, game.display);
});

test("the in-app manual is searchable and can identify contextual rules", () => {
  assert.ok(MANUAL_SECTIONS.length >= 15);
  assert.ok(searchManual("haggling merchant").some((section) => section.id === "bazaar"));
  const game = game1();
  startBattle(game, { enemyCount: 4 });
  assert.equal(contextualManualId(game), "battle");
});


test("Milestone 3 preferences normalize invalid values safely", () => {
  const prefs = normalizePreferences({ presentation: "unknown", volume: 9, showMap: false, highContrast: 1 });
  assert.equal(prefs.presentation, "deluxe");
  assert.equal(prefs.volume, 1);
  assert.equal(prefs.showMap, false);
  assert.equal(prefs.highContrast, true);
});

test("display classification drives deluxe animation and sound cues", () => {
  assert.equal(classifyDisplay({ title: "DRAGON ATTACK" }), "dragon");
  assert.equal(classifyDisplay({ title: "GOLD" }), "treasure");
  assert.equal(classifyDisplay({ title: "BRIGANDS" }, { type: "battle", final: false }), "battle");
  assert.equal(classifyDisplay({ title: "FINAL BATTLE" }, { type: "battle", final: true }), "final-battle");
});

test("the original atlas contains all kingdoms, players, and landmark actions", () => {
  const game = createGame({ playerNames: ["A", "B", "C", "D"], level: 1, seed: 5 });
  const markup = atlasMarkup({ players: game.players, currentPlayerId: 1 });
  for (const kingdom of KINGDOMS) assert.ok(markup.includes(kingdom));
  assert.ok(markup.includes('data-map-action="bazaar"'));
  assert.ok(markup.includes('data-map-action="darktower"'));
  assert.ok(markup.includes('data-map-player="4"'));
  assert.equal(atlasActionLabel("tomb"), "Tomb or Ruin");
});

test("guided tutorial covers the major Milestone 3 interface areas", () => {
  assert.ok(TUTORIAL_STEPS.length >= 6);
  assert.equal(tutorialStep(999).index, TUTORIAL_STEPS.length - 1);
  assert.ok(TUTORIAL_STEPS.some((step) => step.selector === "#atlasPanel"));
  assert.ok(TUTORIAL_STEPS.some((step) => step.selector === "#settingsBtn"));
});


test("Milestone 4 contextual rule targets include exact manual anchors", () => {
  const battleGame = game1();
  startBattle(battleGame, { enemyCount: 4 });
  assert.deepEqual(contextualManualTarget(battleGame), {
    sectionId: "battle",
    anchorId: "rule-brigand-battles",
    label: "Brigand Battles",
  });

  const bazaarGame = game1();
  startBazaar(bazaarGame);
  assert.equal(contextualManualTarget(bazaarGame).anchorId, "rule-bazaar-shopping");
  bazaarGame.display.title = "HAGGLE SUCCESS";
  assert.equal(contextualManualTarget(bazaarGame).anchorId, "rule-bazaar-haggling");
});

test("Milestone 4 manual contains deep-link anchors for common events", () => {
  const anchors = [
    "rule-brigand-battles",
    "rule-bazaar-shopping",
    "rule-bazaar-haggling",
    "rule-dragon-attack",
    "rule-plague",
    "rule-lost",
    "rule-frontiers-keys",
    "rule-riddle",
    "rule-final-battle",
  ];
  const html = MANUAL_SECTIONS.map((section) => section.html).join("\n");
  for (const anchor of anchors) assert.match(html, new RegExp(`id="${anchor}"`));
});
