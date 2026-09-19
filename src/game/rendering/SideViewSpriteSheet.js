import { SIDE_VIEW_CLIPS, sideViewFrameAt } from "../animation/SideViewAnimation.js";
export class SideViewSpriteSheet {
  constructor({ url, frameWidth = 64, frameHeight = 96, imageFactory = null, clips = SIDE_VIEW_CLIPS }) { Object.assign(this, { url, frameWidth, frameHeight, imageFactory, clips }); this.image = null; this.ready = false; this.failed = false; }
  load() {
    if (this.ready || this.failed) return Promise.resolve(this.ready);
    this.image = (this.imageFactory ?? (() => new Image()))();
    return new Promise((resolve) => {
      this.image.onload = () => { this.ready = this.image.naturalWidth === this.frameWidth * 8 && this.image.naturalHeight === this.frameHeight * 5; this.failed = !this.ready; resolve(this.ready); };
      this.image.onerror = () => { this.failed = true; resolve(false); }; this.image.src = this.url;
    });
  }
  draw(ctx, { state, time, facing = 1, x, y, scale = 1, flash = false }) {
    if (!this.ready) return false;
    const frame = sideViewFrameAt(state, time, this.clips), width = this.frameWidth * scale, height = this.frameHeight * scale;
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(x), Math.round(y)); if (facing < 0) ctx.scale(-1, 1);
    if (flash) { ctx.globalAlpha = .55; ctx.globalCompositeOperation = "screen"; }
    ctx.drawImage(this.image, frame.column * this.frameWidth, frame.row * this.frameHeight, this.frameWidth, this.frameHeight, Math.round(-width / 2), Math.round(-height), Math.round(width), Math.round(height));
    ctx.restore(); return true;
  }
}
