const DEFAULT_KEY = "below-protocol.save.v1";

export class SaveStore {
  constructor(storage, key = DEFAULT_KEY) {
    this.storage = storage;
    this.key = key;
  }

  async load() {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return [3, 4].includes(parsed?.version) ? parsed : null;
    } catch {
      return null;
    }
  }

  async save(state) {
    this.storage.setItem(this.key, JSON.stringify(state));
  }
}
