import { floorAt } from "../map/ShelterMap.js";
import { PixelSpriteLibrary } from "./PixelSpriteLibrary.js";

const PALETTE = {
  central: ["#293437", "#273235"], living: ["#3a3f38", "#383d36"],
  storage: ["#3b3530", "#39332e"], generator: ["#32383b", "#303639"], airlock: ["#374044", "#353d41"],
  medical: ["#423536", "#3f3234"], workshop: ["#423a33", "#3f3730"],
  additional: ["#27282a", "#252628"], unknownNorth: ["#20272b", "#1e2529"], unknownSouth: ["#111619", "#101518"]
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
    // Fixed 2:1 isometric grid, snapped to a 4px step to keep every sprite crisp.
    this.#tileWidth = Math.round(Math.max(48 * this.#dpr, Math.min(68 * this.#dpr, shortSide * .15)) / (4 * this.#dpr)) * 4 * this.#dpr;
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
    const corners = [{ x: p.x, y: p.y }, { x: p.x + hw, y: p.y + hh }, { x: p.x, y: p.y + this.#tileHeight }, { x: p.x - hw, y: p.y + hh }];
    this.#polygon(corners, PALETTE[tile.zone][(tile.x + tile.y) & 1]);

    const ctx = this.#context;
    const seed = tile.x * 31 + tile.y * 17;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + hw, p.y + hh); ctx.lineTo(p.x, p.y + this.#tileHeight); ctx.lineTo(p.x - hw, p.y + hh);
    ctx.clip();

    // Keep floor wear broad and low-contrast. Tiny bright pixels made the map look noisy.
    ctx.globalAlpha = .14;
    ctx.fillStyle = "#11191b";
    if (seed % 3 === 0) ctx.fillRect(Math.round(p.x - hw * .48), Math.round(p.y + hh * .7), Math.round(hw * .38), Math.max(1, this.#dpr));
    if (seed % 4 === 0) ctx.fillRect(Math.round(p.x + hw * .08), Math.round(p.y + hh * .34), Math.round(hw * .24), Math.max(1, this.#dpr));
    if (["generator", "airlock"].includes(tile.zone) && seed % 2 === 0) {
      ctx.globalAlpha = .2;
      ctx.fillStyle = "#151d1f";
      ctx.fillRect(Math.round(p.x - hw * .18), Math.round(p.y + hh * .7), Math.round(hw * .36), Math.max(1, 2 * this.#dpr));
    }
    if (tile.zone === "living" && seed % 5 === 0) {
      ctx.globalAlpha = .12;
      ctx.fillStyle = "#62574a";
      ctx.fillRect(Math.round(p.x - hw * .24), Math.round(p.y + hh * .68), Math.round(hw * .48), Math.max(1, 2 * this.#dpr));
    }
    ctx.restore();

    // A restrained seam preserves the tile structure without turning the floor into a checkerboard.
    ctx.strokeStyle = "rgb(103 116 112 / 10%)";
    ctx.lineWidth = Math.max(1, this.#dpr);
    ctx.beginPath(); ctx.moveTo(p.x - hw, p.y + hh); ctx.lineTo(p.x, p.y + this.#tileHeight); ctx.stroke();

    if (tile.zone === "central" && seed % 3 === 0) {
      ctx.fillStyle = "rgb(113 124 116 / 16%)";
      ctx.fillRect(Math.round(p.x - 2 * this.#dpr), Math.round(p.y + hh), 4 * this.#dpr, Math.max(1, this.#dpr));
    }
    if (["medical", "workshop"].includes(tile.zone) && (tile.x * 3 + tile.y) % 7 === 0) {
      ctx.strokeStyle = "rgb(117 73 68 / 55%)";
      ctx.beginPath(); ctx.moveTo(p.x - hw * .2, p.y + hh * .8); ctx.lineTo(p.x + hw * .18, p.y + hh * 1.2); ctx.stroke();
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
      this.#wallFace(tile.x, tile.y, "north");
    }
    if (!west || (west.zone !== tile.zone && !this.#hasDoorOnEdge(tile.x, tile.y, "west"))) {
      this.#wallFace(tile.x, tile.y, "west");
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

  #wallFace(x, y, side) {
    const bottom = this.#iso(x, y), top = this.#iso(x, y, 1.15);
    const endBottom = side === "north" ? this.#iso(x + 1, y) : this.#iso(x, y + 1);
    const endTop = side === "north" ? this.#iso(x + 1, y, 1.15) : this.#iso(x, y + 1, 1.15);
    this.#polygon([top, endTop, endBottom, bottom], side === "north" ? "#48575b" : "#354449", "#171f22");
    const ctx = this.#context; ctx.strokeStyle = "#718084"; ctx.lineWidth = this.#dpr;
    ctx.beginPath(); ctx.moveTo(top.x, top.y + 3 * this.#dpr); ctx.lineTo(endTop.x, endTop.y + 3 * this.#dpr); ctx.stroke();
    // Panel seams, rivets and grime make walls read as bunker modules.
    const midTop={x:(top.x+endTop.x)/2,y:(top.y+endTop.y)/2}, midBottom={x:(bottom.x+endBottom.x)/2,y:(bottom.y+endBottom.y)/2};
    ctx.strokeStyle="rgb(20 29 31 / 65%)"; ctx.beginPath(); ctx.moveTo(midTop.x,midTop.y); ctx.lineTo(midBottom.x,midBottom.y); ctx.stroke();
    ctx.fillStyle="#1b2628"; for (const q of [top,endTop]) ctx.fillRect(Math.round(q.x-1*this.#dpr),Math.round(q.y+7*this.#dpr),2*this.#dpr,2*this.#dpr);
    ctx.fillStyle="rgb(117 89 55 / 32%)"; ctx.fillRect(Math.round(midBottom.x-5*this.#dpr),Math.round(midBottom.y-4*this.#dpr),10*this.#dpr,2*this.#dpr);
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
    const wallMounted = ["sign", "wallpanel", "vent", "lamp"].includes(item.kind);
    const castsShadow = ["table", "cabinet", "shelf", "bench", "stool"].includes(item.kind);
    const anchorY = p.y + this.#tileHeight * (wallMounted ? .08 : .38);

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
    const p = this.#iso(item.x + .5, item.y + .5);
    const ctx = this.#context;
    const groundY = p.y + this.#tileHeight * .48;
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
