import {
  adjustResource,
  awardTreasure,
  bazaarBuy,
  bazaarHaggle,
  bazaarNextOffer,
  battleRound,
  beginDarkTower,
  clearIllegalMove,
  createGame,
  currentBazaarOffer,
  currentPlayer,
  endTurn,
  exportGame,
  foodCost,
  goldCapacity,
  guessRiddleKey,
  importGame,
  keyCount,
  repeatDisplay,
  resolveFrontier,
  resolveMove,
  resolveSanctuaryOrCitadel,
  resolveTombRuin,
  resolveWizard,
  retreatBattle,
  setKey,
  setPlayerKingdom,
  showInventory,
  startBazaar,
  toggleItem,
  usePegasus,
} from "./engine.js";
import { APP_VERSION, ITEM_LABELS, KEY_NAMES, KINGDOMS } from "./rules.js";
import { MANUAL_SECTIONS, contextualManualTarget, manualSection, searchManual } from "./manual.js";
import { atlasActionLabel, atlasMarkup } from "./atlas.js";
import { DEFAULT_PREFERENCES, SoundEngine, applyPreferences, classifyDisplay, loadPreferences, normalizePreferences, savePreferences } from "./presentation.js";
import { TUTORIAL_STEPS, tutorialStep } from "./tutorial.js";

const SAVE_KEY = "darkTowerOpenCompanion.autosave.v2";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let game = null;
let visibleLogCount = 80;
let activeManualSectionId = "quick-start";
let activeManualAnchorId = null;
let preferences = loadPreferences();
const sound = new SoundEngine(preferences);
let tutorialIndex = -1;
let tutorialTarget = null;

function initialize() {
  document.title = `Dark Tower: Open Companion v${APP_VERSION}`;
  $$('[data-version]').forEach((node) => { node.textContent = APP_VERSION; });
  preferences = applyPreferences(preferences);
  sound.setPreferences(preferences);
  $("#presentationMode").value = preferences.presentation;
  $("#tutorialOnStart").checked = !preferences.tutorialSeen;
  populateKingdoms();
  updateNameFields();
  wireEvents();
  updateLoadButton();
  renderManualNav(MANUAL_SECTIONS);
  renderManualSection(activeManualSectionId);
  renderAtlas();
  updateAtlasVisibility();
  configureOfflineSupport();
}

async function configureOfflineSupport() {
  const isDesktopApp = Boolean(window.__TAURI_INTERNALS__)
    || location.hostname === "tauri.localhost"
    || location.protocol === "tauri:";

  // The desktop bundle already contains all web assets. A service worker is
  // unnecessary there and can cause an older cached UI to override a newer EXE.
  if (isDesktopApp) {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys().catch(() => []);
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    return;
  }

  // The browser/iPad edition remains installable and offline-capable.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {});
  }
}

