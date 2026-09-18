export class CharacterSpriteStack {
  constructor({ baseSheet, layers = {} }) {
    this.baseSheet = baseSheet;
    this.layers = new Map(Object.entries(layers).filter(([, sheet]) => Boolean(sheet)));
  }

  setLayer(slot, sheet) {
    if (!sheet) {
      this.layers.delete(slot);
      return;
    }
    this.layers.set(slot, sheet);
  }

  getLayer(slot) {
    return this.layers.get(slot) ?? null;
  }

  async load() {
    const baseReady = await this.baseSheet.load();
    await Promise.all([...this.layers.values()].map((sheet) => sheet.load()));
    return baseReady;
  }

  draw(context, options) {
    const baseDrawn = this.baseSheet.draw(context, options);
    if (!baseDrawn) return false;

    for (const sheet of this.layers.values()) {
      sheet.draw(context, options);
    }
    return true;
  }
}
