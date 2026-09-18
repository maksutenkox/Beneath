import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";

test("full shelter contains all requested active and damaged sectors", () => {
  const byStatus = (status) => shelterMap.sectors.filter((sector) => sector.status === status).map((sector) => sector.name);
  assert.deepEqual(byStatus("ACTIVE"), ["Central Sector", "Living Sector", "Storage", "Generator Room", "External Airlock"]);
  assert.deepEqual(byStatus("DAMAGED"), ["Medical Sector", "Workshop"]);
  assert.deepEqual(byStatus("BLOCKED"), ["Additional Living Sector"]);
});

test("map exposes at least two unknown locked expansions", () => {
  const unknown = shelterMap.sectors.filter((sector) => ["UNKNOWN", "LOCKED"].includes(sector.status));
  const unknownDoors = shelterMap.doors.filter((door) => door.id.startsWith("unknown-") && door.doorKind === "locked");
  assert.ok(unknown.length >= 2);
  assert.ok(unknownDoors.length >= 2);
});

test("expanded shelter is substantially larger than the prototype", () => {
  assert.ok(shelterMap.width >= 30);
  assert.ok(shelterMap.height >= 22);
  assert.ok(shelterMap.floors.length > 300);
});