function wireEvents() {
  $("#playerCount").addEventListener("change", updateNameFields);
  $("#presentationMode").addEventListener("change", () => {
    preferences = savePreferences({ ...preferences, presentation: $("#presentationMode").value });
    applyPresentationSettings();
  });
  $("#tourBtn").addEventListener("click", startTutorial);
  $("#atlasToggleBtn").addEventListener("click", toggleAtlas);
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#settingsClose").addEventListener("click", closeSettings);
  $("#settingsSave").addEventListener("click", applySettingsFromDialog);
  $("#settingsReset").addEventListener("click", resetSettings);
  $("#settingsDialog").addEventListener("click", (event) => { if (event.target === $("#settingsDialog")) closeSettings(); });
  $("#tutorialBack").addEventListener("click", previousTutorialStep);
  $("#tutorialNext").addEventListener("click", nextTutorialStep);
  $("#tutorialSkip").addEventListener("click", closeTutorial);
  $("#manualBtn").addEventListener("click", () => openManual());
  $("#setupManualBtn").addEventListener("click", () => openManual("quick-start"));
  $("#contextRuleBtn").addEventListener("click", () => openManual(contextualManualTarget(game)));
  $("#manualClose").addEventListener("click", closeManual);
  $("#manualSearch").addEventListener("input", handleManualSearch);
  $("#manualDialog").addEventListener("click", (event) => {
    if (event.target === $("#manualDialog")) closeManual();
  });
  $("#startBtn").addEventListener("click", startNewGame);
  $("#loadBtn").addEventListener("click", loadAutosave);
  $("#newBtn").addEventListener("click", confirmNewGame);
  $("#exportBtn").addEventListener("click", downloadSave);
  $("#importFile").addEventListener("change", importSaveFile);
  $("#clearLogBtn").addEventListener("click", () => {
    visibleLogCount = visibleLogCount === 0 ? 80 : 0;
    renderLog();
  });
  $("#kingdomSelect").addEventListener("change", () => runAction(() => setPlayerKingdom(game, $("#kingdomSelect").value)));
  $("#pegasusBtn").addEventListener("click", showPegasusPrompt);
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (event) => {
    if (event.target === $("#modal")) closeModal();
  });
  $("#atlasMap").addEventListener("click", handleAtlasClick);
  $("#atlasMap").addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-map-action]")) {
      event.preventDefault(); handleAtlasClick(event);
    }
  });
  document.addEventListener("pointerdown", () => sound.unlock(), { once: true });
  document.addEventListener("keydown", handleKeyboardShortcuts);

  $$(".key").forEach((button) => {
    button.addEventListener("click", () => { sound.unlock(); sound.playCue("tap"); handleTowerAction(button.dataset.action); });
  });
  $$(".resource").forEach((button) => {
    button.addEventListener("click", () => showResourceCorrection(button.dataset.resource));
  });
}

function populateKingdoms() {
  $("#kingdomSelect").innerHTML = KINGDOMS.map((kingdom) => `<option value="${kingdom}">${kingdom}</option>`).join("");
}

function updateNameFields() {
  const count = Number($("#playerCount").value);
  const previous = $$('[data-player-name]').map((input) => input.value);
  $("#nameFields").innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    const label = document.createElement("label");
    label.textContent = `Player ${index + 1} — ${KINGDOMS[index]}`;
    const input = document.createElement("input");
    input.type = "text";
    input.value = previous[index] || `Player ${index + 1}`;
    input.dataset.playerName = String(index);
    label.append(input);
    $("#nameFields").append(label);
  }
}

function startNewGame() {
  preferences = savePreferences({ ...preferences, presentation: $("#presentationMode").value });
  applyPresentationSettings();
  const names = $$('[data-player-name]').map((input, index) => input.value.trim() || `Player ${index + 1}`);
  const seedInput = $("#seedInput").value.trim();
  game = createGame({
    playerNames: names,
    level: Number($("#gameLevel").value),
    enhancedMode: $("#enhancedMode").checked,
    seed: seedInput || Date.now(),
  });
  enterGameScreen();
  saveAutosave();
  render();
  if ($("#tutorialOnStart").checked) setTimeout(startTutorial, 180);
}

function enterGameScreen() {
  $("#setupScreen").classList.add("hidden");
  $("#gameScreen").classList.remove("hidden");
  $("#newBtn").disabled = false;
  $("#exportBtn").disabled = false;
  updateAtlasVisibility();
}

function confirmNewGame() {
  if (!game || window.confirm("Start a new game? Your current autosave will be replaced when the new game begins.")) {
    game = null;
    $("#gameScreen").classList.add("hidden");
    $("#setupScreen").classList.remove("hidden");
    $("#newBtn").disabled = true;
    $("#exportBtn").disabled = true;
    closeModal();
    closeTutorial();
    updateLoadButton();
  }
}

function updateLoadButton() {
  $("#loadBtn").disabled = !localStorage.getItem(SAVE_KEY);
}

function saveAutosave() {
  if (!game) return;
  localStorage.setItem(SAVE_KEY, exportGame(game));
  updateLoadButton();
}

