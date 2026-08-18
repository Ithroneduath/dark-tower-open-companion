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
  enterBoardSpace,
  exportGame,
  foodCost,
  goldCapacity,
  guessRiddleKey,
  importGame,
  keyCount,
  legalMovesForCurrentPlayer,
  pegasusMovesForCurrentPlayer,
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
  usePegasusToSpace,
} from "./engine.js";
import { APP_VERSION, ITEM_LABELS, KEY_NAMES, KINGDOMS } from "./rules.js";
import { MANUAL_SECTIONS, contextualManualTarget, manualSection, searchManual } from "./manual.js";
import { atlasActionLabel, atlasMarkup } from "./atlas.js";
import { boardMoveCheck, spaceAction, spaceById, spaceLabel } from "./board.js";
import { DEFAULT_PREFERENCES, SoundEngine, applyPreferences, classifyDisplay, loadPreferences, normalizePreferences, savePreferences } from "./presentation.js";
import { TUTORIAL_STEPS, tutorialStep } from "./tutorial.js";
import { DEFAULT_WORKSPACE_LAYOUT, adjustWorkspaceLayout, layoutReadout, loadWorkspaceLayout, normalizeWorkspaceLayout, saveWorkspaceLayout, workspacePreset } from "./layout.js";
import {
  SHARED_DISPLAY_CHANNEL,
  SHARED_DISPLAY_KEY,
  installMessage,
  isAppleMobile,
  isStandalone,
  saveFilename,
  sharedDisplaySnapshot,
} from "./platform.js";

const SAVE_KEY = "darkTowerOpenCompanion.autosave.v3";
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
let deferredInstallPrompt = null;
let wakeLockSentinel = null;
let displayChannel = null;
let toastTimer = null;
let tabletPane = sessionStorage.getItem("darkTowerOpenCompanion.tabletPane") || "tower";
let pegasusTargetMode = false;
let mapView = { scale: 1, x: 0, y: 0 };
let mapDrag = null;
let suppressMapClick = false;
let workspaceLayout = loadWorkspaceLayout();
let splitterDrag = null;
let workspaceResizeObserver = null;
let tutorialResizeTimer = null;

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
  configurePlatformFeatures();
  configureAdaptiveWorkspace();
  applyWorkspaceLayout({ persist: false });
  setTabletPane(tabletPane, { scroll: false });
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
  $("#layoutBtn").addEventListener("click", openLayoutDialog);
  $("#layoutClose").addEventListener("click", closeLayoutDialog);
  $("#layoutDone").addEventListener("click", closeLayoutDialog);
  $("#layoutReset").addEventListener("click", () => applyLayoutPreset("balanced"));
  $("#layoutDialog").addEventListener("click", (event) => { if (event.target === $("#layoutDialog")) closeLayoutDialog(); });
  $$(`[data-layout-preset]`).forEach((button) => button.addEventListener("click", () => applyLayoutPreset(button.dataset.layoutPreset)));
  $$(`[data-layout-handle]`).forEach((splitter) => { splitter.addEventListener("pointerdown", beginSplitterDrag); splitter.addEventListener("pointermove", continueSplitterDrag); splitter.addEventListener("pointerup", endSplitterDrag); splitter.addEventListener("pointercancel", endSplitterDrag); splitter.addEventListener("keydown", handleSplitterKeyboard); });
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#deviceBtn").addEventListener("click", openDeviceDialog);
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
  $("#exportBtn").addEventListener("click", shareOrDownloadSave);
  $("#importFile").addEventListener("change", importSaveFile);
  $("#deviceClose").addEventListener("click", closeDeviceDialog);
  $("#deviceDialog").addEventListener("click", (event) => { if (event.target === $("#deviceDialog")) closeDeviceDialog(); });
  $("#installBtn").addEventListener("click", installApp);
  $("#deviceShareSave").addEventListener("click", shareOrDownloadSave);
  $("#deviceKeepAwake").addEventListener("change", applyDeviceWakePreference);
  $("#fullscreenBtn").addEventListener("click", toggleFullscreen);
  $("#openDisplayBtn").addEventListener("click", openSharedDisplay);
  $$('[data-tablet-pane]').forEach((button) => button.addEventListener("click", () => setTabletPane(button.dataset.tabletPane)));
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
  $("#mapZoomIn").addEventListener("click", () => zoomMap(.2));
  $("#mapZoomOut").addEventListener("click", () => zoomMap(-.2));
  $("#mapZoomReset").addEventListener("click", resetMapView);
  $("#atlasMap").addEventListener("wheel", handleMapWheel, { passive: false });
  $("#atlasMap").addEventListener("pointerdown", beginMapDrag);
  $("#atlasMap").addEventListener("pointermove", continueMapDrag);
  $("#atlasMap").addEventListener("pointerup", endMapDrag);
  $("#atlasMap").addEventListener("pointercancel", endMapDrag);
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
  setTabletPane("tower", { scroll: false });
  syncWakeLock();
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
    releaseWakeLock();
    publishSharedDisplay(null);
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

