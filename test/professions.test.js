import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";
import { PROFESSIONS, PROFESSION_BEHAVIOR } from "../src/game/npc/Professions.js";

test("all six professions are represented in the shelter population", () => {
  const assigned = new Set(shelterMap.npcs.map(({ profession }) => profession));
  for (const profession of Object.values(PROFESSIONS)) assert.ok(assigned.has(profession));
});

test("every resident has identity, profession, behavior and work zone", () => {
  for (const npc of shelterMap.npcs) {
    assert.ok(npc.name);
    assert.ok(PROFESSION_BEHAVIOR[npc.profession]);
    assert.ok(npc.workZone);
    assert.ok(npc.waypoints.length);
  }
});
