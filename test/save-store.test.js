import test from "node:test";
import assert from "node:assert/strict";
import { SaveStore } from "../src/game/save/SaveStore.js";

class MemoryStorage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, value); }
}

test("save data survives a store round trip", async () => {
  const storage = new MemoryStorage();
  const store = new SaveStore(storage);
  const state = { version: 1, createdAt: "now", savedAt: "later" };
  await store.save(state);
  assert.deepEqual(await store.load(), state);
});

test("invalid and future save formats are ignored safely", async () => {
  const storage = new MemoryStorage();
  const store = new SaveStore(storage);
  storage.setItem(store.key, "not json");
  assert.equal(await store.load(), null);
  storage.setItem(store.key, JSON.stringify({ version: 3 }));
  assert.equal(await store.load(), null);
});

test("current version two saves and legacy version one saves both load", async () => {
  const storage = new MemoryStorage();
  const store = new SaveStore(storage);
  storage.setItem(store.key, JSON.stringify({ version: 2, resources: { food: 7 } }));
  assert.equal((await store.load()).resources.food, 7);
  storage.setItem(store.key, JSON.stringify({ version: 1, player: { x: 2 } }));
  assert.equal((await store.load()).player.x, 2);
});