async function shareOrDownloadSave() {
  if (!game) return;
  const contents = exportGame(game);
  const filename = saveFilename(game);
  const file = typeof File === "function" ? new File([contents], filename, { type: "application/json" }) : null;
  if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: "Dark Tower game save", text: `Turn ${game.turn} backup`, files: [file] });
      showToast("Save shared successfully.");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Save file downloaded.");
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
    showToast("Save imported successfully.");
  } catch (error) {
    showError(error);
  }
}

function handleTowerAction(action) {
  if (!game) return;
  setTabletPane("tower");
  const locationActions = new Set(["move", "bazaar", "tomb", "sanctuary", "darktower", "frontier"]);
  if (preferences.interactiveBoard && locationActions.has(action)) {
    const player = currentPlayer(game);
    const space = spaceById(player.currentSpaceId);
    const expected = spaceAction(space);
    if (action !== expected) return showMessage("Use the matching location", `The pawn is at ${space?.label || "an unknown territory"}. Select a highlighted destination on the map, or press ${String(expected || "the matching button").toUpperCase()} to remain here.`);
    return runAction(() => enterBoardSpace(game, player.currentSpaceId));
  }
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
  if (!preferences.interactiveBoard) {
    const buttons = KINGDOMS.map((kingdom) => ({ label: kingdom, action: () => runAction(() => usePegasus(game, kingdom)) }));
    buttons.push({ label: "Cancel", action: closeModal });
    return showModal("Use Pegasus", "<p>Move the pawn to any legal territory in the selected kingdom.</p>", buttons);
  }
  pegasusTargetMode = !pegasusTargetMode;
  setTabletPane("map");
  renderAtlas();
  showToast(pegasusTargetMode ? "Pegasus flight: choose a blue-highlighted territory." : "Pegasus flight canceled.");
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
  $("#locationStatus").textContent = spaceLabel(player.currentSpaceId);
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
  $("#pegasusBtn").textContent = pegasusTargetMode ? "Cancel Pegasus Flight" : "Use Pegasus";

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
  publishSharedDisplay();
  if ($("#deviceDialog").open) updateDeviceDialog();
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
  updateWorkspaceMetrics();
}

