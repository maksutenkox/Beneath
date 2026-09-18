import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap, floorAt } from "../src/game/map/ShelterMap.js";
import { CollisionMap } from "../src/game/physics/CollisionMap.js";

test("map lookup remains stable under repeated render and collision queries", () => {
  const first = floorAt(shelterMap, 14, 9);
  for (let i = 0; i < 10000; i += 1) assert.equal(floorAt(shelterMap, 14, 9), first);
});

test("collision index preserves walkable and blocked results", () => {
  const collision = new CollisionMap(shelterMap);
  assert.equal(collision.isWalkable(14, 9), true);
  assert.equal(collision.isWalkable(11, 3), false);
  assert.equal(collision.isWalkable(0, 0), false);
});
