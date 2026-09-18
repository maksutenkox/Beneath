import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";

test("ambient scene declares restrained animation sources", () => {
  const kinds = new Set(shelterMap.decorations.map(({ kind }) => kind));
  for (const kind of ["vent", "steam", "lamp", "drip", "spark"]) assert.ok(kinds.has(kind));
  assert.ok(shelterMap.obstacles.some(({ kind }) => kind === "generator"));
  assert.ok(shelterMap.obstacles.some(({ kind }) => ["screen", "terminal", "airlockPanel"].includes(kind)));
});

test("ambient sources stay sparse relative to map size", () => {
  const ambientKinds = new Set(["vent", "steam", "lamp", "drip", "spark"]);
  const ambientCount = shelterMap.decorations.filter(({ kind }) => ambientKinds.has(kind)).length;
  assert.ok(ambientCount >= 8);
  assert.ok(ambientCount < shelterMap.floors.length / 20);
});
