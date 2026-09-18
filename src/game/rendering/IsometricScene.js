import { floorAt } from "../map/ShelterMap.js";
import { PixelSpriteLibrary } from "./PixelSpriteLibrary.js";

const PALETTE = {
  central: ["#293437", "#283336"], living: ["#393e37", "#373c35"],
  storage: ["#3a342f", "#38322d"], generator: ["#31373a", "#303639"], airlock: ["#363e42", "#343c40"],
  medical: ["#403435", "#3e3233"], workshop: ["#403831", "#3e362f"],
  additional: ["#262729", "#242527"], unknownNorth: ["#20272b", "#1e2529"], unknownSouth: ["#111619", "#101518"]
};

const WALL_STYLE = {
  central: { north: "#46575b", west: "#35464b", trim: "#657276", accent: "#596566" },
  living: { north: "#4c5750", west: "#3a4641", trim: "#6e776d", accent: "#686a55" },
  storage: { north: "#514b46", west: "#3f3b37", trim: "#716b63", accent: "#685a4b" },
  generator: { north: "#45545a", west: "#34444a", trim: "#69777b", accent: "#4f6266" },
  airlock: { north: "#4b5a60", west: "#394a50", trim: "#718087", accent: "#5d6c70" },
  medical: { north: "#53494b", west: "#413a3d", trim: "#776b6e", accent: "#67585b" },
  workshop: { north: "#514a43", west: "#403a35", trim: "#746c62", accent: "#695b4b" },
  additional: { north: "#3d4447", west: "#2f393c", trim: "#596367", accent: "#4c5558" },
  unknownNorth: { north: "#333e42", west: "#283438", trim: "#4a565b", accent: "#3b484d" },
  unknownSouth: { north: "#252d30", west: "#1c2528", trim: "#3b464a", accent: "#303a3d" }
};

export class IsometricScene {
  #canvas; #context; #map; #sectorStates; #lighting; #staticEntities; #orderedFloors; #sprites; #dpr = 1; #tileWidth = 60; #tileHeight = 30; #originX = 0; #originY = 0; #sceneTime = 0;

