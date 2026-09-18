import { floorAt } from "../map/ShelterMap.js";
import { PixelSpriteLibrary } from "./PixelSpriteLibrary.js";

const PALETTE = {
  central: ["#293437", "#232d30"], living: ["#3b4038", "#343a33"],
  storage: ["#3d3630", "#352f2a"], generator: ["#33383b", "#2b3134"], airlock: ["#394044", "#30373b"]
  , medical: ["#453536", "#3a2e30"], workshop: ["#453b32", "#3a322c"],
  additional: ["#27282a", "#222326"], unknownNorth: ["#20272b", "#1a2125"], unknownSouth: ["#111619", "#0d1215"]
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
    const p = this.#iso(tile.x, tile.y); const hw = this.#tileWidth / 2; const hh = this.#tileHeight / 2;
    const corners = [{ x: p.x, y: p.y }, { x: p.x + hw, y: p.y + hh }, { x: p.x, y: p.y + this.#tileHeight }, { x: p.x - hw, y: p.y + hh }];
    this.#polygon(corners, PALETTE[tile.zone][(tile.x + tile.y) & 1]);
    const ctx = this.#context, seed = tile.x * 31 + tile.y * 17;
    ctx.save(); ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+hw,p.y+hh); ctx.lineTo(p.x,p.y+this.#tileHeight); ctx.lineTo(p.x-hw,p.y+hh); ctx.clip();
    // Authored wear pattern replaces the conspicuous checkerboard grid.
    ctx.globalAlpha = .24; ctx.fillStyle = seed % 3 ? "#101719" : "#7b765b";
    ctx.fillRect(Math.round(p.x - hw * .52), Math.round(p.y + hh * .65), Math.round(hw * .42), Math.max(1, this.#dpr));
    ctx.fillRect(Math.round(p.x + hw * .12), Math.round(p.y + hh * .28), Math.round(hw * .19), Math.max(1, this.#dpr));
    if (seed % 5 === 0) { ctx.fillStyle = "#a18749"; ctx.fillRect(Math.round(p.x - 2*this.#dpr), Math.round(p.y+hh), 4*this.#dpr, this.#dpr); }
    if (["generator","airlock"].includes(tile.zone)) { ctx.fillStyle="#11191b"; for(let i=-1;i<=1;i++) ctx.fillRect(p.x+i*6*this.#dpr,p.y+hh+i*3*this.#dpr,2*this.#dpr,2*this.#dpr); }
    if (tile.zone === "living" && seed % 4 === 0) { ctx.fillStyle="#80614a"; ctx.fillRect(p.x-hw*.28,p.y+hh*.62,hw*.56,2*this.#dpr); }
    ctx.restore();
    ctx.strokeStyle="rgb(103 116 112 / 18%)"; ctx.lineWidth=Math.max(1,this.#dpr); ctx.beginPath(); ctx.moveTo(p.x-hw,p.y+hh); ctx.lineTo(p.x,p.y+this.#tileHeight); ctx.stroke();
    if (tile.zone === "central") { ctx.fillStyle = "#8b7b3e"; ctx.fillRect(p.x - 2 * this.#dpr, p.y + hh - this.#dpr, 4 * this.#dpr, 2 * this.#dpr); }
    if (["medical", "workshop"].includes(tile.zone) && (tile.x * 3 + tile.y) % 7 === 0) { const ctx = this.#context; ctx.strokeStyle = "#8c4f48"; ctx.beginPath(); ctx.moveTo(p.x - hw * .2, p.y + hh * .8); ctx.lineTo(p.x + hw * .18, p.y + hh * 1.2); ctx.stroke(); }
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
    if (!floorAt(this.#map, tile.x, tile.y - 1)) this.#wallFace(tile.x, tile.y, "north");
    if (!floorAt(this.#map, tile.x - 1, tile.y)) this.#wallFace(tile.x, tile.y, "west");
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
    const scale = Math.max(1, Math.round(this.#tileWidth / 48));
    const width = sprite.width * scale, height = sprite.height * scale;
    const ctx = this.#context;
    ctx.save(); ctx.imageSmoothingEnabled=false;
    ctx.fillStyle="rgb(0 0 0 / 45%)"; ctx.beginPath(); ctx.ellipse(p.x,p.y+this.#tileHeight*.33,this.#tileWidth*.3,this.#tileHeight*.15,0,0,Math.PI*2); ctx.fill();
    ctx.drawImage(sprite, Math.round(p.x-width/2), Math.round(p.y-height+this.#tileHeight*.38), width, height);
    ctx.restore();

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
    const p = this.#iso(item.x, item.y, .03), ctx = this.#context, s = this.#dpr;
    ctx.save(); ctx.translate(p.x, p.y);
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
    const p = this.#iso(item.x + .5, item.y + .5, .08); const ctx = this.#context;
    const progress = sealed ? 0 : (item.progress ?? (item.open ? 1 : 0));
    const bulkhead = item.doorKind === "bulkhead";
    const thickness = (bulkhead ? 11 : 7) * this.#dpr;
    const totalWidth = this.#tileWidth * (bulkhead ? .82 : .62);
    const remaining = Math.max(0, 1 - progress);
    ctx.save(); ctx.translate(p.x, p.y); ctx.transform(1, ["north", "south"].includes(item.orientation) ? .5 : -.5, 0, 1, 0, 0);
    ctx.fillStyle = item.state === "locked" ? "#7b433c" : item.state === "jammed" ? "#8b6040" : bulkhead ? "#536167" : "#69745d";
    if (bulkhead) {
      const slab = totalWidth * remaining / 2;
      ctx.fillRect(-totalWidth / 2, -thickness / 2, slab, thickness);
      ctx.fillRect(totalWidth / 2 - slab, -thickness / 2, slab, thickness);
      ctx.fillStyle = "#252d30";
      ctx.fillRect(-2 * this.#dpr, -thickness / 2, 4 * this.#dpr, thickness);
    } else {
      ctx.fillRect(-totalWidth / 2, -thickness / 2, totalWidth * remaining, thickness);
    }
    ctx.strokeStyle = item.state === "locked" || item.state === "jammed" ? "#d27155" : "#a9b58b";
    ctx.lineWidth = this.#dpr;
    ctx.strokeRect(-totalWidth / 2, -thickness / 2, totalWidth, thickness);
    if (item.doorKind === "damaged") {
      ctx.strokeStyle = "#27211f"; ctx.beginPath(); ctx.moveTo(-totalWidth * .25, -thickness); ctx.lineTo(0, thickness); ctx.lineTo(totalWidth * .2, -thickness); ctx.stroke();
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
    const scale=Math.max(1,Math.round(this.#tileWidth/32));
    const w=sprite.width*scale,h=sprite.height*scale, footY=p.y+this.#tileHeight*.4;
    ctx.save(); ctx.imageSmoothingEnabled=false;
    ctx.fillStyle="rgb(0 0 0 / 52%)"; ctx.beginPath(); ctx.ellipse(p.x,footY,this.#tileWidth*.22,this.#tileHeight*.11,0,0,Math.PI*2); ctx.fill();
    ctx.drawImage(sprite,Math.round(p.x-w/2),Math.round(footY-h),w,h); ctx.restore();
  }

  #drawNpc(npc) {
    const p = this.#iso(npc.x, npc.y);
    const ctx = this.#context;
    const sitting = npc.activity === "sit";
    const walking = npc.activity === "walk";
    const phase = Math.floor(npc.animationTime * 7) % 4;
    const sprite=this.#sprites.character({color:npc.color,profession:npc.profession,direction:npc.direction??"south",frame:walking?phase:0,sitting,working:npc.activity==="work"});
    const scale=Math.max(1,Math.round(this.#tileWidth/36)),w=sprite.width*scale,h=sprite.height*scale,footY=p.y+this.#tileHeight*.38;
    ctx.save(); ctx.imageSmoothingEnabled=false; ctx.fillStyle="rgb(0 0 0 / 43%)"; ctx.beginPath(); ctx.ellipse(p.x,footY,this.#tileWidth*.18,this.#tileHeight*.09,0,0,Math.PI*2); ctx.fill();
    ctx.drawImage(sprite,Math.round(p.x-w/2),Math.round(footY-h+(sitting?5*scale:0)),w,h);
    if (npc.activity === "chat") {
      ctx.fillStyle = "#d7dfca"; ctx.fillRect(p.x+8*scale,footY-h-5*scale,10*scale,6*scale);
      ctx.fillStyle = "#394443"; ctx.fillRect(p.x+11*scale,footY-h-3*scale,scale,scale); ctx.fillRect(p.x+14*scale,footY-h-3*scale,scale,scale);
    }
    ctx.restore();
  }

  #drawLabel(label) {
    const p = this.#iso(label.x, label.y, .03), ctx = this.#context;
    const status = label.sector ? this.#sectorStates.get(label.sector)?.status : null;
    const text = status ? `${label.text} · ${status}` : label.text;
    ctx.font = `bold ${Math.max(7, 7 * this.#dpr)}px "Courier New", monospace`; ctx.textAlign = "center"; ctx.fillStyle = "rgb(215 223 202 / 72%)"; ctx.fillText(text, p.x, p.y);
  }
}