function loadAutosave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return showMessage("No autosave", "No saved game was found in this browser or app installation.");
  try {
    game = importGame(raw);
    enterGameScreen();
    render();
  } catch (error) {
    showError(error);
  }
}

function downloadSave() {
  if (!game) return;
  const blob = new Blob([exportGame(game)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dark-tower-save-turn-${game.turn}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importSaveFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    game = importGame(await file.text());
    enterGameScreen();
    saveAutosave();
    render();
  } catch (error) {
    showError(error);
  }
}

function handleTowerAction(action) {
  if (!game) return;
  switch (action) {
    case "yes": return handleYes();
    case "no": return handleNo();
    case "repeat": return runAction(() => repeatDisplay(game));
    case "haggle": return handleHaggle();
    case "bazaar": return runAction(() => startBazaar(game));
    case "clear": return handleClear();
    case "tomb": return runAction(() => resolveTombRuin(game));
    case "move": return runAction(() => resolveMove(game));
    case "sanctuary": return showSanctuaryPrompt();
    case "darktower": return runAction(() => beginDarkTower(game));
    case "frontier": return showFrontierPrompt();
    case "inventory": return runAction(() => showInventory(game));
    default: return undefined;
  }
}

function handleYes() {
  if (game.pending?.type === "battle") return runAction(() => battleRound(game));
  if (game.pending?.type === "bazaar") return buyCurrentOffer();
  if (game.pending?.type === "wizard") return showWizardTargets();
  if (game.pending?.type === "riddle") return showRiddleChoices();
  showMessage("No YES prompt", "The Tower is not currently asking for an affirmative response.");
}

function handleNo() {
  if (game.pending?.type === "battle") return runAction(() => retreatBattle(game));
  if (game.pending?.type === "bazaar") return runAction(() => bazaarNextOffer(game));
  if (game.pending?.type === "wizard") return showWizardTargets();
  if (game.pending?.type === "riddle") return showRiddleChoices();
  if (game.pending?.type === "illegalMove") return showMessage("Press CLEAR", "An illegal move must be canceled with the CLEAR button; the turn is then forfeited.");
  return runAction(() => endTurn(game));
}

function handleHaggle() {
  if (game.pending?.type !== "bazaar") return showMessage("No merchant", "HAGGLE is available only while the Bazaar is offering an item.");
  return runAction(() => bazaarHaggle(game));
}

function handleClear() {
  if (game.pending?.type === "illegalMove") {
    runAction(() => clearIllegalMove(game), { save: false });
    return runAction(() => endTurn(game));
  }
  showMessage("Nothing to clear", "CLEAR is used to cancel an illegal move. Other pending events must be resolved normally.");
}

function showSanctuaryPrompt() {
  if (game.pending) return showMessage("Event in progress", `Resolve the pending ${game.pending.type} action first.`);
  showModal(
    "Sanctuary or Citadel?",
    `<p>The original tower used the same button for both locations. Select the space occupied by the pawn.</p>`,
    [
      { label: "Sanctuary", action: () => runAction(() => resolveSanctuaryOrCitadel(game, "sanctuary")) },
      { label: "Citadel", action: () => runAction(() => resolveSanctuaryOrCitadel(game, "citadel")) },
      { label: "Cancel", action: closeModal },
    ],
  );
}

function showFrontierPrompt() {
  if (game.pending) return showMessage("Event in progress", `Resolve the pending ${game.pending.type} action first.`);
  const player = currentPlayer(game);
  const currentIndex = KINGDOMS.indexOf(player.currentKingdom);
  const nextKingdom = KINGDOMS[(currentIndex + 1) % KINGDOMS.length];
  const buttons = [{
    label: `Cross into ${nextKingdom}`,
    action: () => runAction(() => resolveFrontier(game, nextKingdom)),
  }];
  buttons.push({ label: "Cancel", action: closeModal });
  showModal("Cross a Frontier", `<p>Current kingdom: <strong>${player.currentKingdom}</strong>. Choose the kingdom entered on the physical board.</p>`, buttons);
}

function showPegasusPrompt() {
  const player = currentPlayer(game);
  if (!player.pegasus) return;
  const buttons = KINGDOMS.map((kingdom) => ({
    label: kingdom,
    action: () => runAction(() => usePegasus(game, kingdom)),
  }));
  buttons.push({ label: "Cancel", action: closeModal });
  showModal("Use Pegasus", "<p>Move the pawn to any legal territory in the selected kingdom. Crossing without the key from the kingdom being left causes the Pegasus to be lost.</p>", buttons);
}

function buyCurrentOffer() {
  const offer = currentBazaarOffer(game);
  if (offer.max === 1) return runAction(() => bazaarBuy(game, 1));
  showModal(
    `Buy ${offer.label}`,
    `<p>Price: <strong>${game.pending.price} gold each</strong>. Available gold: <strong>${currentPlayer(game).gold}</strong>.</p>
     <label class="quantity-row">Quantity <input id="purchaseQuantity" type="number" min="1" max="99" value="1"></label>`,
    [
      { label: "Purchase", primary: true, action: () => runAction(() => bazaarBuy(game, Number($("#purchaseQuantity").value))) },
      { label: "Cancel", action: closeModal },
    ],
  );
}

function showWizardTargets() {
  const caster = currentPlayer(game);
  const rivals = game.players.filter((player) => player.id !== caster.id);
  if (!rivals.length) {
    game.pending = null;
    saveAutosave();
    render();
    return showMessage("Wizard departs", "There is no rival to curse in a one-player game.");
  }
  showModal(
    "Choose a Player to Curse",
    "<p>The Wizard immediately transfers one quarter of the target's warriors and gold and causes that player to lose a turn.</p>",
    rivals.map((player) => ({ label: `${player.name} — P${player.id}`, action: () => runAction(() => resolveWizard(game, player.id)) })),
    { mandatory: true },
  );
}

function showRiddleChoices() {
  const pending = game.pending;
  if (pending?.type !== "riddle") return;
  const labels = { brass: "Brass Key", silver: "Silver Key", gold: "Gold Key" };
  showModal(
    `Riddle — Position ${pending.step + 1}`,
    `<p>Choose the key you believe belongs in position ${pending.step + 1}. Two correct choices open the Tower; the third key is implied.</p>`,
    pending.remaining.map((key) => ({ label: labels[key], action: () => runAction(() => guessRiddleKey(game, key)) })),
    { mandatory: true },
  );
}

function showResourceCorrection(resource) {
  if (!game?.enhancedMode) return;
  const label = resource[0].toUpperCase() + resource.slice(1);
  const buttons = [-5, -1, 1, 5].map((delta) => ({
    label: delta > 0 ? `+${delta}` : String(delta),
    action: () => runAction(() => adjustResource(game, resource, delta)),
  }));
  buttons.push({ label: "Cancel", action: closeModal });
  showModal(`Correct ${label}`, `<p>Use corrections only for a mistaken input or to synchronize with physical score pegs.</p>`, buttons);
}

function showItemCorrection(item) {
  if (!game?.enhancedMode) return;
  const player = currentPlayer(game);
  showModal(
    `${ITEM_LABELS[item]} correction`,
    `<p>${player[item] ? "Remove" : "Add"} this possession to synchronize the app with the table?</p>`,
    [
      { label: player[item] ? "Remove" : "Add", primary: true, action: () => runAction(() => toggleItem(game, item)) },
      { label: "Cancel", action: closeModal },
    ],
  );
}

function showKeyCorrection(key) {
  if (!game?.enhancedMode) return;
  const player = currentPlayer(game);
  showModal(
    `${key[0].toUpperCase() + key.slice(1)} key correction`,
    `<p>Set this key to ${player.keys[key] ? "not owned" : "owned"}? Manual key corrections do not assign the key to a particular foreign kingdom.</p>`,
    [
      { label: player.keys[key] ? "Remove" : "Add", primary: true, action: () => runAction(() => setKey(game, key, !player.keys[key])) },
      { label: "Cancel", action: closeModal },
    ],
  );
}

function render() {
  if (!game) return;
  const player = currentPlayer(game);
  const display = game.display;
  $("#eventIcon").textContent = display.icon;
  $("#eventTitle").textContent = display.title;
  $("#numberDisplay").textContent = display.number;
  $("#eventText").textContent = display.text;
  const ruleTarget = contextualManualTarget(game);
  $("#contextRuleBtn").textContent = `Rule: ${ruleTarget.label}`;
  $("#contextRuleBtn").setAttribute("aria-label", `Open the rules for ${ruleTarget.label}`);
  const effect = classifyDisplay(display, game.pending, game.status);
  $("#towerDisplay").dataset.effect = effect;
  $("#towerPanel").dataset.effect = effect;
  $("#currentPlayerName").textContent = player.name;
  $("#turnBadge").textContent = `TURN ${game.turn} · P${player.id}`;
  $("#kingdomSelect").value = player.currentKingdom;
  $("#warriors").textContent = player.warriors;
  $("#gold").textContent = player.gold;
  $("#food").textContent = player.food;
  $("#goldCapacity").textContent = `Capacity ${goldCapacity(player)}`;
  $("#foodCost").textContent = `${foodCost(player.warriors)} per turn`;
  $("#keyProgress").textContent = `${keyCount(player)} / 3`;
  $("#frontierProgress").textContent = `${player.frontiersCrossed} / 4`;
  $("#towerDefenders").textContent = game.enhancedMode ? game.towerDefenders : "Hidden";
  $("#seedLabel").textContent = game.seed;
  $("#pegasusBtn").disabled = !player.pegasus || game.status !== "playing";

  $("#inventoryGrid").innerHTML = Object.entries(ITEM_LABELS).map(([key, label]) =>
    `<button class="item ${player[key] ? "owned" : ""}" data-item="${key}">${label}</button>`).join("");
  $$('[data-item]').forEach((button) => button.addEventListener("click", () => showItemCorrection(button.dataset.item)));

  $("#keyGrid").innerHTML = KEY_NAMES.map((key) =>
    `<button class="key-token ${player.keys[key] ? "owned" : ""}" data-key="${key}">${key[0].toUpperCase() + key.slice(1)} Key</button>`).join("");
  $$('[data-key]').forEach((button) => button.addEventListener("click", () => showKeyCorrection(button.dataset.key)));

  renderContextActions();
  renderAtlas();
  renderLog();

  const disabled = game.status !== "playing";
  $$(".key").forEach((button) => { button.disabled = disabled; });
  $("#kingdomSelect").disabled = disabled;
  saveAutosave();
}

function renderContextActions() {
  const container = $("#contextActions");
  container.innerHTML = "";
  const actions = [];
  if (game.pending?.type === "battle") {
    actions.push(["Fight one round", () => runAction(() => battleRound(game))]);
    if (currentPlayer(game).warriors > 1) actions.push(["Retreat", () => runAction(() => retreatBattle(game))]);
  } else if (game.pending?.type === "bazaar") {
    const offer = currentBazaarOffer(game);
    actions.push([`Buy ${offer.label}`, buyCurrentOffer]);
    if (offer.key !== "food") actions.push(["Haggle", () => runAction(() => bazaarHaggle(game))]);
    actions.push(["Next item", () => runAction(() => bazaarNextOffer(game))]);
  } else if (game.pending?.type === "wizard") {
    actions.push(["Choose curse target", showWizardTargets]);
  } else if (game.pending?.type === "riddle") {
    actions.push(["Choose a key", showRiddleChoices]);
  } else if (game.pending?.type === "illegalMove") {
    actions.push(["Clear illegal move", handleClear]);
  }

  if (!actions.length) {
    container.classList.add("hidden");
    return;
  }
  actions.forEach(([label, handler]) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", handler);
    container.append(button);
  });
  container.classList.remove("hidden");
}