function updateAtlasVisibility() {
  const visible = preferences.presentation === "deluxe" && preferences.showMap;
  $("#atlasPanel").classList.toggle("hidden", !visible);
  $(".game-layout")?.classList.toggle("atlas-hidden", !visible);
  $("#atlasToggleBtn").textContent = visible ? "Hide Map" : "Show Map";
  $("#atlasToggleBtn").disabled = preferences.presentation === "classic";
  updateTabletTabs();
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
  const legalSpaceIds = game && preferences.interactiveBoard && !pegasusTargetMode ? legalMovesForCurrentPlayer(game) : [];
  const pegasusSpaceIds = game && preferences.interactiveBoard && pegasusTargetMode ? pegasusMovesForCurrentPlayer(game) : [];
  map.innerHTML = atlasMarkup({ game, players: game?.players || [], currentPlayerId: player?.id || null, legalSpaceIds, pegasusSpaceIds, interactive: preferences.interactiveBoard });
  applyMapView();
  map.querySelectorAll("[data-kingdom-label]").forEach((node) => node.classList.toggle("current", Boolean(player && node.dataset.kingdomLabel === player.currentKingdom)));
  const defaultAtlasStatus = player ? `${player.name} · ${spaceLabel(player.currentSpaceId)}` : "Board preview";
  $("#atlasStatus").textContent = defaultAtlasStatus;
  map.querySelectorAll("[data-space-id]").forEach((node) => {
    const showFullLabel = () => {
      const space = spaceById(node.dataset.spaceId);
      if (space) $("#atlasStatus").textContent = `${space.label} · ${space.kingdom}`;
    };
    node.addEventListener("mouseenter", showFullLabel);
    node.addEventListener("focus", showFullLabel);
    node.addEventListener("mouseleave", () => { $("#atlasStatus").textContent = defaultAtlasStatus; });
    node.addEventListener("blur", () => { $("#atlasStatus").textContent = defaultAtlasStatus; });
  });
  $("#atlasNote").textContent = pegasusTargetMode
    ? "Pegasus flight: select any blue-highlighted legal territory."
    : preferences.interactiveBoard
      ? "Gold-highlighted territories are legal destinations. Hover or focus a territory to see its full name above the map."
      : "Manual-board mode: use the physical board and the Tower controls; the digital board is a reference.";
  $("#atlasNote").classList.toggle("flight-mode", pegasusTargetMode);
}

function handleAtlasClick(event) {
  if (suppressMapClick) { suppressMapClick = false; return; }
  const target = event.target.closest?.("[data-space-id]");
  if (!target || !game) return;
  const spaceId = target.dataset.spaceId;
  const destination = spaceById(spaceId);
  const player = currentPlayer(game);
  if (!destination) return;

  if (pegasusTargetMode) {
    const legal = new Set(pegasusMovesForCurrentPlayer(game));
    if (!legal.has(spaceId)) return showMessage("Pegasus cannot land there", boardMoveCheck(game, player, spaceId, { pegasus: true }).reason || "Choose a blue-highlighted territory.");
    return showModal("Fly with Pegasus", `<p>Fly from <strong>${escapeHtml(spaceLabel(player.currentSpaceId))}</strong> to <strong>${escapeHtml(destination.label)}</strong>?</p>`, [
      { label: "Fly", primary: true, action: () => { pegasusTargetMode = false; runAction(() => usePegasusToSpace(game, spaceId)); } },
      { label: "Cancel", action: closeModal },
    ]);
  }

  if (!preferences.interactiveBoard) {
    if (destination.kingdom !== player.currentKingdom && destination.type !== "frontier") return showMessage("Another kingdom", `The marker is currently in ${player.currentKingdom}.`);
    switch (destination.action) {
      case "move": return runAction(() => resolveMove(game));
      case "bazaar": return runAction(() => startBazaar(game));
      case "tomb": return runAction(() => resolveTombRuin(game));
      case "sanctuary": return runAction(() => resolveSanctuaryOrCitadel(game, destination.type === "citadel" ? "citadel" : "sanctuary"));
      case "frontier": return showFrontierPrompt();
      case "darktower": return runAction(() => beginDarkTower(game));
      default: return undefined;
    }
  }

  const check = boardMoveCheck(game, player, spaceId);
  if (!check.ok) return showMessage("That move is not legal", check.reason);
  const staying = spaceId === player.currentSpaceId;
  showModal(staying ? "Remain in this territory" : "Move pawn", `<p>${staying ? "Remain at" : "Move from <strong>" + escapeHtml(spaceLabel(player.currentSpaceId)) + "</strong> to"} <strong>${escapeHtml(destination.label)}</strong> and resolve its Tower action?</p>`, [
    { label: staying ? "Use This Location" : "Move Here", primary: true, action: () => runAction(() => enterBoardSpace(game, spaceId)) },
    { label: "Cancel", action: closeModal },
  ]);
}

