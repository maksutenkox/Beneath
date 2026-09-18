const WIDTH = 30;
const HEIGHT = 22;

const zoneAt = (x, y) => {
  if (x >= 23 && x <= 28 && y >= 7 && y <= 13) return "airlock";
  if (x >= 24 && x <= 28 && y >= 2 && y <= 6) return "unknownNorth";
  if (x >= 24 && x <= 28 && y >= 15 && y <= 18) return "unknownSouth";
  if (x >= 18 && x <= 23 && y >= 14 && y <= 20) return "additional";
  if (x >= 18 && x <= 23 && y >= 2 && y <= 7) return "workshop";
  if (x >= 10 && x <= 16 && y >= 12 && y <= 18) return "medical";
  if (x >= 10 && x <= 16 && y >= 2 && y <= 7) return "generator";
  if (x >= 2 && x <= 8 && y >= 12 && y <= 18) return "storage";
  if (x >= 2 && x <= 8 && y >= 2 && y <= 7) return "living";
  if (y >= 8 && y <= 11 && x >= 1 && x <= 27) return "central";
  if (x >= 20 && x <= 21 && y >= 12 && y <= 14) return "additional";
  return null;
};

const floors = [];
for (let y = 0; y < HEIGHT; y += 1) {
  for (let x = 0; x < WIDTH; x += 1) {
    const zone = zoneAt(x, y);
    if (zone) floors.push({ x, y, zone, sector: zone });
  }
}

const floorIndexes = new WeakMap();

