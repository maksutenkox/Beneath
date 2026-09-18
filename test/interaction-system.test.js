import test from "node:test";
import assert from "node:assert/strict";
import { InteractionSystem } from "../src/game/interaction/InteractionSystem.js";
import { DoorSystem } from "../src/game/doors/DoorSystem.js";

const createMap = () => ({
  doors: [{ id: "door", type: "door", x: 1, y: 1, open: false }],
  obstacles: [
    { id: "terminal", type: "terminal", x: 4, y: 4 },
    { id: "crate", type: "container", x: 7, y: 7 },
    { x: 2, y: 2, kind: "bed" }
  ]
});

test("universal interaction selects only the nearest in-range target", () => {
  const map = createMap();
  const system = new InteractionSystem(map, new DoorSystem(map.doors));
  assert.equal(system.nearest({ x: 1.5, y: 1.5 }).id, "door");
  assert.equal(system.nearest({ x: 20, y: 20 }), null);
});

test("doors use the same interaction path and toggle state", () => {
  const map = createMap();
  const system = new InteractionSystem(map, new DoorSystem(map.doors));
  const world = {};
  const result = system.interact(map.doors[0], world);
  assert.equal(map.doors[0].state, "opening");
  assert.equal(result.type, "door");
  assert.equal(result.actionPerformed, true);
  assert.equal(world.interacted.door, 1);
});

test("terminal, container, npc, equipment, airlock and damage types have labels", () => {
  const map = createMap();
  const system = new InteractionSystem(map, new DoorSystem(map.doors));
  const types = ["terminal", "container", "npc", "equipment", "airlock", "damaged", "expedition"];
  for (const type of types) assert.notEqual(system.label({ type, open: false }), "Действие");
});


test("blocked doors report that no action was performed", () => {
  const map = createMap();
  map.doors[0].doorKind = "locked";
  map.doors[0].locked = true;
  const system = new InteractionSystem(map, new DoorSystem(map.doors));
  const result = system.interact(map.doors[0], {});
  assert.equal(result.actionPerformed, false);
  assert.equal(map.doors[0].state, "locked");
});


test("interaction availability reflects door state without affecting other targets", () => {
  const map = createMap();
  const doors = new DoorSystem(map.doors);
  const system = new InteractionSystem(map, doors);

  assert.equal(system.canInteract(map.doors[0]), true);
  assert.equal(system.canInteract(map.obstacles[0]), true);

  map.doors[0].state = "locked";
  assert.equal(system.canInteract(map.doors[0]), false);

  map.doors[0].state = "jammed";
  assert.equal(system.canInteract(map.doors[0]), false);

  map.doors[0].state = "closed";
  map.doors[0].doorKind = "automatic";
  assert.equal(system.canInteract(map.doors[0]), false);
});
