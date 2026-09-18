const PROFESSION_ACCENT = {
  Engineer: "#d59a3a", Medic: "#b8d8c7", Technician: "#55a5a1",
  Worker: "#b57a45", Security: "#7e9275", Cook: "#c87862"
};

function canvas(width, height) {
  const surface = document.createElement("canvas");
  surface.width = width;
  surface.height = height;
  surface.getContext("2d").imageSmoothingEnabled = false;
  return surface;
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function poly(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, color, x1, y1, x2, y2, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function detailedBed(ctx) {
  rect(ctx, "rgb(0 0 0 / 28%)", 8, 49, 49, 4);
  poly(ctx, "#2a3435", [[8,35],[22,29],[57,40],[44,47]]);
  poly(ctx, "#465451", [[8,31],[22,25],[57,36],[44,43]]);
  poly(ctx, "#718071", [[11,29],[23,24],[54,34],[43,40]]);
  poly(ctx, "#8b8d78", [[12,28],[23,24],[35,28],[24,33]]);
  poly(ctx, "#56634f", [[27,29],[53,37],[43,40],[18,33]]);
  poly(ctx, "#43503f", [[28,32],[51,39],[44,42],[22,35]]);
  line(ctx, "#8c967e", 12, 31, 44, 41);
  line(ctx, "#293233", 9, 36, 44, 47);
  rect(ctx, "#1c2425", 11, 42, 4, 9);
  rect(ctx, "#1c2425", 43, 48, 4, 6);
  rect(ctx, "#69746b", 13, 44, 2, 5);
  rect(ctx, "#69746b", 45, 49, 2, 4);
}

function detailedLocker(ctx) {
  rect(ctx, "rgb(0 0 0 / 30%)", 17, 53, 33, 4);
  poly(ctx, "#2b373a", [[18,12],[28,8],[49,15],[39,19]]);
  poly(ctx, "#3e4d50", [[18,12],[39,19],[39,53],[18,46]]);
  poly(ctx, "#2c393c", [[39,19],[49,15],[49,48],[39,53]]);
  rect(ctx, "#536266", 21, 17, 15, 26);
  rect(ctx, "#1d282a", 23, 20, 11, 2);
  rect(ctx, "#1d282a", 23, 24, 11, 2);
  rect(ctx, "#263234", 21, 34, 15, 1);
  rect(ctx, "#1b2426", 31, 30, 2, 4);
  rect(ctx, "#a59258", 24, 38, 6, 3);
  rect(ctx, "#6c5845", 43, 22, 2, 8);
  rect(ctx, "#765c44", 20, 43, 4, 2);
  rect(ctx, "#1b2425", 20, 47, 4, 4);
  rect(ctx, "#1b2425", 36, 52, 4, 3);
}

function detailedTerminal(ctx, activeFrame) {
  rect(ctx, "rgb(0 0 0 / 32%)", 9, 52, 48, 4);
  poly(ctx, "#263234", [[12,22],[23,17],[55,27],[44,32]]);
  poly(ctx, "#364548", [[12,22],[44,32],[44,51],[12,41]]);
  poly(ctx, "#273639", [[44,32],[55,27],[55,46],[44,51]]);
  poly(ctx, "#1b282b", [[18,19],[25,16],[50,24],[43,28]]);
  poly(ctx, "#0d2426", [[20,23],[42,30],[42,42],[20,35]]);
  poly(ctx, activeFrame ? "#6bbcaf" : "#478d87", [[22,24],[40,30],[40,39],[22,33]]);
  line(ctx, "#a9cdbd", 25, 28, 36, 32);
  line(ctx, activeFrame ? "#d0b962" : "#7d8b67", 24, 31, 37, 35);
  rect(ctx, "#1b2426", 19, 39, 18, 4);
  rect(ctx, "#7f6940", 21, 40, 4, 2);
  rect(ctx, "#4e7d72", 27, 41, 4, 1);
  rect(ctx, "#1b2426", 14, 42, 5, 9);
  rect(ctx, "#1b2426", 40, 49, 5, 5);
}

function basicBox(ctx, top, front, side, ox = 7, oy = 15, w = 34, h = 24) {
  rect(ctx, "#12191a", ox + 2, oy + h, w, 3);
  rect(ctx, front, ox, oy + 6, w, h - 6);
  rect(ctx, side, ox + w - 7, oy + 4, 7, h - 4);
  rect(ctx, top, ox + 3, oy, w - 7, 7);
  rect(ctx, "#172022", ox, oy + 10, w, 2);
}

export class PixelSpriteLibrary {
  #cache = new Map();

  character({ hero = false, color = "#56615a", profession = "Worker", direction = "south", frame = 0, sitting = false, working = false }) {
    const key = `char2:${hero}:${color}:${profession}:${direction}:${frame}:${sitting}:${working}`;
    if (this.#cache.has(key)) return this.#cache.get(key);

    const sprite = canvas(40, 56);
    const ctx = sprite.getContext("2d");
    const north = direction.includes("north");
    const west = direction.includes("west");
    const east = direction.includes("east");
    const walk = frame % 4;
    const bob = sitting ? 5 : (walk === 1 || walk === 3 ? -1 : 0);
    const leftStep = walk < 2 ? -1 : 1;
    const rightStep = -leftStep;

    // Ground shadow is intentionally inside the sprite so every pose stays anchored.
    rect(ctx, "rgb(0 0 0 / 24%)", 9, 49, 23, 3);

    // Legs and boots: slimmer proportions than the old block-character.
    const trouserA = hero ? "#29465b" : "#344148";
    const trouserB = hero ? "#345b73" : "#414d54";
    rect(ctx, trouserA, 12 + leftStep, sitting ? 37 : 36, 5, sitting ? 7 : 10);
    rect(ctx, trouserB, 22 + rightStep, sitting ? 37 : 36, 5, sitting ? 7 : 10);
    rect(ctx, "#171d1f", 10 + leftStep, 45, 7, 3);
    rect(ctx, "#171d1f", 22 + rightStep, 45, 7, 3);
    rect(ctx, "#2a3233", 11 + leftStep, 44, 6, 1);
    rect(ctx, "#2a3233", 23 + rightStep, 44, 6, 1);

    // Torso uses several tones to suggest folds and volume rather than one flat rectangle.
    const jacket = hero ? "#4b5938" : color;
    const jacketLight = hero ? "#66754b" : "#6d7972";
    const jacketDark = hero ? "#313d27" : "#37433f";
    rect(ctx, jacketDark, 9, 24 + bob, 22, 13);
    rect(ctx, jacket, 11, 22 + bob, 18, 14);
    rect(ctx, jacketLight, 12, 23 + bob, 5, 11);
    rect(ctx, jacketDark, 24, 23 + bob, 4, 12);
    rect(ctx, "#19201c", 11, 34 + bob, 18, 2);
    rect(ctx, "#8a916f", 19, 23 + bob, 1, 10);
    rect(ctx, hero ? "#b79a53" : (PROFESSION_ACCENT[profession] ?? "#b18a50"), west ? 13 : 24, 26 + bob, 3, 2);

    // Arms get hand pixels and direction bias.
    rect(ctx, jacketLight, west ? 8 : 9, 25 + bob, 3, 10);
    rect(ctx, jacketDark, east ? 29 : 28, 25 + bob, 3, 10);
    if (!north) {
      rect(ctx, "#c48b70", west ? 7 : 9, 34 + bob, 3, 3);
      rect(ctx, "#b97f67", east ? 30 : 28, 34 + bob, 3, 3);
    }

    // Neck / head with a narrower jaw and separate highlight/shadow pixels.
    rect(ctx, "#8a5847", 15, 14 + bob, 10, 9);
    rect(ctx, "#c98f72", 14, 11 + bob, 12, 10);
    rect(ctx, "#daa080", 16, 12 + bob, 7, 7);
    rect(ctx, "#965e4f", 14, 18 + bob, 3, 3);

    if (hero) {
      // Copper hair: larger authored silhouette with dark underside and loose side lock.
      rect(ctx, "#6f2d20", 12, 6 + bob, 15, 9);
      rect(ctx, "#b85231", 11, 7 + bob, 16, 6);
      rect(ctx, "#d06a3d", west ? 14 : 12, 8 + bob, 7, 3);
      rect(ctx, "#8c3826", west ? 24 : 10, 12 + bob, 5, 14);
      rect(ctx, "#b84b2c", west ? 25 : 9, 14 + bob, 4, 11);
      rect(ctx, "#5e271e", 14, 6 + bob, 11, 2);
    } else {
      rect(ctx, north ? "#292724" : "#45362f", 12, 7 + bob, 15, 7);
      rect(ctx, "#201f1d", 13, 7 + bob, 12, 2);
    }

    if (!north) {
      rect(ctx, "#182326", west ? 16 : 23, 15 + bob, 2, 2);
      rect(ctx, "#9d5d50", west ? 14 : 24, 19 + bob, 2, 1);
    }

    if (working) {
      rect(ctx, "#c98f70", 31, 28 + bob, 5, 3);
      rect(ctx, PROFESSION_ACCENT[profession] ?? "#75c4b5", 34, 25 + bob, 3, 6);
    }

    this.#cache.set(key, sprite);
    return sprite;
  }

  object(kind, activeFrame = 0, detailed = false) {
    const animated = ["generator", "terminal", "screen", "workstation", "airlockPanel", "beacon"].includes(kind);
    const key = `object:${kind}:${animated ? activeFrame % 2 : 0}:${detailed}`;
    if (this.#cache.has(key)) return this.#cache.get(key);

    if (detailed && ["bed", "locker", "cabinet", "terminal"].includes(kind)) {
      const c = canvas(64, 64);
      const x = c.getContext("2d");
      if (kind === "bed") detailedBed(x);
      else if (kind === "locker" || kind === "cabinet") detailedLocker(x);
      else detailedTerminal(x, activeFrame % 2);
      this.#cache.set(key, c);
      return c;
    }

    const c = canvas(48, 48);
    const x = c.getContext("2d");
    if (kind === "bed") {
      basicBox(x, "#7b8167", "#4b5044", "#343a35", 4, 24, 40, 13);
      rect(x, "#d0c7a8", 7, 20, 12, 7);
      rect(x, "#657052", 18, 22, 23, 9);
    } else if (kind === "crate") {
      basicBox(x, "#806344", "#5e432d", "#412f25", 8, 18, 32, 22);
      rect(x, "#aa8655", 10, 22, 28, 3);
      rect(x, "#2c2823", 21, 25, 5, 6);
    } else if (kind === "locker" || kind === "cabinet") {
      basicBox(x, "#657073", "#414d50", "#2c3638", 11, 5, 27, 37);
      rect(x, "#1d2729", 15, 15, 19, 2);
      rect(x, "#b5944d", 30, 24, 2, 3);
    } else if (kind === "generator" || kind === "compressor") {
      basicBox(x, "#58686a", "#344448", "#253235", 4, 16, 40, 25);
      rect(x, "#172426", 8, 23, 17, 11);
      rect(x, "#78978f", 11, 26, 11, 2);
      rect(x, "#c88b35", 29, 25, 7, 5);
      rect(x, "#202a2d", 7, 39, 5, 4);
      rect(x, "#202a2d", 36, 39, 5, 4);
    } else if (["terminal", "screen", "workstation", "airlockPanel"].includes(kind)) {
      basicBox(x, "#596769", "#354548", "#273437", 8, 11, 32, 31);
      rect(x, "#102b2d", 12, 15, 24, 14);
      rect(x, activeFrame ? "#79d6c4" : "#4aa69e", 14, 17, 20, 9);
      rect(x, "#d4bd63", 15, 20 + activeFrame * 3, 14, 1);
      rect(x, "#20292b", 13, 34, 22, 5);
    } else if (kind === "decon") {
      basicBox(x, "#748185", "#435359", "#2e3b40", 7, 8, 34, 34);
      rect(x, "#9cc0ba", 12, 14, 19, 18);
      rect(x, "#223236", 15, 18, 13, 10);
    } else if (["damaged", "debris", "rubble"].includes(kind)) {
      rect(x, "#171b1b", 6, 38, 37, 4);
      rect(x, "#544941", 7, 31, 12, 8);
      rect(x, "#706054", 18, 26, 13, 13);
      rect(x, "#3f3935", 30, 33, 12, 7);
      rect(x, "#9b513d", 20, 28, 5, 2);
    } else if (kind === "wire") {
      rect(x, "#111718", 4, 38, 40, 2);
      rect(x, "#8b5838", 8, 34, 3, 5);
      rect(x, "#365e67", 24, 36, 3, 4);
      rect(x, "#b18a45", 35, 33, 2, 6);
    } else if (kind === "beacon") {
      rect(x, "#222c2e", 20, 20, 8, 22);
      rect(x, "#bc6735", 18, 14, 12, 8);
      rect(x, activeFrame ? "#ffbd4d" : "#8f4a2d", 20, 15, 8, 5);
    } else {
      basicBox(x, "#66706b", "#3c4948", "#283434");
    }

    this.#cache.set(key, c);
    return c;
  }

  furnishing(kind, variant = 0) {
    const key = `furnishing:${kind}:${variant}`;
    if (this.#cache.has(key)) return this.#cache.get(key);

    const c = canvas(64, 64);
    const x = c.getContext("2d");

    if (kind === "table") {
      rect(x, "rgb(0 0 0 / 24%)", 12, 48, 42, 4);
      poly(x, "#6a5a49", [[13,31],[28,25],[54,33],[39,40]]);
      poly(x, "#4c4035", [[13,31],[39,40],[39,45],[13,36]]);
      poly(x, "#3a322c", [[39,40],[54,33],[54,38],[39,45]]);
      line(x, "#8a745b", 17, 31, 45, 40);
      rect(x, "#262d2d", 17, 36, 4, 14);
      rect(x, "#262d2d", 42, 43, 4, 9);
    } else if (kind === "cabinet" || kind === "shelf") {
      detailedLocker(x);
      if (kind === "shelf") {
        rect(x, "#1c2527", 22, 20, 14, 3);
        rect(x, "#1c2527", 22, 29, 14, 3);
        rect(x, "#7b6044", 23, 22, 5, 5);
        rect(x, "#56615b", 30, 31, 5, 5);
      }
    } else if (kind === "bench") {
      rect(x, "rgb(0 0 0 / 22%)", 10, 49, 44, 4);
      poly(x, "#5b625c", [[10,34],[25,29],[54,38],[39,44]]);
      poly(x, "#454d48", [[10,34],[39,44],[39,48],[10,38]]);
      line(x, "#7e7a63", 14, 34, 42, 43);
      rect(x, "#252d2e", 15, 39, 4, 12);
      rect(x, "#252d2e", 39, 46, 4, 7);
    } else if (kind === "stool") {
      poly(x, "#6d6756", [[20,32],[31,28],[43,32],[32,37]]);
      poly(x, "#504c41", [[20,32],[32,37],[32,41],[20,36]]);
      rect(x, "#2b3232", 23, 37, 3, 13);
      rect(x, "#2b3232", 36, 39, 3, 10);
    } else if (kind === "wallpanel") {
      rect(x, "#20292b", 20, 12, 25, 34);
      rect(x, "#536164", 22, 14, 21, 30);
      rect(x, "#102628", 25, 18, 15, 9);
      rect(x, variant % 2 ? "#66a99a" : "#4f8e86", 27, 20, 11, 5);
      rect(x, "#1c2526", 25, 31, 15, 8);
      rect(x, "#b28b45", 27, 33, 3, 2);
      rect(x, "#68776f", 32, 33, 6, 2);
      rect(x, "#192123", 23, 43, 19, 2);
    } else if (kind === "vent") {
      rect(x, "#242e30", 20, 18, 24, 24);
      rect(x, "#566368", 22, 20, 20, 20);
      rect(x, "#1b2527", 25, 23, 14, 14);
      for (let i = 0; i < 5; i += 1) line(x, "#667478", 27, 25 + i * 3, 37, 25 + i * 3);
      rect(x, "#1a2325", 22, 20, 2, 20);
    } else if (kind === "sign") {
      rect(x, "#20282a", 13, 23, 38, 16);
      rect(x, "#8a7040", 15, 25, 34, 12);
      rect(x, "#2b2d26", 18, 28, 20, 2);
      rect(x, "#4b4b3b", 18, 32, 27, 2);
    } else {
      return null;
    }

    this.#cache.set(key, c);
    return c;
  }
}
