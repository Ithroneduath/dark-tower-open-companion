import {
  APP_VERSION,
  ITEM_LABELS,
  KEY_NAMES,
  KINGDOMS,
  RULE_PROFILE,
  nextKingdom,
  towerDefenderRange,
} from "./rules.js";

const MAX_RESOURCE = 99;

export function createGame({
  playerNames,
  level = 1,
  enhancedMode = true,
  seed = Date.now(),
} = {}) {
  if (!Array.isArray(playerNames) || playerNames.length < 1 || playerNames.length > 4) {
    throw new RangeError("Dark Tower supports one to four players.");
  }

  const normalizedSeed = normalizeSeed(seed);
  const game = {
    schemaVersion: 2,
    appVersion: APP_VERSION,
    rulesProfile: RULE_PROFILE.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    level: Number(level),
    enhancedMode: Boolean(enhancedMode),
    seed: normalizedSeed,
    rngState: normalizedSeed,
    turn: 1,
    currentPlayerIndex: 0,
    status: "playing",
    winnerPlayerId: null,
    towerDefenders: 0,
    keyOrder: [],
    dragonHoard: { warriors: 0, gold: 0 },
    players: playerNames.map((name, index) => createPlayer(name, index)),
    pending: null,
    display: {
      icon: "◆",
      title: "THE TOWER AWAKENS",
      number: "--",
      text: "Move one territory or remain where you are, then press the matching location button.",
    },
    previousDisplay: null,
    log: [],
  };

  const [minDefenders, maxDefenders] = towerDefenderRange(game.level);
  game.towerDefenders = randomInt(game, minDefenders, maxDefenders);
  game.keyOrder = shuffle(game, [...KEY_NAMES]);

  if (game.level === 4) {
    const player = game.players[0];
    player.keys.brass = true;
    player.keys.silver = true;
    player.keys.gold = true;
    player.keysByKingdom.Brynthia = "brass";
    player.keysByKingdom.Durnin = "silver";
    player.keysByKingdom.Zenon = "gold";
    player.frontiersCrossed = 4;
  }

  logEvent(game, `Game created at Level ${game.level}; the Tower contains ${game.towerDefenders} defenders.`);
  setDisplay(
    game,
    "◆",
    "THE TOWER AWAKENS",
    String(currentPlayer(game).id),
    `${currentPlayer(game).name}, begin in the ${currentPlayer(game).homeKingdom} Citadel.`,
  );
  return game;
}

function createPlayer(name, index) {
  const homeKingdom = KINGDOMS[index];
  return {
    id: index + 1,
    name: String(name || `Player ${index + 1}`).trim() || `Player ${index + 1}`,
    homeKingdom,
    currentKingdom: homeKingdom,
    previousKingdom: homeKingdom,
    warriors: 10,
    gold: 30,
    food: 25,
    scout: false,
    healer: false,
    beast: false,
    sword: false,
    pegasus: false,
    keys: { brass: false, silver: false, gold: false },
    keysByKingdom: {},
    frontiersCrossed: 0,
    skipTurns: 0,
    extraTurn: false,
    citadelDoubleReady: true,
    defeated: false,
  };
}

export function currentPlayer(game) {
  return game.players[game.currentPlayerIndex];
}

export function playerById(game, playerId) {
  return game.players.find((player) => player.id === Number(playerId)) || null;
}

export function keyCount(player) {
  return KEY_NAMES.filter((key) => player.keys[key]).length;
}

export function foodCost(warriors) {
  return Math.max(1, Math.ceil(Math.max(1, Number(warriors)) / 15));
}

export function goldCapacity(player) {
  return Math.min(MAX_RESOURCE, player.warriors * 6 + (player.beast ? 50 : 0));
}

export function setPlayerKingdom(game, kingdom) {
  assertPlaying(game);
  if (!KINGDOMS.includes(kingdom)) {
    throw new RangeError(`Unknown kingdom: ${kingdom}`);
  }
  const player = currentPlayer(game);
  player.previousKingdom = player.currentKingdom;
  player.currentKingdom = kingdom;
  logEvent(game, `${player.name}'s board marker was set to ${kingdom}.`);
  touch(game);
}

export function resolveMove(game) {
  assertReadyForLocation(game);
  const event = pick(game, RULE_PROFILE.moveEvents);
  switch (event) {
    case "safe":
      setDisplay(game, "◇", "SAFE MOVE", "0", "No event occurs. Press NO / END when ready.");
      logEvent(game, `${currentPlayer(game).name} moved safely.`);
      return { type: "safe" };
    case "battle":
      return startBattle(game, { source: "wilderness", rewardEligible: true });
    case "dragon":
      return resolveDragon(game);
    case "lost":
      return resolveLost(game);
    case "plague":
      return resolvePlague(game);
    default:
      throw new Error(`Unhandled move event: ${event}`);
  }
}

