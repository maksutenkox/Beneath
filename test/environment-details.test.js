import test from "node:test";
import assert from "node:assert/strict";
import { shelterMap } from "../src/game/map/ShelterMap.js";

test("environment contains all requested detail families", () => {
  const decorationKinds = new Set(shelterMap.decorations.map(({ kind }) => kind));
  const obstacleKinds = new Set(shelterMap.obstacles.map(({ kind }) => kind));
  for (const kind of ["pipe", "cable", "vent", "tools", "table", "mug", "personal", "sign", "damage", "trash"]) assert.ok(decorationKinds.has(kind));
  for (const kind of ["locker", "crate", "bed"] ) assert.ok(obstacleKinds.has(kind));
});

test("each major zone has its own decoration set", () => {
  for (const zone of ["central", "living", "storage", "generator", "medical", "workshop", "airlock", "additional"]) {
    assert.ok(shelterMap.decorations.filter((item) => item.zone === zone).length >= 3, `${zone} needs detail`);
  }
});


test("rooms use neutral furnishing details without defining story loot", () => {
  const decorationKinds = new Set(shelterMap.decorations.map(({ kind }) => kind));
  for (const kind of ["shelf", "bench", "stool", "wallpanel"]) assert.ok(decorationKinds.has(kind));
  assert.equal(shelterMap.obstacles.some(({ loot }) => Array.isArray(loot) && loot.length > 0), false);
});

test("only the external exit uses the hermetic visual style", () => {
  const hermeticDoors = shelterMap.doors.filter(({ visualStyle }) => visualStyle === "hermetic");
  assert.equal(hermeticDoors.length, 1);
  assert.equal(hermeticDoors[0].id, "airlock-outer");
  for (const door of shelterMap.doors.filter(({ id }) => id !== "airlock-outer")) {
    assert.equal(door.visualStyle, "metal");
  }
});
