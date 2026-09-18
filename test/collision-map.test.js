import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";
import { CollisionMap } from "../src/game/physics/CollisionMap.js";

const collision = new CollisionMap(shelterMap);

test("floors are walkable and empty space is not", () => {
  assert.equal(collision.isWalkable(14, 9), true);
  assert.equal(collision.isWalkable(0, 0), false);
});

test("furniture and machinery block their tiles", () => {
  assert.equal(collision.isWalkable(3, 3), false);
  assert.equal(collision.isWalkable(11, 3), false);
});

test("movement cannot skip tiles or leave mapped floor", () => {
  assert.equal(collision.canCross(14, 9, 15, 9), true);
  assert.equal(collision.canCross(14, 9, 16, 9), false);
  assert.equal(collision.canCross(2, 1, 1, 1), false);
});

test("sealed passages and closed airlock doors are impassable", () => {
  assert.equal(collision.canCross(20, 14, 20, 13), false);
  assert.equal(collision.canCross(28, 9, 29, 9), false);
});