export function resolveTombRuin(game) {
  assertReadyForLocation(game);
  markHomeServiceVisit(game);
  const event = pick(game, RULE_PROFILE.tombRuinEvents);
  if (event === "empty") {
    setDisplay(game, "⌂", "DESERTED", "0", "The old chamber is empty. Your turn is over.");
    logEvent(game, `${currentPlayer(game).name} found a deserted Tomb or Ruin.`);
    return { type: "empty" };
  }
  if (event === "battle") {
    return startBattle(game, { source: "tombRuin", rewardEligible: true });
  }
  return awardTreasure(game, { guaranteed: true, source: "tombRuin" });
}

export function resolveSanctuaryOrCitadel(game, locationType) {
  assertReadyForLocation(game);
  const player = currentPlayer(game);
  if (locationType === "citadel") {
    if (player.currentKingdom !== player.homeKingdom) {
      setDisplay(game, "✕", "ILLEGAL CITADEL", "-1", "You may not enter a foreign Citadel. Press CLEAR to forfeit the turn.");
      game.pending = { type: "illegalMove" };
      logEvent(game, `${player.name} attempted to enter a foreign Citadel.`);
      return { type: "illegal" };
    }
    const readyForSiege = keyCount(player) === 3 && player.frontiersCrossed >= 4;
    if (readyForSiege && player.citadelDoubleReady && player.warriors >= 5 && player.warriors <= 24) {
      const before = player.warriors;
      player.warriors = Math.min(MAX_RESOURCE, player.warriors * 2);
      player.citadelDoubleReady = false;
      setDisplay(game, "♜", "CITADEL", String(player.warriors), `${before} warriors were reinforced to ${player.warriors}.`);
      logEvent(game, `${player.name}'s home Citadel doubled the army from ${before} to ${player.warriors}.`);
      touch(game);
      return { type: "citadelDouble", before, after: player.warriors };
    }
  }
  return resolveSanctuaryAid(game, locationType);
}

function resolveSanctuaryAid(game, source) {
  const player = currentPlayer(game);
  const s = RULE_PROFILE.sanctuary;
  let result = { type: "none" };
  if (player.warriors <= s.warriorThreshold) {
    const amount = randomInt(game, s.warriorGift.min, s.warriorGift.max);
    player.warriors = Math.min(MAX_RESOURCE, player.warriors + amount);
    result = { type: "warriors", amount };
  } else if (player.gold <= s.goldThreshold) {
    const amount = randomInt(game, s.goldGift.min, s.goldGift.max);
    player.gold = Math.min(goldCapacity(player), player.gold + amount);
    result = { type: "gold", amount };
  } else if (player.food <= s.foodThreshold) {
    const amount = randomInt(game, s.foodGift.min, s.foodGift.max);
    player.food = Math.min(MAX_RESOURCE, player.food + amount);
    result = { type: "food", amount };
  }

  if (result.type === "none") {
    setDisplay(game, "♜", source === "citadel" ? "CITADEL" : "SANCTUARY", "0", "You do not qualify for aid.");
    logEvent(game, `${player.name} visited a ${source} but did not qualify for aid.`);
  } else {
    setDisplay(game, "♜", source === "citadel" ? "CITADEL AID" : "SANCTUARY AID", `+${result.amount}`, `Receive ${result.amount} ${result.type}.`);
    logEvent(game, `${player.name} received ${result.amount} ${result.type} from the ${source}.`);
  }
  touch(game);
  return result;
}

export function resolveFrontier(game, destinationKingdom) {
  assertReadyForLocation(game);
  if (!KINGDOMS.includes(destinationKingdom)) {
    throw new RangeError(`Unknown destination kingdom: ${destinationKingdom}`);
  }
  const player = currentPlayer(game);
  const leaving = player.currentKingdom;
  const expectedDestination = nextKingdom(leaving);
  if (destinationKingdom !== expectedDestination) {
    setDisplay(game, "✕", "WRONG DIRECTION", "-1", `Frontier travel proceeds counterclockwise from ${leaving} to ${expectedDestination}.`);
    game.pending = { type: "illegalMove" };
    logEvent(game, `${player.name} attempted to cross from ${leaving} to ${destinationKingdom} instead of ${expectedDestination}.`);
    touch(game);
    return { type: "wrongDirection", expectedDestination };
  }
  if (leaving !== player.homeKingdom && !player.keysByKingdom[leaving]) {
    setDisplay(game, "⚿", "KEY MISSING", "-1", `You cannot leave ${leaving} until its key is found.`);
    logEvent(game, `${player.name} was turned back at the ${leaving} frontier because its key was missing.`);
    return { type: "blocked", kingdom: leaving };
  }
  player.previousKingdom = leaving;
  player.currentKingdom = destinationKingdom;
  player.frontiersCrossed = Math.min(4, player.frontiersCrossed + 1);
  setDisplay(game, "⚑", "FRONTIER", "0", `${player.name} crosses from ${leaving} into ${destinationKingdom}.`);
  logEvent(game, `${player.name} crossed the frontier from ${leaving} to ${destinationKingdom}.`);
  touch(game);
  return { type: "crossed", from: leaving, to: destinationKingdom };
}

