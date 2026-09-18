import { ACTIVITY_TASKS, PROFESSION_BEHAVIOR } from "./Professions.js";

export class NpcSystem {
  constructor(definitions, collisionMap, sectorStates) {
    this.definitions = definitions;
    this.collisionMap = collisionMap;
    this.sectorStates = sectorStates;
  }

  initialize(saved = []) {
    const byId = new Map(saved.map((npc) => [npc.id, npc]));
    return this.definitions.map((definition, index) => ({
      ...definition,
      x: byId.get(definition.id)?.x ?? definition.x,
      y: byId.get(definition.id)?.y ?? definition.y,
      activity: byId.get(definition.id)?.activity ?? (index < 2 ? "chat" : index % 3 === 0 ? "sit" : "work"),
      timer: 1.5 + (index % 4),
      waypointIndex: byId.get(definition.id)?.waypointIndex ?? 0,
      animationTime: 0,
      target: null,
      currentTask: byId.get(definition.id)?.currentTask ?? ACTIVITY_TASKS.idle,
      type: "npc"
    }));
  }

  update(npcs, deltaSeconds) {
    for (const npc of npcs) {
      npc.animationTime += deltaSeconds;
      npc.timer -= deltaSeconds;
      if (npc.activity === "walk" && npc.target) this.#walk(npc, deltaSeconds);
      else if (npc.timer <= 0) this.#chooseNext(npc);
      npc.currentTask = npc.activity === "work"
        ? (PROFESSION_BEHAVIOR[npc.profession]?.task ?? "Работает")
        : (ACTIVITY_TASKS[npc.activity] ?? "Занят");
    }
  }

  #chooseNext(npc) {
    const available = npc.waypoints.filter((point) => !point.sector || this.sectorStates.isAccessible(point.sector));
    if (!available.length) { npc.activity = "idle"; npc.timer = 2; return; }
    npc.waypointIndex = (npc.waypointIndex + 1) % available.length;
    npc.target = available[npc.waypointIndex];
    npc.activity = "walk";
  }

  #walk(npc, deltaSeconds) {
    const dx = npc.target.x - npc.x, dy = npc.target.y - npc.y;
    const distance = Math.hypot(dx, dy);
    if (distance < .08) {
      npc.x = npc.target.x; npc.y = npc.target.y;
      npc.activity = npc.target.activity ?? "idle";
      npc.timer = npc.target.duration ?? (npc.activity === "work" ? PROFESSION_BEHAVIOR[npc.profession]?.workDuration ?? 4 : 2.5);
      npc.target = null;
      return;
    }
    const step = Math.min(distance, deltaSeconds * .9);
    const moveX = dx / distance * step, moveY = dy / distance * step;
    this.#tryMove(npc, moveX, 0); this.#tryMove(npc, 0, moveY);
    npc.direction = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "west" : "east") : (dy < 0 ? "north" : "south");
  }

  #tryMove(npc, dx, dy) {
    const nx = npc.x + dx, ny = npc.y + dy;
    const fromX = Math.floor(npc.x), fromY = Math.floor(npc.y), toX = Math.floor(nx), toY = Math.floor(ny);
    const allowed = fromX === toX && fromY === toY
      ? this.collisionMap.isWalkable(toX, toY)
      : this.collisionMap.canCross(fromX, fromY, toX, toY);
    if (allowed) { npc.x = nx; npc.y = ny; }
  }
}
