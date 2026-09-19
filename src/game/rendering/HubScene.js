import { SideViewSpriteSheet } from "./SideViewSpriteSheet.js";
import { HubPropAtlas } from "./HubPropAtlas.js";

export class HubScene {
  constructor(canvas, map) {
    this.canvas = canvas; this.map = map; this.ctx = canvas.getContext("2d", { alpha: false });
    this.dpr = 1; this.sceneTime = 0; this.viewWidth = 360; this.viewHeight = 640;
    this.heroine = new SideViewSpriteSheet({ url: new URL("../assets/below-protocol/heroine-side.png", import.meta.url).href });
    this.props = new HubPropAtlas(); this.heroine.load(); this.props.load();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.viewWidth = Math.max(320, rect.width); this.viewHeight = Math.max(520, rect.height);
    this.canvas.width = Math.round(this.viewWidth * this.dpr); this.canvas.height = Math.round(this.viewHeight * this.dpr);
    this.ctx.imageSmoothingEnabled = false;
  }
  viewport() { return { width: this.viewWidth, height: this.viewHeight }; }
  render({ deltaSeconds, state }) {
    this.sceneTime += deltaSeconds;
    const ctx = this.ctx, camera = state.camera;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#070b0e"; ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
    ctx.save(); ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    this.#drawArchitecture(ctx, camera);
    for (const item of this.map.wallProps) this.#drawProp(ctx, item);
    this.#drawPlatforms(ctx);
    for (const item of this.map.props) this.#drawProp(ctx, item, state);
    this.#drawHeroine(ctx, state.player);
    this.#drawAtmosphere(ctx, camera);
    ctx.restore();
    this.#drawVignette(ctx);
  }
  #drawArchitecture(ctx, camera) {
    const top = 88, floor = this.map.floorY;
    ctx.fillStyle = "#10181c"; ctx.fillRect(0, 0, this.map.width, this.map.height);
    ctx.fillStyle = "#182328"; ctx.fillRect(0, top, this.map.width, floor - top);
    for (let x = 0; x < this.map.width; x += 192) {
      ctx.fillStyle = (x / 192) % 2 ? "#1b292e" : "#1d2c31"; ctx.fillRect(x + 4, top + 4, 184, floor - top - 8);
      ctx.fillStyle = "#0d1518"; ctx.fillRect(x, top, 5, floor - top);
      ctx.fillStyle = "#334247"; ctx.fillRect(x + 5, top + 4, 2, floor - top - 8);
      ctx.fillStyle = "rgb(116 135 132 / 9%)"; ctx.fillRect(x + 18, top + 26, 142, 2);
    }
    ctx.fillStyle = "#0a1013"; ctx.fillRect(0, 0, this.map.width, top);
    ctx.fillStyle = "#3c494c"; ctx.fillRect(0, floor - 18, this.map.width, 18);
    ctx.fillStyle = "#172023"; ctx.fillRect(0, floor, this.map.width, this.map.height - floor);
    ctx.fillStyle = "#59615e"; ctx.fillRect(0, floor, this.map.width, 3);
    for (let x = 0; x < this.map.width; x += 96) {
      ctx.fillStyle = x % 192 ? "#202a2b" : "#222d2e"; ctx.fillRect(x, floor + 4, 94, this.map.height - floor);
      ctx.fillStyle = "rgb(7 11 12 / 38%)"; ctx.fillRect(x + 94, floor + 4, 2, this.map.height - floor);
      if (x % 288 === 0) { ctx.fillStyle = "#765d34"; ctx.fillRect(x + 18, floor + 21, 48, 3); }
    }
    // Repeating windows and damaged corporate wall panels provide parallax-free readability.
    for (let x = 110; x < this.map.width; x += 520) {
      ctx.fillStyle = "#0a1216"; ctx.fillRect(x, 330, 300, 170);
      ctx.fillStyle = "#27383e"; ctx.fillRect(x + 5, 335, 290, 160);
      ctx.fillStyle = "#0e1b20"; ctx.fillRect(x + 12, 342, 276, 146);
      ctx.fillStyle = "rgb(77 119 126 / 15%)"; ctx.fillRect(x + 18, 350, 120, 5);
      ctx.fillStyle = "#38484c"; ctx.fillRect(x + 148, 335, 5, 160);
    }
    ctx.fillStyle = "#ad7e35"; ctx.font = "bold 12px monospace"; ctx.fillText("CORPORATE SAFE FLOOR  /  HUB 01", Math.max(28, camera.x + 28), 126);
    ctx.fillStyle = "#667377"; ctx.font = "9px monospace"; ctx.fillText("BELOW PROTOCOL — INTERNAL EMERGENCY NETWORK", Math.max(28, camera.x + 28), 144);
  }
  #drawPlatforms(ctx) {
    for (const collider of this.map.colliders.filter((item) => item.kind === "platform")) {
      ctx.fillStyle = "#303b3d"; ctx.fillRect(collider.x, collider.y, collider.width, collider.height);
      ctx.fillStyle = "#6b7169"; ctx.fillRect(collider.x, collider.y, collider.width, 3);
      ctx.fillStyle = "#11191b"; ctx.fillRect(collider.x + 8, collider.y + collider.height, collider.width - 16, 7);
    }
  }
  #drawProp(ctx, item, state = null) {
    const bob = item.kind === "cable" ? Math.sin(this.sceneTime * 1.3 + item.x) * 2 : 0;
    const flash = item.kind === "dummy" && (state?.dummy?.hitTime ?? 0) > 0;
    if (this.props.draw(ctx, item.kind, item.x, item.y + bob, item.scale, { flash })) return;
    // Asset-loading fallback is deliberately a silhouette, visible only before the local atlas is ready.
    ctx.fillStyle = "#263337"; ctx.fillRect(item.x - 20, item.y - 54, 40, 54);
  }
  #drawHeroine(ctx, player) {
    const centerX = player.x + player.width / 2, feetY = player.y + player.height;
    const flash = player.invulnerableTime > 0 && Math.floor(player.invulnerableTime * 24) % 2 === 0;
    if (this.heroine.draw(ctx, { state: player.animation, time: player.animationTime, facing: player.facing, x: centerX, y: feetY + 5, scale: 1.08, flash })) return;
    ctx.fillStyle = "#b75432"; ctx.fillRect(centerX - 8, feetY - 76, 16, 17);
    ctx.fillStyle = "#4c5845"; ctx.fillRect(centerX - 13, feetY - 59, 26, 35);
    ctx.fillStyle = "#34475b"; ctx.fillRect(centerX - 11, feetY - 24, 9, 24); ctx.fillRect(centerX + 2, feetY - 24, 9, 24);
  }
  #drawAtmosphere(ctx, camera) {
    const start = Math.floor(camera.x / 160) * 160;
    ctx.fillStyle = "rgb(173 190 174 / 18%)";
    for (let x = start; x < camera.x + camera.width + 160; x += 160) {
      const drift = (this.sceneTime * (7 + x % 11) + x * .37) % 190;
      ctx.fillRect(Math.round(x + Math.sin(this.sceneTime + x) * 8), Math.round(180 + drift), 2, 2);
    }
    const flicker = Math.sin(this.sceneTime * 21) > .82;
    ctx.fillStyle = flicker ? "rgb(197 80 50 / 15%)" : "rgb(218 187 105 / 5%)";
    ctx.fillRect(930, 160, 360, 500);
  }
  #drawVignette(ctx) {
    const gradient = ctx.createRadialGradient(this.viewWidth / 2, this.viewHeight * .48, this.viewWidth * .15, this.viewWidth / 2, this.viewHeight * .48, this.viewHeight * .75);
    gradient.addColorStop(0, "rgb(0 0 0 / 0%)"); gradient.addColorStop(1, "rgb(0 0 0 / 55%)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
  }
}