export function usePegasus(game, destinationKingdom) {
  assertPlaying(game);
  const player = currentPlayer(game);
  if (!player.pegasus) return { type: "unavailable" };
  if (!KINGDOMS.includes(destinationKingdom)) throw new RangeError("Unknown destination kingdom.");
  if (destinationKingdom !== player.currentKingdom && player.currentKingdom !== player.homeKingdom && !player.keysByKingdom[player.currentKingdom]) {
    player.pegasus = false;
    setDisplay(game, "⚿", "KEY MISSING", "-1", "The Pegasus is lost, and you remain in the foreign kingdom.");
    logEvent(game, `${player.name} lost a Pegasus while attempting to leave without the kingdom's key.`);
    touch(game);
    return { type: "blockedAndLost" };
  }
  const from = player.currentKingdom;
  player.pegasus = false;
  player.previousKingdom = from;
  player.currentKingdom = destinationKingdom;
  if (from !== destinationKingdom) player.frontiersCrossed = Math.min(4, player.frontiersCrossed + 1);
  setDisplay(game, "♞", "PEGASUS", "0", `Fly from ${from} to any legal space in ${destinationKingdom}.`);
  logEvent(game, `${player.name} used a Pegasus to travel to ${destinationKingdom}.`);
  touch(game);
  return { type: "used", from, to: destinationKingdom };
}

export function startBazaar(game) {
  assertReadyForLocation(game);
  markHomeServiceVisit(game);
  const player = currentPlayer(game);
  const offers = [
    { key: "warriors", label: "Warriors", unitPrice: randomInt(game, RULE_PROFILE.warriorPrice.min, RULE_PROFILE.warriorPrice.max), max: 99 },
    { key: "food", label: "Food", unitPrice: RULE_PROFILE.foodPrice, max: 99 },
  ];
  if (!player.beast) offers.push({ key: "beast", label: "Beast", unitPrice: randomInt(game, RULE_PROFILE.specialPrice.min, RULE_PROFILE.specialPrice.max), max: 1 });
  if (!player.scout) offers.push({ key: "scout", label: "Scout", unitPrice: randomInt(game, RULE_PROFILE.specialPrice.min, RULE_PROFILE.specialPrice.max), max: 1 });
  if (!player.healer) offers.push({ key: "healer", label: "Healer", unitPrice: randomInt(game, RULE_PROFILE.specialPrice.min, RULE_PROFILE.specialPrice.max), max: 1 });
  game.pending = { type: "bazaar", offers, index: 0, price: offers[0].unitPrice, haggleCount: 0 };
  updateBazaarDisplay(game);
  logEvent(game, `${player.name} entered a Bazaar.`);
  touch(game);
  return game.pending;
}

export function bazaarNextOffer(game) {
  requirePending(game, "bazaar");
  game.pending.index += 1;
  if (game.pending.index >= game.pending.offers.length) {
    game.pending = null;
    setDisplay(game, "⚖", "BAZAAR ENDS", "0", "No more wares are offered. Press NO / END.");
    logEvent(game, `${currentPlayer(game).name} finished browsing the Bazaar.`);
    return { type: "end" };
  }
  game.pending.price = game.pending.offers[game.pending.index].unitPrice;
  game.pending.haggleCount = 0;
  updateBazaarDisplay(game);
  touch(game);
  return { type: "next", offer: currentBazaarOffer(game) };
}

export function bazaarHaggle(game) {
  requirePending(game, "bazaar");
  const offer = currentBazaarOffer(game);
  if (offer.key === "food") {
    setDisplay(game, "⚖", "NO HAGGLING", String(game.pending.price), "Food always costs one gold per ration.");
    return { type: "notAllowed" };
  }
  game.pending.haggleCount = (game.pending.haggleCount || 0) + 1;
  const outcome = pick(game, RULE_PROFILE.haggleOutcomes);
  if (outcome === "lower") {
    game.pending.price = Math.max(1, game.pending.price - 1);
    setDisplay(game, "⚖", "HAGGLE SUCCESS", String(game.pending.price), `${offer.label} now cost ${game.pending.price} gold each.`);
    logEvent(game, `${currentPlayer(game).name} lowered the ${offer.label} price to ${game.pending.price}.`);
    touch(game);
    return { type: "success", price: game.pending.price };
  }
  if (outcome === "unchanged") {
    setDisplay(game, "⚖", "PRICE UNCHANGED", String(game.pending.price), `The merchant holds at ${game.pending.price} gold. Buy, haggle again, or view the next item.`);
    logEvent(game, `${currentPlayer(game).name}'s haggle did not change the ${offer.label} price.`);
    touch(game);
    return { type: "unchanged", price: game.pending.price };
  }
  game.pending = null;
  setDisplay(game, "✕", "BAZAAR CLOSED", "0", "The merchant is angered. Your shopping turn is over.");
  logEvent(game, `${currentPlayer(game).name} angered the merchant; the Bazaar closed.`);
  touch(game);
  return { type: "closed" };
}

