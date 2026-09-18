const SAVE_VERSION = 2;
import { createInitialInventory } from "../resources/ResourceCatalog.js";
import { EXPEDITION_UNAVAILABLE_MESSAGE } from "../interaction/Messages.js";

export class GameCore {
  #renderer;
  #saveStore;
  #collisionMap;
  #input;
  #camera;
  #interactions;
  #doors;
  #resourceHud;
  #repairPanel;
  #repairs;
  #npcs;
  #population;
  #statusToast;
  #audio;
  #lastFootstep = 0;
  #autosaveTime = 0;
  #state;
  #running = false;
  #frame = 0;
  #lastTime = 0;

  constructor({ renderer, saveStore, collisionMap, input, camera, interactions, doors, resourceHud, repairPanel, repairs, npcs, population, statusToast, audio }) {
    this.#renderer = renderer;
    this.#saveStore = saveStore;
    this.#collisionMap = collisionMap;
    this.#input = input;
    this.#camera = camera;
    this.#interactions = interactions;
    this.#doors = doors;
    this.#resourceHud = resourceHud;
    this.#repairPanel = repairPanel;
    this.#repairs = repairs;
    this.#npcs = npcs;
    this.#population = population;
    this.#statusToast = statusToast;
    this.#audio = audio;
    this.#state = this.#newState();
  }

