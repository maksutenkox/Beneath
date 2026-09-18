import test from "node:test";
import assert from "node:assert/strict";
import { SectorStateSystem } from "../src/game/sectors/SectorStateSystem.js";
import { RepairSystem } from "../src/game/repair/RepairSystem.js";

const setup = () => {
  const map = {
    sectors: [{ id: "medical", name: "Medical Sector", status: "DAMAGED" }],
    doors: [{ id: "medical-door", sectorId: "medical", doorKind: "damaged", state: "jammed", progress: .2 }]
  };
  return { map, system: new RepairSystem(new SectorStateSystem(map), map) };
};

test("medical repair details compare available and required materials", () => {
  const { system } = setup();
  const details = system.details("medical", { controlModule: 2, electronicComponents: 2, airFilter: 1 });
  assert.equal(details.name, "Medical Sector");
  assert.equal(details.status, "DAMAGED");
  assert.equal(details.canRepair, false);
  assert.equal(details.requirements.find(({ resourceId }) => resourceId === "electronicComponents").enough, false);
});

test("successful repair consumes resources and activates sector", () => {
  const { map, system } = setup();
  const resources = { controlModule: 2, electronicComponents: 3, airFilter: 1 };
  assert.equal(system.repair("medical", resources), true);
  assert.equal(map.sectors[0].status, "ACTIVE");
  assert.deepEqual(resources, { controlModule: 0, electronicComponents: 0, airFilter: 0 });
  assert.equal(map.doors[0].doorKind, "manual");
});

test("repair is rejected without materials and leaves state unchanged", () => {
  const { map, system } = setup();
  const resources = { controlModule: 1, electronicComponents: 3, airFilter: 1 };
  assert.equal(system.repair("medical", resources), false);
  assert.equal(map.sectors[0].status, "DAMAGED");
  assert.equal(resources.controlModule, 1);
});
