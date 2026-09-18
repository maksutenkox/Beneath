export const AUDIO_CATEGORIES = Object.freeze([
  "music", "ambient", "footsteps", "doors", "equipment", "ui", "npc", "effects"
]);

export const DEFAULT_AUDIO_LEVELS = Object.freeze({
  master: .55, music: .35, ambient: .4, footsteps: .65,
  doors: .75, equipment: .55, ui: .55, npc: .6, effects: .7
});

export const AUDIO_CUES = Object.freeze({
  footstep: { category: "footsteps" }, doorMove: { category: "doors" },
  equipmentUse: { category: "equipment" }, uiAction: { category: "ui" },
  npcTalk: { category: "npc" }, repair: { category: "effects" },
  bunkerHum: { category: "ambient" }, bunkerTheme: { category: "music" }
});

export class AudioSystem {
  constructor(output, levels = DEFAULT_AUDIO_LEVELS) { this.output = output; this.levels = { ...DEFAULT_AUDIO_LEVELS, ...levels }; }
  unlock() { return this.output.unlock?.(); }
  setLevel(category, value) {
    if (category !== "master" && !AUDIO_CATEGORIES.includes(category)) return false;
    this.levels[category] = Math.max(0, Math.min(1, Number(value)));
    return true;
  }
  play(cue, options = {}) {
    const definition = AUDIO_CUES[cue];
    if (!definition) return false;
    const category = definition.category;
    const gain = this.levels.master * this.levels[category] * (options.gain ?? 1);
    if (gain <= 0) return false;
    this.output.play(cue, { ...options, category, gain });
    return true;
  }
  snapshot() { return { ...this.levels }; }
  restore(levels = {}) { for (const [category, value] of Object.entries(levels)) this.setLevel(category, value); }
}
