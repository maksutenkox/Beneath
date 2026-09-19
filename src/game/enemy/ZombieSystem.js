import { rectanglesOverlap } from "../physics/SideViewCollisionWorld.js";

export class ZombieSystem {
  constructor(collisionWorld) { this.world = collisionWorld; }

  initialize(definitions = [], saved = []) {
    const savedById = new Map(saved.map((enemy) => [enemy.id, enemy]));
    return definitions.map((definition) => ({
      ...definition, x: savedById.get(definition.id)?.x ?? definition.x, y: definition.y,
      width: 34, height: 82, vx: 0, vy: 0, facing: -1,
      hp: savedById.get(definition.id)?.hp ?? 3, maxHp: 3,
      animation: savedById.get(definition.id)?.hp <= 0 ? "death" : "idle", animationTime: savedById.get(definition.id)?.hp <= 0 ? 2 : 0,
      attackTime: 0, attackCooldown: .4, attackConnected: false, hurtTime: 0, hitTime: 0,
      spawnX: definition.x, grounded: false
    }));
  }

  update(enemies, player, deltaSeconds) {
    const dt = Math.min(.05, Math.max(0, deltaSeconds)), playerHits = [];
    for (const enemy of enemies) {
      enemy.animationTime += dt;
      enemy.hitTime = Math.max(0, enemy.hitTime - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      if (enemy.hp <= 0) { this.#setAnimation(enemy, "death"); enemy.vx = 0; continue; }
      enemy.hurtTime = Math.max(0, enemy.hurtTime - dt);
      if (enemy.hurtTime > 0) {
        this.#setAnimation(enemy, "hurt");
      } else if (enemy.attackTime > 0) {
        enemy.attackTime += dt;
        this.#setAnimation(enemy, "attack");
        if (!enemy.attackConnected && enemy.attackTime >= .2 && enemy.attackTime <= .34) {
          const box = { x: enemy.facing > 0 ? enemy.x + enemy.width - 4 : enemy.x - 36, y: enemy.y + 18, width: 40, height: 52 };
          if (rectanglesOverlap(box, player)) { playerHits.push({ enemyId: enemy.id, damage: 1, sourceX: enemy.x + enemy.width / 2 }); enemy.attackConnected = true; }
        }
        if (enemy.attackTime >= .54) { enemy.attackTime = 0; enemy.attackCooldown = 1.05; enemy.attackConnected = false; }
      } else {
        const distance = player.x - enemy.x;
        const closeEnough = Math.abs(distance) < 54 && Math.abs(player.y - enemy.y) < 65;
        if (closeEnough && enemy.attackCooldown <= 0) {
          enemy.attackTime = .001; enemy.attackConnected = false; enemy.vx = 0; enemy.facing = distance < 0 ? -1 : 1; this.#setAnimation(enemy, "attack");
        } else {
          let direction = 0;
          if (Math.abs(distance) < 440 && player.hp > 0) direction = distance < 0 ? -1 : 1;
          else if (enemy.x < enemy.spawnX - enemy.patrolRadius) direction = 1;
          else if (enemy.x > enemy.spawnX + enemy.patrolRadius) direction = -1;
          else direction = enemy.facing;
          enemy.vx += (direction * 58 - enemy.vx) * Math.min(1, dt * 7);
          enemy.facing = direction || enemy.facing;
          this.#setAnimation(enemy, Math.abs(enemy.vx) > 8 ? "walk" : "idle");
        }
      }
      enemy.vy += 1780 * dt;
      const collision = this.world.move(enemy, enemy.vx * dt, enemy.vy * dt);
      enemy.grounded = collision.grounded;
      if ((collision.hitLeft || collision.hitRight) && enemy.hurtTime <= 0) enemy.facing *= -1;
      if (collision.grounded && enemy.vy > 0) enemy.vy = 0;
    }
    return playerHits;
  }

  damage(enemy, amount, sourceX) {
    if (!enemy || enemy.hp <= 0 || enemy.hurtTime > 0) return false;
    enemy.hp = Math.max(0, enemy.hp - amount); enemy.hitTime = .16;
    if (enemy.hp <= 0) { enemy.vx = 0; this.#setAnimation(enemy, "death"); }
    else { enemy.hurtTime = .24; enemy.vx = enemy.x < sourceX ? -135 : 135; enemy.vy = -90; this.#setAnimation(enemy, "hurt"); }
    return true;
  }

  activeTargets(enemies) { return enemies.filter((enemy) => enemy.hp > 0); }
  snapshot(enemies) { return enemies.map(({ id, x, hp }) => ({ id, x, hp })); }

  #setAnimation(enemy, next) {
    if (enemy.animation === next) return;
    enemy.animation = next; enemy.animationTime = 0;
  }
}
