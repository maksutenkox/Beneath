import { SideViewSpriteSheet } from "./SideViewSpriteSheet.js";
import { HubPropAtlas } from "./HubPropAtlas.js";
import { BackdropAtlas } from "./BackdropAtlas.js";
import { EnemySpriteSheet } from "./EnemySpriteSheet.js";

export class HubScene {
  constructor(canvas, map) {
    this.canvas = canvas; this.map = map; this.ctx = canvas.getContext("2d", { alpha: false });
    this.dpr = 1; this.sceneTime = 0; this.viewWidth = 360; this.viewHeight = 640;
    this.heroine = new SideViewSpriteSheet({ url: new URL("../assets/below-protocol/heroine-side.png", import.meta.url).href });
    this.props = new HubPropAtlas(); this.backdrops = new BackdropAtlas(); this.enemies = new EnemySpriteSheet();
    this.heroine.load(); this.props.load(); this.backdrops.load(); this.enemies.load();
  }
  setMap(map) { this.map = map; }
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
    ctx.fillStyle = "#060a0d"; ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
    ctx.save(); ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    this.#drawOfficeShell(ctx, camera);
    for (const item of this.map.wallProps ?? []) this.#drawProp(ctx, item);
    this.#drawPlatforms(ctx);
    for (const item of this.map.props ?? []) this.#drawProp(ctx, item, state);
    for (const enemy of state.enemies ?? []) this.#drawEnemy(ctx, enemy);
    this.#drawHeroine(ctx, state.player);
    this.#drawAtmosphere(ctx, camera);
    ctx.restore();
    this.#drawVignette(ctx);
    if (state.player.hurtTime > 0) this.#drawDamageFlash(ctx, state.player.hurtTime);
  }
  #drawOfficeShell(ctx, camera) {
    const floor = this.map.floorY, officeTop = floor - 402;
    ctx.fillStyle = "#0b1115"; ctx.fillRect(0, 0, this.map.width, this.map.height);
    for (const background of this.map.backgroundTiles ?? []) {
      if (background.x > camera.x + camera.width + 420 || background.x + 420 < camera.x - 20) continue;
      if (!this.backdrops.draw(ctx, background.tile, background.x, floor)) {
        ctx.fillStyle = "#17252a"; ctx.fillRect(background.x, officeTop, 402, 402);
      }
    }
    ctx.fillStyle = "#080d10"; ctx.fillRect(0, 0, this.map.width, officeTop);
    ctx.fillStyle = "#30393a"; ctx.fillRect(0, officeTop - 5, this.map.width, 7);
    ctx.fillStyle = "#505654"; ctx.fillRect(0, floor - 2, this.map.width, 4);
    ctx.fillStyle = "#171e20"; ctx.fillRect(0, floor + 2, this.map.width, this.map.height - floor);
    for (let x = 0; x < this.map.width; x += 80) {
      ctx.fillStyle = x % 160 ? "#202829" : "#1c2425"; ctx.fillRect(x, floor + 4, 78, this.map.height - floor);
      ctx.fillStyle = "rgb(0 0 0 / 28%)"; ctx.fillRect(x + 78, floor + 4, 2, this.map.height - floor);
    }
    const labelX = Math.max(20, camera.x + 20);
    ctx.fillStyle = "rgb(7 12 14 / 82%)"; ctx.fillRect(labelX - 8, officeTop + 12, 184, 34);
    ctx.fillStyle = this.map.type === "office" ? "#c65f45" : "#d3a052"; ctx.font = "bold 11px monospace"; ctx.fillText(this.map.title, labelX, officeTop + 28);
    ctx.fillStyle = "#768082"; ctx.font = "8px monospace"; ctx.fillText(this.map.type === "office" ? "HOSTILE WORKPLACE" : "SECURE CHECKPOINT", labelX, officeTop + 40);
  }
  #drawPlatforms(ctx) {
    for (const collider of this.map.colliders.filter((item) => item.kind === "platform")) {
      ctx.fillStyle = "#343d3d"; ctx.fillRect(collider.x, collider.y, collider.width, collider.height);
      ctx.fillStyle = "#8b8a76"; ctx.fillRect(collider.x, collider.y, collider.width, 3);
      ctx.fillStyle = "#101617"; ctx.fillRect(collider.x + 7, collider.y + collider.height, collider.width - 14, 6);
      for (let x = collider.x + 16; x < collider.x + collider.width - 8; x += 34) { ctx.fillStyle = "#735c32"; ctx.fillRect(x, collider.y + 7, 18, 3); }
    }
  }
  #drawProp(ctx, item, state = null) {
    const bob = item.kind === "cable" ? Math.sin(this.sceneTime * 1.3 + item.x) * 1.5 : 0;
    const flash = item.kind === "dummy" && (state?.dummy?.hitTime ?? 0) > 0;
    if (this.props.draw(ctx, item.kind, item.x, item.y + bob, item.scale, { flash })) return;
    ctx.fillStyle = "#263337"; ctx.fillRect(item.x - 16, item.y - 46, 32, 46);
  }
  #drawEnemy(ctx, enemy) {
    if (!this.enemies.draw(ctx, enemy)) { ctx.fillStyle = "#879070"; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); }
    if (enemy.hp > 0 && enemy.hp < enemy.maxHp) {
      const x = Math.round(enemy.x - 3), y = Math.round(enemy.y - 10);
      ctx.fillStyle = "#160d0e"; ctx.fillRect(x, y, 40, 5);
      ctx.fillStyle = "#b5443e"; ctx.fillRect(x + 1, y + 1, Math.round(38 * enemy.hp / enemy.maxHp), 3);
    }
  }
  #drawHeroine(ctx, player) {
    const centerX = player.x + player.width / 2, feetY = player.y + player.height;
    const flash = player.invulnerableTime > 0 && Math.floor(player.invulnerableTime * 24) % 2 === 0;
    if (this.heroine.draw(ctx, { state: player.animation, time: player.animationTime, facing: player.facing, x: centerX, y: feetY + 4, scale: 1, flash })) return;
    ctx.fillStyle = "#b75432"; ctx.fillRect(centerX - 8, feetY - 76, 16, 17);
    ctx.fillStyle = "#4c5845"; ctx.fillRect(centerX - 13, feetY - 59, 26, 35);
  }
  #drawAtmosphere(ctx, camera) {
    const start = Math.floor(camera.x / 180) * 180;
    ctx.fillStyle = "rgb(191 205 192 / 13%)";
    for (let x = start; x < camera.x + camera.width + 180; x += 180) {
      const drift = (this.sceneTime * (5 + x % 9) + x * .31) % 150;
      ctx.fillRect(Math.round(x + Math.sin(this.sceneTime + x) * 5), Math.round(this.map.floorY - 340 + drift), 2, 2);
    }
    if (this.map.type === "office") {
      const pulse = (Math.sin(this.sceneTime * 7) + 1) * .5;
      ctx.fillStyle = `rgb(148 31 28 / ${Math.round((3 + pulse * 5) * 10) / 10}%)`;
      ctx.fillRect(camera.x, this.map.floorY - 405, camera.width, 405);
    }
  }
  #drawVignette(ctx) {
    const gradient = ctx.createRadialGradient(this.viewWidth / 2, this.viewHeight * .48, this.viewWidth * .2, this.viewWidth / 2, this.viewHeight * .48, this.viewHeight * .75);
    gradient.addColorStop(0, "rgb(0 0 0 / 0%)"); gradient.addColorStop(1, "rgb(0 0 0 / 48%)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
  }
  #drawDamageFlash(ctx, hurtTime) {
    ctx.fillStyle = `rgb(166 24 27 / ${Math.min(22, 6 + hurtTime * 55)}%)`;
    ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
  }
}
