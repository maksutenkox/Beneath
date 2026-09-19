import { ENEMY_CLIPS, enemyFrameAt } from "../animation/EnemyAnimation.js";

export class EnemySpriteSheet {
  constructor(imageFactory = null) { this.imageFactory = imageFactory; this.ready = false; this.failed = false; }
  load() {
    this.image = (this.imageFactory ?? (() => new Image()))();
    return new Promise((resolve) => {
      this.image.onload = () => { this.ready = this.image.naturalWidth === 768 && this.image.naturalHeight === 448; this.failed = !this.ready; resolve(this.ready); };
      this.image.onerror = () => { this.failed = true; resolve(false); };
      this.image.src = new URL("../assets/below-protocol/office-zombie.png", import.meta.url).href;
    });
  }
  draw(ctx, enemy) {
    if (!this.ready) return false;
    const frame = enemyFrameAt(enemy.animation, enemy.animationTime), x = enemy.x + enemy.width / 2, y = enemy.y + enemy.height + 4;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y));
    // Authored sheet faces left; mirror only when chasing right.
    if (enemy.facing > 0) ctx.scale(-1, 1);
    if (enemy.hitTime > 0) { ctx.globalAlpha = .62; ctx.globalCompositeOperation = "screen"; }
    ctx.drawImage(this.image, frame.column * 96, frame.row * 112, 96, 112, -48, -112, 96, 112);
    ctx.restore(); return true;
  }
}
