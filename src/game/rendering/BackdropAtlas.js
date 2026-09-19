export class BackdropAtlas {
  constructor(imageFactory = null) { this.imageFactory = imageFactory; this.ready = false; this.failed = false; }
  load() {
    this.image = (this.imageFactory ?? (() => new Image()))();
    return new Promise((resolve) => {
      this.image.onload = () => { this.ready = this.image.naturalWidth === 1024 && this.image.naturalHeight === 512; this.failed = !this.ready; resolve(this.ready); };
      this.image.onerror = () => { this.failed = true; resolve(false); };
      this.image.src = new URL("../assets/below-protocol/office-backdrops.png", import.meta.url).href;
    });
  }
  draw(ctx, tile, x, floorY, width = 402, height = 402) {
    if (!this.ready) return false;
    const normalized = ((tile % 8) + 8) % 8;
    ctx.drawImage(this.image, normalized % 4 * 256, Math.floor(normalized / 4) * 256, 256, 256, Math.round(x), Math.round(floorY - height), Math.ceil(width), Math.ceil(height));
    return true;
  }
}
