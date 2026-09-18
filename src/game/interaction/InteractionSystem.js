const LABELS = {
  door: "Дверь", airlock: "Шлюз", terminal: "Терминал", container: "Открыть",
  npc: "Поговорить", equipment: "Осмотреть", damaged: "Осмотреть", expedition: "Экспедиция"
};

export class InteractionSystem {
  constructor(map, doorSystem, sectorStates = null, range = 1.8) {
    this.map = map;
    this.doorSystem = doorSystem;
    this.sectorStates = sectorStates;
    this.range = range;
  }

  targets(npcs = []) {
    const visible = (item) => !item.visibleWhen || !item.sectorId || !this.sectorStates || item.visibleWhen.includes(this.sectorStates.get(item.sectorId)?.status);
    return [...this.map.doors, ...this.map.obstacles.filter((item) => item.type && visible(item)), ...npcs];
  }

  nearest(player, npcs = []) {
    let result = null;
    let distance = this.range;
    for (const target of this.targets(npcs)) {
      const current = Math.hypot((target.x + .5) - player.x, (target.y + .5) - player.y);
      if (current <= distance) { result = target; distance = current; }
    }
    return result;
  }

  label(target) {
    if (!target) return "Действие";
    if (target.type === "door" || target.type === "airlock") {
      if (target.state === "locked") return "Закрыто";
      if (target.state === "jammed") return "Повреждено";
      if (target.doorKind === "automatic") return "Автодверь";
      return ["open", "opening"].includes(target.state) ? "Закрыть" : "Открыть";
    }
    return LABELS[target.type] ?? "Взаимодействовать";
  }

  interact(target, worldState) {
    if (!target) return null;
    worldState.interacted ??= {};
    worldState.looted ??= {};
    const previousInteractions = worldState.interacted[target.id] ?? 0;
    const firstInteraction = previousInteractions === 0;
    const lootCollected = target.type === "container" && !worldState.looted[target.id];
    let actionPerformed = true;

    if (target.type === "door" || target.type === "airlock") {
      actionPerformed = this.doorSystem.toggle(target);
    } else if (target.type === "container") {
      actionPerformed = lootCollected;
      if (lootCollected) worldState.looted[target.id] = true;
    }

    worldState.interacted[target.id] = previousInteractions + 1;

    return {
      id: target.id,
      type: target.type,
      sectorId: target.sectorId ?? null,
      label: LABELS[target.type] ?? "Объект",
      actionPerformed,
      firstInteraction,
      lootCollected,
      loot: lootCollected ? [...(target.loot ?? [])] : [],
      message: target.type === "container" && !lootCollected ? "Контейнер пуст" : null
    };
  }
}
