export const APP_VERSION = "0.5.0";

export const KINGDOMS = ["Arisilon", "Brynthia", "Durnin", "Zenon"];
export const KEY_NAMES = ["brass", "silver", "gold"];

export const ITEM_LABELS = {
  scout: "Scout",
  healer: "Healer",
  beast: "Beast",
  sword: "Dragonsword",
  pegasus: "Pegasus",
};

export const RULE_PROFILE = {
  id: "classic-research-v1",
  label: "Classic research profile (provisional)",

  // The manual establishes the event types but not every exact firmware weight.
  // These 16-slot tables are deliberately isolated so research can update them
  // without rewriting the engine.
  moveEvents: [
    ...Array(7).fill("battle"),
    ...Array(6).fill("safe"),
    "dragon",
    "lost",
    "plague",
  ],

  // Community reverse-engineering reports a 43.75% free-treasure result in
  // Tomb/Ruin resolution. Seven of sixteen slots reproduces 43.75%.
  tombRuinEvents: [
    ...Array(7).fill("treasure"),
    ...Array(7).fill("battle"),
    ...Array(2).fill("empty"),
  ],

  // Contemporary descriptions say battle odds favor the player. Exact firmware
  // probability remains a research item, so this is configurable.
  battleRoundPlayerWinChance: 0.625,

  // Weighted reward table after a non-final victory. Invalid rewards (for
  // example, a key in the home kingdom) fall back to gold or no reward.
  battleRewards: [
    ...Array(7).fill("gold"),
    ...Array(2).fill("key"),
    ...Array(2).fill("pegasus"),
    ...Array(2).fill("sword"),
    "wizard",
    ...Array(2).fill("none"),
  ],

  warriorPrice: { min: 4, max: 10 },
  specialPrice: { min: 15, max: 20 },
  foodPrice: 1,
  // The manual describes an approximately 50/50 chance of lowering the price,
  // while also allowing an unchanged price and a merchant-closure result.
  // This transparent 16-slot working table is provisional pending firmware verification.
  haggleOutcomes: [
    ...Array(8).fill("lower"),
    ...Array(6).fill("unchanged"),
    ...Array(2).fill("closed"),
  ],

  sanctuary: {
    warriorThreshold: 4,
    goldThreshold: 7,
    foodThreshold: 5,
    warriorGift: { min: 1, max: 4 },
    goldGift: { min: 2, max: 8 },
    foodGift: { min: 3, max: 9 },
  },
};

export function nextKingdom(kingdom) {
  const index = KINGDOMS.indexOf(kingdom);
  if (index < 0) throw new RangeError(`Unknown kingdom: ${kingdom}`);
  return KINGDOMS[(index + 1) % KINGDOMS.length];
}

export function towerDefenderRange(level) {
  switch (Number(level)) {
    case 1:
      return [17, 32];
    case 2:
      return [33, 64];
    case 3:
      return [17, 64];
    case 4:
      return [16, 16];
    default:
      throw new RangeError(`Unsupported game level: ${level}`);
  }
}
