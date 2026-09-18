import { Inventory } from "../resources/Inventory.js";
import { resourceById } from "../resources/ResourceCatalog.js";

export const repairRecipes = Object.freeze({
  medical: [
    { resourceId: "controlModule", amount: 2 },
    { resourceId: "electronicComponents", amount: 3 },
    { resourceId: "airFilter", amount: 1 }
  ],
  workshop: [
    { resourceId: "industrialCable", amount: 2 },
    { resourceId: "mechanicalComponent", amount: 2 },
    { resourceId: "electronicComponents", amount: 2 }
  ]
});

export class RepairSystem {
  constructor(sectorStates, map) { this.sectorStates = sectorStates; this.map = map; }

  isRepairable(sectorId) { return this.sectorStates.get(sectorId)?.status === "DAMAGED" && Boolean(repairRecipes[sectorId]); }

  details(sectorId, amounts) {
    const sector = this.sectorStates.get(sectorId);
    if (!sector) return null;
    const inventory = new Inventory(amounts);
    const requirements = (repairRecipes[sectorId] ?? []).map((requirement) => ({
      ...requirement,
      name: resourceById(requirement.resourceId)?.name ?? requirement.resourceId,
      available: inventory.count(requirement.resourceId),
      enough: inventory.count(requirement.resourceId) >= requirement.amount
    }));
    return { sectorId, name: sector.name, status: sector.status, requirements, canRepair: this.isRepairable(sectorId) && inventory.has(requirements) };
  }

  repair(sectorId, amounts) {
    const requirements = repairRecipes[sectorId] ?? [];
    const inventory = new Inventory(amounts);
    if (!this.isRepairable(sectorId) || !inventory.consume(requirements)) return false;
    this.sectorStates.setState(sectorId, "ACTIVE");
    this.#activateSectorDoors(sectorId);
    return true;
  }

  snapshot() { return Object.fromEntries(this.map.sectors.map(({ id, status }) => [id, status])); }
  restore(snapshot = {}) {
    for (const [id, status] of Object.entries(snapshot)) {
      if (!this.sectorStates.get(id)) continue;
      this.sectorStates.setState(id, status);
      if (status === "ACTIVE") this.#activateSectorDoors(id);
    }
  }

  #activateSectorDoors(sectorId) {
    for (const door of this.map.doors.filter((item) => item.sectorId === sectorId && item.doorKind === "damaged")) {
      door.doorKind = "manual"; door.state = "closed"; door.progress = 0; door.collision = true;
    }
  }
}