function zoomMap(delta) {
  mapView.scale = Math.max(1, Math.min(2.6, Number((mapView.scale + delta).toFixed(2))));
  if (mapView.scale === 1) { mapView.x = 0; mapView.y = 0; }
  applyMapView();
}
function resetMapView() { mapView = { scale: 1, x: 0, y: 0 }; applyMapView(); }
function applyMapView() {
  const svg = $("#atlasMap .atlas-svg");
  if (!svg) return;
  const maxOffset = 240 * (mapView.scale - 1);
  mapView.x = Math.max(-maxOffset, Math.min(maxOffset, mapView.x));
  mapView.y = Math.max(-maxOffset, Math.min(maxOffset, mapView.y));
  svg.style.transform = `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.scale})`;
  $("#mapZoomReset").textContent = `${Math.round(mapView.scale * 100)}%`;
}
function handleMapWheel(event) { event.preventDefault(); zoomMap(event.deltaY < 0 ? .15 : -.15); }
function beginMapDrag(event) {
  if (mapView.scale <= 1) return;
  mapDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: mapView.x, originY: mapView.y, moved: false };
  $("#atlasMap").setPointerCapture?.(event.pointerId);
  $("#atlasMap").classList.add("dragging");
}
function continueMapDrag(event) {
  if (!mapDrag || event.pointerId !== mapDrag.pointerId) return;
  const dx = event.clientX - mapDrag.startX, dy = event.clientY - mapDrag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 5) mapDrag.moved = true;
  mapView.x = mapDrag.originX + dx;
  mapView.y = mapDrag.originY + dy;
  applyMapView();
}
function endMapDrag(event) {
  if (!mapDrag || event.pointerId !== mapDrag.pointerId) return;
  suppressMapClick = mapDrag.moved;
  mapDrag = null;
  $("#atlasMap").classList.remove("dragging");
}

function configureAdaptiveWorkspace() {
  updateWorkspaceMetrics();
  if ("ResizeObserver" in window) {
    workspaceResizeObserver = new ResizeObserver(() => updateWorkspaceMetrics());
    workspaceResizeObserver.observe($(".topbar"));
  }
}
function updateWorkspaceMetrics() {
  const topbar=$(".topbar"), main=$("main"); if (!topbar || !main) return;
  const style=getComputedStyle(main); const pad=parseFloat(style.paddingTop||"0")+parseFloat(style.paddingBottom||"0");
  const available=window.innerHeight-topbar.getBoundingClientRect().height-pad-8;
  document.documentElement.style.setProperty("--workspace-height",`${Math.max(560,Math.floor(available))}px`);
}
function applyWorkspaceLayout({ persist=true }={}) {
  workspaceLayout=normalizeWorkspaceLayout(workspaceLayout); const root=document.documentElement;
  root.style.setProperty("--atlas-track",`${workspaceLayout.atlas}fr`); root.style.setProperty("--tower-track",`${workspaceLayout.tower}fr`); root.style.setProperty("--side-track",`${workspaceLayout.side}fr`); root.style.setProperty("--player-track",`${workspaceLayout.player}fr`); root.style.setProperty("--chronicle-track",`${100-workspaceLayout.player}fr`);
  if (persist) workspaceLayout=saveWorkspaceLayout(workspaceLayout); updateLayoutDialog(); requestAnimationFrame(()=>{ applyMapView(); if (tutorialIndex>=0) ensureTutorialTargetVisible(); });
}
function openLayoutDialog(){ updateLayoutDialog(); if (!$("#layoutDialog").open) $("#layoutDialog").showModal(); }
function closeLayoutDialog(){ if ($("#layoutDialog").open) $("#layoutDialog").close(); }
function applyLayoutPreset(name){ workspaceLayout=workspacePreset(name); applyWorkspaceLayout(); }
function updateLayoutDialog(){ if ($("#layoutReadout")) $("#layoutReadout").textContent=layoutReadout(workspaceLayout); $$(`[data-layout-preset]`).forEach(b=>b.classList.toggle("active",b.dataset.layoutPreset===workspaceLayout.preset)); }
function beginSplitterDrag(event){ if (matchMedia("(max-width: 1180px)").matches) return; const s=event.currentTarget,h=s.dataset.layoutHandle,g=$(".game-layout").getBoundingClientRect(),side=$(".side-column").getBoundingClientRect(); splitterDrag={handle:h,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,initial:{...workspaceLayout},gameWidth:Math.max(1,g.width-20),sideHeight:Math.max(1,side.height-10)}; s.setPointerCapture?.(event.pointerId); s.classList.add("dragging"); document.body.classList.add("resizing-layout"); document.body.dataset.resizeAxis=h==="player-log"?"row":"column"; event.preventDefault(); }
function continueSplitterDrag(event){ if (!splitterDrag||event.pointerId!==splitterDrag.pointerId) return; const delta=splitterDrag.handle==="player-log"?((event.clientY-splitterDrag.startY)/splitterDrag.sideHeight)*100:((event.clientX-splitterDrag.startX)/splitterDrag.gameWidth)*100; workspaceLayout=adjustWorkspaceLayout(splitterDrag.initial,splitterDrag.handle,delta); applyWorkspaceLayout({persist:false}); }
function endSplitterDrag(event){ if (!splitterDrag||event.pointerId!==splitterDrag.pointerId) return; event.currentTarget.classList.remove("dragging"); splitterDrag=null; document.body.classList.remove("resizing-layout"); delete document.body.dataset.resizeAxis; workspaceLayout=saveWorkspaceLayout(workspaceLayout); applyWorkspaceLayout({persist:false}); }
function handleSplitterKeyboard(event){ const h=event.currentTarget.dataset.layoutHandle, vertical=h==="player-log", negative=vertical?event.key==="ArrowUp":event.key==="ArrowLeft", positive=vertical?event.key==="ArrowDown":event.key==="ArrowRight"; if(!negative&&!positive)return; event.preventDefault(); workspaceLayout=adjustWorkspaceLayout(workspaceLayout,h,negative?-2:2); applyWorkspaceLayout(); }

