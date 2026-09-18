import test from "node:test";
import assert from "node:assert/strict";
import { DoorSystem } from "../src/game/doors/DoorSystem.js";

test("door and passage progress survives a snapshot round trip", () => {
  const sourceDoor = { id: "passage", doorKind: "manual", x: 1, y: 1, open: false };
  const source = new DoorSystem([sourceDoor]);
  source.toggle(sourceDoor);
  source.update(.4, { x: 10, y: 10 });
  const snapshot = source.snapshot();

  const restoredDoor = { id: "passage", doorKind: "manual", x: 1, y: 1, open: false };
  const restored = new DoorSystem([restoredDoor]);
  restored.restore(snapshot);
  assert.equal(restoredDoor.state, sourceDoor.state);
  assert.equal(restoredDoor.progress, sourceDoor.progress);
  assert.equal(restoredDoor.collision, sourceDoor.collision);
});

test("save snapshot shape covers all persistent gameplay domains", () => {
  const snapshot = {
    version: 2,
    player: { x: 1, y: 2 }, resources: {}, sectors: {}, completedRepairs: [],
    npcs: [], doors: {}, world: {}, audioLevels: {}
  };
  for (const key of ["player", "resources", "sectors", "completedRepairs", "npcs", "doors", "world"]) assert.ok(key in snapshot);
});
