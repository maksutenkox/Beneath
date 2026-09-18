export const SECTOR_STATES = Object.freeze({
  ACTIVE: "ACTIVE", DAMAGED: "DAMAGED", BLOCKED: "BLOCKED", LOCKED: "LOCKED", UNKNOWN: "UNKNOWN"
});

export const STATE_RULES = Object.freeze({
  ACTIVE: { accessible: true, light: 1, interfaceLabel: "Работает" },
  DAMAGED: { accessible: true, light: .58, interfaceLabel: "Повреждено" },
  BLOCKED: { accessible: false, light: .35, interfaceLabel: "Проход завален" },
  LOCKED: { accessible: false, light: .42, interfaceLabel: "Доступ закрыт" },
  UNKNOWN: { accessible: false, light: .18, interfaceLabel: "Неизвестная зона" }
});

export class SectorStateSystem {
  constructor(map) {
    this.map = map;
    this.byId = new Map(map.sectors.map((sector) => [sector.id, sector]));
  }

  get(sectorId) { return this.byId.get(sectorId) ?? null; }
  stateForTile(tile) { return this.get(tile?.sector)?.status ?? SECTOR_STATES.UNKNOWN; }
  rulesFor(sectorId) { return STATE_RULES[this.get(sectorId)?.status ?? SECTOR_STATES.UNKNOWN]; }
  isAccessible(sectorId) { return this.rulesFor(sectorId).accessible; }

  setState(sectorId, status) {
    if (!STATE_RULES[status]) throw new Error(`Unknown sector state: ${status}`);
    const sector = this.get(sectorId);
    if (!sector) return false;
    sector.status = status;
    return true;
  }
}
