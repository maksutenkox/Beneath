import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";
import { CollisionMap } from "../src/game/physics/CollisionMap.js";
import { DoorSystem } from "../src/game/doors/DoorSystem.js";

const collision = new CollisionMap(shelterMap);
new DoorSystem(shelterMap.doors);

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


test("sector partitions can only be crossed through authored doorways", () => {
  const livingDoor = shelterMap.doors.find(({ id }) => id === "living-door");
  livingDoor.state = "closed";
  livingDoor.progress = 0;
  livingDoor.collision = true;

  assert.equal(collision.canCross(5, 8, 5, 7), false);
  assert.equal(collision.canCross(4, 8, 4, 7), false);

  livingDoor.state = "open";
  livingDoor.progress = 1;
  livingDoor.collision = false;
  assert.equal(collision.canCross(5, 8, 5, 7), true);
  assert.equal(collision.canCross(4, 8, 4, 7), false);
});
