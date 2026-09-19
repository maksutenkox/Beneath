export const PLAYER_TUNING = Object.freeze({
  acceleration: 1480, deceleration: 1860, maxSpeed: 245, airControl: .62,
  gravity: 1780, jumpVelocity: 610, jumpCut: .48, coyoteTime: .1, jumpBuffer: .11
});

export function createPlayer(spawn) {
  return {
    x: spawn.x, y: spawn.y, width: 34, height: 82,
    vx: 0, vy: 0, facing: 1, grounded: false,
    coyoteRemaining: 0, jumpBuffered: 0,
    animation: "idle", animationTime: 0, previousAnimation: "idle",
    hp: 6, maxHp: 6, hurtTime: 0, invulnerableTime: 0,
    activeWeapon: "keyboard", landTime: 0
  };
}

export class PlayerController {
  constructor(collisionWorld, tuning = {}) { this.world = collisionWorld; this.tuning = { ...PLAYER_TUNING, ...tuning }; }

  update(player, input, deltaSeconds, locked = false) {
    const dt = Math.min(.05, Math.max(0, deltaSeconds));
    player.animationTime += dt;
    player.invulnerableTime = Math.max(0, (player.invulnerableTime ?? 0) - dt);
    player.hurtTime = Math.max(0, (player.hurtTime ?? 0) - dt);
    player.landTime = Math.max(0, (player.landTime ?? 0) - dt);
    if (input.jumpPressed) player.jumpBuffered = this.tuning.jumpBuffer;
    else player.jumpBuffered = Math.max(0, player.jumpBuffered - dt);
    player.coyoteRemaining = player.grounded ? this.tuning.coyoteTime : Math.max(0, player.coyoteRemaining - dt);

    const axis = locked ? 0 : Math.max(-1, Math.min(1, input.horizontal));
    if (axis) {
      const control = player.grounded ? 1 : this.tuning.airControl;
      player.vx += axis * this.tuning.acceleration * control * dt;
      player.vx = Math.max(-this.tuning.maxSpeed, Math.min(this.tuning.maxSpeed, player.vx));
      player.facing = axis < 0 ? -1 : 1;
    } else {
      const drag = this.tuning.deceleration * (player.grounded ? 1 : .18) * dt;
      player.vx = Math.abs(player.vx) <= drag ? 0 : player.vx - Math.sign(player.vx) * drag;
    }

    let jumped = false;
    if (!locked && player.jumpBuffered > 0 && player.coyoteRemaining > 0) {
      player.vy = -this.tuning.jumpVelocity;
      player.grounded = false; player.coyoteRemaining = 0; player.jumpBuffered = 0;
      jumped = true;
      this.#setAnimation(player, "jump_start");
    }
    if (!input.jumpHeld && player.vy < -120) player.vy *= Math.pow(this.tuning.jumpCut, dt * 10);
    player.vy += this.tuning.gravity * dt;

    const impactVelocity = player.vy;
    const collision = this.world.move(player, player.vx * dt, player.vy * dt);
    const wasGrounded = player.grounded;
    player.grounded = collision.grounded;
    if (collision.hitLeft || collision.hitRight) player.vx = 0;
    if (collision.hitCeiling && player.vy < 0) player.vy = 0;
    if (collision.grounded && player.vy > 0) player.vy = 0;

    let animation = "idle";
    if (player.hurtTime > 0) animation = "hurt";
    else if (!player.grounded) animation = jumped || (player.animation === "jump_start" && player.animationTime < .12) ? "jump_start" : player.vy < -45 ? "jump" : "fall";
    else if (!wasGrounded && player.grounded) { animation = "land"; player.landTime = .11; }
    else if (player.landTime > 0) animation = "land";
    else if (Math.abs(player.vx) > 18) animation = "run";
    if (!locked || player.hurtTime > 0) this.#setAnimation(player, animation);
    return { ...collision, landed: !wasGrounded && player.grounded, jumped, impactVelocity };
  }

  hurt(player, damage = 1, sourceX = player.x) {
    if (player.invulnerableTime > 0 || player.hp <= 0) return false;
    player.hp = Math.max(0, player.hp - damage);
    player.invulnerableTime = .72; player.hurtTime = .28;
    player.vx = player.x < sourceX ? -185 : 185; player.vy = -170;
    this.#setAnimation(player, player.hp <= 0 ? "death" : "hurt");
    return true;
  }

  #setAnimation(player, next) {
    if (player.animation === next) return;
    player.previousAnimation = player.animation;
    player.animation = next; player.animationTime = 0;
  }
}
