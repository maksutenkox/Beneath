const SPEED = { automatic: 2.8, manual: 1.65, locked: 0, damaged: .7, bulkhead: .48 };

export class DoorSystem {
  constructor(doors) {
    this.doors = doors;
    for (const door of doors) this.#initialize(door);
  }

  #initialize(door) {
    door.doorKind ??= "manual";
    door.progress ??= door.open ? 1 : door.doorKind === "damaged" ? .22 : 0;
    door.state ??= door.locked || door.doorKind === "locked" ? "locked" : door.doorKind === "damaged" ? "jammed" : door.open ? "open" : "closed";
    door.collision = door.progress < .82;
  }

  update(deltaSeconds, player) {
    for (const door of this.doors) {
      if (door.doorKind === "automatic") {
        const near = Math.hypot((door.x + .5) - player.x, (door.y + .5) - player.y) < 1.65;
        if (near && ["closed", "closing"].includes(door.state)) door.state = "opening";
        if (!near && ["open", "opening"].includes(door.state)) door.state = "closing";
      }
      const speed = SPEED[door.doorKind] ?? SPEED.manual;
      if (door.state === "opening") {
        door.progress = Math.min(1, door.progress + speed * deltaSeconds);
        if (door.progress >= 1) door.state = "open";
      } else if (door.state === "closing") {
        door.progress = Math.max(0, door.progress - speed * deltaSeconds);
        if (door.progress <= 0) door.state = "closed";
      }
      door.open = door.state === "open" || door.state === "opening";
      door.collision = door.progress < .82;
    }
  }

  toggle(door) {
    if (!door || ["locked", "jammed"].includes(door.state) || door.doorKind === "automatic") return false;
    door.state = ["open", "opening"].includes(door.state) ? "closing" : "opening";
    return true;
  }

  snapshot() {
    return Object.fromEntries(this.doors.map((door) => [door.id, {
      state: door.state, progress: door.progress, open: door.open, collision: door.collision,
      doorKind: door.doorKind, locked: Boolean(door.locked)
    }]));
  }

  restore(snapshot = {}) {
    for (const door of this.doors) {
      const saved = snapshot[door.id];
      if (!saved) continue;
      Object.assign(door, saved);
    }
  }
}