export function bazaarBuy(game, quantity = 1) {
  requirePending(game, "bazaar");
  const player = currentPlayer(game);
  const offer = currentBazaarOffer(game);
  const qty = offer.max === 1 ? 1 : Math.max(1, Math.floor(Number(quantity) || 1));
  const cost = qty * game.pending.price;
  if (cost > player.gold) {
    game.pending = null;
    setDisplay(game, "✕", "BAZAAR CLOSED", "0", "You attempted to buy more than you can afford.");
    logEvent(game, `${player.name} could not afford the Bazaar purchase; the merchant closed shop.`);
    touch(game);
    return { type: "closedInsufficientGold", cost };
  }

  player.gold -= cost;
  if (offer.key === "warriors") player.warriors = Math.min(MAX_RESOURCE, player.warriors + qty);
  else if (offer.key === "food") player.food = Math.min(MAX_RESOURCE, player.food + qty);
  else player[offer.key] = true;
  enforceGoldCapacity(game, player);

  game.pending = null;
  setDisplay(game, "✓", "PURCHASED", String(cost), `${qty} ${offer.label}${qty === 1 ? "" : " units"} purchased for ${cost} gold.`);
  logEvent(game, `${player.name} bought ${qty} ${offer.label} for ${cost} gold.`);
  touch(game);
  return { type: "purchased", offer, quantity: qty, cost };
}

export function currentBazaarOffer(game) {
  requirePending(game, "bazaar");
  return game.pending.offers[game.pending.index];
}

function updateBazaarDisplay(game) {
  const offer = currentBazaarOffer(game);
  setDisplay(game, "⚖", offer.label.toUpperCase(), String(game.pending.price), "YES / BUY purchases; NO / END shows the next item; HAGGLE tries to lower the price.");
}

export function startBattle(game, { source = "wilderness", rewardEligible = true, final = false, enemyCount = null } = {}) {
  assertReadyForLocation(game);
  const player = currentPlayer(game);
  const maxEnemy = Math.max(3, Math.min(99, Math.round(player.warriors * 1.4) + 4));
  const minEnemy = Math.max(1, Math.min(maxEnemy, Math.round(player.warriors * 0.35)));
  const brigands = enemyCount ?? randomInt(game, minEnemy, maxEnemy);
  game.pending = {
    type: "battle",
    source,
    final,
    rewardEligible,
    brigands,
    initialBrigands: brigands,
    rounds: 0,
  };
  setDisplay(game, "⚔", final ? "TOWER DEFENDERS" : "BRIGANDS", String(brigands), `You have ${player.warriors} warriors. YES / BUY fights one round; NO / END retreats.`);
  logEvent(game, `${player.name} encountered ${brigands} ${final ? "Tower defenders" : "brigands"}.`);
  touch(game);
  return { type: "battle", brigands };
}

export function battleRound(game) {
  requirePending(game, "battle");
  const player = currentPlayer(game);
  const battle = game.pending;
  battle.rounds += 1;

  if (randomFloat(game) < RULE_PROFILE.battleRoundPlayerWinChance) {
    const before = battle.brigands;
    battle.brigands = Math.floor(battle.brigands / 2);
    const defeated = before - battle.brigands;
    logEvent(game, `${player.name} won battle round ${battle.rounds}; ${defeated} brigands fell.`);
    if (battle.brigands <= 0) return finishBattleVictory(game);
    setDisplay(game, "⚔", "BRIGANDS", String(battle.brigands), `${player.warriors} warriors remain. Continue or retreat.`);
    touch(game);
    return { type: "roundWon", brigands: battle.brigands, warriors: player.warriors };
  }

  applyWarriorLoss(game, player, 1, "battle");
  logEvent(game, `${player.name} lost battle round ${battle.rounds}; one warrior fell.`);
  if (player.defeated) return finishBattleDefeat(game);
  setDisplay(game, "⚔", "WARRIORS", String(player.warriors), `${battle.brigands} brigands remain. Continue or retreat.`);
  touch(game);
  return { type: "roundLost", brigands: battle.brigands, warriors: player.warriors };
}

