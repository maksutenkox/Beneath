import test from "node:test";
import assert from "node:assert/strict";
import { DoorSystem } from "../src/game/doors/DoorSystem.js";

const door = (doorKind, open = false) => ({ id: doorKind, doorKind, x: 1, y: 1, open });

test("manual doors animate and stop blocking near fully open", () => {
  const item = door("manual");
  const system = new DoorSystem([item]);
  assert.equal(system.toggle(item), true);
  system.update(.25, { x: 10, y: 10 });
  assert.equal(item.state, "opening");
  assert.ok(item.progress > 0 && item.progress < 1);
  system.update(1, { x: 10, y: 10 });
  assert.equal(item.state, "open");
  assert.equal(item.collision, false);
});

test("bulkhead doors move slower than ordinary doors", () => {
  const manual = door("manual");
  const bulkhead = door("bulkhead");
  const system = new DoorSystem([manual, bulkhead]);
  system.toggle(manual); system.toggle(bulkhead);
  system.update(.5, { x: 10, y: 10 });
  assert.ok(manual.progress > bulkhead.progress);
});

test("automatic doors react to proximity while locked and damaged doors refuse toggles", () => {
  const automatic = door("automatic");
  const locked = door("locked");
  const damaged = door("damaged");
  const system = new DoorSystem([automatic, locked, damaged]);
  system.update(.2, { x: 1.5, y: 1.5 });
  assert.equal(automatic.state, "opening");
  assert.equal(system.toggle(locked), false);
  assert.equal(system.toggle(damaged), false);
});