function renderLog() {
  if (!game) return;
  if (visibleLogCount === 0) {
    $("#gameLog").innerHTML = '<div class="log-entry">Chronicle view hidden. Press “Clear View” again to restore it.</div>';
    return;
  }
  const entries = game.log.slice(-visibleLogCount).reverse();
  $("#gameLog").innerHTML = entries.map((entry) =>
    `<div class="log-entry"><span class="log-meta">Turn ${entry.turn}${entry.playerId ? ` · P${entry.playerId}` : ""}</span>${escapeHtml(entry.text)}</div>`).join("");
}

function runAction(callback, { save = true } = {}) {
  closeModal();
  const before = game ? `${game.display?.title}|${game.display?.number}|${game.pending?.type || ""}` : "";
  try {
    const result = callback();
    if (save) saveAutosave();
    render();
    const after = game ? `${game.display?.title}|${game.display?.number}|${game.pending?.type || ""}` : "";
    if (after !== before) sound.playCue(classifyDisplay(game.display, game.pending, game.status));
    if (game.pending?.type === "wizard") setTimeout(showWizardTargets, 0);
    if (game.pending?.type === "riddle") setTimeout(showRiddleChoices, 0);
    return result;
  } catch (error) {
    sound.playCue("warning");
    showError(error);
    return null;
  }
}