export function retreatBattle(game) {
  requirePending(game, "battle");
  const battle = game.pending;
  const player = currentPlayer(game);
  if (player.warriors <= 1) {
    setDisplay(game, "⚔", "NO RETREAT", String(player.warriors), "With only one warrior remaining, the battle must continue.");
    logEvent(game, `${player.name} could not retreat with only one warrior remaining.`);
    touch(game);
    return { type: "retreatUnavailable", warriors: player.warriors };
  }
  applyWarriorLoss(game, player, 1, "retreat");
  if (battle.final) game.towerDefenders = battle.brigands;
  game.pending = null;
  setDisplay(game, "↶", "RETREAT", String(player.warriors), "Lose one additional warrior. The battle ends.");
  logEvent(game, `${player.name} retreated from battle and lost one additional warrior.`);
  touch(game);
  return { type: "retreated", warriors: player.warriors };
}

function finishBattleVictory(game) {
  const battle = game.pending;
  const player = currentPlayer(game);
  game.pending = null;
  if (battle.final) {
    game.towerDefenders = 0;
    game.status = "won";
    game.winnerPlayerId = player.id;
    setDisplay(game, "★", "VICTORY", "00", `${player.name} has recovered the Ancient Scepter and won the game!`);
    logEvent(game, `${player.name} conquered the Dark Tower.`);
    touch(game);
    return { type: "gameWon", playerId: player.id };
  }

  setDisplay(game, "⚔", "VICTORY", String(player.warriors), `${player.warriors} warriors remain.`);
  logEvent(game, `${player.name} defeated ${battle.initialBrigands} brigands.`);
  if (battle.rewardEligible) return awardTreasure(game, { guaranteed: false, source: battle.source });
  touch(game);
  return { type: "victory" };
}

function finishBattleDefeat(game) {
  const battle = game.pending;
  const player = currentPlayer(game);
  if (battle.final) game.towerDefenders = battle.brigands;
  game.pending = null;
  if (game.players.length === 1 && player.defeated) {
    game.status = "lost";
    setDisplay(game, "☠", "DEFEAT", "0", "Your final warrior has fallen. The quest is lost.");
    logEvent(game, `${player.name}'s last warrior fell; the single-player game ended.`);
    touch(game);
    return { type: "gameLost" };
  }
  setDisplay(game, "☠", "DEFEAT", String(player.warriors), "The brigands prevail. Your turn ends.");
  logEvent(game, `${player.name} was defeated in battle.`);
  touch(game);
  return { type: "defeat", warriors: player.warriors };
}

export function awardTreasure(game, { guaranteed = false, source = "battle" } = {}) {
  assertPlaying(game);
  const player = currentPlayer(game);
  let reward = pick(game, RULE_PROFILE.battleRewards);
  if (guaranteed && reward === "none") reward = "gold";

  if (reward === "key" && !canReceiveKey(player)) reward = "gold";
  if (reward === "pegasus" && player.pegasus) reward = guaranteed ? "gold" : "none";
  if (reward === "sword" && player.sword) reward = guaranteed ? "gold" : "none";

  switch (reward) {
    case "gold": {
      const amount = randomInt(game, 5, 20);
      const before = player.gold;
      player.gold = Math.min(goldCapacity(player), MAX_RESOURCE, player.gold + amount);
      const gained = player.gold - before;
      setDisplay(game, "◈", "GOLD", String(player.gold), `Gain ${gained} gold; total gold is ${player.gold}.`);
      logEvent(game, `${player.name} gained ${gained} gold from ${source}.`);
      touch(game);
      return { type: "gold", amount: gained };
    }
    case "key": {
      const key = KEY_NAMES[keyCount(player)];
      player.keys[key] = true;
      player.keysByKingdom[player.currentKingdom] = key;
      setDisplay(game, "⚿", `${key.toUpperCase()} KEY`, String(keyCount(player)), `The key of ${player.currentKingdom} has been found.`);
      logEvent(game, `${player.name} found the ${key} key in ${player.currentKingdom}.`);
      touch(game);
      return { type: "key", key, kingdom: player.currentKingdom };
    }
    case "pegasus":
      player.pegasus = true;
      setDisplay(game, "♞", "PEGASUS", "1", "A Pegasus may carry you to any legal territory and is then surrendered.");
      logEvent(game, `${player.name} gained a Pegasus.`);
      touch(game);
      return { type: "pegasus" };
    case "sword":
      player.sword = true;
      setDisplay(game, "†", "DRAGONSWORD", "1", "The Dragonsword will turn the next Dragon attack into victory.");
      logEvent(game, `${player.name} gained the Dragonsword.`);
      touch(game);
      return { type: "sword" };
    case "wizard":
      game.pending = { type: "wizard" };
      setDisplay(game, "✦", "WIZARD", "C", "Choose another player to curse immediately.");
      logEvent(game, `${player.name} gained the immediate service of a Wizard.`);
      touch(game);
      return { type: "wizard" };
    case "none":
    default:
      setDisplay(game, "◇", "NO TREASURE", "0", "The defeated brigands leave nothing of value.");
      logEvent(game, `${player.name} received no treasure after victory.`);
      touch(game);
      return { type: "none" };
  }
}

