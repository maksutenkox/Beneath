import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";
import { DoorSystem } from "../src/game/doors/DoorSystem.js";
import { InteractionSystem } from "../src/game/interaction/InteractionSystem.js";
import { EXPEDITION_UNAVAILABLE_MESSAGE } from "../src/game/interaction/Messages.js";

test("external airlock has locked heavy door, controls and warning equipment", () => {
  const outer = shelterMap.doors.find(({ id }) => id === "airlock-outer");
  assert.equal(outer.doorKind, "bulkhead");
  assert.equal(outer.locked, true);
  assert.ok(shelterMap.obstacles.some(({ type }) => type === "expedition"));
  assert.ok(shelterMap.obstacles.filter(({ kind }) => kind === "beacon").length >= 2);
  assert.ok(shelterMap.obstacles.some(({ kind }) => kind === "compressor"));
});

test("expedition console uses universal interaction and reports its type", () => {
  const doors = new DoorSystem(shelterMap.doors);
  const interactions = new InteractionSystem(shelterMap, doors);
  const console = shelterMap.obstacles.find(({ type }) => type === "expedition");
  assert.equal(interactions.label(console), "Экспедиция");
  assert.equal(interactions.interact(console, {}).type, "expedition");
  assert.equal(EXPEDITION_UNAVAILABLE_MESSAGE, "EXTERNAL EXPEDITIONS UNAVAILABLE");
});