function applyPresentationSettings() {
  preferences = applyPreferences(normalizePreferences(preferences));
  sound.setPreferences(preferences);
  $("#presentationMode").value = preferences.presentation;
  updateAtlasVisibility();
  if (game) renderAtlas();
}

function updateAtlasVisibility() {
  const visible = preferences.presentation === "deluxe" && preferences.showMap;
  $("#atlasPanel").classList.toggle("hidden", !visible);
  $(".game-layout")?.classList.toggle("atlas-hidden", !visible);
  $("#atlasToggleBtn").textContent = visible ? "Hide Map" : "Show Map";
  $("#atlasToggleBtn").disabled = preferences.presentation === "classic";
}

function toggleAtlas() {
  if (preferences.presentation === "classic") return showMessage("Classic presentation", "Switch to Deluxe 2026 in Settings to use the interactive atlas.");
  preferences = savePreferences({ ...preferences, showMap: !preferences.showMap });
  applyPresentationSettings();
}

function renderAtlas() {
  const map = $("#atlasMap");
  if (!map) return;
  const player = game ? currentPlayer(game) : null;
  map.innerHTML = atlasMarkup({ players: game?.players || [], currentPlayerId: player?.id || null });
  map.querySelectorAll("[data-kingdom-wedge], [data-kingdom-label]").forEach((node) => {
    node.classList.toggle("current", Boolean(player && node.dataset.kingdomWedge === player.currentKingdom) || Boolean(player && node.dataset.kingdomLabel === player.currentKingdom));
  });
  map.querySelectorAll("[data-map-action]").forEach((node) => {
    const kingdom = node.dataset.kingdom;
    const unavailable = Boolean(game && kingdom !== "center" && kingdom !== player.currentKingdom);
    node.classList.toggle("unavailable", unavailable);
    node.setAttribute("aria-disabled", String(unavailable));
  });
  $("#atlasStatus").textContent = player ? `${player.name} · ${player.currentKingdom}` : "Preview map";
}