function openSettings() {
  $("#settingsPresentation").value = preferences.presentation;
  $("#settingsMap").checked = preferences.showMap;
  $("#settingsInteractiveBoard").checked = preferences.interactiveBoard;
  $("#settingsSound").checked = preferences.soundEffects;
  $("#settingsMusic").checked = preferences.ambientMusic;
  $("#settingsVolume").value = String(preferences.volume);
  $("#settingsReducedMotion").checked = preferences.reducedMotion;
  $("#settingsContrast").checked = preferences.highContrast;
  $("#settingsLargeText").checked = preferences.largeText;
  $("#settingsKeepAwake").checked = preferences.keepAwake;
  if (!$("#settingsDialog").open) $("#settingsDialog").showModal();
}

function closeSettings() { if ($("#settingsDialog").open) $("#settingsDialog").close(); }

function applySettingsFromDialog() {
  preferences = savePreferences({
    ...preferences,
    presentation: $("#settingsPresentation").value,
    showMap: $("#settingsMap").checked,
    interactiveBoard: $("#settingsInteractiveBoard").checked,
    soundEffects: $("#settingsSound").checked,
    ambientMusic: $("#settingsMusic").checked,
    volume: Number($("#settingsVolume").value),
    reducedMotion: $("#settingsReducedMotion").checked,
    highContrast: $("#settingsContrast").checked,
    largeText: $("#settingsLargeText").checked,
    keepAwake: $("#settingsKeepAwake").checked,
  });
  applyPresentationSettings();
  syncWakeLock();
  sound.unlock();
  sound.playCue("sanctuary");
  closeSettings();
}

function resetSettings() {
  preferences = savePreferences({ ...DEFAULT_PREFERENCES, tutorialSeen: preferences.tutorialSeen });
  applyPresentationSettings();
  syncWakeLock();
  openSettings();
}

function startTutorial() {
  if (!game) return showMessage("Begin a game first", "The guided tour highlights the live game screen after a quest begins.");
  closeSettings(); closeManual(); closeModal(); closeLayoutDialog();
  tutorialIndex = 0;
  document.body.classList.add("tutorial-open");
  updateWorkspaceMetrics();
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
  requestAnimationFrame(ensureTutorialTargetVisible);
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
  document.body.classList.remove("tutorial-open");
  tutorialIndex = -1;
  updateWorkspaceMetrics();
  if (markSeen) preferences = savePreferences({ ...preferences, tutorialSeen: true });
}

