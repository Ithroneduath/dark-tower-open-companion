# Rules Research Ledger

The purpose of this file is to distinguish confirmed rules from implementation estimates.

## Primary evidence

The project owner photographed the complete surviving instruction manual and physical components. Those photographs are used for private rules analysis but are not distributed in this repository.

Confirmed from the manual and cross-checked with surviving references:

- 1–4 players;
- starting values of 10 warriors, 30 gold, and 25 food;
- Levels 1, 2, and 3 use Tower defender ranges 17–32, 33–64, and 17–64;
- Level 4 starts the single player with all keys and 16 Tower defenders;
- one food feeds up to 15 warriors per turn;
- six gold may be carried per warrior, plus 50 with a Beast, maximum 99;
- one warrior is lost on a failed combat round;
- the brigand force is halved on a successful combat round;
- retreat costs one additional warrior;
- Plague loses two warriors, or gains two with a Healer;
- Lost costs a turn, while a Scout grants an immediate extra turn;
- Dragon and Curse transfer one quarter of warriors and gold;
- keys are awarded Brass, Silver, then Gold, one per foreign kingdom;
- Citadel reinforcement doubles 5–24 warriors under the documented conditions;
- the Riddle requires identifying the first two positions of a hidden key order;
- Tower defenders persist after an unsuccessful final assault unless evidence later disproves this interpretation.

## Secondary references

- Well of Souls Dark Tower reference: https://well-of-souls.com/tower/
- Locations: https://www.well-of-souls.com/tower/dt_loc.htm
- Events: https://www.well-of-souls.com/tower/dt_events.htm
- Inventory: https://well-of-souls.com/tower/dt_inv.htm
- Gameplay: https://well-of-souls.com/tower/dt_board.htm
- Community probability discussion: https://boardgamegeek.com/thread/1087086/anyone-know-the-percent-chance-of-an-event-happeni

Well of Souls explicitly notes that some of its text and images originated in the manual and were used without permission. This project therefore uses it only as a research cross-check and does not copy its artwork or long-form text.

## Provisional implementation values

### Tomb/Ruin

The community probability discussion reports a 43.75% chance of free treasure. Version 0.3 models the Tomb/Ruin table as:

- 7/16 instant treasure (43.75%);
- 7/16 battle (43.75%);
- 2/16 deserted (12.5%).

Only the instant-treasure figure has community support; the remaining split is a transparent working hypothesis.

### Standard movement

Version 0.3 uses a transparent 16-slot working table:

- 7/16 battle;
- 6/16 safe;
- 1/16 Dragon;
- 1/16 Lost;
- 1/16 Plague.

This table is not yet claimed as original-firmware accurate.

### Combat

Version 0.3 assigns a 62.5% chance for the player to win each combat round because contemporary descriptions say the odds favor the player. The round consequences themselves are confirmed; the exact probability is not.

### Bazaar and Sanctuary

Documented price ranges and the approximately 50/50 chance of lowering a Bazaar price are used where available. The manual also distinguishes an unchanged price from an angered-merchant closure. Version 0.3 therefore uses a transparent 16-slot working table:

- 8/16 lower the price by one (50%);
- 6/16 leave the price unchanged (37.5%);
- 2/16 close the Bazaar (12.5%).

Only the approximate 50% reduction chance and existence of the other two outcomes are confirmed; the remaining split is provisional. Exact item-generation and Sanctuary aid-amount tables remain provisional.

## Research priorities

1. Locate a reproducible firmware disassembly or well-documented emulator source.
2. Verify standard movement event weights.
3. Verify treasure table weights and multi-treasure behavior.
4. Verify combat-round probability and odd-number halving behavior.
5. Verify whether final Tower defenders persist after retreat or defeat.
6. Verify Sanctuary award quantities and ordering.
7. Verify the exact unchanged-price versus merchant-closure split after the approximately 50/50 reduction chance.


## Milestone 2 corrections incorporated in v0.3.0

The following behaviors were corrected after rechecking the photographed manual and surviving rules references:

- Frontier movement is counterclockwise.
- A player with only one warrior cannot retreat.
- Home Citadel doubling is an endgame reinforcement and requires all three keys, four frontier crossings, and return to the home kingdom.
- A failed haggle does not always close the Bazaar; the price may remain unchanged.

The repository's in-app manual is newly written and paraphrased. It does not distribute the photographed pages or copy the long-form text of secondary sites.
