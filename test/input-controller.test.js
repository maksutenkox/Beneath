import test from "node:test";
import assert from "node:assert/strict";
import { InputController } from "../src/game/input/InputController.js";

test("movement vectors support idle, cardinal and normalized diagonal movement", () => {
  const input = new InputController({});
  assert.deepEqual(input.vector(), { x: 0, y: 0 });
  input.active.add("east");
  assert.deepEqual(input.vector(), { x: 1, y: 0 });
  input.active.add("north");
  const diagonal = input.vector();
  assert.ok(Math.abs(diagonal.x - Math.SQRT1_2) < 0.0001);
  assert.ok(Math.abs(diagonal.y + Math.SQRT1_2) < 0.0001);
});

test("analog input preserves direction and partial movement strength", () => {
  const input = new InputController({});
  input.analog = { x: .25, y: -.5 };
  assert.deepEqual(input.vector(), { x: .25, y: -.5 });
});

test("interaction presses are consumed once", () => {
  const input = new InputController({});
  input.interactions = 1;
  assert.equal(input.consumeInteraction(), true);
  assert.equal(input.consumeInteraction(), false);
});
