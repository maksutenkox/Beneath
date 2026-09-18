export const CHARACTER_DIRECTIONS = [
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
  "east",
  "south-east"
];

export const DEFAULT_CHARACTER_CLIPS = Object.freeze({
  idle: Object.freeze({ startColumn: 0, frames: 4, fps: 4, loop: true }),
  walk: Object.freeze({ startColumn: 4, frames: 8, fps: 9, loop: true })
});

const ALIASES = Object.freeze({
  "south-east": "south-east",
  southeast: "south-east",
  se: "south-east",
  "south-west": "south-west",
  southwest: "south-west",
  sw: "south-west",
  "north-east": "north-east",
  northeast: "north-east",
  ne: "north-east",
  "north-west": "north-west",
  northwest: "north-west",
  nw: "north-west",
  n: "north",
  s: "south",
  e: "east",
  w: "west"
});

export function normalizeCharacterDirection(direction = "south") {
  const normalized = String(direction).toLowerCase().trim();
  if (CHARACTER_DIRECTIONS.includes(normalized)) return normalized;
  return ALIASES[normalized] ?? "south";
}

export function characterFrameAt({ state = "idle", direction = "south", time = 0, clips = DEFAULT_CHARACTER_CLIPS } = {}) {
  const clip = clips[state] ?? clips.idle ?? DEFAULT_CHARACTER_CLIPS.idle;
  const safeFrames = Math.max(1, Number(clip.frames) || 1);
  const safeFps = Math.max(0, Number(clip.fps) || 0);
  const rawFrame = safeFps > 0 ? Math.floor(Math.max(0, time) * safeFps) : 0;
  const localFrame = clip.loop === false ? Math.min(safeFrames - 1, rawFrame) : rawFrame % safeFrames;
  const normalizedDirection = normalizeCharacterDirection(direction);
  const row = Math.max(0, CHARACTER_DIRECTIONS.indexOf(normalizedDirection));

  return {
    state: clips[state] ? state : "idle",
    direction: normalizedDirection,
    row,
    column: (Number(clip.startColumn) || 0) + localFrame,
    localFrame
  };
}
