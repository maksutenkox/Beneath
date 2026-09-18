import test from "node:test";
import assert from "node:assert/strict";
import { CameraController } from "../src/game/camera/CameraController.js";

test("camera follows gradually without snapping", () => {
  const controller = new CameraController({ width: 20, height: 16, followSpeed: 5 });
  const camera = controller.initialize({ x: 2, y: 2 });
  controller.update(camera, { x: 10, y: 8 }, 1 / 60);
  assert.ok(camera.x > 2 && camera.x < 10);
  assert.ok(camera.y > 2 && camera.y < 8);
});

test("camera target remains inside map boundaries", () => {
  const controller = new CameraController({ width: 20, height: 16, followSpeed: 100 });
  const camera = { x: 10, y: 8 };
  controller.update(camera, { x: -100, y: 100 }, 1);
  assert.equal(camera.x, .5);
  assert.equal(camera.y, 15.5);
});