  constructor(canvas, map, sectorStates, lighting) {
    this.#canvas = canvas;
    this.#map = map;
    this.#sectorStates = sectorStates;
    this.#lighting = lighting;
    this.#sprites = new PixelSpriteLibrary();
    this.#staticEntities = [
      ...map.obstacles.map((item) => ({ item, entity: "obstacle" })),
      ...map.doors.map((item) => ({ item, entity: "door" })),
      ...map.blockedPassages.map((item) => ({ item, entity: "sealed" })),
      ...(map.decorations ?? []).map((item) => ({ item, entity: "decoration" }))
    ];
    this.#orderedFloors = [...map.floors].sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x);
    this.#context = canvas.getContext("2d", { alpha: false });
    this.#context.imageSmoothingEnabled = false;
  }

  resize() {
    this.#dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(this.#canvas.clientWidth * this.#dpr));
    const height = Math.max(1, Math.floor(this.#canvas.clientHeight * this.#dpr));
    if (this.#canvas.width !== width || this.#canvas.height !== height) {
      this.#canvas.width = width; this.#canvas.height = height; this.#context.imageSmoothingEnabled = false;
    }
    const shortSide = Math.min(width, height);
    // Closer gameplay framing: enough context to read a room, but no longer a whole-map overview.
    // Keep the 2:1 grid snapped to a 4px step so pixel art stays crisp while the camera follows.
    this.#tileWidth = Math.round(Math.max(64 * this.#dpr, Math.min(92 * this.#dpr, shortSide * .19)) / (4 * this.#dpr)) * 4 * this.#dpr;
    this.#tileHeight = this.#tileWidth / 2;
  }

  render({ state }) {
    this.resize();
    this.#sceneTime = state.player.animationTime;
    const ctx = this.#context;
    ctx.fillStyle = "#080d10"; ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#drawBackdrop();
    this.#positionCamera(state.camera ?? state.player);
    for (const tile of this.#orderedFloors) this.#drawFloor(tile);
    for (const tile of this.#orderedFloors) this.#drawWalls(tile);
    this.#drawSectorEffects(this.#orderedFloors, state.player.animationTime);
    this.#drawLighting();
    const entities = [
      ...this.#staticEntities.filter(({ item }) => this.#isEntityVisible(item)),
      ...(state.npcs ?? []).map((item) => ({ item, entity: "npc" })),
      ...(state.player ? [{ item: state.player, entity: "player" }] : [])
    ].sort((a, b) => (a.item.x + a.item.y) - (b.item.x + b.item.y));
    for (const entry of entities) {
      const entity = entry.item;
      if (entity.id && entity.id === state.interaction?.targetId) this.#drawHighlight(entity, state.player.animationTime);
      if (entry.entity === "obstacle") this.#drawObstacle(entity);
      else if (entry.entity === "decoration") this.#drawDecoration(entity);
      else if (entry.entity === "npc") this.#drawNpc(entity);
      else if (entry.entity === "player") this.#drawCharacter(entity);
      else this.#drawDoor(entity, entry.entity === "sealed");
    }
    for (const label of this.#map.labels) this.#drawLabel(label);
    this.#drawVignette();
  }

  #drawLighting() {
    const ctx = this.#context;
    ctx.save(); ctx.globalCompositeOperation = "screen";
    for (const light of this.#map.lights ?? []) {
      const profile = this.#lighting.profile(light.sector);
      const pulse = profile.flicker ? (.72 + Math.max(0, Math.sin(this.#sceneTime * 8 + light.x)) * .28) : 1;
      const p = this.#iso(light.x + .5, light.y + .5, .05);
      const radius=this.#tileWidth*2.15;
      const gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
      gradient.addColorStop(0,profile.color); gradient.addColorStop(.28,profile.color); gradient.addColorStop(1,"rgb(0 0 0 / 0%)");
      ctx.globalAlpha=profile.intensity*pulse*.62; ctx.fillStyle=gradient;
      ctx.save(); ctx.translate(p.x,p.y); ctx.scale(1,.48); ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill(); ctx.restore();
      ctx.globalAlpha=profile.intensity*pulse;
      ctx.fillStyle=profile.color; ctx.shadowColor=profile.color; ctx.shadowBlur=10*this.#dpr;
      ctx.fillRect(Math.round(p.x-5*this.#dpr),Math.round(p.y-this.#tileHeight*1.15),10*this.#dpr,2*this.#dpr); ctx.shadowBlur=0;
    }
    ctx.restore();
  }

  #drawVignette() {
    const ctx = this.#context;
    const gradient = ctx.createRadialGradient(this.#canvas.width / 2, this.#canvas.height * .48, this.#canvas.height * .18, this.#canvas.width / 2, this.#canvas.height * .48, this.#canvas.width * .72);
    gradient.addColorStop(0, "rgb(0 0 0 / 0%)"); gradient.addColorStop(1, "rgb(0 0 0 / 46%)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
  }

  #isEntityVisible(item) {
    if (!item.visibleWhen || !item.sectorId) return true;
    return item.visibleWhen.includes(this.#sectorStates.get(item.sectorId)?.status);
  }

  #positionCamera(camera) {
    const width = this.#canvas.width, height = this.#canvas.height;
    const projectX = (camera.x - camera.y) * this.#tileWidth / 2;
    const projectY = (camera.x + camera.y) * this.#tileHeight / 2;
    let offsetX = width * .5 - projectX;
    let offsetY = height * .48 - projectY;
    const marginX = Math.min(90 * this.#dpr, width * .12);
    const marginTop = Math.min(85 * this.#dpr, height * .22);
    const marginBottom = Math.min(60 * this.#dpr, height * .15);
    const minMapX = -this.#map.height * this.#tileWidth / 2;
    const maxMapX = this.#map.width * this.#tileWidth / 2;
    const minMapY = -1.4 * this.#tileHeight;
    const maxMapY = (this.#map.width + this.#map.height) * this.#tileHeight / 2 + this.#tileHeight;
    const minOffsetX = width - marginX - maxMapX;
    const maxOffsetX = marginX - minMapX;
    const minOffsetY = height - marginBottom - maxMapY;
    const maxOffsetY = marginTop - minMapY;
    offsetX = minOffsetX > maxOffsetX ? (width - minMapX - maxMapX) / 2 : Math.max(minOffsetX, Math.min(maxOffsetX, offsetX));
    offsetY = minOffsetY > maxOffsetY ? (height - minMapY - maxMapY) / 2 : Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));
    // Keep the entire isometric world on the physical pixel grid. Smooth camera
    // coordinates are preserved in game state, but rendering never lands between pixels.
    this.#originX = Math.round(offsetX);
    this.#originY = Math.round(offsetY);
  }

  #iso(x, y, z = 0) {
    return { x: this.#originX + (x - y) * this.#tileWidth / 2, y: this.#originY + (x + y) * this.#tileHeight / 2 - z * this.#tileHeight };
  }

  #polygon(points, fill, stroke = null) {
    const ctx = this.#context;
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, this.#dpr); ctx.stroke(); }
  }

  #drawBackdrop() {
    const ctx = this.#context; ctx.strokeStyle = "#10191c"; ctx.lineWidth = this.#dpr;
    for (let y = 0; y < this.#canvas.height; y += 16 * this.#dpr) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.#canvas.width, y); ctx.stroke(); }
  }

  #drawFloor(tile) {
    const p = this.#iso(tile.x, tile.y);
    const hw = this.#tileWidth / 2;
    const hh = this.#tileHeight / 2;
    const corners = [
      { x: p.x, y: p.y },
      { x: p.x + hw, y: p.y + hh },
      { x: p.x, y: p.y + this.#tileHeight },
      { x: p.x - hw, y: p.y + hh }
    ];
    const seed = tile.x * 31 + tile.y * 17;
    const base = PALETTE[tile.zone][(tile.x + tile.y) & 1];
    this.#polygon(corners, base);

    const ctx = this.#context;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + hw, p.y + hh);
    ctx.lineTo(p.x, p.y + this.#tileHeight);
    ctx.lineTo(p.x - hw, p.y + hh);
    ctx.closePath();
    ctx.clip();

    // Large bunker plates: broad seams and recesses instead of noisy per-pixel wear.
    if ((tile.x & 1) === 0) {
      ctx.strokeStyle = "rgb(7 12 14 / 28%)";
      ctx.lineWidth = Math.max(1, this.#dpr);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 2 * this.#dpr);
      ctx.lineTo(p.x, p.y + this.#tileHeight - 2 * this.#dpr);
      ctx.stroke();
    }
    if ((tile.y & 1) === 0) {
      ctx.strokeStyle = "rgb(115 128 124 / 9%)";
      ctx.beginPath();
      ctx.moveTo(p.x - hw * .82, p.y + hh * .58);
      ctx.lineTo(p.x + hw * .82, p.y + hh * 1.42);
      ctx.stroke();
    }

    // Recessed plate inside selected cells adds depth without turning the floor into a checkerboard.
    if (seed % 4 === 0) {
      ctx.globalAlpha = .17;
      ctx.fillStyle = "#12191b";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + hh * .28);
      ctx.lineTo(p.x + hw * .58, p.y + hh * .86);
      ctx.lineTo(p.x, p.y + hh * 1.44);
      ctx.lineTo(p.x - hw * .58, p.y + hh * .86);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Technical rooms use low-contrast service grates.
    if (["generator", "workshop", "airlock"].includes(tile.zone) && seed % 3 === 0) {
      ctx.strokeStyle = "rgb(12 19 21 / 52%)";
      ctx.lineWidth = Math.max(1, this.#dpr);
      for (let i = -2; i <= 2; i += 1) {
        const ox = i * 4 * this.#dpr;
        ctx.beginPath();
        ctx.moveTo(p.x - hw * .22 + ox, p.y + hh * .72 + ox * .5);
        ctx.lineTo(p.x + hw * .2 + ox, p.y + hh * 1.14 + ox * .5);
        ctx.stroke();
      }
    }

    if (tile.zone === "living" && seed % 5 === 0) {
      ctx.fillStyle = "rgb(106 96 78 / 16%)";
      ctx.fillRect(
        Math.round(p.x - hw * .24),
        Math.round(p.y + hh * .73),
        Math.round(hw * .48),
        Math.max(1, 2 * this.#dpr)
      );
    }

    if (tile.zone === "central" && (tile.y === 9 || tile.y === 10)) {
      ctx.strokeStyle = "rgb(102 116 115 / 16%)";
      ctx.lineWidth = Math.max(1, 2 * this.#dpr);
      ctx.beginPath();
      ctx.moveTo(p.x - hw * .68, p.y + hh * .66);
      ctx.lineTo(p.x + hw * .68, p.y + hh * 1.34);
      ctx.stroke();
    }

    ctx.restore();

    // Bottom edge catches a little light and keeps adjacent plates from visually melting together.
    ctx.strokeStyle = "rgb(130 143 137 / 10%)";
    ctx.lineWidth = Math.max(1, this.#dpr);
    ctx.beginPath();
    ctx.moveTo(p.x - hw, p.y + hh);
    ctx.lineTo(p.x, p.y + this.#tileHeight);
    ctx.lineTo(p.x + hw, p.y + hh);
    ctx.stroke();

    if (["medical", "workshop"].includes(tile.zone) && (tile.x * 3 + tile.y) % 9 === 0) {
      ctx.strokeStyle = "rgb(118 72 67 / 42%)";
      ctx.beginPath();
      ctx.moveTo(p.x - hw * .16, p.y + hh * .82);
      ctx.lineTo(p.x + hw * .14, p.y + hh * 1.12);
      ctx.stroke();
    }
  }

  #drawSectorEffects(tiles, time) {
    const ctx = this.#context;
    for (const tile of tiles) {
      const state = this.#sectorStates.stateForTile(tile);
      const p = this.#iso(tile.x, tile.y);
      if (state === "DAMAGED") {
        ctx.fillStyle = `rgba(10, 5, 6, ${.18 + Math.sin(time * 2 + tile.x) * .04})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + this.#tileWidth / 2, p.y + this.#tileHeight / 2); ctx.lineTo(p.x, p.y + this.#tileHeight); ctx.lineTo(p.x - this.#tileWidth / 2, p.y + this.#tileHeight / 2); ctx.closePath(); ctx.fill();
        if ((tile.x * 7 + tile.y * 3) % 19 === 0 && Math.sin(time * 9 + tile.y) > .45) {
          ctx.fillStyle = "#f2b84b"; ctx.fillRect(p.x - this.#dpr, p.y - 4 * this.#dpr, 2 * this.#dpr, 5 * this.#dpr);
          ctx.fillStyle = "#e56c45"; ctx.fillRect(p.x + 2 * this.#dpr, p.y - 7 * this.#dpr, this.#dpr, 4 * this.#dpr);
        }
      } else if (state === "BLOCKED") {
        ctx.fillStyle = "rgb(5 7 8 / 28%)"; ctx.fillRect(p.x - this.#tileWidth / 2, p.y, this.#tileWidth, this.#tileHeight);
      } else if (state === "LOCKED") {
        ctx.fillStyle = "rgb(8 18 25 / 32%)"; ctx.fillRect(p.x - this.#tileWidth / 2, p.y, this.#tileWidth, this.#tileHeight);
      } else if (state === "UNKNOWN") {
        ctx.fillStyle = "rgb(0 0 0 / 58%)"; ctx.fillRect(p.x - this.#tileWidth / 2, p.y, this.#tileWidth, this.#tileHeight);
      }
    }
  }

  #drawWalls(tile) {
    const north = floorAt(this.#map, tile.x, tile.y - 1);
    const west = floorAt(this.#map, tile.x - 1, tile.y);

    if (!north || (north.zone !== tile.zone && !this.#hasDoorOnEdge(tile.x, tile.y, "north"))) {
      this.#wallFace(tile.x, tile.y, "north", tile.zone);
    }
    if (!west || (west.zone !== tile.zone && !this.#hasDoorOnEdge(tile.x, tile.y, "west"))) {
      this.#wallFace(tile.x, tile.y, "west", tile.zone);
    }
  }

  #hasDoorOnEdge(x, y, orientation) {
    const opposite = { north: "south", south: "north", east: "west", west: "east" }[orientation];
    const neighbor = {
      north: { x, y: y - 1 },
      south: { x, y: y + 1 },
      east: { x: x + 1, y },
      west: { x: x - 1, y }
    }[orientation];
    return this.#map.doors.some((door) =>
      (door.x === x && door.y === y && door.orientation === orientation)
      || (door.x === neighbor.x && door.y === neighbor.y && door.orientation === opposite)
    );
  }

  #wallFace(x, y, side, zone = "central") {
    const style = WALL_STYLE[zone] ?? WALL_STYLE.central;
    const bottom = this.#iso(x, y);
    const top = this.#iso(x, y, 1.15);
    const capTop = this.#iso(x, y, 1.25);
    const endBottom = side === "north" ? this.#iso(x + 1, y) : this.#iso(x, y + 1);
    const endTop = side === "north" ? this.#iso(x + 1, y, 1.15) : this.#iso(x, y + 1, 1.15);
    const endCapTop = side === "north" ? this.#iso(x + 1, y, 1.25) : this.#iso(x, y + 1, 1.25);

    this.#polygon([top, endTop, endBottom, bottom], side === "north" ? style.north : style.west, "#171f22");

    // A dark top cap gives the wall actual thickness instead of a paper-thin vertical plane.
    this.#polygon([capTop, endCapTop, endTop, top], "#283337", "#141c1f");

    const ctx = this.#context;
    const lerpPoint = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    const leftUpper = lerpPoint(top, bottom, .22);
    const rightUpper = lerpPoint(endTop, endBottom, .22);
    const leftLower = lerpPoint(top, bottom, .82);
    const rightLower = lerpPoint(endTop, endBottom, .82);

    // Horizontal rails frame each wall module.
    ctx.strokeStyle = style.trim;
    ctx.globalAlpha = .42;
    ctx.lineWidth = Math.max(1, this.#dpr);
    ctx.beginPath();
    ctx.moveTo(leftUpper.x, leftUpper.y);
    ctx.lineTo(rightUpper.x, rightUpper.y);
    ctx.moveTo(leftLower.x, leftLower.y);
    ctx.lineTo(rightLower.x, rightLower.y);
    ctx.stroke();

    // Two large panels per tile are more believable than a seam every few pixels.
    const midTop = lerpPoint(top, endTop, .5);
    const midBottom = lerpPoint(bottom, endBottom, .5);
    ctx.strokeStyle = "rgb(15 23 25 / 72%)";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(midTop.x, midTop.y);
    ctx.lineTo(midBottom.x, midBottom.y);
    ctx.stroke();

    // Recessed lower plinth visually anchors the wall into the floor.
    const baseLeft = lerpPoint(top, bottom, .88);
    const baseRight = lerpPoint(endTop, endBottom, .88);
    this.#polygon([baseLeft, baseRight, endBottom, bottom], "#263236", "#151d20");

    // Muted sector accent: enough identity to differentiate rooms without bright gamey stripes.
    const accentLeft = lerpPoint(top, bottom, .69);
    const accentRight = lerpPoint(endTop, endBottom, .69);
    ctx.strokeStyle = style.accent;
    ctx.globalAlpha = .34;
    ctx.lineWidth = Math.max(1, 2 * this.#dpr);
    ctx.beginPath();
    ctx.moveTo(accentLeft.x, accentLeft.y);
    ctx.lineTo(accentRight.x, accentRight.y);
    ctx.stroke();

    // Sparse bolts/brackets at structural joints.
    ctx.globalAlpha = .75;
    ctx.fillStyle = "#172124";
    for (const point of [
      lerpPoint(top, bottom, .3),
      lerpPoint(endTop, endBottom, .3),
      lerpPoint(top, bottom, .73),
      lerpPoint(endTop, endBottom, .73)
    ]) {
      ctx.fillRect(
        Math.round(point.x - this.#dpr),
        Math.round(point.y - this.#dpr),
        2 * this.#dpr,
        2 * this.#dpr
      );
    }

    // Very restrained grime near the base keeps pristine repeated modules from looking synthetic.
    if ((x * 7 + y * 11) % 4 === 0) {
      const grime = lerpPoint(midTop, midBottom, .86);
      ctx.fillStyle = "rgb(91 69 49 / 22%)";
      ctx.fillRect(
        Math.round(grime.x - 5 * this.#dpr),
        Math.round(grime.y - this.#dpr),
        10 * this.#dpr,
        2 * this.#dpr
      );
    }
    ctx.globalAlpha = 1;
  }

  #drawObstacle(item) {
    const p = this.#iso(item.x + .5, item.y + .5);
    if (item.kind === "generator") p.y += Math.sin(this.#sceneTime * 12 + item.x) * .7 * this.#dpr;
    const sprite = this.#sprites.object(item.kind, Math.floor(this.#sceneTime * 4));
    const scale = Math.max(this.#dpr, Math.round(this.#tileWidth / (64 * this.#dpr)) * this.#dpr);
    const width = sprite.width * scale, height = sprite.height * scale;
    const ctx = this.#context;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "rgb(0 0 0 / 38%)";
    ctx.beginPath(); ctx.ellipse(p.x, p.y + this.#tileHeight * .36, this.#tileWidth * .24, this.#tileHeight * .1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(sprite, Math.round(p.x - width / 2), Math.round(p.y - height + this.#tileHeight * .4), width, height);
    ctx.restore();
  }

  #drawHighlight(item, time = 0) {
    const p = this.#iso(item.x + .5, item.y + .5, .02);
    const pulse = .82 + Math.sin(time * 5) * .12;
    const hw = this.#tileWidth * .42 * pulse, hh = this.#tileHeight * .42 * pulse;
    const ctx = this.#context;
    ctx.save();
    ctx.shadowColor = "#c8db79"; ctx.shadowBlur = 9 * this.#dpr;
    ctx.strokeStyle = "#c8db79"; ctx.lineWidth = 2 * this.#dpr;
    ctx.beginPath(); ctx.moveTo(p.x, p.y - hh); ctx.lineTo(p.x + hw, p.y); ctx.lineTo(p.x, p.y + hh); ctx.lineTo(p.x - hw, p.y); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  #drawDecoration(item) {
    const p = this.#iso(item.x, item.y);
    const ctx = this.#context;
    const s = this.#dpr;
    const castsShadow = ["table", "cabinet", "shelf", "bench", "stool"].includes(item.kind);
    // Only floor-standing furniture needs a lowered contact point. Small decals/effects keep
    // their authored coordinates so they do not drift after the grounding pass.
    const anchorY = p.y + this.#tileHeight * (castsShadow ? .34 : 0);

    ctx.save();
    if (castsShadow) {
      ctx.fillStyle = "rgb(0 0 0 / 30%)";
      ctx.beginPath();
      ctx.ellipse(p.x, anchorY + 2 * s, this.#tileWidth * .18, this.#tileHeight * .07, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.translate(p.x, anchorY);
    if (item.kind === "pipe" || item.kind === "cable") {
      ctx.strokeStyle = item.kind === "pipe" ? "#667477" : "#8a6545";
      ctx.lineWidth = (item.kind === "pipe" ? 3 : 1.5) * s;
      ctx.beginPath(); ctx.moveTo(-this.#tileWidth * .34, 0); ctx.lineTo(0, this.#tileHeight * .18); ctx.lineTo(this.#tileWidth * .34, 0); ctx.stroke();
      if (item.kind === "pipe") { ctx.fillStyle = "#303b3d"; ctx.fillRect(-2 * s, -2 * s, 4 * s, 4 * s); }
    } else if (item.kind === "vent") {
      ctx.fillStyle = "#394548"; ctx.fillRect(-7 * s, -7 * s, 14 * s, 14 * s);
      ctx.strokeStyle = "#7b8786"; ctx.lineWidth = s; ctx.strokeRect(-7 * s, -7 * s, 14 * s, 14 * s);
      ctx.beginPath(); ctx.arc(0, 0, 5 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(this.#sceneTime * 3.5 + item.x);
      ctx.fillStyle = "#738083";
      for (let i = 0; i < 4; i += 1) { ctx.rotate(Math.PI / 2); ctx.fillRect(0, -1 * s, 5 * s, 2 * s); }
    } else if (item.kind === "table") {
      ctx.fillStyle = "#675849"; ctx.fillRect(-11 * s, -6 * s, 22 * s, 8 * s);
      ctx.fillStyle = "#313938"; ctx.fillRect(-9 * s, 2 * s, 3 * s, 6 * s); ctx.fillRect(6 * s, 2 * s, 3 * s, 6 * s);
    } else if (item.kind === "cabinet") {
      ctx.fillStyle = "#4c5a5d"; ctx.fillRect(-6 * s, -18 * s, 12 * s, 20 * s);
      ctx.strokeStyle = "#242d2f"; ctx.strokeRect(-6 * s, -18 * s, 12 * s, 20 * s); ctx.fillStyle = "#9ba56e"; ctx.fillRect(2 * s, -9 * s, 2 * s, 2 * s);
    } else if (item.kind === "tools") {
      ctx.strokeStyle = "#b58a55"; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(-6 * s, -6 * s); ctx.lineTo(6 * s, 5 * s); ctx.moveTo(5 * s, -7 * s); ctx.lineTo(-4 * s, 6 * s); ctx.stroke();
    } else if (item.kind === "mug") {
      ctx.fillStyle = "#c4b792"; ctx.fillRect(-2 * s, -5 * s, 5 * s, 5 * s); ctx.strokeStyle = "#c4b792"; ctx.strokeRect(3 * s, -4 * s, 3 * s, 3 * s);
    } else if (item.kind === "personal") {
      ctx.fillStyle = "#6d4f48"; ctx.fillRect(-5 * s, -4 * s, 10 * s, 7 * s); ctx.fillStyle = "#c8b18d"; ctx.fillRect(-3 * s, -3 * s, 6 * s, 3 * s);
    } else if (item.kind === "sign") {
      ctx.fillStyle = "#b99342"; ctx.fillRect(-10 * s, -9 * s, 20 * s, 8 * s); ctx.fillStyle = "#25291f"; ctx.font = `bold ${5 * s}px monospace`; ctx.textAlign = "center"; ctx.fillText(item.text ?? "!", 0, -3 * s);
    } else if (["trash", "damage"].includes(item.kind)) {
      ctx.fillStyle = item.kind === "trash" ? "#49443e" : "#6c3f38";
      ctx.fillRect(-5 * s, -2 * s, 4 * s, 3 * s); ctx.fillRect(2 * s, 1 * s, 5 * s, 2 * s);
    } else if (item.kind === "shelf") {
      ctx.fillStyle = "#303a3b";
      ctx.fillRect(-10 * s, -17 * s, 20 * s, 19 * s);
      ctx.fillStyle = "#667170";
      ctx.fillRect(-9 * s, -15 * s, 18 * s, 2 * s);
      ctx.fillRect(-9 * s, -8 * s, 18 * s, 2 * s);
      ctx.fillRect(-9 * s, -1 * s, 18 * s, 2 * s);
      ctx.fillStyle = "#755d41";
      ctx.fillRect(-7 * s, -13 * s, 5 * s, 4 * s);
      ctx.fillStyle = "#58605a";
      ctx.fillRect(1 * s, -6 * s, 6 * s, 4 * s);
    } else if (item.kind === "bench") {
      ctx.fillStyle = "#59615b";
      ctx.fillRect(-12 * s, -6 * s, 24 * s, 6 * s);
      ctx.fillStyle = "#2c3434";
      ctx.fillRect(-10 * s, 0, 3 * s, 7 * s);
      ctx.fillRect(7 * s, 0, 3 * s, 7 * s);
      ctx.fillStyle = "#78745d";
      ctx.fillRect(-10 * s, -5 * s, 20 * s, 2 * s);
    } else if (item.kind === "stool") {
      ctx.fillStyle = "#6c6655";
      ctx.fillRect(-5 * s, -5 * s, 10 * s, 5 * s);
      ctx.fillStyle = "#31393a";
      ctx.fillRect(-4 * s, 0, 2 * s, 6 * s);
      ctx.fillRect(2 * s, 0, 2 * s, 6 * s);
    } else if (item.kind === "wallpanel") {
      ctx.fillStyle = "#263133";
      ctx.fillRect(-8 * s, -16 * s, 16 * s, 18 * s);
      ctx.strokeStyle = "#667275";
      ctx.lineWidth = s;
      ctx.strokeRect(-8 * s, -16 * s, 16 * s, 18 * s);
      ctx.fillStyle = "#6ca89c";
      ctx.fillRect(-5 * s, -12 * s, 7 * s, 3 * s);
      ctx.fillStyle = "#c08b42";
      ctx.fillRect(4 * s, -12 * s, 2 * s, 2 * s);
      ctx.fillStyle = "#151d1e";
      ctx.fillRect(-5 * s, -6 * s, 11 * s, 5 * s);
    } else if (item.kind === "lamp") {
      const on = Math.sin(this.#sceneTime * 2.3 + item.x) > -.75;
      ctx.fillStyle = on ? "#ddd18b" : "#625f4d"; ctx.shadowColor = "#e9d98d"; ctx.shadowBlur = on ? 8 * s : 0;
      ctx.fillRect(-4 * s, -13 * s, 8 * s, 5 * s); ctx.shadowBlur = 0; ctx.fillStyle = "#3c4646"; ctx.fillRect(-s, -8 * s, 2 * s, 9 * s);
    } else if (item.kind === "steam") {
      ctx.fillStyle = "rgb(193 207 202 / 30%)";
      for (let i = 0; i < 3; i += 1) {
        const rise = (this.#sceneTime * 10 + i * 7) % 20;
        ctx.beginPath(); ctx.arc((i - 1) * 3 * s + Math.sin(this.#sceneTime * 2 + i) * 2 * s, -rise * s, (2 + i) * s, 0, Math.PI * 2); ctx.fill();
      }
    } else if (item.kind === "drip") {
      const fall = (this.#sceneTime * 16 + item.x) % 18;
      ctx.fillStyle = "#72a7b4"; ctx.fillRect(0, (-14 + fall) * s, 2 * s, 3 * s);
      if (fall > 15) { ctx.strokeStyle = "#72a7b4"; ctx.beginPath(); ctx.ellipse(0, 3 * s, 5 * s, 2 * s, 0, 0, Math.PI * 2); ctx.stroke(); }
    } else if (item.kind === "spark" && Math.sin(this.#sceneTime * 11 + item.y) > .55) {
      ctx.strokeStyle = "#efb64f"; ctx.lineWidth = s;
      ctx.beginPath(); ctx.moveTo(0, -8 * s); ctx.lineTo(-5 * s, 0); ctx.moveTo(0, -8 * s); ctx.lineTo(5 * s, 2 * s); ctx.moveTo(0, -8 * s); ctx.lineTo(2 * s, 5 * s); ctx.stroke();
    }
    ctx.restore();
  }

  #drawDoor(item, sealed) {
    const edgePoint = {
      north: { x: item.x + .5, y: item.y },
      south: { x: item.x + .5, y: item.y + 1 },
      west: { x: item.x, y: item.y + .5 },
      east: { x: item.x + 1, y: item.y + .5 }
    }[item.orientation] ?? { x: item.x + .5, y: item.y + .5 };
    const p = this.#iso(edgePoint.x, edgePoint.y);
    const ctx = this.#context;
    const groundY = p.y;
    const progress = sealed ? 0 : Math.max(0, Math.min(1, item.progress ?? (item.open ? 1 : 0)));
    const hermetic = item.visualStyle === "hermetic";
    const totalWidth = this.#tileWidth * (hermetic ? .88 : .64);
    const frameHeight = (hermetic ? 48 : 38) * this.#dpr;
    const postWidth = (hermetic ? 6 : 4) * this.#dpr;
    const beamHeight = (hermetic ? 7 : 5) * this.#dpr;
    const sillHeight = (hermetic ? 4 : 2) * this.#dpr;
    const innerWidth = totalWidth - postWidth * 2;
    const innerTop = -frameHeight + beamHeight;
    const innerHeight = frameHeight - beamHeight - sillHeight;
    const locked = item.state === "locked";
    const jammed = item.state === "jammed";

    ctx.save();
    ctx.translate(p.x, groundY);
    ctx.transform(1, ["north", "south"].includes(item.orientation) ? .5 : -.5, 0, 1, 0, 0);

    // Threshold and portal frame make room transitions read as actual doorways.
    ctx.fillStyle = "#171e20";
    ctx.fillRect(-totalWidth / 2 - 2 * this.#dpr, -sillHeight, totalWidth + 4 * this.#dpr, sillHeight + 2 * this.#dpr);
    ctx.fillStyle = hermetic ? "#48575b" : "#505d5d";
    ctx.fillRect(-totalWidth / 2, -frameHeight, postWidth, frameHeight);
    ctx.fillRect(totalWidth / 2 - postWidth, -frameHeight, postWidth, frameHeight);
    ctx.fillRect(-totalWidth / 2, -frameHeight, totalWidth, beamHeight);
    ctx.fillStyle = hermetic ? "#273235" : "#2d3839";
    ctx.fillRect(-totalWidth / 2 + this.#dpr, -frameHeight + this.#dpr, totalWidth - 2 * this.#dpr, 2 * this.#dpr);

    // Door leaf animation is clipped inside the frame instead of shrinking like a floor bar.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-innerWidth / 2, innerTop, innerWidth, innerHeight);
    ctx.clip();

    const panel = locked ? "#6e4643" : jammed ? "#71523d" : hermetic ? "#5d696d" : "#66706d";
    if (hermetic) {
      const half = innerWidth / 2;
      const shift = progress * half;
      ctx.fillStyle = panel;
      ctx.fillRect(-innerWidth / 2 - shift, innerTop, half + 1, innerHeight);
      ctx.fillRect(shift, innerTop, half + 1, innerHeight);
      ctx.fillStyle = "#20292b";
      ctx.fillRect(-2 * this.#dpr - shift, innerTop, 4 * this.#dpr, innerHeight);
      ctx.fillRect(shift - 2 * this.#dpr, innerTop, 4 * this.#dpr, innerHeight);
    } else {
      const shift = progress * innerWidth;
      ctx.fillStyle = panel;
      ctx.fillRect(-innerWidth / 2 - shift, innerTop, innerWidth, innerHeight);
      ctx.fillStyle = "#303a39";
      ctx.fillRect(-innerWidth / 2 + 4 * this.#dpr - shift, innerTop + 4 * this.#dpr, 2 * this.#dpr, innerHeight - 8 * this.#dpr);
      ctx.fillStyle = "#9aa08a";
      ctx.fillRect(innerWidth * .24 - shift, innerTop + innerHeight * .52, 4 * this.#dpr, 2 * this.#dpr);
    }

    // Panel seams and damage stay readable at gameplay scale.
    ctx.strokeStyle = "rgb(28 36 37 / 80%)";
    ctx.lineWidth = this.#dpr;
    for (let y = innerTop + 6 * this.#dpr; y < innerTop + innerHeight; y += 8 * this.#dpr) {
      ctx.beginPath(); ctx.moveTo(-innerWidth / 2, y); ctx.lineTo(innerWidth / 2, y); ctx.stroke();
    }
    if (item.doorKind === "damaged") {
      ctx.strokeStyle = "#2b211f";
      ctx.lineWidth = 2 * this.#dpr;
      ctx.beginPath();
      ctx.moveTo(-innerWidth * .28, innerTop + innerHeight * .2);
      ctx.lineTo(innerWidth * .04, innerTop + innerHeight * .58);
      ctx.lineTo(innerWidth * .26, innerTop + innerHeight * .3);
      ctx.stroke();
    }
    ctx.restore();

    // State light lives on the frame, not on the moving door leaf.
    const indicator = locked ? "#c85d4d" : jammed ? "#d08a45" : "#8faf74";
    ctx.fillStyle = "#1a2223";
    ctx.fillRect(totalWidth / 2 + this.#dpr, -frameHeight + 7 * this.#dpr, 5 * this.#dpr, 8 * this.#dpr);
    ctx.fillStyle = indicator;
    ctx.fillRect(totalWidth / 2 + 2 * this.#dpr, -frameHeight + 8 * this.#dpr, 3 * this.#dpr, 3 * this.#dpr);

    if (hermetic) {
      // Only the external exit gets the unmistakable heavy pressure-door treatment.
      ctx.strokeStyle = "#8b7952";
      ctx.lineWidth = 2 * this.#dpr;
      ctx.strokeRect(-totalWidth / 2 - 2 * this.#dpr, -frameHeight - 2 * this.#dpr, totalWidth + 4 * this.#dpr, frameHeight + 3 * this.#dpr);
      ctx.fillStyle = "#b08b3f";
      for (const x of [-.36, .36]) ctx.fillRect(x * totalWidth - 2 * this.#dpr, -frameHeight - 4 * this.#dpr, 4 * this.#dpr, 3 * this.#dpr);
    }

    if (sealed) {
      ctx.strokeStyle = "#8b6040";
      ctx.lineWidth = 4 * this.#dpr;
      ctx.beginPath();
      ctx.moveTo(-innerWidth * .42, innerTop + innerHeight * .18);
      ctx.lineTo(innerWidth * .42, innerTop + innerHeight * .82);
      ctx.moveTo(innerWidth * .42, innerTop + innerHeight * .18);
      ctx.lineTo(-innerWidth * .42, innerTop + innerHeight * .82);
      ctx.stroke();
    }

    ctx.restore();
  }

  #drawCharacter(player) {
    const p = this.#iso(player.x, player.y);
    const ctx = this.#context;
    const walking = player.animation === "walk";
    const phase = Math.floor(player.animationTime * 8) % 4;
    const direction = player.direction ?? "south-east";
    const sprite = this.#sprites.character({ hero:true, direction, frame: walking ? phase : 0 });
    const scale = Math.max(this.#dpr, Math.round(this.#tileWidth / (48 * this.#dpr)) * this.#dpr);
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const footY = p.y + this.#tileHeight * .4;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "rgb(0 0 0 / 42%)";
    ctx.beginPath(); ctx.ellipse(p.x, footY, this.#tileWidth * .16, this.#tileHeight * .075, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(sprite, Math.round(p.x - w / 2), Math.round(footY - h), w, h);
    ctx.restore();
  }

  #drawNpc(npc) {
    const p = this.#iso(npc.x, npc.y);
    const ctx = this.#context;
    const sitting = npc.activity === "sit";
    const walking = npc.activity === "walk";
    const phase = Math.floor(npc.animationTime * 7) % 4;
    const sprite = this.#sprites.character({ color:npc.color, profession:npc.profession, direction:npc.direction ?? "south", frame:walking ? phase : 0, sitting, working:npc.activity === "work" });
    const scale = Math.max(this.#dpr, Math.round(this.#tileWidth / (50 * this.#dpr)) * this.#dpr);
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const footY = p.y + this.#tileHeight * .38;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "rgb(0 0 0 / 36%)";
    ctx.beginPath(); ctx.ellipse(p.x, footY, this.#tileWidth * .145, this.#tileHeight * .065, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(sprite, Math.round(p.x - w / 2), Math.round(footY - h + (sitting ? 5 * scale : 0)), w, h);
    if (npc.activity === "chat") {
      ctx.fillStyle = "#d7dfca"; ctx.fillRect(p.x+8*scale,footY-h-5*scale,10*scale,6*scale);
      ctx.fillStyle = "#394443"; ctx.fillRect(p.x+11*scale,footY-h-3*scale,scale,scale); ctx.fillRect(p.x+14*scale,footY-h-3*scale,scale,scale);
    }
    ctx.restore();
  }

  #drawLabel(label) {
    const p = this.#iso(label.x, label.y);
    const ctx = this.#context;
    ctx.save();
    ctx.globalAlpha = .3;
    ctx.font = `bold ${Math.max(6, 6 * this.#dpr)}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#aab4aa";
    ctx.fillText(label.text, Math.round(p.x), Math.round(p.y + this.#tileHeight * .42));
    ctx.restore();
  }
}
