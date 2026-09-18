import { floorAt } from "../map/ShelterMap.js";

export class CollisionMap {
  constructor(map, sectorStates = null) {
    this.map = map;
    this.sectorStates = sectorStates;
    this.obstaclesByTile = new Map();
    for (const obstacle of map.obstacles) {
      const key = `${obstacle.x},${obstacle.y}`;
      const list = this.obstaclesByTile.get(key) ?? [];
      list.push(obstacle);
      this.obstaclesByTile.set(key, list);
    }
  }

  isObstacleActive(obstacle) {
    if (!obstacle.visibleWhen || !obstacle.sectorId || !this.sectorStates) return true;
    return obstacle.visibleWhen.includes(this.sectorStates.get(obstacle.sectorId)?.status);
  }

  isWalkable(x, y) {
    const floor = floorAt(this.map, x, y);
    const sectorAccessible = !this.sectorStates || this.sectorStates.isAccessible(floor?.sector);
    const blocked = (this.obstaclesByTile.get(`${x},${y}`) ?? []).some((obstacle) => this.isObstacleActive(obstacle));
    return Boolean(floor) && sectorAccessible && !blocked;
  }

  canCross(fromX, fromY, toX, toY) {
    if (!this.isWalkable(fromX, fromY) || !this.isWalkable(toX, toY)) return false;
    if (Math.abs(toX - fromX) + Math.abs(toY - fromY) !== 1) return false;

    const fromFloor = floorAt(this.map, fromX, fromY);
    const toFloor = floorAt(this.map, toX, toY);
    const orientation = toX > fromX ? "east" : toX < fromX ? "west" : toY > fromY ? "south" : "north";
    const opposite = { north: "south", south: "north", east: "west", west: "east" }[orientation];
    const crosses = (edge) => (edge.x === fromX && edge.y === fromY && edge.orientation === orientation)
      || (edge.x === toX && edge.y === toY && edge.orientation === opposite);

    const crossingDoor = this.map.doors.find(crosses);
    const sealed = this.map.blockedPassages.some(crosses);
    if (sealed) return false;

    // Different shelter sectors are separated by real partitions. Movement between
    // them must go through an authored doorway instead of slipping through the wall.
    if (fromFloor?.sector !== toFloor?.sector && !crossingDoor) return false;
    return !crossingDoor?.collision;
  }
}