function canReceiveKey(player) {
  return player.currentKingdom !== player.homeKingdom && !player.keysByKingdom[player.currentKingdom] && keyCount(player) < 3;
}

export function resolveWizard(game, targetPlayerId) {
  requirePending(game, "wizard");
  const caster = currentPlayer(game);
  const target = playerById(game, targetPlayerId);
  if (!target || target.id === caster.id) throw new RangeError("Choose another player.");
  const warriors = Math.floor(target.warriors / 4);
  const gold = Math.floor(target.gold / 4);
  applyWarriorLoss(game, target, warriors, "curse");
  target.gold = Math.max(0, target.gold - gold);
  caster.warriors = Math.min(MAX_RESOURCE, caster.warriors + warriors);
  caster.gold = Math.min(goldCapacity(caster), caster.gold + gold);
  target.skipTurns += 1;
  game.pending = null;
  setDisplay(game, "✦", "CURSE", String(target.id), `${caster.name} takes ${warriors} warriors and ${gold} gold from ${target.name}.`);
  logEvent(game, `${caster.name} cursed ${target.name}, taking ${warriors} warriors and ${gold} gold; ${target.name} will lose a turn.`);
  touch(game);
  return { type: "cursed", targetPlayerId: target.id, warriors, gold };
}

function resolveLost(game) {
  const player = currentPlayer(game);
  if (player.scout) {
    player.extraTurn = true;
    setDisplay(game, "🧭", "SCOUT", "+1", "Your Scout prevents the loss and grants an immediate extra turn after this one.");
    logEvent(game, `${player.name}'s Scout prevented Lost and earned an extra turn.`);
    touch(game);
    return { type: "scout" };
  }
  player.skipTurns += 1;
  setDisplay(game, "↶", "LOST", "-1", "Return to the previous territory and lose your next turn.");
  logEvent(game, `${player.name} became lost and will lose the next turn.`);
  touch(game);
  return { type: "lost" };
}

function resolvePlague(game) {
  const player = currentPlayer(game);
  if (player.healer) {
    player.warriors = Math.min(MAX_RESOURCE, player.warriors + 2);
    setDisplay(game, "✚", "HEALER", "+2", "The Healer prevents Plague and adds two warriors.");
    logEvent(game, `${player.name}'s Healer added two warriors.`);
    touch(game);
    return { type: "healer" };
  }
  applyWarriorLoss(game, player, 2, "plague");
  setDisplay(game, "☠", "PLAGUE", "-2", "Plague kills two warriors.");
  logEvent(game, `${player.name} lost two warriors to Plague.`);
  touch(game);
  return { type: "plague" };
}

function resolveDragon(game) {
  const player = currentPlayer(game);
  if (player.sword) {
    const gold = game.dragonHoard.gold;
    const warriors = game.dragonHoard.warriors;
    player.gold = Math.min(goldCapacity(player), player.gold + gold);
    player.warriors = Math.min(MAX_RESOURCE, player.warriors + warriors);
    game.dragonHoard = { warriors: 0, gold: 0 };
    setDisplay(game, "🐉", "DRAGON DRIVEN OFF", String(gold), `Recover ${warriors} warriors and ${gold} gold from the Dragon's hoard.`);
    logEvent(game, `${player.name} used the Dragonsword and recovered ${warriors} warriors and ${gold} gold.`);
    touch(game);
    return { type: "dragonSlain", warriors, gold };
  }
  const warriors = Math.floor(player.warriors / 4);
  const gold = Math.floor(player.gold / 4);
  applyWarriorLoss(game, player, warriors, "dragon");
  player.gold = Math.max(0, player.gold - gold);
  game.dragonHoard.warriors += warriors;
  game.dragonHoard.gold += gold;
  setDisplay(game, "🐉", "DRAGON ATTACK", `-${warriors}`, `Lose ${warriors} warriors and ${gold} gold. Place the Dragon pawn on this territory.`);
  logEvent(game, `${player.name} lost ${warriors} warriors and ${gold} gold to the Dragon.`);
  touch(game);
  return { type: "dragon", warriors, gold };
}

export function beginDarkTower(game) {
  assertReadyForLocation(game);
  markHomeServiceVisit(game);
  const player = currentPlayer(game);
  if (keyCount(player) < 3 || player.currentKingdom !== player.homeKingdom || player.frontiersCrossed < 4) {
    setDisplay(game, "⚿", "TOWER SEALED", "-1", "You need all three keys, four frontier crossings, and a return to your home kingdom.");
    logEvent(game, `${player.name} approached the Tower before all entry requirements were met.`);
    return { type: "blocked" };
  }
  game.pending = { type: "riddle", step: 0, remaining: [...KEY_NAMES] };
  setDisplay(game, "⚿", "RIDDLE OF THE KEYS", "1", "Choose which key is first in the hidden sequence.");
  logEvent(game, `${player.name} began the Riddle of the Keys.`);
  touch(game);
  return { type: "riddle" };
}

