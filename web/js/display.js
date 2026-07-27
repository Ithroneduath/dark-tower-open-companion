import { APP_VERSION } from "./rules.js";
import { SHARED_DISPLAY_CHANNEL, SHARED_DISPLAY_KEY, parseSharedDisplay } from "./platform.js";

const $ = (selector) => document.querySelector(selector);
let channel = null;
let wakeLock = null;

function render(snapshot) {
  if (!snapshot) {
    $("#sharedIcon").textContent = "◆";
    $("#sharedTitle").textContent = "WAITING FOR THE TOWER";
    $("#sharedNumber").textContent = "--";
    $("#sharedText").textContent = "Open this window from Device & iPad in the main companion app.";
    $("#sharedTowerDisplay").dataset.effect = "idle";
    $("#sharedPlayer").textContent = "Waiting…";
    for (const id of ["sharedTurn", "sharedKingdom", "sharedWarriors", "sharedGold", "sharedFood", "sharedKeys"]) $("#" + id).textContent = "—";
    $("#sharedStatus").textContent = "Waiting for a live game on this browser and device.";
    return;
  }
  const { display, player, game } = snapshot;
  document.title = `Dark Tower Shared Display v${APP_VERSION}`;
  $("#sharedIcon").textContent = display.icon;
  $("#sharedTitle").textContent = display.title;
  $("#sharedNumber").textContent = display.number;
  $("#sharedText").textContent = display.text;
  $("#sharedTowerDisplay").dataset.effect = display.effect || "idle";
  $("#sharedPlayer").textContent = `${player.name} · P${player.id}`;
  $("#sharedTurn").textContent = String(game.turn);
  $("#sharedKingdom").textContent = player.kingdom || "—";
  $("#sharedWarriors").textContent = String(player.warriors);
  $("#sharedGold").textContent = String(player.gold);
  $("#sharedFood").textContent = String(player.food);
  $("#sharedKeys").textContent = `${player.keys} / 3`;
  $("#sharedStatus").textContent = `Live update received ${new Date(snapshot.updatedAt).toLocaleTimeString()}.`;
}

function readStored() {
  render(parseSharedDisplay(localStorage.getItem(SHARED_DISPLAY_KEY)));
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch {}
  updateButtons();
}

async function toggleAwake() {
  if (wakeLock) {
    try { await wakeLock.release(); } catch {}
    wakeLock = null;
  } else if (navigator.wakeLock?.request) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; updateButtons(); });
    } catch {}
  }
  updateButtons();
}

function updateButtons() {
  $("#displayFullscreen").textContent = document.fullscreenElement ? "Exit Full Screen" : "Full Screen";
  $("#displayFullscreen").disabled = !document.documentElement.requestFullscreen && !document.fullscreenElement;
  $("#displayAwake").textContent = wakeLock ? "Release Screen" : "Keep Awake";
  $("#displayAwake").disabled = !navigator.wakeLock?.request;
}

function initialize() {
  readStored();
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(SHARED_DISPLAY_CHANNEL);
    channel.addEventListener("message", (event) => {
      if (event.data?.type === "state") render(parseSharedDisplay(event.data.snapshot));
    });
    channel.postMessage({ type: "request" });
  }
  window.addEventListener("storage", (event) => {
    if (event.key === SHARED_DISPLAY_KEY) render(parseSharedDisplay(event.newValue));
  });
  document.addEventListener("fullscreenchange", updateButtons);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) readStored(); });
  $("#displayFullscreen").addEventListener("click", toggleFullscreen);
  $("#displayAwake").addEventListener("click", toggleAwake);
  updateButtons();
}

initialize();
