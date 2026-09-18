const RESIDENT_ROWS = Object.freeze({ anton: 0, sana: 1, igor: 2, lida: 3, maksim: 4, mira: 5, oleg: 6 });

export class ResidentSpriteSheet {
  constructor() {
    this.image = new Image();
    this.ready = false;
    this.image.onload = () => { this.ready = true; };
    this.image.src = new URL('../assets/characters/residents/npc.png', import.meta.url).href;
  }

  draw(context, npc, x, y, scale) {
    if (!this.ready) return false;
    const row = RESIDENT_ROWS[npc.id] ?? 7;
    const direction = npc.direction ?? 'south';
    let column = npc.activity === 'walk' ? 1 + Math.floor(npc.animationTime * 6) % 2 : 0;
    if (direction.includes('north') && npc.activity !== 'walk') column = 3;
    if (npc.activity === 'sit') column = 4;
    if (npc.activity === 'work') column = 5;
    context.save();
    context.imageSmoothingEnabled = false;
    context.translate(Math.round(x), Math.round(y));
    if (direction.includes('west')) context.scale(-1, 1);
    context.drawImage(this.image, column * 64, row * 80, 64, 80, -32 * scale, -80 * scale, 64 * scale, 80 * scale);
    context.restore();
    return true;
  }
}