  async start() {
    const loaded = await this.#saveStore.load();
    this.#state = loaded ? { ...this.#newState(), ...loaded, version: SAVE_VERSION } : this.#newState();
    this.#state.player ??= this.#newState().player;
    if (!this.#collisionMap.isWalkable(Math.floor(this.#state.player.x), Math.floor(this.#state.player.y))) {
      this.#state.player = this.#newState().player;
    }
    this.#state.camera = this.#camera.initialize(this.#state.player);
    this.#state.resources ??= createInitialInventory();
    this.#state.sectors ??= this.#repairs.snapshot();
    this.#repairs.restore(this.#state.sectors);
    this.#doors.restore(this.#state.doors);
    this.#state.npcs = this.#npcs.initialize(this.#state.npcs);
    this.#state.population = this.#population.initialize(this.#state.population, this.#state.npcs);
    this.#state.completedRepairs ??= [];
    for (const sectorId of ["medical", "workshop"]) {
      if (this.#state.sectors[sectorId] === "ACTIVE" && !this.#state.completedRepairs.includes(sectorId)) this.#state.completedRepairs.push(sectorId);
    }
    this.#audio.restore(this.#state.audioLevels);
    this.#resourceHud.render(this.#state.resources, this.#state.population.count);
    this.#running = true;
    this.#lastTime = performance.now();
    this.#renderer.resize();
    this.#frame = requestAnimationFrame(this.#tick);
  }

  stop() {
    this.#running = false;
    cancelAnimationFrame(this.#frame);
    void this.save();
  }

  async save() {
    this.#state.savedAt = new Date().toISOString();
    this.#state.version = SAVE_VERSION;
    this.#state.doors = this.#doors.snapshot();
    this.#state.audioLevels = this.#audio.snapshot();
    await this.#saveStore.save(this.#state);
  }

  isWalkable(x, y) {
    return this.#collisionMap.isWalkable(x, y);
  }

  #newState() {
    return {
      version: SAVE_VERSION,
      createdAt: new Date().toISOString(),
      savedAt: null,
      player: { x: 14.5, y: 9.5, direction: "south-east", animation: "idle", animationTime: 0 },
      world: { interacted: {} },
      interaction: { targetId: null, lastResult: null }
      , resources: createInitialInventory()
      , completedRepairs: []
    };
  }

  #updatePlayer(deltaSeconds) {
    const player = this.#state.player ?? this.#newState().player;
    this.#state.player = player;
    if (this.#repairPanel.isOpen) { player.animation = "idle"; return; }
    const movement = this.#input.vector();
    player.animationTime += deltaSeconds;
    if (!movement.x && !movement.y) player.animation = "idle";
    else {
      player.animation = "walk";
      const vertical = movement.y < -.25 ? "north" : movement.y > .25 ? "south" : "";
      const horizontal = movement.x < -.25 ? "west" : movement.x > .25 ? "east" : "";
      player.direction = vertical && horizontal ? `${vertical}-${horizontal}` : vertical || horizontal;
      const distance = 2.25 * deltaSeconds;
      this.#tryMove(player, movement.x * distance, 0);
      this.#tryMove(player, 0, movement.y * distance);
      if (player.animationTime - this.#lastFootstep > .34) {
        this.#lastFootstep = player.animationTime;
        this.#audio.play("footstep", { pitch: .94 + (Math.floor(player.animationTime * 10) % 3) * .05, gain: Math.hypot(movement.x, movement.y) });
      }
    }
    this.#updateInteraction(player);
  }

  #updateInteraction(player) {
    this.#state.world ??= { interacted: {} };
    this.#state.interaction ??= { targetId: null, lastResult: null };
    const target = this.#interactions.nearest(player, this.#state.npcs);
    this.#state.interaction.targetId = target?.id ?? null;
    this.#input.setInteractionAvailable(Boolean(target), this.#interactions.label(target));
    if (this.#input.consumeInteraction()) {
      const result = this.#interactions.interact(target, this.#state.world);
      this.#state.interaction.lastResult = result;
      if (result?.actionPerformed !== false) {
        this.#audio.play(target?.type === "door" || target?.type === "airlock" ? "doorMove" : target?.type === "npc" ? "npcTalk" : target?.type === "equipment" ? "equipmentUse" : "uiAction");
      }
      this.#state.interaction.lastResultAt = player.animationTime;
      const sectorId = result?.sectorId;
      if (sectorId && this.#repairs.isRepairable(sectorId)) this.#showRepairPanel(sectorId);
      if (result?.type === "expedition") this.#statusToast.show(EXPEDITION_UNAVAILABLE_MESSAGE);
    }
  }


  #showRepairPanel(sectorId) {
    const refresh = () => {
      const details = this.#repairs.details(sectorId, this.#state.resources);
      this.#repairPanel.show(details, () => {
        if (this.#repairs.repair(sectorId, this.#state.resources)) {
          this.#audio.play("repair");
          this.#state.sectors = this.#repairs.snapshot();
          if (!this.#state.completedRepairs.includes(sectorId)) this.#state.completedRepairs.push(sectorId);
          this.#resourceHud.render(this.#state.resources);
          this.save();
        }
        refresh();
      });
    };
    refresh();
  }

  #tryMove(player, dx, dy) {
    const nextX = player.x + dx;
    const nextY = player.y + dy;
    const fromX = Math.floor(player.x), fromY = Math.floor(player.y);
    const toX = Math.floor(nextX), toY = Math.floor(nextY);
    const sameTile = fromX === toX && fromY === toY;
    if ((sameTile && this.#collisionMap.isWalkable(toX, toY)) || (!sameTile && this.#collisionMap.canCross(fromX, fromY, toX, toY))) {
      player.x = nextX; player.y = nextY;
    }
  }

  #tick = (time) => {
    if (!this.#running) return;
    const deltaSeconds = Math.min((time - this.#lastTime) / 1000, 0.1);
    this.#lastTime = time;
    this.#updatePlayer(deltaSeconds);
    this.#doors.update(deltaSeconds, this.#state.player);
    this.#npcs.update(this.#state.npcs, deltaSeconds);
    this.#population.update(this.#state.population, this.#state.resources, deltaSeconds, this.#state.npcs);
    this.#resourceHud.render(this.#state.resources, this.#state.population.count);
    this.#autosaveTime += deltaSeconds;
    if (this.#autosaveTime >= 15) { this.#autosaveTime = 0; void this.save(); }
    this.#camera.update(this.#state.camera, this.#state.player, deltaSeconds);
    this.#renderer.render({ deltaSeconds, state: this.#state });
    this.#frame = requestAnimationFrame(this.#tick);
  };
}
