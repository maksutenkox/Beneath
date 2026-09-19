export const HUB_PROP_KINDS = Object.freeze(["workbench","dummy","elevator","stairwell","desk","server","printer","cooler","cabinet","plant","barricade","boxes","light","vent","monitor","cable"]);
export class HubPropAtlas {
  constructor(imageFactory = null) { this.imageFactory = imageFactory; this.ready = false; this.failed = false; }
  load() {
    this.image = (this.imageFactory ?? (() => new Image()))();
    return new Promise((resolve) => {
      this.image.onload = () => { this.ready = this.image.naturalWidth === 512 && this.image.naturalHeight === 512; this.failed = !this.ready; resolve(this.ready); };
      this.image.onerror = () => { this.failed = true; resolve(false); };
      this.image.src = new URL("../assets/below-protocol/hub-props.png", import.meta.url).href;
    });
  }
  draw(ctx, kind, x, y, scale = 1, { flash = false } = {}) {
    const index = HUB_PROP_KINDS.indexOf(kind); if (!this.ready || index < 0) return false;
    const size = 128 * scale; ctx.save(); ctx.imageSmoothingEnabled = false;
    if (flash) { ctx.globalAlpha = .7; ctx.globalCompositeOperation = "screen"; }
    ctx.drawImage(this.image, index % 4 * 128, Math.floor(index / 4) * 128, 128, 128, Math.round(x - size / 2), Math.round(y - size), Math.round(size), Math.round(size));
    ctx.restore(); return true;
  }
}
