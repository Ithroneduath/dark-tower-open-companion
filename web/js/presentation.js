export const PREFERENCES_KEY = "darkTowerOpenCompanion.presentation.v1";

export const DEFAULT_PREFERENCES = Object.freeze({
  presentation: "deluxe",
  showMap: true,
  soundEffects: true,
  ambientMusic: false,
  volume: 0.55,
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  tutorialSeen: false,
});

export function normalizePreferences(value = {}) {
  const presentation = value.presentation === "classic" ? "classic" : "deluxe";
  const volume = Math.max(0, Math.min(1, Number(value.volume ?? DEFAULT_PREFERENCES.volume)));
  return {
    presentation,
    showMap: value.showMap !== false,
    soundEffects: value.soundEffects !== false,
    ambientMusic: Boolean(value.ambientMusic),
    volume: Number.isFinite(volume) ? volume : DEFAULT_PREFERENCES.volume,
    reducedMotion: Boolean(value.reducedMotion),
    highContrast: Boolean(value.highContrast),
    largeText: Boolean(value.largeText),
    tutorialSeen: Boolean(value.tutorialSeen),
  };
}

export function loadPreferences(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(PREFERENCES_KEY);
    return normalizePreferences(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizePreferences();
  }
}

export function savePreferences(preferences, storage = globalThis.localStorage) {
  const normalized = normalizePreferences(preferences);
  try { storage?.setItem?.(PREFERENCES_KEY, JSON.stringify(normalized)); } catch {}
  return normalized;
}

export function applyPreferences(preferences, root = globalThis.document?.documentElement) {
  const normalized = normalizePreferences(preferences);
  if (!root) return normalized;
  root.dataset.presentation = normalized.presentation;
  root.dataset.motion = normalized.reducedMotion ? "reduced" : "full";
  root.dataset.contrast = normalized.highContrast ? "high" : "standard";
  root.dataset.text = normalized.largeText ? "large" : "standard";
  return normalized;
}

export function classifyDisplay(display = {}, pending = null, status = "playing") {
  if (status === "won") return "victory";
  if (status === "lost") return "defeat";
  if (pending?.type === "battle") return pending.final ? "final-battle" : "battle";
  if (pending?.type === "bazaar") return "bazaar";
  if (pending?.type === "riddle") return "riddle";
  if (pending?.type === "wizard") return "wizard";
  if (pending?.type === "illegalMove") return "warning";

  const title = String(display.title || "").toLowerCase();
  const icon = String(display.icon || "");
  if (title.includes("victory") || title.includes("scepter")) return "victory";
  if (title.includes("dragon") || icon.includes("🐉")) return "dragon";
  if (title.includes("brigand") || title.includes("battle") || title.includes("defeat")) return "battle";
  if (title.includes("gold") || title.includes("treasure") || title.includes("key") || title.includes("pegasus") || title.includes("sword")) return "treasure";
  if (title.includes("plague") || title.includes("curse")) return "plague";
  if (title.includes("lost")) return "lost";
  if (title.includes("bazaar") || title.includes("haggle") || title.includes("merchant")) return "bazaar";
  if (title.includes("sanctuary") || title.includes("citadel") || title.includes("healer")) return "sanctuary";
  if (title.includes("frontier")) return "frontier";
  if (title.includes("riddle")) return "riddle";
  if (title.includes("tower")) return "tower";
  if (title.includes("safe") || title.includes("next adventurer")) return "safe";
  return "idle";
}

const CUES = Object.freeze({
  tap: [[520, .045], [680, .035]],
  safe: [[440, .08], [550, .10]],
  battle: [[155, .08], [125, .09], [190, .10]],
  "final-battle": [[110, .12], [165, .12], [220, .16]],
  dragon: [[92, .18], [72, .18], [138, .24]],
  treasure: [[660, .08], [880, .10], [1100, .16]],
  plague: [[260, .14], [220, .16], [174, .20]],
  lost: [[410, .09], [310, .12], [230, .18]],
  bazaar: [[392, .07], [494, .07], [587, .10]],
  sanctuary: [[523, .12], [659, .12], [784, .18]],
  frontier: [[330, .08], [440, .08], [660, .12]],
  riddle: [[247, .10], [370, .10], [554, .18]],
  warning: [[180, .12], [180, .12]],
  wizard: [[300, .09], [450, .09], [675, .16]],
  tower: [[196, .12], [294, .12], [392, .18]],
  victory: [[523, .12], [659, .12], [784, .12], [1046, .28]],
  defeat: [[220, .15], [165, .18], [110, .30]],
});

export class SoundEngine {
  constructor(preferences = DEFAULT_PREFERENCES) {
    this.preferences = normalizePreferences(preferences);
    this.context = null;
    this.ambientNodes = [];
  }

  setPreferences(preferences) {
    this.preferences = normalizePreferences(preferences);
    if (!this.preferences.ambientMusic || this.preferences.presentation === "classic") this.stopAmbient();
    else if (this.context) this.startAmbient();
  }

  async unlock() {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.context) this.context = new AudioContextClass();
    if (this.context.state === "suspended") await this.context.resume();
    if (this.preferences.ambientMusic && this.preferences.presentation === "deluxe") this.startAmbient();
    return true;
  }

  playCue(name) {
    if (!this.preferences.soundEffects || !this.context) return;
    const pattern = CUES[name] || CUES.tap;
    let offset = 0;
    for (const [frequency, duration] of pattern) {
      this.tone(frequency, duration, offset);
      offset += duration * 0.82;
    }
  }

  tone(frequency, duration, offset = 0) {
    const ctx = this.context;
    const start = ctx.currentTime + offset;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.preferences.volume * 0.12), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  startAmbient() {
    if (!this.context || this.ambientNodes.length || !this.preferences.ambientMusic || this.preferences.presentation !== "deluxe") return;
    const ctx = this.context;
    const master = ctx.createGain();
    master.gain.value = this.preferences.volume * 0.018;
    master.connect(ctx.destination);
    const frequencies = [55, 82.41, 110];
    for (const [index, frequency] of frequencies.entries()) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? .7 : .18;
      oscillator.connect(gain).connect(master);
      oscillator.start();
      this.ambientNodes.push(oscillator, gain);
    }
    this.ambientNodes.push(master);
  }

  stopAmbient() {
    for (const node of this.ambientNodes) {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    }
    this.ambientNodes = [];
  }
}