function ensureTutorialTargetVisible() {
  if (!tutorialTarget) return;
  tutorialTarget.scrollIntoView({ block: "center", inline: "nearest", behavior: preferences.reducedMotion ? "auto" : "smooth" });
}

function handleKeyboardShortcuts(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (key === "m") openManual();
  else if (key === "g") openSettings();
  else if (key === "t" && game) startTutorial();
  else if (key === "escape") { closeLayoutDialog(); closeSettings(); closeDeviceDialog(); closeManual(); closeTutorial(false); closeModal(); }
}


function configurePlatformFeatures() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateDeviceDialog();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateDeviceDialog();
    showToast("Dark Tower was installed.");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    syncWakeLock();
    publishSharedDisplay();
  });
  document.addEventListener("fullscreenchange", updateDeviceDialog);
  window.addEventListener("resize", () => {
    updateTabletTabs();
    updateWorkspaceMetrics();
    window.clearTimeout(tutorialResizeTimer);
    tutorialResizeTimer = window.setTimeout(() => { if (tutorialIndex >= 0) ensureTutorialTargetVisible(); }, 120);
  });
  if ("BroadcastChannel" in window) {
    displayChannel = new BroadcastChannel(SHARED_DISPLAY_CHANNEL);
    displayChannel.addEventListener("message", (event) => {
      if (event.data?.type === "request") publishSharedDisplay();
    });
  }
}

function setTabletPane(pane, { scroll = true } = {}) {
  const allowed = ["map", "tower", "player", "log"];
  let next = allowed.includes(pane) ? pane : "tower";
  const atlasVisible = preferences.presentation === "deluxe" && preferences.showMap;
  if (next === "map" && !atlasVisible) next = "tower";
  tabletPane = next;
  sessionStorage.setItem("darkTowerOpenCompanion.tabletPane", next);
  $("#gameScreen").dataset.pane = next;
  $$('[data-tablet-pane]').forEach((button) => {
    button.classList.toggle("active", button.dataset.tabletPane === next);
    button.setAttribute("aria-pressed", String(button.dataset.tabletPane === next));
  });
  updateTabletTabs();
  if (scroll && matchMedia("(max-width: 900px)").matches) {
    $("#gameScreen").scrollIntoView({ block: "start", behavior: preferences.reducedMotion ? "auto" : "smooth" });
  }
}

function updateTabletTabs() {
  const atlasVisible = preferences.presentation === "deluxe" && preferences.showMap;
  const mapButton = $('[data-tablet-pane="map"]');
  if (mapButton) mapButton.disabled = !atlasVisible;
  if (!atlasVisible && tabletPane === "map") setTabletPane("tower", { scroll: false });
}

function desktopAppDetected() {
  return Boolean(window.__TAURI_INTERNALS__) || location.hostname === "tauri.localhost" || location.protocol === "tauri:";
}

function openDeviceDialog() {
  updateDeviceDialog();
  if (!$("#deviceDialog").open) $("#deviceDialog").showModal();
}

function closeDeviceDialog() { if ($("#deviceDialog").open) $("#deviceDialog").close(); }

