const PROFESSION_ACCENT = {
  Engineer: "#d59a3a", Medic: "#b8d8c7", Technician: "#55a5a1",
  Worker: "#b57a45", Security: "#7e9275", Cook: "#c87862"
};

function canvas(width, height) {
  const surface = document.createElement("canvas");
  surface.width = width; surface.height = height;
  surface.getContext("2d").imageSmoothingEnabled = false;
  return surface;
}

function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

export class PixelSpriteLibrary {
  #cache = new Map();

  character({ hero = false, color = "#56615a", profession = "Worker", direction = "south", frame = 0, sitting = false, working = false }) {
    const key = `char:${hero}:${color}:${profession}:${direction}:${frame}:${sitting}:${working}`;
    if (this.#cache.has(key)) return this.#cache.get(key);
    const sprite = canvas(32, 48), ctx = sprite.getContext("2d");
    const north = direction.includes("north"), west = direction.includes("west");
    const step = frame % 4 < 2 ? -1 : 1, y = sitting ? 5 : (frame % 2 ? -1 : 0);
    // Hair behind the body creates the heroine's readable copper silhouette.
    if (hero) { rect(ctx, "#55261d", 9, 7 + y, 13, 16); rect(ctx, "#9e452b", west ? 17 : 8, 12 + y, 6, 17); }
    // Boots and trouser legs.
    rect(ctx, "#171d1d", 8 + step, 40, 6, 3); rect(ctx, "#171d1d", 18 - step, 40, 6, 3);
    rect(ctx, hero ? "#28465f" : "#303a40", 9 + step, sitting ? 34 : 31, 5, sitting ? 6 : 9);
    rect(ctx, hero ? "#355b78" : "#3d4850", 18 - step, sitting ? 34 : 31, 5, sitting ? 6 : 9);
    // Jacket with shoulders, belt, zipper and profession patch.
    rect(ctx, "#202722", 7, 20 + y, 18, 13); rect(ctx, hero ? "#485633" : color, 8, 19 + y, 16, 13);
    rect(ctx, hero ? "#617045" : "#66736c", 6, 21 + y, 3, 10); rect(ctx, hero ? "#344126" : "#3d4945", 23, 21 + y, 3, 10);
    rect(ctx, "#171d1a", 8, 30 + y, 16, 2); rect(ctx, "#89916d", 15, 20 + y, 1, 9);
    rect(ctx, hero ? "#c5a452" : (PROFESSION_ACCENT[profession] ?? "#b18a50"), west ? 9 : 20, 22 + y, 3, 2);
    // Head and directional face pixels.
    rect(ctx, "#7c4f3d", 10, 8 + y, 12, 12); rect(ctx, "#c98f70", 11, 9 + y, 10, 10);
    if (hero) { rect(ctx, "#b9532f", 8, 5 + y, 15, 6); rect(ctx, "#7b3022", 9, 5 + y, 12, 2); rect(ctx, "#b9532f", west ? 18 : 8, 9 + y, 5, 10); }
    else rect(ctx, north ? "#2d2925" : "#49372e", 9, 5 + y, 14, 6);
    if (!north) { rect(ctx, "#172326", west ? 12 : 19, 12 + y, 2, 2); rect(ctx, "#9a5b4b", west ? 10 : 20, 16 + y, 2, 1); }
    if (working) { rect(ctx, "#c98f70", 25, 24 + y, 5, 3); rect(ctx, PROFESSION_ACCENT[profession] ?? "#75c4b5", 28, 22 + y, 3, 5); }
    this.#cache.set(key, sprite); return sprite;
  }

  object(kind, activeFrame = 0) {
    const animated = ["generator", "terminal", "screen", "workstation", "airlockPanel", "beacon"].includes(kind);
    const key = `object:${kind}:${animated ? activeFrame % 2 : 0}`;
    if (this.#cache.has(key)) return this.#cache.get(key);
    const c = canvas(48, 48), x = c.getContext("2d");
    const box = (top, front, side, ox = 7, oy = 15, w = 34, h = 24) => {
      rect(x, "#12191a", ox + 2, oy + h, w, 3); rect(x, front, ox, oy + 6, w, h - 6);
      rect(x, side, ox + w - 7, oy + 4, 7, h - 4); rect(x, top, ox + 3, oy, w - 7, 7);
      rect(x, "#172022", ox, oy + 10, w, 2);
    };
    if (kind === "bed") { box("#7b8167", "#4b5044", "#343a35", 4, 24, 40, 13); rect(x,"#d0c7a8",7,20,12,7); rect(x,"#657052",18,22,23,9); }
    else if (kind === "crate") { box("#806344", "#5e432d", "#412f25", 8, 18, 32, 22); rect(x,"#aa8655",10,22,28,3); rect(x,"#2c2823",21,25,5,6); }
    else if (kind === "locker" || kind === "cabinet") { box("#657073", "#414d50", "#2c3638", 11, 5, 27, 37); rect(x,"#1d2729",15,15,19,2); rect(x,"#b5944d",30,24,2,3); }
    else if (kind === "generator" || kind === "compressor") { box("#58686a", "#344448", "#253235", 4, 16, 40, 25); rect(x,"#172426",8,23,17,11); rect(x,"#78978f",11,26,11,2); rect(x,"#c88b35",29,25,7,5); rect(x,"#202a2d",7,39,5,4); rect(x,"#202a2d",36,39,5,4); }
    else if (["terminal","screen","workstation","airlockPanel"].includes(kind)) { box("#596769", "#354548", "#273437", 8, 11, 32, 31); rect(x,"#102b2d",12,15,24,14); rect(x,activeFrame ? "#79d6c4" : "#4aa69e",14,17,20,9); rect(x,"#d4bd63",15,20 + activeFrame * 3,14,1); rect(x,"#20292b",13,34,22,5); }
    else if (kind === "decon") { box("#748185", "#435359", "#2e3b40", 7, 8, 34, 34); rect(x,"#9cc0ba",12,14,19,18); rect(x,"#223236",15,18,13,10); }
    else if (["damaged","debris","rubble"].includes(kind)) { rect(x,"#171b1b",6,38,37,4); rect(x,"#544941",7,31,12,8); rect(x,"#706054",18,26,13,13); rect(x,"#3f3935",30,33,12,7); rect(x,"#9b513d",20,28,5,2); }
    else if (kind === "wire") { rect(x,"#111718",4,38,40,2); rect(x,"#8b5838",8,34,3,5); rect(x,"#365e67",24,36,3,4); rect(x,"#b18a45",35,33,2,6); }
    else if (kind === "beacon") { rect(x,"#222c2e",20,20,8,22); rect(x,"#bc6735",18,14,12,8); rect(x,activeFrame ? "#ffbd4d" : "#8f4a2d",20,15,8,5); }
    else { box("#66706b", "#3c4948", "#283434"); }
    this.#cache.set(key, c); return c;
  }
}
