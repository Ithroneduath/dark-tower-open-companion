export const TUTORIAL_STEPS = Object.freeze([
  { selector: "#atlasPanel", title: "The Deluxe Atlas", body: "This original map is a landmark navigator, not an exact reproduction of the vintage board. Select a landmark in the current kingdom to use the matching tower function." },
  { selector: "#towerPanel .display", title: "Animated Tower Window", body: "The display now changes lighting and motion for battles, treasure, dragons, danger, and victory. Reduced Motion is available in Settings." },
  { selector: "#towerPanel .keypad", title: "Classic Keyboard", body: "The twelve tower buttons remain the primary controls. YES fights or buys; NO retreats, skips an offer, or ends a completed turn." },
  { selector: ".player-panel", title: "Player Dashboard", body: "Resources, keys, possessions, kingdom, frontier progress, and the hidden Tower force are tracked here." },
  { selector: "#manualBtn", title: "Rules at Any Time", body: "Open the searchable paraphrased manual whenever a question comes up. Relevant Rule jumps to the current event." },
  { selector: "#settingsBtn", title: "Classic or Deluxe", body: "Settings control presentation style, map visibility, synthesized sound, ambient music, contrast, text size, and motion." },
]);

export function tutorialStep(index) {
  const normalized = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Number(index) || 0));
  return { ...TUTORIAL_STEPS[normalized], index: normalized, total: TUTORIAL_STEPS.length };
}
