const FLOOR_Y = 730;

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

export class OfficeLevelGenerator {
  generate(seed = 1, levelNumber = 1) {
    const random = mulberry32((seed + levelNumber * 7919) >>> 0);
    const width = Math.min(4200, 2800 + levelNumber * 220 + Math.floor(random() * 3) * 200);
    const backgroundTiles = [];
    for (let x = 0; x < width; x += 400) backgroundTiles.push({ x, tile: Math.floor(random() * 8) });

    const colliders = [
      { id: "office-floor", kind: "floor", x: 0, y: FLOOR_Y, width, height: 170 },
      { id: "office-left-wall", kind: "wall", x: -36, y: 0, width: 36, height: 900 },
      { id: "office-right-wall", kind: "wall", x: width, y: 0, width: 36, height: 900 }
    ];
    const props = [
      { id: "entry-door", kind: "stairwell", x: 74, y: FLOOR_Y, scale: .9 },
      { id: "exit-door", kind: "elevator", x: width - 86, y: FLOOR_Y, scale: .92 }
    ];
    const obstacleKinds = ["boxes", "printer", "cabinet", "barricade", "cooler"];
    let obstacleIndex = 0;
    for (let x = 650; x < width - 420; x += 460 + Math.floor(random() * 190)) {
      const kind = obstacleKinds[Math.floor(random() * obstacleKinds.length)];
      const obstacleWidth = kind === "barricade" ? 88 : 62;
      const obstacleHeight = kind === "barricade" ? 55 : 70;
      colliders.push({ id: `office-obstacle-${obstacleIndex}`, kind: "obstacle", x: x - obstacleWidth / 2, y: FLOOR_Y - obstacleHeight, width: obstacleWidth, height: obstacleHeight });
      props.push({ id: `office-prop-${obstacleIndex}`, kind, x, y: FLOOR_Y, scale: kind === "barricade" ? .64 : .52 });
      obstacleIndex += 1;
    }
    const platformCount = Math.min(3, 1 + Math.floor(levelNumber / 2));
    for (let index = 0; index < platformCount; index += 1) {
      const x = 980 + index * 820 + Math.floor(random() * 180);
      if (x + 220 < width - 240) colliders.push({ id: `office-platform-${index}`, kind: "platform", x, y: FLOOR_Y - 118 - (index % 2) * 34, width: 220, height: 18 });
    }
    const enemyCount = Math.min(7, 3 + levelNumber);
    const enemies = Array.from({ length: enemyCount }, (_, index) => {
      const lane = (index + 1) / (enemyCount + 1);
      return { id: `employee-${levelNumber}-${index}`, x: Math.round(520 + lane * (width - 920) + (random() - .5) * 180), y: FLOOR_Y - 82, patrolRadius: 100 + Math.floor(random() * 90) };
    });
    return {
      id: `office-floor-${levelNumber}-${seed}`,
      type: "office", title: `OFFICE FLOOR ${String(levelNumber).padStart(2, "0")}`,
      seed, levelNumber, width, height: 900, floorY: FLOOR_Y,
      spawn: { x: 170, y: FLOOR_Y - 82 }, backgroundTiles, colliders, props, wallProps: [], enemies,
      interactables: [
        { id: "entry-door", type: "return-hub", label: "ВЕРНУТЬСЯ В HUB", x: 74, y: FLOOR_Y - 70, range: 108 },
        { id: "exit-door", type: "next-floor", label: "СЛЕДУЮЩИЙ ЭТАЖ", x: width - 86, y: FLOOR_Y - 70, range: 112 }
      ],
      trainingDummy: null
    };
  }
}
