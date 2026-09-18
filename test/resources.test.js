import test from "node:test";
import assert from "node:assert/strict";
import { resourceCatalog, createInitialInventory, resourceById } from "../src/game/resources/ResourceCatalog.js";
import { Inventory } from "../src/game/resources/Inventory.js";

test("catalog contains all basic and technical resource types", () => {
  const names = resourceCatalog.map(({ name }) => name);
  for (const name of ["Food", "Water", "Power", "Medicine", "Control Module", "Industrial Cable", "Air Filter", "Mechanical Component", "Electronic Components"]) {
    assert.ok(names.includes(name));
  }
});

test("inventory checks and atomically consumes requirements", () => {
  const inventory = new Inventory({ controlModule: 2, airFilter: 1 });
  const valid = [{ resourceId: "controlModule", amount: 2 }, { resourceId: "airFilter", amount: 1 }];
  assert.equal(inventory.has(valid), true);
  assert.equal(inventory.consume(valid), true);
  assert.equal(inventory.count("controlModule"), 0);
  assert.equal(inventory.consume(valid), false);
});

test("new catalog entries automatically appear in initial inventory", () => {
  const custom = [...resourceCatalog, { id: "newPart", name: "New Part", category: "technical", initial: 4 }];
  assert.equal(createInitialInventory(custom).newPart, 4);
  assert.equal(resourceById("airFilter").name, "Air Filter");
});
