import test from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTER_DIRECTIONS,
  characterFrameAt,
  normalizeCharacterDirection
} from "../src/game/animation/CharacterAnimation.js";
import { CharacterSpriteSheet } from "../src/game/rendering/CharacterSpriteSheet.js";

test("character direction aliases normalize to the eight authored directions", () => {
  assert.equal(CHARACTER_DIRECTIONS.length, 8);
  assert.equal(normalizeCharacterDirection("NE"), "north-east");
  assert.equal(normalizeCharacterDirection("southwest"), "south-west");
  assert.equal(normalizeCharacterDirection("unknown"), "south");
});

test("idle and walk clips select stable atlas columns", () => {
  assert.deepEqual(characterFrameAt({ state: "idle", direction: "south", time: 0 }), {
    state: "idle", direction: "south", row: 0, column: 0, localFrame: 0
  });
  assert.equal(characterFrameAt({ state: "walk", direction: "east", time: 0 }).column, 4);
  assert.equal(characterFrameAt({ state: "walk", direction: "east", time: 1 }).column, 5);
  assert.equal(characterFrameAt({ state: "walk", direction: "north", time: 0 }).row, 4);
});

test("sprite sheet loader can fail cleanly so procedural fallback remains usable", async () => {
  const sheet = new CharacterSpriteSheet({
    url: "/missing.png",
    imageFactory: () => {
      const image = {};
      queueMicrotask(() => image.onerror?.());
      return image;
    }
  });
  assert.equal(await sheet.load(), false);
  assert.equal(sheet.ready, false);
  assert.equal(sheet.failed, true);
});