export function guessRiddleKey(game, key) {
  requirePending(game, "riddle");
  if (!game.pending.remaining.includes(key)) throw new RangeError("That key is not available.");
  const expected = game.keyOrder[game.pending.step];
  if (key !== expected) {
    const failedPosition = game.pending.step + 1;
    game.pending = null;
    setDisplay(game, "✕", "WRONG KEY", "-1", "The sequence is rejected. Try again on a later turn.");
    logEvent(game, `${currentPlayer(game).name} failed the Riddle of the Keys at position ${failedPosition}.`);
    touch(game);
    return { type: "wrong" };
  }
  game.pending.remaining = game.pending.remaining.filter((candidate) => candidate !== key);
  game.pending.step += 1;
  if (game.pending.step >= 2) {
    game.pending = null;
    logEvent(game, `${currentPlayer(game).name} solved the Riddle of the Keys.`);
    return startBattle(game, {
      source: "darkTower",
      rewardEligible: false,
      final: true,
      enemyCount: game.towerDefenders,
    });
  }
  setDisplay(game, "⚿", "RIDDLE OF THE KEYS", String(game.pending.step + 1), "The first key is correct. Choose the second key.");
  logEvent(game, `${currentPlayer(game).name} correctly placed the ${key} key.`);
  touch(game);
  return { type: "correct", step: game.pending.step };
}

export function showInventory(game) {
  assertReadyForLocation(game);
  const player = currentPlayer(game);
  const items = Object.entries(ITEM_LABELS)
    .filter(([key]) => player[key])
    .map(([, label]) => label);
  setDisplay(
    game,
    "☷",
    "INVENTORY",
    String(player.gold),
    `${player.warriors} warriors; ${player.gold} gold; ${player.food} food; keys ${keyCount(player)}/3; ${items.join(", ") || "no special items"}. Inventory uses the turn.`,
  );
  logEvent(game, `${player.name} reviewed inventory.`);
  touch(game);
  return inventorySnapshot(player);
}

export function inventorySnapshot(player) {
  return {
    warriors: player.warriors,
    gold: player.gold,
    food: player.food,
    keys: { ...player.keys },
    items: Object.fromEntries(Object.keys(ITEM_LABELS).map((key) => [key, Boolean(player[key])])),
  };
}

export function repeatDisplay(game) {
  if (game.previousDisplay) game.display = { ...game.previousDisplay };
  touch(game);
  return game.display;
}

export function clearIllegalMove(game) {
  requirePending(game, "illegalMove");
  game.pending = null;
  setDisplay(game, "◆", "MOVE CLEARED", "-1", "The illegal move is canceled and the turn is forfeited.");
  logEvent(game, `${currentPlayer(game).name}'s illegal move was cleared.`);
  touch(game);
  return { type: "cleared" };
}

export function endTurn(game) {
  assertPlaying(game);
  if (["battle", "bazaar", "wizard", "riddle", "illegalMove"].includes(game.pending?.type)) {
    throw new Error(`Resolve the pending ${game.pending.type} action before ending the turn.`);
  }

  const outgoing = currentPlayer(game);
  consumeFood(game, outgoing);
  if (game.status !== "playing") return { type: "gameOver" };

  if (outgoing.extraTurn) {
    outgoing.extraTurn = false;
    game.turn += 1;
    setDisplay(game, "🧭", "EXTRA TURN", String(outgoing.id), `${outgoing.name} takes the Scout's extra turn.`);
    logEvent(game, `${outgoing.name} begins an extra turn.`);
    touch(game);
    return { type: "extraTurn", playerId: outgoing.id };
  }

  let safety = 0;
  do {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    if (game.currentPlayerIndex === 0) game.turn += 1;
    const incoming = currentPlayer(game);
    if (incoming.skipTurns > 0) {
      incoming.skipTurns -= 1;
      logEvent(game, `${incoming.name}'s turn was skipped.`);
      safety += 1;
      continue;
    }
    setDisplay(game, "◆", "NEXT ADVENTURER", String(incoming.id), `${incoming.name}, move one territory or remain in place.`);
    touch(game);
    return { type: "nextPlayer", playerId: incoming.id };
  } while (safety < game.players.length * 4);

  throw new Error("Unable to advance to an eligible player.");
}

function consumeFood(game, player) {
  const cost = foodCost(player.warriors);
  if (player.food >= cost) {
    player.food -= cost;
    logEvent(game, `${player.name}'s force consumed ${cost} food.`);
  } else {
    player.food = 0;
    applyWarriorLoss(game, player, 1, "starvation");
    logEvent(game, `${player.name} lacked enough food and lost one warrior to starvation.`);
  }
  enforceGoldCapacity(game, player);
}