function handleAtlasClick(event) {
  const target = event.target.closest?.("[data-map-action]");
  if (!target || !game) return;
  const action = target.dataset.mapAction;
  const kingdom = target.dataset.kingdom;
  const player = currentPlayer(game);
  if (kingdom !== "center" && kingdom !== player.currentKingdom) {
    return showMessage("Another kingdom", `The marker is currently in ${player.currentKingdom}. Cross a Frontier, use Pegasus, or correct the kingdom selector before selecting ${atlasActionLabel(action)} in ${kingdom}.`);
  }
  switch (action) {
    case "wilds": return runAction(() => resolveMove(game));
    case "bazaar": return runAction(() => startBazaar(game));
    case "tomb": return runAction(() => resolveTombRuin(game));
    case "sanctuary": return runAction(() => resolveSanctuaryOrCitadel(game, "sanctuary"));
    case "citadel": return runAction(() => resolveSanctuaryOrCitadel(game, "citadel"));
    case "frontier": return showFrontierPrompt();
    case "darktower": return runAction(() => beginDarkTower(game));
    default: return undefined;
  }
}

function openSettings() {
  $("#settingsPresentation").value = preferences.presentation;
  $("#settingsMap").checked = preferences.showMap;
  $("#settingsSound").checked = preferences.soundEffects;
  $("#settingsMusic").checked = preferences.ambientMusic;
  $("#settingsVolume").value = String(preferences.volume);
  $("#settingsReducedMotion").checked = preferences.reducedMotion;
  $("#settingsContrast").checked = preferences.highContrast;
  $("#settingsLargeText").checked = preferences.largeText;
  if (!$("#settingsDialog").open) $("#settingsDialog").showModal();
}

