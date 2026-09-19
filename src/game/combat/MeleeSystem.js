import { rectanglesOverlap } from "../physics/SideViewCollisionWorld.js";

export class MeleeSystem {
  constructor({ cooldown = .42, duration = .34, activeStart = .11, activeEnd = .22, damage = 1 } = {}) {
    Object.assign(this, { cooldown, duration, activeStart, activeEnd, damage });
  }
  initialize(saved = {}) { return { cooldown: 0, time: 0, active: false, connected: false, serial: saved.serial ?? 0 }; }
  tryStart(state, player) {
    if (state.cooldown > 0 || state.active || player.hp <= 0) return false;
    state.active = true; state.time = 0; state.connected = false; state.serial += 1;
    player.previousAnimation = player.animation; player.animation = "attack_1"; player.animationTime = 0;
    return true;
  }
  update(state, player, deltaSeconds, targets = []) {
    const dt = Math.max(0, deltaSeconds);
    state.cooldown = Math.max(0, state.cooldown - dt);
    if (!state.active) return [];
    state.time += dt;
    const hits = [];
    if (!state.connected && state.time >= this.activeStart && state.time <= this.activeEnd) {
      const box = this.hitbox(player);
      for (const target of targets) {
        if (!rectanglesOverlap(box, target)) continue;
        target.hitTime = .18; target.hits = (target.hits ?? 0) + 1;
        hits.push({ id: target.id, damage: this.damage, serial: state.serial });
      }
      state.connected = hits.length > 0;
    }
    if (state.time >= this.duration) { state.active = false; state.cooldown = this.cooldown; }
    return hits;
  }
  hitbox(player) {
    return { x: player.facing > 0 ? player.x + player.width - 2 : player.x - 58, y: player.y + 20, width: 60, height: 48 };
  }
}

