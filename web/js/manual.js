export const MANUAL_SECTIONS = [
  {
    id: "quick-start",
    title: "Quick Start",
    keywords: ["start", "begin", "first game", "summary", "turn"],
    html: `
      <p class="manual-lead">This rules reference is an original, paraphrased companion to the surviving instruction booklet. It is designed for quick consultation during play and does not reproduce manual scans or original artwork.</p>
      <ol>
        <li>Each player begins in the Citadel of the matching home kingdom with <strong>10 warriors, 30 gold, and 25 food</strong>.</li>
        <li>On a turn, move the pawn one adjacent territory, or remain where it is to use the location again.</li>
        <li>Press the tower button matching the territory entered: MOVE, BAZAAR, TOMB/RUIN, SANCTUARY/CITADEL, FRONTIER, or DARK TOWER.</li>
        <li>Resolve the tower response. Press NO/END when the action is complete.</li>
        <li>At the end of every turn, the army consumes food according to its size.</li>
      </ol>
      <div class="manual-callout"><strong>Goal:</strong> find one key in each of the three foreign kingdoms, return home after crossing all four frontiers, solve the Riddle of the Keys, and defeat the force inside the Dark Tower.</div>
    `,
  },
  {
    id: "setup",
    title: "Setup and Game Levels",
    keywords: ["setup", "players", "level", "starting", "resources", "tower defenders"],
    html: `
      <h3>Player setup</h3>
      <p>One to four players may play. Each player selects a home kingdom and begins in its Citadel. Give each player 10 warriors, 30 bags of gold, and 25 food rations.</p>
      <h3>Levels</h3>
      <table class="manual-table"><thead><tr><th>Level</th><th>Final Tower force</th><th>Notes</th></tr></thead><tbody>
        <tr><td>1</td><td>17–32 defenders</td><td>Standard introductory game.</td></tr>
        <tr><td>2</td><td>33–64 defenders</td><td>Stronger final defense.</td></tr>
        <tr><td>3</td><td>17–64 defenders</td><td>Widest possible range.</td></tr>
        <tr><td>4</td><td>16 defenders</td><td>Solo teaching scenario that begins near the endgame.</td></tr>
      </tbody></table>
      <p>The app chooses the hidden Tower force when the game begins. Enhanced mode may display it for testing; classic play keeps it hidden.</p>
    `,
  },
  {
    id: "objective",
    title: "Objective and Route",
    keywords: ["objective", "win", "keys", "route", "counterclockwise", "foreign kingdoms"],
    html: `
      <p>The Ancient Scepter is guarded inside the Dark Tower. To reach it, travel counterclockwise through the three foreign kingdoms and find one key in each.</p>
      <ul>
        <li>The first foreign key found is Brass, the second is Silver, and the third is Gold.</li>
        <li>A key is never found in the player's home kingdom.</li>
        <li>A player cannot leave a foreign kingdom until that kingdom's key has been found.</li>
        <li>After crossing the fourth frontier and returning home, the player may approach the Dark Tower.</li>
      </ul>
    `,
  },
  {
    id: "turn-sequence",
    title: "Turn Sequence",
    keywords: ["turn", "sequence", "move", "food", "end"],
    html: `
      <ol id="rule-turn-sequence" class="manual-rule-anchor" tabindex="-1">
        <li><strong>Move or stay:</strong> move one adjacent territory, or stay on the present space to use that location again.</li>
        <li><strong>Press one location button:</strong> tell the tower where the pawn is.</li>
        <li><strong>Resolve the event:</strong> complete battles, shopping, aid, treasure, or other prompts.</li>
        <li><strong>End the turn:</strong> press NO/END when no prompt remains.</li>
        <li><strong>Consume food:</strong> the app deducts food automatically when the turn ends.</li>
      </ol>
      <p>INVENTORY consumes the entire turn. REPEAT only repeats the previous display. CLEAR is reserved for canceling an illegal move.</p>
    `,
  },
  {
    id: "movement",
    title: "Movement and the Board",
    keywords: ["movement", "adjacent", "territory", "frontier", "dragon pawn", "citadel"],
    html: `
      <ul id="rule-legal-movement" class="manual-rule-anchor" tabindex="-1">
        <li>Each outlined territory is one space, including frontiers and Dark Tower spaces.</li>
        <li>Normal movement is one adjacent territory per turn.</li>
        <li>Within a kingdom, movement may follow any legal adjacent route.</li>
        <li>Kingdom-to-kingdom travel follows the frontiers counterclockwise.</li>
        <li>Multiple warrior pawns may occupy the same territory.</li>
        <li>A pawn may not enter a foreign Citadel.</li>
        <li>The territory occupied by the Dragon pawn is blocked until the Dragon attacks somewhere else.</li>
      </ul>
      <h3 id="rule-illegal-moves" class="manual-rule-anchor" tabindex="-1">Illegal moves</h3>
      <p>A foreign Citadel, a frontier crossed in the wrong direction, or an attempt to leave a foreign kingdom without its key is illegal. Follow the tower prompt, return the pawn as instructed, and use CLEAR when the display requests it.</p>
      <p>The current app tracks the kingdom, but the physical players remain responsible for legal territory-by-territory movement.</p>
    `,
  },
  {
    id: "keyboard",
    title: "Tower Keyboard",
    keywords: ["buttons", "keyboard", "yes", "no", "repeat", "clear", "inventory"],
    html: `
      <dl class="manual-dl">
        <dt>YES / BUY</dt><dd>Answer yes, buy the offered Bazaar item, or fight one battle round.</dd>
        <dt>REPEAT</dt><dd>Repeat the most recent display.</dd>
        <dt>NO / END</dt><dd>Answer no, view the next Bazaar item, retreat from battle, or end the turn.</dd>
        <dt>HAGGLE</dt><dd>Try to reduce the current Bazaar price.</dd>
        <dt>BAZAAR</dt><dd>Use a Bazaar location.</dd>
        <dt>CLEAR</dt><dd>Cancel an illegal move and forfeit the turn.</dd>
        <dt>TOMB / RUIN</dt><dd>Explore either location.</dd>
        <dt>MOVE</dt><dd>Enter an ordinary, unoccupied territory.</dd>
        <dt>SANCTUARY / CITADEL</dt><dd>Use either of those locations.</dd>
        <dt>DARK TOWER</dt><dd>Attempt the endgame after meeting all entry requirements.</dd>
        <dt>FRONTIER</dt><dd>Cross into the next kingdom.</dd>
        <dt>INVENTORY</dt><dd>Review resources and possessions; this uses the turn.</dd>
      </dl>
    `,
  },
  {
    id: "battle",
    title: "Battles with Brigands",
    keywords: ["battle", "brigands", "fight", "retreat", "warrior", "round"],
    html: `
      <p id="rule-brigand-battles" class="manual-rule-anchor" tabindex="-1">The tower first displays the number of brigands. You may fight or retreat.</p>
      <ul>
        <li>Press YES/BUY to fight one round.</li>
        <li>If the player wins the round, the brigand force is reduced to half its current size, dropping fractions.</li>
        <li>If the player loses the round, one warrior is lost.</li>
        <li>Press NO/END to retreat, losing one additional warrior.</li>
        <li>Retreat is no longer permitted when only one warrior remains.</li>
        <li>Defeating ordinary brigands may produce treasure. Defeating the Tower defenders wins the game.</li>
      </ul>
      <p>In multiplayer, misfortune normally leaves a player with at least one warrior. In solo play, losing the final warrior ends the game.</p>
    `,
  },
  {
    id: "events",
    title: "Wilderness Events",
    keywords: ["safe", "dragon", "plague", "lost", "curse", "events"],
    html: `
      <h3 id="rule-safe-move" class="manual-rule-anchor" tabindex="-1">Safe move</h3><p>No event occurs.</p>
      <h3 id="rule-dragon-attack" class="manual-rule-anchor" tabindex="-1">Dragon attack</h3><p>Lose one quarter of current warriors and gold, dropping fractions. The lost resources join the Dragon's hoard. A Dragonsword turns a later Dragon attack into victory and recovers the hoard.</p>
      <h3 id="rule-plague" class="manual-rule-anchor" tabindex="-1">Plague and Healer</h3><p>Lose two warriors. A Healer reverses the result and adds two warriors instead.</p>
      <h3 id="rule-lost" class="manual-rule-anchor" tabindex="-1">Lost and Scout</h3><p>Return the pawn to its previous territory and lose the next turn. A Scout prevents the penalty and grants an extra turn.</p>
      <h3 id="rule-curse" class="manual-rule-anchor" tabindex="-1">Curse</h3><p>A Wizard selected by another player transfers one quarter of the target's warriors and gold to the caster and causes the target to lose a turn.</p>
    `,
  },
  {
    id: "tomb-ruin",
    title: "Tombs and Ruins",
    keywords: ["tomb", "ruin", "treasure", "deserted", "battle"],
    html: `
      <p id="rule-tomb-ruin" class="manual-rule-anchor" tabindex="-1">Entering either location can produce one of three broad results:</p>
      <ul>
        <li>the place is deserted and the turn ends;</li>
        <li>brigands attack, with a possible treasure after victory;</li>
        <li>treasure is discovered immediately without a battle.</li>
      </ul>
      <p>The precise original firmware distribution remains under research. The app labels its current event table as provisional.</p>
    `,
  },
  {
    id: "sanctuary-citadel",
    title: "Sanctuary and Citadel",
    keywords: ["sanctuary", "citadel", "aid", "double", "reinforcement"],
    html: `
      <h3 id="rule-sanctuary" class="manual-rule-anchor" tabindex="-1">Sanctuary</h3>
      <p>A Sanctuary may provide aid when the player has 4 or fewer warriors, 7 or fewer gold, or 5 or fewer food. If no need threshold is met, no aid is given.</p>
      <h3 id="rule-citadel" class="manual-rule-anchor" tabindex="-1">Home Citadel</h3>
      <p>A player may enter only the home Citadel. After collecting all three keys, crossing all four frontiers, and returning home, a force of 5–24 warriors may be doubled in preparation for the final siege.</p>
      <p>The reinforcement can be earned again only after visiting a Tomb, Ruin, Bazaar, or Dark Tower space in the home kingdom. Otherwise, the Citadel acts like a Sanctuary.</p>
    `,
  },
  {
    id: "bazaar",
    title: "Bazaar and Haggling",
    keywords: ["bazaar", "buy", "haggle", "price", "merchant", "warriors", "food"],
    html: `
      <h3 id="rule-bazaar-shopping" class="manual-rule-anchor" tabindex="-1">Shopping</h3>
      <p>The Bazaar presents its available goods in order. Press NO/END to skip to the next item, YES/BUY to purchase, or HAGGLE to negotiate.</p>
      <ul>
        <li>Warriors generally cost about 4–10 gold each.</li>
        <li>Food always costs 1 gold per ration and cannot be haggled.</li>
        <li>A Beast, Scout, or Healer generally costs about 15–20 gold, and a player may own only one of each.</li>
        <li>Attempting a purchase that cannot be paid for closes the Bazaar.</li>
      </ul>
      <h3 id="rule-bazaar-haggling" class="manual-rule-anchor" tabindex="-1">Haggling</h3>
      <ul>
        <li>A successful haggle lowers the current price by one gold.</li>
        <li>An unsuccessful attempt may leave the price unchanged.</li>
        <li>Repeated haggling risks angering the merchant and closing the Bazaar.</li>
      </ul>
      <p>The exact split between unchanged-price and merchant-closure outcomes is still provisional in this build.</p>
    `,
  },
  {
    id: "inventory",
    title: "Resources and Carrying Limits",
    keywords: ["inventory", "food", "gold", "capacity", "warriors", "beast"],
    html: `
      <h3 id="rule-food-use" class="manual-rule-anchor" tabindex="-1">Food use</h3>
      <table class="manual-table"><thead><tr><th>Warriors</th><th>Food per turn</th></tr></thead><tbody>
        <tr><td>1–15</td><td>1</td></tr><tr><td>16–30</td><td>2</td></tr><tr><td>31–45</td><td>3</td></tr>
        <tr><td>46–60</td><td>4</td></tr><tr><td>61–75</td><td>5</td></tr><tr><td>76–90</td><td>6</td></tr><tr><td>91–99</td><td>7</td></tr>
      </tbody></table>
      <h3 id="rule-gold-capacity" class="manual-rule-anchor" tabindex="-1">Gold capacity</h3>
      <p>Each warrior carries up to 6 gold. A Beast adds capacity for 50 more gold. The display limit is 99. Excess gold must be abandoned immediately when the force can no longer carry it.</p>
      <h3>Maximum values</h3>
      <p>Warriors, gold, and food are each capped at 99.</p>
    `,
  },
  {
    id: "treasures",
    title: "Treasures and Helpers",
    keywords: ["treasure", "key", "pegasus", "dragonsword", "wizard", "scout", "healer", "beast"],
    html: `
      <div id="rule-treasures" class="manual-rule-anchor" tabindex="-1"></div>
      <dl class="manual-dl">
        <dt id="rule-magic-keys" class="manual-rule-anchor" tabindex="-1">Magic keys</dt><dd>Found one per foreign kingdom, in Brass–Silver–Gold order.</dd>
        <dt id="rule-pegasus" class="manual-rule-anchor" tabindex="-1">Pegasus</dt><dd>A one-use flight to a legal destination. It does not permit a player to bypass a missing-key restriction when leaving a foreign kingdom.</dd>
        <dt id="rule-dragonsword" class="manual-rule-anchor" tabindex="-1">Dragonsword</dt><dd>Turns the next Dragon encounter into victory and recovers the accumulated hoard.</dd>
        <dt id="rule-wizard" class="manual-rule-anchor" tabindex="-1">Wizard</dt><dd>Used immediately to curse another player.</dd>
        <dt>Scout</dt><dd>Prevents Lost and grants an extra turn.</dd>
        <dt>Healer</dt><dd>Turns Plague into a gain of two warriors.</dd>
        <dt>Beast</dt><dd>Carries 50 additional gold, consumes no food, and is not lost in battle.</dd>
      </dl>
    `,
  },
  {
    id: "frontier-keys",
    title: "Frontiers and Keys",
    keywords: ["frontier", "keys", "missing", "foreign", "brass", "silver", "gold"],
    html: `
      <p id="rule-frontiers-keys" class="manual-rule-anchor" tabindex="-1">Cross kingdom borders only through frontier spaces and in the counterclockwise direction shown by the board.</p>
      <ul>
        <li>A frontier counts as one territory.</li>
        <li>The player may enter a foreign kingdom without its key, but cannot leave that kingdom until the key is found.</li>
        <li>The key found in the first foreign kingdom is Brass; the second is Silver; the third is Gold.</li>
        <li>A missing-key attempt sends the pawn back to the prior territory and ends the turn.</li>
      </ul>
    `,
  },
  {
    id: "dark-tower",
    title: "Dark Tower and the Final Battle",
    keywords: ["dark tower", "riddle", "keys", "final battle", "victory", "scepter"],
    html: `
      <h3 id="rule-tower-entry" class="manual-rule-anchor" tabindex="-1">Entry requirements</h3>
      <p>Possess all three keys, cross all four frontiers, return to the home kingdom, and move onto the home Dark Tower space.</p>
      <h3 id="rule-riddle" class="manual-rule-anchor" tabindex="-1">Riddle of the Keys</h3>
      <p>The three keys have a hidden order that remains the same for the game. Identify the first two positions; the third is then determined. A wrong choice ends the attempt, and the riddle must be tried again on a later turn.</p>
      <h3 id="rule-final-battle" class="manual-rule-anchor" tabindex="-1">Final battle</h3>
      <p>After the riddle is solved, fight the Tower defenders by the normal battle procedure. Victory recovers the Ancient Scepter and ends the game.</p>
      <p>If the player retreats or loses, the riddle must be solved again on the next attempt. Whether the exact remaining defender count persists is retained as a documented research question in the project.</p>
    `,
  },
  {
    id: "app-controls",
    title: "Using This App",
    keywords: ["app", "save", "export", "import", "correction", "seed", "manual"],
    html: `
      <ul>
        <li>The app autosaves after actions. Use Export Save for a portable JSON backup and Import Save to restore one.</li>
        <li>The seed shown above the Chronicle makes random outcomes reproducible for bug reports.</li>
        <li>In Enhanced Guidance mode, resource and possession tiles may be clicked to correct accidental inputs or synchronize the app with physical score pegs.</li>
        <li>The kingdom selector records the pawn's current kingdom; physical players remain responsible for the exact territory.</li>
        <li>The Rules Manual button is available before and during a game. “Relevant Rule” opens the section most closely related to the current tower prompt.</li>
        <li>Deluxe 2026 presentation adds an original four-kingdom landmark atlas, animated tower lighting, and optional synthesized audio. The atlas does not replace legal territory-by-territory movement.</li>
        <li>Settings include Classic 1981 presentation, reduced motion, high contrast, larger text, sound, music, and map visibility.</li>
        <li>Keyboard shortcuts: M opens the manual, G opens settings, T starts the guided tour, and Escape closes an open overlay.</li>
      </ul>
    `,
  },
  {
    id: "research",
    title: "Research Status",
    keywords: ["research", "probability", "firmware", "provisional", "accuracy", "source"],
    html: `
      <p>The project distinguishes rules clearly stated in the surviving manual from hidden firmware values that are still being reconstructed.</p>
      <h3>Confirmed rule structure</h3>
      <p>Starting resources, food use, carrying limits, battle consequences, key order, helpers, entry requirements, and the broad location/event behavior are supported by the manual.</p>
      <h3>Still provisional</h3>
      <p>Some event frequencies, reward weights, Sanctuary gift quantities, the exact combat success probability, and parts of the haggling outcome distribution remain configurable research estimates.</p>
      <p>These estimates are centralized in <code>web/js/rules.js</code>, documented in <code>docs/RULES_RESEARCH.md</code>, and covered by deterministic tests where possible.</p>
    `,
  },
];

