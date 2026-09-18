import test from "node:test";
import assert from "node:assert/strict";
import { SectorStateSystem, SECTOR_STATES } from "../src/game/sectors/SectorStateSystem.js";

const map = { sectors: Object.values(SECTOR_STATES).map((status) => ({ id: status, status })) };
const system = new SectorStateSystem(map);

test("active and damaged sectors allow access while restricted states do not", () => {
  assert.equal(system.isAccessible("ACTIVE"), true);
  assert.equal(system.isAccessible("DAMAGED"), true);
  assert.equal(system.isAccessible("BLOCKED"), false);
  assert.equal(system.isAccessible("LOCKED"), false);
  assert.equal(system.isAccessible("UNKNOWN"), false);
});

test("sector state changes are validated and update rules immediately", () => {
  assert.equal(system.setState("DAMAGED", "ACTIVE"), true);
  assert.equal(system.get("DAMAGED").status, "ACTIVE");
  assert.throws(() => system.setState("ACTIVE", "INVALID"));
});
