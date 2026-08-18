export const TUTORIAL_STEPS = Object.freeze([
  { selector: "#layoutBtn", title: "Adaptive Workspace", body: "The app opens maximized on desktop. Use Layout presets or drag the dividers to resize the map, Tower, dashboard, Current Adventurer, and Chronicle. Your proportions are remembered." },
  { selector: "#atlasPanel", title: "The Deluxe Atlas", body: "This reconstructed full board follows the original circular kingdom structure and landmark placement. Gold outlines show adjacent legal moves; zoom or drag the map for a closer view." },
  { selector: "#towerPanel .display", title: "Animated Tower Window", body: "The display now changes lighting and motion for battles, treasure, dragons, danger, and victory. Reduced Motion is available in Settings." },
  { selector: "#towerPanel .keypad", title: "Classic Keyboard", body: "The twelve tower buttons remain the primary controls. YES fights or buys; NO retreats, skips an offer, or ends a completed turn." },
  { selector: ".player-panel", title: "Player Dashboard", body: "Resources, keys, possessions, kingdom, frontier progress, and the hidden Tower force are tracked here." },
  { selector: "#manualBtn", title: "Rules at Any Time", body: "Open the searchable paraphrased manual whenever a question comes up. Relevant Rule jumps to the current event." },
  { selector: "#settingsBtn", title: "Classic or Deluxe", body: "Settings control presentation style, map visibility, synthesized sound, ambient music, contrast, text size, motion, and screen wake lock." },
  { selector: "#deviceBtn", title: "iPad and Display Tools", body: "Install the web app, share save files through Files or iCloud, keep the screen awake, enter full screen, or open a display-only Tower window." },
]);

export function tutorialStep(index) {
  const normalized = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Number(index) || 0));
  return { ...TUTORIAL_STEPS[normalized], index: normalized, total: TUTORIAL_STEPS.length };
}
