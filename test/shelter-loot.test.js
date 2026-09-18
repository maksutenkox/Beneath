import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";
import { createInitialInventory } from "../src/game/resources/ResourceCatalog.js";
import { repairRecipes } from "../src/game/repair/RepairSystem.js";

test("shelter containers provide enough electronics to restore both damaged sectors", () => {
  const initial = createInitialInventory();
  const containerElectronics = shelterMap.obstacles
    .filter(({ type }) => type === "container")
    .flatMap(({ loot = [] }) => loot)
    .filter(({ resourceId }) => resourceId === "electronicComponents")
    .reduce((total, { amount }) => total + amount, 0);
  const repairElectronics = Object.values(repairRecipes)
    .flat()
    .filter(({ resourceId }) => resourceId === "electronicComponents")
    .reduce((total, { amount }) => total + amount, 0);

  assert.ok(initial.electronicComponents + containerElectronics >= repairElectronics);
});

test("all storage containers have one-time loot definitions", () => {
  const containers = shelterMap.obstacles.filter(({ type }) => type === "container");
  assert.ok(containers.length >= 3);
  for (const container of containers) assert.ok(container.loot?.length > 0, `${container.id} should contain loot`);
});