export function manualSection(id) {
  return MANUAL_SECTIONS.find((section) => section.id === id) || MANUAL_SECTIONS[0];
}

export function searchManual(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return MANUAL_SECTIONS;
  return MANUAL_SECTIONS.filter((section) => {
    const haystack = `${section.title} ${section.keywords.join(" ")} ${stripHtml(section.html)}`.toLowerCase();
    return normalized.split(/\s+/).every((term) => haystack.includes(term));
  });
}

export function contextualManualTarget(game) {
  const target = (sectionId, anchorId, label) => ({ sectionId, anchorId, label });
  if (!game) return target("quick-start", null, "Quick Start");

  const title = String(game.display?.title || "").toUpperCase();
  const pending = game.pending;

  if (pending?.type === "battle") {
    return pending.final
      ? target("dark-tower", "rule-final-battle", "Final Tower Battle")
      : target("battle", "rule-brigand-battles", "Brigand Battles");
  }
  if (pending?.type === "bazaar") {
    if (/HAGGLE|PRICE|NO HAGGLING|CLOSED/.test(title)) {
      return target("bazaar", "rule-bazaar-haggling", "Bazaar Haggling");
    }
    return target("bazaar", "rule-bazaar-shopping", "Bazaar Shopping");
  }
  if (pending?.type === "wizard") return target("treasures", "rule-wizard", "Wizard");
  if (pending?.type === "riddle") return target("dark-tower", "rule-riddle", "Riddle of the Keys");
  if (pending?.type === "illegalMove") return target("movement", "rule-illegal-moves", "Illegal Moves");

  if (game.status === "won") return target("dark-tower", "rule-final-battle", "Victory and Final Battle");
  if (/TOWER DEFENDERS/.test(title)) return target("dark-tower", "rule-final-battle", "Final Tower Battle");
  if (/BRIGANDS|WARRIORS|NO RETREAT|RETREAT|DEFEAT/.test(title)) return target("battle", "rule-brigand-battles", "Brigand Battles");
  if (/DRAGON/.test(title)) return target("events", "rule-dragon-attack", "Dragon Attack");
  if (/PLAGUE|HEALER/.test(title)) return target("events", "rule-plague", "Plague and Healer");
  if (/LOST|SCOUT|EXTRA TURN/.test(title)) return target("events", "rule-lost", "Lost and Scout");
  if (/CURSE/.test(title)) return target("events", "rule-curse", "Curse");
  if (/SAFE MOVE/.test(title)) return target("events", "rule-safe-move", "Safe Move");
  if (/TOMB|RUIN|DESERTED/.test(title)) return target("tomb-ruin", "rule-tomb-ruin", "Tombs and Ruins");
  if (/SANCTUARY/.test(title)) return target("sanctuary-citadel", "rule-sanctuary", "Sanctuary");
  if (/CITADEL/.test(title)) return target("sanctuary-citadel", "rule-citadel", "Citadel");
  if (/HAGGLE|PRICE UNCHANGED|NO HAGGLING|BAZAAR CLOSED/.test(title)) return target("bazaar", "rule-bazaar-haggling", "Bazaar Haggling");
  if (/BAZAAR|PURCHASED|WARRIOR|FOOD|BEAST/.test(title)) return target("bazaar", "rule-bazaar-shopping", "Bazaar Shopping");
  if (/BRASS KEY|SILVER KEY|GOLD KEY/.test(title)) return target("treasures", "rule-magic-keys", "Magic Keys");
  if (/PEGASUS/.test(title)) return target("treasures", "rule-pegasus", "Pegasus");
  if (/DRAGONSWORD/.test(title)) return target("treasures", "rule-dragonsword", "Dragonsword");
  if (/WIZARD/.test(title)) return target("treasures", "rule-wizard", "Wizard");
  if (/GOLD|NO TREASURE|TREASURE/.test(title)) return target("treasures", "rule-treasures", "Treasures");
  if (/WRONG DIRECTION|FRONTIER|KEY MISSING/.test(title)) return target("frontier-keys", "rule-frontiers-keys", "Frontiers and Keys");
  if (/TOWER SEALED/.test(title)) return target("dark-tower", "rule-tower-entry", "Tower Entry");
  if (/RIDDLE|WRONG KEY/.test(title)) return target("dark-tower", "rule-riddle", "Riddle of the Keys");
  if (/VICTORY/.test(title)) return target("battle", "rule-brigand-battles", "Battle Victory");
  if (/INVENTORY/.test(title)) return target("inventory", "rule-food-use", "Resources and Inventory");
  if (/MOVE CLEARED/.test(title)) return target("movement", "rule-illegal-moves", "Illegal Moves");
  if (/NEXT ADVENTURER|THE TOWER WAITS|READY/.test(title)) return target("turn-sequence", "rule-turn-sequence", "Turn Sequence");

  return target("turn-sequence", "rule-turn-sequence", "Turn Sequence");
}

export function contextualManualId(game) {
  return contextualManualTarget(game).sectionId;
}

function stripHtml(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}
