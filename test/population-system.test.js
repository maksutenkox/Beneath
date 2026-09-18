import test from "node:test";
import assert from "node:assert/strict";
import { PopulationSystem } from "../src/game/population/PopulationSystem.js";

test("population equals current residents and consumes core resources gradually", () => {
  const system = new PopulationSystem();
  const residents = Array.from({ length: 8 }, (_, id) => ({ id }));
  const population = system.initialize(null, residents);
  const resources = { food: 12, water: 10, power: 20, medicine: 3 };
  system.update(population, resources, 60, residents);
  assert.equal(population.count, 8);
  assert.ok(resources.food < 12 && resources.food > 11);
  assert.ok(resources.water < 10 && resources.water > 9);
  assert.ok(resources.power < 20 && resources.power > 19);
  assert.ok(resources.medicine < 3 && resources.medicine > 2.9);
});

test("resource consumption never makes a stock negative", () => {
  const system = new PopulationSystem();
  const residents = Array.from({ length: 8 }, (_, id) => ({ id }));
  const population = system.initialize(null, residents);
  const resources = { food: .01, water: .01, power: .01, medicine: .01 };
  system.update(population, resources, 3600, residents);
  for (const amount of Object.values(resources)) assert.equal(amount, 0);
});
