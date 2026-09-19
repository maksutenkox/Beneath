export const ENEMY_CLIPS = Object.freeze({
  idle: Object.freeze({ row: 0, start: 0, frames: 8, fps: 5, loop: true }),
  walk: Object.freeze({ row: 1, start: 0, frames: 8, fps: 9, loop: true }),
  attack: Object.freeze({ row: 2, start: 0, frames: 8, fps: 15, loop: false }),
  hurt: Object.freeze({ row: 3, start: 0, frames: 3, fps: 12, loop: false }),
  death: Object.freeze({ row: 3, start: 3, frames: 5, fps: 8, loop: false })
});

export function enemyFrameAt(state, time) {
  const clip = ENEMY_CLIPS[state] ?? ENEMY_CLIPS.idle;
  const raw = Math.floor(Math.max(0, time) * clip.fps);
  const local = clip.loop ? raw % clip.frames : Math.min(clip.frames - 1, raw);
  return { row: clip.row, column: clip.start + local };
}