function closeSettings() { if ($("#settingsDialog").open) $("#settingsDialog").close(); }

function applySettingsFromDialog() {
  preferences = savePreferences({
    ...preferences,
    presentation: $("#settingsPresentation").value,
    showMap: $("#settingsMap").checked,
    soundEffects: $("#settingsSound").checked,
    ambientMusic: $("#settingsMusic").checked,
    volume: Number($("#settingsVolume").value),
    reducedMotion: $("#settingsReducedMotion").checked,
    highContrast: $("#settingsContrast").checked,
    largeText: $("#settingsLargeText").checked,
  });
  applyPresentationSettings();
  sound.unlock();
  sound.playCue("sanctuary");
  closeSettings();
}

function resetSettings() {
  preferences = savePreferences({ ...DEFAULT_PREFERENCES, tutorialSeen: preferences.tutorialSeen });
  applyPresentationSettings();
  openSettings();
}

function startTutorial() {
  if (!game) return showMessage("Begin a game first", "The guided tour highlights the live game screen after a quest begins.");
  closeSettings(); closeManual(); closeModal();
  tutorialIndex = 0;
  showTutorialStep();
}

function showTutorialStep() {
  clearTutorialFocus();
  let step = tutorialStep(tutorialIndex);
  let target = document.querySelector(step.selector);
  while ((!target || target.classList.contains("hidden")) && tutorialIndex < TUTORIAL_STEPS.length - 1) {
    tutorialIndex += 1; step = tutorialStep(tutorialIndex); target = document.querySelector(step.selector);
  }
  tutorialTarget = target;
  tutorialTarget?.classList.add("tutorial-focus");
  $("#tutorialProgress").textContent = `Step ${step.index + 1} of ${step.total}`;
  $("#tutorialTitle").textContent = step.title;
  $("#tutorialBody").textContent = step.body;
  $("#tutorialBack").disabled = tutorialIndex <= 0;
  $("#tutorialNext").textContent = tutorialIndex >= TUTORIAL_STEPS.length - 1 ? "Finish" : "Next";
  $("#tutorialOverlay").classList.remove("hidden");
  target?.scrollIntoView?.({ behavior: preferences.reducedMotion ? "auto" : "smooth", block: "center" });
}

function nextTutorialStep() {
  if (tutorialIndex >= TUTORIAL_STEPS.length - 1) return closeTutorial(true);
  tutorialIndex += 1; showTutorialStep();
}
function previousTutorialStep() { if (tutorialIndex > 0) { tutorialIndex -= 1; showTutorialStep(); } }
function clearTutorialFocus() { tutorialTarget?.classList.remove("tutorial-focus"); tutorialTarget = null; }
function closeTutorial(markSeen = true) {
  clearTutorialFocus();
  $("#tutorialOverlay").classList.add("hidden");
  tutorialIndex = -1;
  if (markSeen) preferences = savePreferences({ ...preferences, tutorialSeen: true });
}