export const shelterMap = Object.freeze({
  width: WIDTH,
  height: HEIGHT,
  sectors: [
    { id: "central", name: "Central Sector", status: "ACTIVE" },
    { id: "living", name: "Living Sector", status: "ACTIVE" },
    { id: "storage", name: "Storage", status: "ACTIVE" },
    { id: "generator", name: "Generator Room", status: "ACTIVE" },
    { id: "airlock", name: "External Airlock", status: "ACTIVE" },
    { id: "medical", name: "Medical Sector", status: "DAMAGED" },
    { id: "workshop", name: "Workshop", status: "DAMAGED" },
    { id: "additional", name: "Additional Living Sector", status: "BLOCKED" },
    { id: "unknownNorth", name: "Unknown Passage A", status: "LOCKED" },
    { id: "unknownSouth", name: "Unknown Passage B", status: "UNKNOWN" }
  ],
  floors,
  npcs: [
    { id: "vera", name: "Вера", profession: "Technician", workZone: "central", x: 9.5, y: 9.5, color: "#596946", waypoints: [{ x: 9.5, y: 9.5, activity: "chat" }, { x: 11.5, y: 9.5, activity: "work" }, { x: 10.5, y: 10.5, activity: "idle" }] },
    { id: "maksim", name: "Максим", profession: "Security", workZone: "central", x: 10.5, y: 9.5, color: "#4c5e69", waypoints: [{ x: 10.5, y: 9.5, activity: "chat" }, { x: 14.5, y: 10.5, activity: "work" }, { x: 12.5, y: 9.5, activity: "idle" }] },
    { id: "lida", name: "Лида", profession: "Worker", workZone: "storage", x: 4.5, y: 15.5, color: "#6c5741", waypoints: [{ x: 4.5, y: 15.5, activity: "work" }, { x: 7.5, y: 13.5, activity: "sit" }, { x: 5.5, y: 17.5, activity: "work" }] },
    { id: "anton", name: "Антон", profession: "Engineer", workZone: "generator", x: 13.5, y: 5.5, color: "#485c50", waypoints: [{ x: 13.5, y: 5.5, activity: "work" }, { x: 11.5, y: 6.5, activity: "sit" }, { x: 15.5, y: 5.5, activity: "work" }] },
    { id: "mira", name: "Мира", profession: "Cook", workZone: "living", x: 4.5, y: 5.5, color: "#695366", waypoints: [{ x: 4.5, y: 5.5, activity: "sit" }, { x: 6.5, y: 4.5, activity: "work" }, { x: 7.5, y: 6.5, activity: "idle" }] },
    { id: "oleg", name: "Олег", profession: "Security", workZone: "airlock", x: 21.5, y: 9.5, color: "#535b45", waypoints: [{ x: 21.5, y: 9.5, activity: "work" }, { x: 18.5, y: 10.5, activity: "idle" }, { x: 23.5, y: 10.5, activity: "work" }] },
    { id: "sana", name: "Сана", profession: "Medic", workZone: "medical", x: 11.5, y: 10.5, color: "#536a68", waypoints: [{ x: 11.5, y: 10.5, activity: "idle" }, { x: 13.5, y: 15.5, sector: "medical", activity: "work" }, { x: 11.5, y: 14.5, sector: "medical", activity: "sit" }] },
    { id: "igor", name: "Игорь", profession: "Technician", workZone: "airlock", x: 25.5, y: 10.5, color: "#645744", waypoints: [{ x: 25.5, y: 10.5, activity: "work" }, { x: 27.5, y: 11.5, activity: "sit" }, { x: 24.5, y: 8.5, activity: "work" }] }
  ],
  doors: [
    { id: "living-door", type: "door", doorKind: "automatic", visualStyle: "metal", x: 5, y: 8, orientation: "north", open: false },
    { id: "storage-door", type: "door", doorKind: "manual", visualStyle: "metal", x: 6, y: 11, orientation: "south", open: true },
    { id: "generator-door", type: "door", doorKind: "manual", visualStyle: "metal", x: 12, y: 8, orientation: "north", open: false },
    { id: "medical-door", type: "door", sectorId: "medical", doorKind: "damaged", visualStyle: "metal", x: 13, y: 11, orientation: "south", open: false },
    { id: "workshop-door", type: "door", sectorId: "workshop", doorKind: "damaged", visualStyle: "metal", x: 20, y: 8, orientation: "north", open: false },
    { id: "additional-door", type: "door", doorKind: "locked", visualStyle: "metal", x: 20, y: 13, orientation: "south", open: false },
    { id: "unknown-north-door", type: "door", doorKind: "locked", visualStyle: "metal", x: 23, y: 4, orientation: "east", open: false },
    { id: "unknown-south-door", type: "door", doorKind: "locked", visualStyle: "metal", x: 23, y: 16, orientation: "east", open: false },
    { id: "airlock-inner", type: "airlock", doorKind: "bulkhead", visualStyle: "metal", x: 23, y: 9, orientation: "west", open: true },
    { id: "airlock-outer", type: "airlock", doorKind: "bulkhead", visualStyle: "hermetic", locked: true, x: 28, y: 9, orientation: "east", open: false, label: "ВЫХОД" }
  ],
  blockedPassages: [
    { x: 20, y: 14, orientation: "north" },
    { x: 21, y: 14, orientation: "north" }
  ],
  obstacles: [
    { x: 3, y: 3, kind: "bed" }, { x: 6, y: 3, kind: "bed" },
    { x: 3, y: 6, kind: "bed" }, { x: 7, y: 6, kind: "locker" },
    { id: "storage-crate-a", type: "container", x: 3, y: 13, kind: "crate" },
    { id: "storage-crate-b", type: "container", x: 5, y: 14, kind: "crate" },
    { id: "storage-crate-c", type: "container", x: 7, y: 16, kind: "crate" },
    { x: 3, y: 17, kind: "locker" },
    { id: "generator-a", type: "equipment", x: 11, y: 3, kind: "generator" },
    { id: "generator-b", type: "equipment", x: 14, y: 3, kind: "generator" },
    { id: "generator-terminal", type: "terminal", x: 15, y: 6, kind: "terminal" },
    { id: "medical-repair-console", type: "terminal", sectorId: "medical", x: 12, y: 10, kind: "terminal" },
    { id: "medical-terminal", type: "terminal", sectorId: "medical", x: 11, y: 14, kind: "terminal" },
    { id: "damaged-medical", type: "damaged", sectorId: "medical", visibleWhen: ["DAMAGED"], x: 15, y: 16, kind: "damaged" },
    { id: "medical-debris-a", sectorId: "medical", visibleWhen: ["DAMAGED"], x: 12, y: 16, kind: "debris" },
    { id: "medical-wire-a", sectorId: "medical", visibleWhen: ["DAMAGED"], x: 14, y: 13, kind: "wire" },
    { id: "medical-screen", type: "equipment", sectorId: "medical", visibleWhen: ["ACTIVE"], x: 15, y: 16, kind: "screen" },
    { id: "medical-station", type: "equipment", sectorId: "medical", visibleWhen: ["ACTIVE"], x: 12, y: 16, kind: "workstation" },
    { id: "workshop-equipment", type: "equipment", sectorId: "workshop", x: 19, y: 4, kind: "generator" },
    { id: "workshop-repair-console", type: "terminal", sectorId: "workshop", x: 19, y: 9, kind: "terminal" },
    { id: "damaged-workshop", type: "damaged", sectorId: "workshop", visibleWhen: ["DAMAGED"], x: 22, y: 6, kind: "damaged" },
    { id: "workshop-debris", sectorId: "workshop", visibleWhen: ["DAMAGED"], x: 20, y: 6, kind: "debris" },
    { id: "workshop-wire", sectorId: "workshop", visibleWhen: ["DAMAGED"], x: 21, y: 3, kind: "wire" },
    { id: "workshop-screen", type: "equipment", sectorId: "workshop", visibleWhen: ["ACTIVE"], x: 22, y: 6, kind: "screen" },
    { id: "workshop-station", type: "equipment", sectorId: "workshop", visibleWhen: ["ACTIVE"], x: 20, y: 6, kind: "workstation" },
    { id: "decon-unit", type: "equipment", x: 25, y: 8, kind: "decon" },
    { id: "airlock-container", type: "container", x: 26, y: 12, kind: "crate" },
    { id: "expedition-console", type: "expedition", x: 27, y: 8, kind: "airlockPanel" },
    { id: "airlock-compressor", type: "equipment", x: 25, y: 12, kind: "compressor" },
    { id: "airlock-beacon-a", x: 27, y: 10, kind: "beacon" },
    { id: "airlock-beacon-b", x: 28, y: 11, kind: "beacon" },
    { x: 19, y: 15, kind: "rubble" }, { x: 20, y: 15, kind: "rubble" },
    { x: 21, y: 15, kind: "rubble" }, { x: 22, y: 16, kind: "rubble" },
    { x: 19, y: 18, kind: "bed" }, { x: 22, y: 19, kind: "bed" }
  ],
  decorations: [
    { id: "central-sign", zone: "central", kind: "sign", x: 16.2, y: 8.3, text: "C-01" },
    { id: "central-pipe", zone: "central", kind: "pipe", x: 7.2, y: 10.7 },
    { id: "central-cable", zone: "central", kind: "cable", x: 17.4, y: 10.2 },
    { id: "central-trash", zone: "central", kind: "trash", x: 2.8, y: 9.3 },
    { id: "central-bench", zone: "central", kind: "bench", x: 5.4, y: 10.45 },
    { id: "central-wallpanel", zone: "central", kind: "wallpanel", x: 18.2, y: 8.35 },

    { id: "living-table", zone: "living", kind: "table", x: 5.2, y: 5.3 },
    { id: "living-mug", zone: "living", kind: "mug", x: 5.15, y: 5.25 },
    { id: "living-photo", zone: "living", kind: "personal", x: 2.8, y: 6.4 },
    { id: "living-vent", zone: "living", kind: "vent", x: 7.5, y: 2.4 },
    { id: "living-cabinet", zone: "living", kind: "cabinet", x: 2.5, y: 3.8 },
    { id: "living-shelf", zone: "living", kind: "shelf", x: 7.35, y: 4.7 },
    { id: "living-stool", zone: "living", kind: "stool", x: 5.85, y: 5.65 },

    { id: "storage-tools", zone: "storage", kind: "tools", x: 7.4, y: 17.3 },
    { id: "storage-sign", zone: "storage", kind: "sign", x: 2.6, y: 12.5, text: "ST-02" },
    { id: "storage-cable", zone: "storage", kind: "cable", x: 6.8, y: 13.2 },
    { id: "storage-trash", zone: "storage", kind: "trash", x: 2.9, y: 17.5 },
    { id: "storage-shelf-a", zone: "storage", kind: "shelf", x: 2.7, y: 15.5 },
    { id: "storage-shelf-b", zone: "storage", kind: "shelf", x: 7.45, y: 14.45 },

    { id: "generator-pipe-a", zone: "generator", kind: "pipe", x: 10.5, y: 6.8 },
    { id: "generator-pipe-b", zone: "generator", kind: "pipe", x: 14.6, y: 2.4 },
    { id: "generator-vent", zone: "generator", kind: "vent", x: 12.5, y: 6.5 },
    { id: "generator-tools", zone: "generator", kind: "tools", x: 15.2, y: 5.6 },
    { id: "generator-lamp", zone: "generator", kind: "lamp", x: 13.5, y: 4.4 },
    { id: "generator-steam", zone: "generator", kind: "steam", x: 10.8, y: 3.2 },
    { id: "generator-wallpanel", zone: "generator", kind: "wallpanel", x: 10.7, y: 5.15 },
    { id: "generator-bench", zone: "generator", kind: "bench", x: 15.15, y: 3.7 },

    { id: "medical-table", zone: "medical", kind: "table", x: 14.2, y: 14.4 },
    { id: "medical-mug", zone: "medical", kind: "mug", x: 14.2, y: 14.35 },
    { id: "medical-cabinet", zone: "medical", kind: "cabinet", x: 10.5, y: 17.4 },
    { id: "medical-cable", zone: "medical", kind: "cable", x: 15.5, y: 13.2 },
    { id: "medical-scratch", zone: "medical", kind: "damage", x: 16.2, y: 17.1 },
    { id: "medical-drip", zone: "medical", kind: "drip", x: 10.8, y: 12.6 },
    { id: "medical-shelf", zone: "medical", kind: "shelf", x: 15.35, y: 14.15 },
    { id: "medical-stool", zone: "medical", kind: "stool", x: 13.3, y: 14.8 },

    { id: "workshop-table", zone: "workshop", kind: "table", x: 21.2, y: 4.5 },
    { id: "workshop-tools", zone: "workshop", kind: "tools", x: 21.1, y: 4.4 },
    { id: "workshop-pipe", zone: "workshop", kind: "pipe", x: 18.5, y: 6.7 },
    { id: "workshop-vent", zone: "workshop", kind: "vent", x: 22.5, y: 2.5 },
    { id: "workshop-trash", zone: "workshop", kind: "trash", x: 19.3, y: 6.1 },
    { id: "workshop-sparks", zone: "workshop", kind: "spark", x: 22.2, y: 6.2 },
    { id: "workshop-shelf", zone: "workshop", kind: "shelf", x: 18.75, y: 3.55 },
    { id: "workshop-wallpanel", zone: "workshop", kind: "wallpanel", x: 22.25, y: 4.1 },

    { id: "airlock-sign", zone: "airlock", kind: "sign", x: 24.2, y: 7.5, text: "AIRLOCK" },
    { id: "airlock-pipe", zone: "airlock", kind: "pipe", x: 24.5, y: 12.7 },
    { id: "airlock-vent", zone: "airlock", kind: "vent", x: 27.4, y: 12.4 },
    { id: "airlock-tools", zone: "airlock", kind: "tools", x: 26.3, y: 8.4 },
    { id: "airlock-steam", zone: "airlock", kind: "steam", x: 27.7, y: 12.2 },
    { id: "airlock-lamp", zone: "airlock", kind: "lamp", x: 26.5, y: 9.2 },
    { id: "airlock-bench", zone: "airlock", kind: "bench", x: 24.65, y: 11.65 },
    { id: "airlock-wallpanel", zone: "airlock", kind: "wallpanel", x: 27.25, y: 8.15 },

    { id: "additional-cable", zone: "additional", kind: "cable", x: 19.3, y: 19.4 },
    { id: "additional-personal", zone: "additional", kind: "personal", x: 22.2, y: 18.3 },
    { id: "additional-trash", zone: "additional", kind: "trash", x: 20.5, y: 17.7 },
    { id: "unknown-sign", zone: "unknownSouth", kind: "sign", x: 25.2, y: 17.3, text: "?" }
  ],
  lights: [
    { sector: "central", x: 7, y: 9 }, { sector: "central", x: 14, y: 9 }, { sector: "central", x: 21, y: 9 },
    { sector: "living", x: 4, y: 4 }, { sector: "living", x: 7, y: 6 },
    { sector: "storage", x: 4, y: 14 }, { sector: "storage", x: 7, y: 17 },
    { sector: "generator", x: 12, y: 4 }, { sector: "generator", x: 15, y: 6 },
    { sector: "medical", x: 12, y: 14 }, { sector: "medical", x: 15, y: 17 },
    { sector: "workshop", x: 19, y: 4 }, { sector: "workshop", x: 22, y: 6 },
    { sector: "airlock", x: 24, y: 9 }, { sector: "airlock", x: 27, y: 11 },
    { sector: "additional", x: 20, y: 17 },
    { sector: "unknownNorth", x: 26, y: 4 }, { sector: "unknownSouth", x: 26, y: 16 }
  ],
  labels: [
    { sector: "central", x: 13.5, y: 9.5, text: "CENTRAL SECTOR" },
    { sector: "living", x: 5, y: 4.5, text: "LIVING" },
    { sector: "storage", x: 5, y: 15, text: "STORAGE" },
    { sector: "generator", x: 13, y: 4.5, text: "GENERATOR" },
    { sector: "airlock", x: 25.5, y: 10, text: "EXTERNAL AIRLOCK" },
    { sector: "medical", x: 13, y: 15, text: "MEDICAL" },
    { sector: "workshop", x: 20.5, y: 4.5, text: "WORKSHOP" },
    { sector: "additional", x: 20.5, y: 17.5, text: "LIVING II" },
    { sector: "unknownNorth", x: 26.5, y: 4, text: "PASSAGE A" },
    { sector: "unknownSouth", x: 26, y: 16.5, text: "PASSAGE B" }
  ]
});

export function floorAt(map, x, y) {
  let index = floorIndexes.get(map);
  if (!index) {
    index = new Map(map.floors.map((tile) => [`${tile.x},${tile.y}`, tile]));
    floorIndexes.set(map, index);
  }
  return index.get(`${x},${y}`) ?? null;
}
