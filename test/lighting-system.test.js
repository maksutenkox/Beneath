import test from "node:test";
import assert from "node:assert/strict";
import { LightingSystem } from "../src/game/lighting/LightingSystem.js";
import { SectorStateSystem } from "../src/game/sectors/SectorStateSystem.js";

const map = { sectors: [
  { id: "living", status: "ACTIVE" }, { id: "generator", status: "ACTIVE" },
  { id: "medical", status: "DAMAGED" }, { id: "unknown", status: "UNKNOWN" }
] };
const states = new SectorStateSystem(map);
const lighting = new LightingSystem(states);

test("living and technical sectors receive distinct light colors", () => {
  assert.notEqual(lighting.profile("living").color, lighting.profile("generator").color);
  assert.equal(lighting.profile("living").flicker, false);
});

test("damaged sectors are darker and use flickering emergency light", () => {
  const damaged = lighting.profile("medical");
  assert.equal(damaged.flicker, true);
  assert.ok(damaged.darkness > lighting.profile("generator").darkness);
});

test("repair immediately replaces emergency lighting with active lighting", () => {
  const before = lighting.profile("medical");
  states.setState("medical", "ACTIVE");
  const after = lighting.profile("medical");
  assert.equal(after.flicker, false);
  assert.ok(after.darkness < before.darkness);
});
