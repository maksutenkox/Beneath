const FLOOR_Y = 730;

export const hubMap = Object.freeze({
  id: "corporate-safe-hub",
  width: 2400,
  height: 900,
  floorY: FLOOR_Y,
  spawn: Object.freeze({ x: 280, y: FLOOR_Y - 82 }),
  colliders: Object.freeze([
    { id: "main-floor", kind: "floor", x: 0, y: FLOOR_Y, width: 2400, height: 170 },
    { id: "archive-platform", kind: "platform", x: 460, y: 614, width: 270, height: 20 },
    { id: "server-platform", kind: "platform", x: 1460, y: 650, width: 250, height: 20 },
    { id: "desk-blocker", kind: "obstacle", x: 128, y: 651, width: 108, height: 79 },
    { id: "workbench-blocker", kind: "obstacle", x: 815, y: 650, width: 112, height: 80 },
    { id: "dummy-blocker", kind: "obstacle", x: 1213, y: 622, width: 54, height: 108 },
    { id: "server-blocker", kind: "obstacle", x: 1488, y: 610, width: 64, height: 120 },
    { id: "barricade-blocker", kind: "obstacle", x: 1905, y: 663, width: 100, height: 67 },
    { id: "left-wall", kind: "wall", x: -36, y: 0, width: 36, height: 900 },
    { id: "right-wall", kind: "wall", x: 2400, y: 0, width: 36, height: 900 }
  ]),
  props: Object.freeze([
    { id: "desk-a", kind: "desk", x: 180, y: FLOOR_Y, scale: 1.05 },
    { id: "plant-a", kind: "plant", x: 385, y: FLOOR_Y, scale: .72 },
    { id: "boxes-a", kind: "boxes", x: 510, y: 614, scale: .68 },
    { id: "printer-a", kind: "printer", x: 650, y: 614, scale: .72 },
    { id: "workbench", kind: "workbench", x: 870, y: FLOOR_Y, scale: 1.08 },
    { id: "papers-a", kind: "boxes", x: 1035, y: FLOOR_Y, scale: .48 },
    { id: "training-dummy", kind: "dummy", x: 1240, y: FLOOR_Y, scale: .92 },
    { id: "server-a", kind: "server", x: 1520, y: FLOOR_Y, scale: .95 },
    { id: "monitor-a", kind: "monitor", x: 1640, y: 650, scale: .62 },
    { id: "cooler-a", kind: "cooler", x: 1815, y: FLOOR_Y, scale: .7 },
    { id: "barricade-a", kind: "barricade", x: 1955, y: FLOOR_Y, scale: .92 },
    { id: "elevator", kind: "elevator", x: 2205, y: FLOOR_Y, scale: 1.22 }
  ]),
  wallProps: Object.freeze([
    { id: "light-a", kind: "light", x: 330, y: 215, scale: .9 },
    { id: "vent-a", kind: "vent", x: 720, y: 305, scale: .7 },
    { id: "light-b", kind: "light", x: 1110, y: 215, scale: .9, damaged: true },
    { id: "cable-a", kind: "cable", x: 1370, y: 225, scale: .8 },
    { id: "light-c", kind: "light", x: 1740, y: 215, scale: .9 },
    { id: "vent-b", kind: "vent", x: 1990, y: 305, scale: .7 }
  ]),
  interactables: Object.freeze([
    { id: "workbench", type: "workbench", label: "ОРУЖЕЙНЫЙ ВЕРСТАК", x: 870, y: FLOOR_Y - 58, range: 105 },
    { id: "elevator", type: "expedition", label: "ЛИФТ", x: 2205, y: FLOOR_Y - 78, range: 112 }
  ]),
  trainingDummy: Object.freeze({ id: "training-dummy", x: 1240, y: FLOOR_Y - 108, width: 54, height: 108 })
});
