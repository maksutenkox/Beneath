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