function updateDeviceDialog() {
  const standalone = isStandalone({ isTauri: desktopAppDetected() });
  const appleMobile = isAppleMobile();
  $("#installStatus").textContent = installMessage({
    appleMobile,
    standalone,
    installPromptAvailable: Boolean(deferredInstallPrompt),
    desktopApp: desktopAppDetected(),
  });
  $("#installBtn").textContent = deferredInstallPrompt ? "Install This App" : "Show Installation Instructions";
  $("#installBtn").disabled = desktopAppDetected() || standalone;
  $("#deviceShareSave").disabled = !game;
  $("#openDisplayBtn").disabled = !game;
  $("#deviceKeepAwake").checked = preferences.keepAwake;
  $("#deviceKeepAwake").disabled = !navigator.wakeLock?.request;
  $("#fullscreenBtn").textContent = document.fullscreenElement ? "Exit Full Screen" : "Enter Full Screen";
  $("#fullscreenBtn").disabled = !document.documentElement.requestFullscreen && !document.fullscreenElement;
  const lines = [];
  if (appleMobile && !standalone) lines.push("For iPad: use Safari—not an in-app browser—then tap Share → Add to Home Screen.");
  if (!navigator.wakeLock?.request) lines.push("This browser does not expose the screen wake-lock control; use the device's Auto-Lock setting if needed.");
  lines.push(
    desktopAppDetected()
      ? "The Windows edition opens the Shared Tower as a native second window; browser popup permissions and ad blockers are not used."
      : "The browser/iPad edition opens the Shared Tower in a second browser window, so popup permission may be required."
  );
  $("#deviceHint").innerHTML = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

async function installApp() {
  if (deferredInstallPrompt) {
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch {}
    deferredInstallPrompt = null;
    updateDeviceDialog();
    return;
  }
  const apple = isAppleMobile();
  showMessage(
    "Install Dark Tower",
    apple
      ? "Open the GitHub Pages version in Safari. Tap the Share button, choose Add to Home Screen, and open the new icon."
      : "Open the browser menu and choose Install app, Apps → Install, or Create shortcut. The wording varies by browser.",
  );
}

async function applyDeviceWakePreference() {
  preferences = savePreferences({ ...preferences, keepAwake: $("#deviceKeepAwake").checked });
  $("#settingsKeepAwake").checked = preferences.keepAwake;
  await syncWakeLock();
  updateDeviceDialog();
}

async function syncWakeLock() {
  const shouldLock = Boolean(game && game.status === "playing" && preferences.keepAwake && !document.hidden);
  if (!shouldLock || !navigator.wakeLock?.request) return releaseWakeLock();
  if (wakeLockSentinel && !wakeLockSentinel.released) return;
  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => { wakeLockSentinel = null; updateDeviceDialog(); });
  } catch {
    wakeLockSentinel = null;
  }
  updateDeviceDialog();
}

async function releaseWakeLock() {
  const sentinel = wakeLockSentinel;
  wakeLockSentinel = null;
  try { await sentinel?.release?.(); } catch {}
  updateDeviceDialog();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch {
    showToast("Full screen is unavailable in this browser.");
  }
  updateDeviceDialog();
}

function publishSharedDisplay(snapshot = undefined) {
  if (snapshot === null) {
    localStorage.removeItem(SHARED_DISPLAY_KEY);
    displayChannel?.postMessage({ type: "state", snapshot: null });
    return;
  }
  if (!game) return;
  const player = currentPlayer(game);
  const payload = sharedDisplaySnapshot(game, player, classifyDisplay(game.display, game.pending, game.status));
  try { localStorage.setItem(SHARED_DISPLAY_KEY, JSON.stringify(payload)); } catch {}
  displayChannel?.postMessage({ type: "state", snapshot: payload });
}

async function openSharedDisplay() {
  if (!game) return;
  publishSharedDisplay();

  const nativeInvoke = window.__TAURI__?.core?.invoke;
  if (desktopAppDetected() && nativeInvoke) {
    try {
      await nativeInvoke("show_shared_display");
      window.setTimeout(publishSharedDisplay, 180);
      showToast("Native Shared Tower display opened.");
      return;
    } catch (error) {
      return showMessage(
        "Shared display could not open",
        `The native display window could not be created. ${String(error || "Unknown desktop error.")}`,
      );
    }
  }

  const popup = window.open(
    new URL("display.html", location.href),
    "darkTowerSharedDisplay",
    "popup,width=980,height=900",
  );
  if (!popup) {
    return showMessage(
      "Popup blocked",
      "The browser edition needs permission to open a second window. Allow popups for this site and try again.",
    );
  }
  window.setTimeout(publishSharedDisplay, 250);
  showToast("Shared Tower display opened.");
}

function showToast(message) {
  const toast = $("#appToast");
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimer = window.setTimeout(() => toast.classList.add("hidden"), 2600);
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
