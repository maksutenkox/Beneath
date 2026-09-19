import { createPlayer } from "../player/PlayerController.js";

const SAVE_VERSION = 3;
export class GameCore {
  #running = false; #frame = 0; #lastTime = 0; #autosaveTime = 0; #footstepTime = 0; #state;
  constructor({ map, renderer, saveStore, input, playerController, camera, interactions, melee, health, heartsHud, workbenchPanel, statusToast, audio }) {
    Object.assign(this, { map, renderer, saveStore, input, playerController, camera, interactions, melee, health, heartsHud, workbenchPanel, statusToast, audio });
    this.#state = this.#newState();
  }
  async start() {
    this.renderer.resize();
    const loaded = await this.saveStore.load();
    this.#state = this.#restore(loaded);
    this.#state.camera = this.camera.initialize(this.#state.player, this.renderer.viewport());
    this.audio.restore(this.#state.audioLevels);
    this.heartsHud.render(this.#state.player.hp, this.#state.player.maxHp);
    this.#running = true; this.#lastTime = performance.now(); this.#frame = requestAnimationFrame(this.#tick);
  }
  stop() { this.#running = false; cancelAnimationFrame(this.#frame); void this.save(); }
  async save() {
    const { player, weapon, upgrades, combat } = this.#state;
    await this.saveStore.save({
      version: SAVE_VERSION, savedAt: new Date().toISOString(),
      player: { x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, facing: player.facing, activeWeapon: player.activeWeapon },
      weapon: { ...weapon }, upgrades: JSON.parse(JSON.stringify(upgrades)), combat: { serial: combat.serial }, audioLevels: this.audio.snapshot()
    });
  }
  get state() { return this.#state; }
  #newState() {
    const player = createPlayer(this.map.spawn);
    return { version: SAVE_VERSION, player, camera: null, combat: this.melee.initialize(), dummy: { ...this.map.trainingDummy, hits: 0, hitTime: 0 }, weapon: { id: "keyboard", name: "Battered Keyboard", level: 1, damage: 1, modifier: "balanced" }, upgrades: { keyboard: { level: 1 } }, interaction: { targetId: null }, audioLevels: {} };
  }
  #restore(saved) {
    const state = this.#newState(); if (!saved || saved.version !== SAVE_VERSION) return state;
    Object.assign(state.player, saved.player ?? {}); state.player.hp = this.health.normalize(state.player.hp);
    state.player.x = Math.max(0, Math.min(this.map.width - state.player.width, state.player.x));
    state.player.y = Number.isFinite(state.player.y) ? state.player.y : this.map.spawn.y;
    state.weapon = { ...state.weapon, ...(saved.weapon ?? {}) }; state.upgrades = { ...state.upgrades, ...(saved.upgrades ?? {}) };
    state.combat = this.melee.initialize(saved.combat); state.audioLevels = saved.audioLevels ?? {}; return state;
  }
  #updateInteraction(input) {
    const target = this.interactions.nearest(this.#state.player);
    this.#state.interaction.targetId = target?.id ?? null;
    this.input.setInteractionAvailable(Boolean(target), target?.label ?? "ВЗАИМОДЕЙСТВОВАТЬ");
    if (!input.interactPressed || !target) return;
    const result = this.interactions.interact(target); this.audio.play("uiAction");
    this.#state.player.animation = "interact"; this.#state.player.animationTime = 0;
    if (result.openPanel) this.#openWorkbench();
    if (result.message) this.statusToast.show(result.message);
  }
  #openWorkbench() {
    const refresh = () => this.workbenchPanel.show(this.#state.weapon, {
      upgrade: () => { if (this.#state.weapon.level < 3) { this.#state.weapon.level += 1; this.#state.weapon.damage += 1; this.#state.upgrades.keyboard.level = this.#state.weapon.level; this.audio.play("upgrade"); void this.save(); } refresh(); },
      modify: () => { this.#state.weapon.modifier = this.#state.weapon.modifier === "balanced" ? "impact" : "balanced"; this.audio.play("uiAction"); void this.save(); refresh(); }
    });
    refresh();
  }
  #tick = (time) => {
    if (!this.#running) return;
    const dt = Math.min(.05, Math.max(0, (time - this.#lastTime) / 1000)); this.#lastTime = time;
    const input = this.input.snapshot(), panelOpen = this.workbenchPanel.isOpen;
    const movement = this.playerController.update(this.#state.player, input, dt, panelOpen || this.#state.combat.active);
    if (movement.jumped) this.audio.play("jump");
    if (movement.landed) this.audio.play("land", { gain: Math.min(1, Math.abs(movement.impactVelocity) / 400 + .35) });
    if (!panelOpen && input.attackPressed && this.melee.tryStart(this.#state.combat, this.#state.player)) this.audio.play("attack");
    const hits = this.melee.update(this.#state.combat, this.#state.player, dt, [this.#state.dummy]);
    if (this.#state.combat.active) { this.#state.player.animation = "attack_1"; this.#state.player.animationTime = this.#state.combat.time; }
    if (hits.length) this.audio.play("hit", { pitch: .92 + (this.#state.dummy.hits % 3) * .06 });
    this.#state.dummy.hitTime = Math.max(0, this.#state.dummy.hitTime - dt);
    if (this.#state.player.grounded && Math.abs(this.#state.player.vx) > 45) {
      this.#footstepTime += dt;
      if (this.#footstepTime >= .27) { this.#footstepTime = 0; this.audio.play("footstep", { pitch: .95 + (Math.floor(time / 100) % 3) * .04 }); }
    } else this.#footstepTime = 0;
    if (!panelOpen) this.#updateInteraction(input); else this.input.setInteractionAvailable(false);
    this.heartsHud.render(this.#state.player.hp, this.#state.player.maxHp);
    this.camera.update(this.#state.camera, this.#state.player, dt, this.renderer.viewport());
    this.renderer.render({ deltaSeconds: dt, state: this.#state });
    this.#autosaveTime += dt; if (this.#autosaveTime >= 15) { this.#autosaveTime = 0; void this.save(); }
    this.#frame = requestAnimationFrame(this.#tick);
  };
}
