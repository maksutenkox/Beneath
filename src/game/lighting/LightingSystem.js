const WARM_ZONES = new Set(["living", "storage", "additional"]);

export class LightingSystem {
  constructor(sectorStates) { this.sectorStates = sectorStates; }

  profile(sectorId) {
    const status = this.sectorStates.get(sectorId)?.status ?? "UNKNOWN";
    if (status === "DAMAGED") return { color: "#d65b42", intensity: .18, darkness: .32, flicker: true };
    if (status === "BLOCKED") return { color: "#7d6548", intensity: .06, darkness: .45, flicker: false };
    if (status === "LOCKED") return { color: "#69828b", intensity: .07, darkness: .42, flicker: false };
    if (status === "UNKNOWN") return { color: "#52636a", intensity: .025, darkness: .62, flicker: false };
    if (WARM_ZONES.has(sectorId)) return { color: "#e2b86f", intensity: .16, darkness: .08, flicker: false };
    return { color: "#9bc8cf", intensity: .14, darkness: .1, flicker: false };
  }
}
