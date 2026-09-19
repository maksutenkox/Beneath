import { createPlayer } from "../player/PlayerController.js";

const SAVE_VERSION = 4;

export class GameCore {
  #running = false; #frame = 0; #lastTime = 0; #autosaveTime = 0; #footstepTime = 0; #state;
  constructor({ map, renderer, saveStore, input, playerController, camera, interactions, melee, health, zombies, levelGenerator, heartsHud, runHud, workbenchPanel, statusToast, audio }) {
    Object.assign(this, { renderer, saveStore, input, playerController, camera, interactions, melee, health, zombies, levelGenerator, heartsHud, runHud, workbenchPanel, statusToast, audio });
    this.hubMap = map; this.map = map; this.#state = this.#newState();
  }
  async start() {
    this.renderer.resize();
    await this.renderer.load?.();
    const loaded = await this.saveStore.load();
    this.#state = this.#restore(loaded);
    this.map = this.#mapForScene(this.#state.scene);
    this.#configureMap(this.map);
    this.#state.player.x = Math.max(0, Math.min(this.map.width - this.#state.player.width, Number.isFinite(this.#state.player.x) ? this.#state.player.x : this.map.spawn.x));
    this.#state.player.y = Number.isFinite(this.#state.player.y) ? this.#state.player.y : this.map.spawn.y;
    this.#state.enemies = this.zombies.initialize(this.map.enemies ?? [], this.#state.enemies);
    this.#state.dummy = this.map.trainingDummy ? { ...this.map.trainingDummy, hits: 0, hitTime: 0 } : null;
    if (this.playerController.world.intersects(this.#state.player)) this.#placePlayer(this.map.spawn);
    this.#state.camera = this.camera.initialize(this.#state.player, this.renderer.viewport());
    this.audio.restore(this.#state.audioLevels);
    this.#renderHud();
    this.#running = true; this.#lastTime = performance.now(); this.#frame = requestAnimationFrame(this.#tick);
  }
  stop() { this.#running = false; cancelAnimationFrame(this.#frame); void this.save(); }
  async save() {
    const { player, weapon, upgrades, combat, scene, enemies } = this.#state;
    await this.saveStore.save({
      version: SAVE_VERSION, savedAt: new Date().toISOString(), scene: { ...scene },
      player: { x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, facing: player.facing, activeWeapon: player.activeWeapon },
      weapon: { ...weapon }, upgrades: JSON.parse(JSON.stringify(upgrades)), combat: { serial: combat.serial },
      enemies: this.zombies.snapshot(enemies), audioLevels: this.audio.snapshot()
    });
  }
  get state() { return this.#state; }
  #newState() {
    const player = createPlayer(this.hubMap.spawn);
    return {
      version: SAVE_VERSION, scene: { kind: "hub", levelNumber: 0, seed: 0 }, player, camera: null,
      combat: this.melee.initialize(), dummy: null, enemies: [], deathTime: 0,
      weapon: { id: "keyboard", name: "Battered Keyboard", level: 1, damage: 1, modifier: "balanced" },
      upgrades: { keyboard: { level: 1 } }, interaction: { targetId: null }, audioLevels: {}
    };
  }
  #restore(saved) {
    const state = this.#newState(); if (!saved || ![3, 4].includes(saved.version)) return state;
    Object.assign(state.player, saved.player ?? {}); state.player.hp = this.health.normalize(state.player.hp);
    state.scene = saved.version === 4 ? { ...state.scene, ...(saved.scene ?? {}) } : state.scene;
    state.weapon = { ...state.weapon, ...(saved.weapon ?? {}) }; state.upgrades = { ...state.upgrades, ...(saved.upgrades ?? {}) };
    state.combat = this.melee.initialize(saved.combat); state.audioLevels = saved.audioLevels ?? {}; state.enemies = saved.enemies ?? [];
    return state;
  }
  #mapForScene(scene) {
    return scene.kind === "office" ? this.levelGenerator.generate(scene.seed, scene.levelNumber) : this.hubMap;
  }
  #configureMap(map) {
    this.playerController.world.replace(map.colliders); this.renderer.setMap(map);
    this.camera.setBounds(map); this.interactions.setInteractables(map.interactables);
  }
  #placePlayer(spawn) {
    Object.assign(this.#state.player, { x: spawn.x, y: spawn.y, vx: 0, vy: 0, grounded: false, animation: "idle", animationTime: 0, hurtTime: 0, invulnerableTime: .45 });
  }
  #transition(destination) {
    if (destination === "hub") {
      this.#state.scene = { kind: "hub", levelNumber: 0, seed: 0 };
      this.#state.player.hp = this.#state.player.maxHp;
    } else if (destination === "office") {
      this.#state.scene = { kind: "office", levelNumber: 1, seed: (Date.now() >>> 0) || 1 };
    } else {
      this.#state.scene = { ...this.#state.scene, kind: "office", levelNumber: this.#state.scene.levelNumber + 1 };
    }
    this.map = this.#mapForScene(this.#state.scene); this.#configureMap(this.map); this.#placePlayer(this.map.spawn);
    this.#state.enemies = this.zombies.initialize(this.map.enemies ?? []);
    this.#state.dummy = this.map.trainingDummy ? { ...this.map.trainingDummy, hits: 0, hitTime: 0 } : null;
    this.#state.combat = this.melee.initialize(this.#state.combat); this.#state.deathTime = 0;
    this.#state.camera = this.camera.initialize(this.#state.player, this.renderer.viewport()); this.input.clear(); this.#renderHud();
    this.statusToast.show(destination === "hub" ? "SAFE HUB — HEALTH RESTORED" : this.map.title);
    void this.save();
  }
  #updateInteraction(input) {
    const target = this.interactions.nearest(this.#state.player);
    this.#state.interaction.targetId = target?.id ?? null;
    this.input.setInteractionAvailable(Boolean(target), target?.label ?? "ВЗАИМОДЕЙСТВОВАТЬ");
    if (!input.interactPressed || !target) return;
    const result = this.interactions.interact(target); this.audio.play("uiAction");
    this.#state.player.animation = "interact"; this.#state.player.animationTime = 0;
    if (result.openPanel) this.#openWorkbench();
    if (result.transition === "next-floor") {
      const alive = this.#state.enemies.filter((enemy) => enemy.hp > 0).length;
      if (alive) this.statusToast.show(`CLEAR THE FLOOR — ${alive} HOSTILE${alive === 1 ? "" : "S"} REMAIN`);
      else this.#transition("next-floor");
    } else if (result.transition) this.#transition(result.transition);
  }
  #openWorkbench() {
    const refresh = () => this.workbenchPanel.show(this.#state.weapon, {
      upgrade: () => { if (this.#state.weapon.level < 3) { this.#state.weapon.level += 1; this.#state.weapon.damage += 1; this.#state.upgrades.keyboard.level = this.#state.weapon.level; this.audio.play("upgrade"); void this.save(); } refresh(); },
      modify: () => { this.#state.weapon.modifier = this.#state.weapon.modifier === "balanced" ? "impact" : "balanced"; this.audio.play("uiAction"); void this.save(); refresh(); }
    });
    refresh();
  }
  #renderHud() {
    this.heartsHud.render(this.#state.player.hp, this.#state.player.maxHp);
    this.runHud.render(this.#state.scene, this.#state.enemies);
  }
  #tick = (time) => {
    if (!this.#running) return;
    const dt = Math.min(.05, Math.max(0, (time - this.#lastTime) / 1000)); this.#lastTime = time;
    const input = this.input.snapshot(), panelOpen = this.workbenchPanel.isOpen, dead = this.#state.player.hp <= 0;
    this.#state.player.attackDamage = this.#state.weapon.damage;
    const movement = this.playerController.update(this.#state.player, input, dt, panelOpen || dead || this.#state.combat.active);
    if (movement.jumped) this.audio.play("jump");
    if (movement.landed) this.audio.play("land", { gain: Math.min(1, Math.abs(movement.impactVelocity) / 400 + .35) });
    if (!panelOpen && !dead && input.attackPressed && this.melee.tryStart(this.#state.combat, this.#state.player)) this.audio.play("attack");
    const targets = [...this.zombies.activeTargets(this.#state.enemies)]; if (this.#state.dummy) targets.push(this.#state.dummy);
    const hits = this.melee.update(this.#state.combat, this.#state.player, dt, targets);
    if (this.#state.combat.active) { this.#state.player.animation = "attack_1"; this.#state.player.animationTime = this.#state.combat.time; }
    for (const hit of hits) {
      const enemy = this.#state.enemies.find(({ id }) => id === hit.id);
      if (enemy) this.zombies.damage(enemy, hit.damage, this.#state.player.x + this.#state.player.width / 2);
    }
    if (hits.length) this.audio.play("hit", { pitch: .92 + ((hits[0].serial ?? 0) % 3) * .06 });
    if (this.#state.dummy) this.#state.dummy.hitTime = Math.max(0, this.#state.dummy.hitTime - dt);
    const enemyHits = this.zombies.update(this.#state.enemies, this.#state.player, dt);
    for (const hit of enemyHits) if (this.playerController.hurt(this.#state.player, hit.damage, hit.sourceX)) this.audio.play("hurt");
    if (this.#state.player.grounded && Math.abs(this.#state.player.vx) > 45) {
      this.#footstepTime += dt;
      if (this.#footstepTime >= .27) { this.#footstepTime = 0; this.audio.play("footstep", { pitch: .95 + (Math.floor(time / 100) % 3) * .04 }); }
    } else this.#footstepTime = 0;
    if (dead || this.#state.player.hp <= 0) {
      this.input.setInteractionAvailable(false); this.#state.deathTime += dt;
      if (this.#state.deathTime >= 1.65) this.#transition("hub");
    } else if (!panelOpen) this.#updateInteraction(input); else this.input.setInteractionAvailable(false);
    this.#renderHud(); this.camera.update(this.#state.camera, this.#state.player, dt, this.renderer.viewport());
    this.renderer.render({ deltaSeconds: dt, state: this.#state });
    this.#autosaveTime += dt; if (this.#autosaveTime >= 15) { this.#autosaveTime = 0; void this.save(); }
    this.#frame = requestAnimationFrame(this.#tick);
  };
}