function handleKeyboardShortcuts(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (key === "m") openManual();
  else if (key === "g") openSettings();
  else if (key === "t" && game) startTutorial();
  else if (key === "escape") { closeSettings(); closeManual(); closeTutorial(false); closeModal(); }
}


function normalizeManualTarget(value) {
  if (!value) return contextualManualTarget(game);
  if (typeof value === "string") return { sectionId: value, anchorId: null, label: null };
  return {
    sectionId: value.sectionId || "quick-start",
    anchorId: value.anchorId || null,
    label: value.label || null,
  };
}

function openManual(target = null) {
  const resolved = normalizeManualTarget(target);
  activeManualSectionId = resolved.sectionId;
  activeManualAnchorId = resolved.anchorId;
  $("#manualSearch").value = "";
  renderManualNav(MANUAL_SECTIONS);
  renderManualSection(activeManualSectionId, activeManualAnchorId);
  if (!$("#manualDialog").open) $("#manualDialog").showModal();
  focusManualAnchor(activeManualAnchorId);
}

function closeManual() {
  if ($("#manualDialog").open) $("#manualDialog").close();
}

function handleManualSearch() {
  activeManualAnchorId = null;
  const results = searchManual($("#manualSearch").value);
  renderManualNav(results);
  if (!results.some((section) => section.id === activeManualSectionId)) {
    if (results.length) renderManualSection(results[0].id);
    else $("#manualContent").innerHTML = '<div class="manual-empty"><h3>No matching rule found</h3><p>Try a broader term such as “battle,” “food,” “key,” or “Bazaar.”</p></div>';
  }
}

function renderManualNav(sections) {
  const nav = $("#manualNav");
  nav.innerHTML = sections.map((section) => `<button type="button" data-manual-section="${section.id}" class="${section.id === activeManualSectionId ? "active" : ""}">${escapeHtml(section.title)}</button>`).join("");
  $$('[data-manual-section]').forEach((button) => button.addEventListener("click", () => {
    activeManualAnchorId = null;
    renderManualSection(button.dataset.manualSection);
    renderManualNav(searchManual($("#manualSearch").value));
  }));
}

function renderManualSection(sectionId, anchorId = null) {
  const section = manualSection(sectionId);
  activeManualSectionId = section.id;
  activeManualAnchorId = anchorId;
  $("#manualContent").innerHTML = `<div class="manual-section-title"><div class="eyebrow">Rules reference</div><h2>${escapeHtml(section.title)}</h2></div>${section.html}`;
  $("#manualContent").scrollTop = 0;
  focusManualAnchor(anchorId);
}

function focusManualAnchor(anchorId) {
  if (!anchorId) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;
    anchor.classList.remove("rule-focus");
    anchor.scrollIntoView({ block: "start", behavior: preferences.reducedMotion ? "auto" : "smooth" });
    void anchor.offsetWidth;
    anchor.classList.add("rule-focus");
    window.setTimeout(() => anchor.classList.remove("rule-focus"), 2600);
    anchor.focus({ preventScroll: true });
  }));
}

function showModal(title, body, actions = [], { mandatory = false } = {}) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalActions").innerHTML = "";
  $("#modalClose").classList.toggle("hidden", mandatory);
  actions.forEach(({ label, action, primary = false }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (primary) button.classList.add("primary-action");
    button.addEventListener("click", action);
    $("#modalActions").append(button);
  });
  if (!$("#modal").open) $("#modal").showModal();
}

function showMessage(title, message) {
  showModal(title, `<p>${escapeHtml(message)}</p>`, [{ label: "Close", action: closeModal }]);
}

function showError(error) {
  console.error(error);
  showMessage("The Tower cannot complete that action", error?.message || String(error));
}

function closeModal() {
  if ($("#modal").open) $("#modal").close();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

initialize();