export function adjustResource(game, resource, delta) {
  assertPlaying(game);
  const player = currentPlayer(game);
  if (!["warriors", "gold", "food"].includes(resource)) throw new RangeError("Unknown resource.");
  const before = player[resource];
  player[resource] = Math.max(resource === "warriors" && game.players.length > 1 ? 1 : 0, Math.min(MAX_RESOURCE, before + Number(delta)));
  if (resource === "warriors") enforceGoldCapacity(game, player);
  logEvent(game, `${player.name}'s ${resource} was manually adjusted from ${before} to ${player[resource]}.`);
  touch(game);
  return player[resource];
}

export function toggleItem(game, item) {
  assertPlaying(game);
  if (!Object.hasOwn(ITEM_LABELS, item)) throw new RangeError("Unknown item.");
  const player = currentPlayer(game);
  player[item] = !player[item];
  if (item === "beast") enforceGoldCapacity(game, player);
  logEvent(game, `${ITEM_LABELS[item]} was manually ${player[item] ? "added to" : "removed from"} ${player.name}'s inventory.`);
  touch(game);
  return player[item];
}

export function setKey(game, key, owned) {
  assertPlaying(game);
  if (!KEY_NAMES.includes(key)) throw new RangeError("Unknown key.");
  const player = currentPlayer(game);
  player.keys[key] = Boolean(owned);
  logEvent(game, `${player.name}'s ${key} key was manually set to ${Boolean(owned) ? "owned" : "not owned"}.`);
  touch(game);
  return player.keys[key];
}

export function exportGame(game) {
  touch(game);
  return JSON.stringify(game, null, 2);
}

export function importGame(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : structuredClone(raw);
  validateGame(parsed);
  parsed.updatedAt = new Date().toISOString();
  return parsed;
}

export function validateGame(game) {
  if (!game || typeof game !== "object") throw new TypeError("Save file is not an object.");
  if (game.schemaVersion !== 2) throw new Error(`Unsupported save schema: ${game.schemaVersion}`);
  if (!Array.isArray(game.players) || game.players.length < 1 || game.players.length > 4) throw new Error("Save file has an invalid player list.");
  if (!Number.isInteger(game.currentPlayerIndex) || !game.players[game.currentPlayerIndex]) throw new Error("Save file has an invalid current player.");
  return true;
}

function applyWarriorLoss(game, player, amount, source) {
  const loss = Math.max(0, Math.floor(Number(amount) || 0));
  if (loss === 0) return 0;
  const minimum = game.players.length > 1 ? 1 : 0;
  const before = player.warriors;
  player.warriors = Math.max(minimum, player.warriors - loss);
  const actual = before - player.warriors;
  if (game.players.length === 1 && player.warriors <= 0) player.defeated = true;
  enforceGoldCapacity(game, player);
  return actual;
}

function enforceGoldCapacity(game, player) {
  const capacity = goldCapacity(player);
  if (player.gold > capacity) {
    const abandoned = player.gold - capacity;
    player.gold = capacity;
    logEvent(game, `${player.name} abandoned ${abandoned} excess gold because the party could not carry it.`);
  }
}

function markHomeServiceVisit(game) {
  const player = currentPlayer(game);
  if (player.currentKingdom === player.homeKingdom) player.citadelDoubleReady = true;
}

function setDisplay(game, icon, title, number, text) {
  game.previousDisplay = game.display ? { ...game.display } : null;
  game.display = { icon, title, number: String(number), text };
  touch(game);
}

function logEvent(game, text) {
  game.log.push({
    at: new Date().toISOString(),
    turn: game.turn,
    playerId: currentPlayer(game)?.id ?? null,
    text,
  });
  if (game.log.length > 300) game.log.splice(0, game.log.length - 300);
  touch(game);
}

function randomFloat(game) {
  let x = game.rngState >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  game.rngState = x >>> 0 || 0x6d2b79f5;
  return game.rngState / 4294967296;
}

function randomInt(game, min, max) {
  return Math.floor(randomFloat(game) * (max - min + 1)) + min;
}

function pick(game, array) {
  return array[randomInt(game, 0, array.length - 1)];
}

function shuffle(game, values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(game, 0, index);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function normalizeSeed(seed) {
  const numeric = Number(seed);
  if (Number.isFinite(numeric)) return (Math.floor(numeric) >>> 0) || 0x6d2b79f5;
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 0x6d2b79f5;
}

function touch(game) {
  game.updatedAt = new Date().toISOString();
}

function assertPlaying(game) {
  if (!game || game.status !== "playing") throw new Error("The game is not currently active.");
}

function assertReadyForLocation(game) {
  assertPlaying(game);
  if (game.pending) throw new Error(`Resolve the pending ${game.pending.type} action first.`);
}

function requirePending(game, type) {
  assertPlaying(game);
  if (game.pending?.type !== type) throw new Error(`Expected a pending ${type} action.`);
}
