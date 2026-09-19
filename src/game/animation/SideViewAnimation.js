export const SIDE_VIEW_CLIPS = Object.freeze({
  idle: Object.freeze({ row: 0, start: 0, frames: 8, fps: 6, loop: true }),
  run: Object.freeze({ row: 1, start: 0, frames: 8, fps: 12, loop: true }),
  jump_start: Object.freeze({ row: 2, start: 0, frames: 2, fps: 14, loop: false }),
  jump: Object.freeze({ row: 2, start: 2, frames: 3, fps: 8, loop: false }),
  fall: Object.freeze({ row: 2, start: 4, frames: 2, fps: 7, loop: true }),
  land: Object.freeze({ row: 2, start: 6, frames: 2, fps: 14, loop: false }),
  attack_1: Object.freeze({ row: 3, start: 0, frames: 8, fps: 20, loop: false }),
  interact: Object.freeze({ row: 4, start: 0, frames: 2, fps: 8, loop: false }),
  terminal: Object.freeze({ row: 4, start: 1, frames: 1, fps: 0, loop: false }),
  pickup: Object.freeze({ row: 4, start: 2, frames: 1, fps: 0, loop: false }),
  hurt: Object.freeze({ row: 4, start: 3, frames: 2, fps: 12, loop: false }),
  death: Object.freeze({ row: 4, start: 5, frames: 3, fps: 8, loop: false })
});
export function sideViewFrameAt(state, time, clips = SIDE_VIEW_CLIPS) {
  const resolved = clips[state] ?? clips.idle;
  const raw = resolved.fps > 0 ? Math.floor(Math.max(0, time) * resolved.fps) : 0;
  const local = resolved.loop ? raw % resolved.frames : Math.min(resolved.frames - 1, raw);
  return { state: clips[state] ? state : "idle", row: resolved.row, column: resolved.start + local, localFrame: local };
}
