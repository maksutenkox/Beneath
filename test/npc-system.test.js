import test from "node:test";
import assert from "node:assert/strict";
import { NpcSystem } from "../src/game/npc/NpcSystem.js";
import { CollisionMap } from "../src/game/physics/CollisionMap.js";
import { SectorStateSystem } from "../src/game/sectors/SectorStateSystem.js";

const setup = () => {
  const map = {
    width: 5, height: 5,
    sectors: [{ id: "active", status: "ACTIVE" }, { id: "locked", status: "LOCKED" }],
    floors: Array.from({ length: 25 }, (_, index) => ({ x: index % 5, y: Math.floor(index / 5), sector: "active" })),
    obstacles: [], doors: [], blockedPassages: []
  };
  const states = new SectorStateSystem(map);
  const collision = new CollisionMap(map, states);
  const definitions = [{ id: "npc", name: "NPC", x: 1.5, y: 1.5, waypoints: [{ x: 2.5, y: 1.5, activity: "work" }, { x: 3.5, y: 1.5, sector: "locked", activity: "sit" }] }];
  return new NpcSystem(definitions, collision, states);
};

test("npc cycles from a pause into walking and reaches work", () => {
  const system = setup();
  const [npc] = system.initialize();
  npc.timer = 0;
  system.update([npc], .1);
  assert.equal(npc.activity, "walk");
  for (let i = 0; i < 15; i += 1) system.update([npc], .1);
  assert.equal(npc.activity, "work");
  assert.ok(Math.abs(npc.x - 2.5) < .1);
});

test("npc ignores waypoints in inaccessible sectors", () => {
  const system = setup();
  const [npc] = system.initialize();
  npc.waypointIndex = 0; npc.timer = 0;
  system.update([npc], .1);
  assert.notEqual(npc.target?.sector, "locked");
});

test("shelter starts with eight residents and conversational pair", async () => {
  const { shelterMap } = await import("../src/game/map/ShelterMap.js");
  assert.equal(shelterMap.npcs.length, 8);
  const states = new SectorStateSystem(shelterMap);
  const system = new NpcSystem(shelterMap.npcs, new CollisionMap(shelterMap, states), states);
  assert.equal(system.initialize().filter(({ activity }) => activity === "chat").length, 2);
});
