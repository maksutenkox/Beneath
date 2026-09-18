import test from "node:test";
import assert from "node:assert/strict";
import { SectorStateSystem } from "../src/game/sectors/SectorStateSystem.js";
import { CollisionMap } from "../src/game/physics/CollisionMap.js";

test("repair swaps damaged and restored object collision sets", () => {
  const map = {
    sectors: [{ id: "medical", status: "DAMAGED" }],
    floors: [{ x: 1, y: 1, sector: "medical" }, { x: 2, y: 1, sector: "medical" }],
    obstacles: [
      { x: 1, y: 1, sectorId: "medical", visibleWhen: ["DAMAGED"] },
      { x: 2, y: 1, sectorId: "medical", visibleWhen: ["ACTIVE"] }
    ],
    doors: [], blockedPassages: []
  };
  const states = new SectorStateSystem(map);
  const collision = new CollisionMap(map, states);
  assert.equal(collision.isWalkable(1, 1), false);
  assert.equal(collision.isWalkable(2, 1), true);
  states.setState("medical", "ACTIVE");
  assert.equal(collision.isWalkable(1, 1), true);
  assert.equal(collision.isWalkable(2, 1), false);
});
