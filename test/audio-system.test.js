import test from "node:test";
import assert from "node:assert/strict";
import { AudioSystem, AUDIO_CATEGORIES, AUDIO_CUES } from "../src/game/audio/AudioSystem.js";

class FakeOutput { calls = []; play(cue, options) { this.calls.push({ cue, options }); } unlock() { return true; } }

test("audio exposes all requested independently adjustable categories", () => {
  assert.deepEqual(AUDIO_CATEGORIES, ["music", "ambient", "footsteps", "doors", "equipment", "ui", "npc", "effects"]);
  for (const category of AUDIO_CATEGORIES) assert.ok(Object.values(AUDIO_CUES).some((cue) => cue.category === category));
});

test("category and master levels combine without changing cue definitions", () => {
  const output = new FakeOutput();
  const audio = new AudioSystem(output);
  audio.setLevel("master", .5);
  audio.setLevel("doors", .4);
  assert.equal(audio.play("doorMove"), true);
  assert.equal(output.calls[0].options.gain, .2);
  assert.equal(audio.play("unknown"), false);
});

test("audio settings can be snapshotted and restored", () => {
  const audio = new AudioSystem(new FakeOutput());
  audio.setLevel("music", .12);
  const snapshot = audio.snapshot();
  const restored = new AudioSystem(new FakeOutput());
  restored.restore(snapshot);
  assert.equal(restored.snapshot().music, .12);
});
