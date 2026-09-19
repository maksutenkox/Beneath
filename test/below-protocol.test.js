import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hubMap } from "../src/game/map/HubMap.js";
import { SideViewCollisionWorld } from "../src/game/physics/SideViewCollisionWorld.js";
import { PLAYER_TUNING, PlayerController, createPlayer } from "../src/game/player/PlayerController.js";
import { SideViewCamera } from "../src/game/camera/SideViewCamera.js";
import { sideViewFrameAt, SIDE_VIEW_CLIPS } from "../src/game/animation/SideViewAnimation.js";
import { MeleeSystem } from "../src/game/combat/MeleeSystem.js";
import { HealthSystem, heartStates } from "../src/game/health/HealthSystem.js";
import { HubInteractionSystem } from "../src/game/interaction/HubInteractionSystem.js";
import { InputController } from "../src/game/input/InputController.js";
import { SaveStore } from "../src/game/save/SaveStore.js";

const pngSize = (path) => {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

test("new map is a long side-view HUB with platforms, obstacles and the required stations", () => {
  assert.equal(hubMap.height, 900);
  assert.ok(hubMap.width > hubMap.height * 2);
  assert.ok(hubMap.colliders.some(({ kind }) => kind === "platform"));
  assert.ok(hubMap.colliders.filter(({ kind }) => kind === "obstacle").length >= 4);
  assert.deepEqual(hubMap.interactables.map(({ type }) => type), ["workbench", "expedition"]);
  assert.ok(hubMap.props.some(({ kind }) => kind === "dummy"));
});

test("collision world resolves floors and solid obstacles on separate axes", () => {
  const world = new SideViewCollisionWorld([
    { x: 0, y: 100, width: 300, height: 30 },
    { x: 100, y: 0, width: 20, height: 100 }
  ]);
  const falling = { x: 20, y: 50, width: 30, height: 50 };
  assert.equal(world.move(falling, 0, 20).grounded, true);
  assert.equal(falling.y, 50);
  const walking = { x: 60, y: 50, width: 30, height: 50 };
  assert.equal(world.move(walking, 30, 0).hitRight, true);
  assert.equal(walking.x, 70);
});

test("player movement has the requested responsive platformer tuning", () => {
  assert.ok(PLAYER_TUNING.coyoteTime >= .08 && PLAYER_TUNING.coyoteTime <= .12);
  assert.ok(PLAYER_TUNING.jumpBuffer >= .08);
  assert.ok(PLAYER_TUNING.airControl > 0 && PLAYER_TUNING.airControl < 1);
  const world = new SideViewCollisionWorld([{ x: 0, y: 100, width: 400, height: 40 }]);
  const controller = new PlayerController(world);
  const player = createPlayer({ x: 20, y: 18 });
  player.grounded = true;
  const moved = controller.update(player, { horizontal: 1, jumpPressed: false, jumpHeld: false }, 1 / 60);
  assert.ok(player.vx > 0);
  assert.equal(moved.grounded, true);
});

test("coyote time permits a jump just after leaving a ledge", () => {
  const controller = new PlayerController(new SideViewCollisionWorld([]));
  const player = createPlayer({ x: 0, y: 0 });
  player.grounded = true;
  controller.update(player, { horizontal: 0, jumpPressed: false, jumpHeld: false }, .04);
  const result = controller.update(player, { horizontal: 0, jumpPressed: true, jumpHeld: true }, .04);
  assert.equal(result.jumped, true);
  assert.ok(player.vy < 0);
});

test("jump buffer fires when the player lands shortly after pressing jump", () => {
  const controller = new PlayerController(new SideViewCollisionWorld([{ x: 0, y: 100, width: 300, height: 50 }]));
  const player = createPlayer({ x: 10, y: 13 });
  player.vy = 240;
  controller.update(player, { horizontal: 0, jumpPressed: true, jumpHeld: true }, .02);
  assert.equal(player.grounded, true);
  const result = controller.update(player, { horizontal: 0, jumpPressed: false, jumpHeld: true }, .016);
  assert.equal(result.jumped, true);
});

test("side camera uses look-ahead and never leaves map bounds", () => {
  const cameraSystem = new SideViewCamera({ worldWidth: 1200, worldHeight: 900, floorY: 730 });
  const player = { x: 500, y: 600, width: 34, vx: 200, facing: 1 };
  const camera = cameraSystem.initialize(player, { width: 360, height: 640 });
  for (let i = 0; i < 120; i += 1) cameraSystem.update(camera, player, 1 / 60, { width: 360, height: 640 });
  assert.ok(camera.x > player.x - 180);
  player.x = 5000;
  cameraSystem.update(camera, player, 1, { width: 360, height: 640 });
  assert.equal(camera.x, 840);
  assert.ok(camera.y >= 0 && camera.y <= 260);
});

test("animation table covers locomotion, combat and damage without frame overflow", () => {
  for (const name of ["idle", "run", "jump_start", "jump", "fall", "land", "attack_1", "interact", "hurt", "death"]) {
    const frame = sideViewFrameAt(name, 99);
    assert.ok(frame.row >= 0 && frame.row < 5, name);
    assert.ok(frame.column >= 0 && frame.column < 8, name);
  }
  assert.equal(SIDE_VIEW_CLIPS.run.frames, 8);
});

test("keyboard attack creates one directional hit against the training dummy", () => {
  const melee = new MeleeSystem();
  const state = melee.initialize();
  const player = { x: 100, y: 100, width: 34, height: 82, facing: 1, hp: 6, animation: "idle", animationTime: 0 };
  const target = { id: "dummy", x: 145, y: 120, width: 30, height: 50 };
  assert.equal(melee.tryStart(state, player), true);
  const hits = melee.update(state, player, .15, [target]);
  assert.equal(hits.length, 1);
  assert.equal(target.hits, 1);
});

test("health renders three full/half/empty hearts for six HP units", () => {
  assert.deepEqual(heartStates(6), ["full", "full", "full"]);
  assert.deepEqual(heartStates(3), ["full", "half", "empty"]);
  const health = new HealthSystem();
  const player = { hp: 5 };
  assert.equal(health.heal(player, 8), 1);
  assert.equal(player.hp, 6);
});

test("context interaction finds the closest HUB station and keeps expeditions locked", () => {
  const interactions = new HubInteractionSystem(hubMap.interactables);
  const player = { x: 835, y: hubMap.floorY - 82, width: 34, height: 82 };
  assert.equal(interactions.nearest(player).type, "workbench");
  const expedition = interactions.interact(hubMap.interactables.find(({ type }) => type === "expedition"));
  assert.match(expedition.message, /COMING NEXT/);
});

test("input maps desktop controls and consumes edge presses once", () => {
  class Events {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, handler) { this.listeners.set(type, handler); }
    removeEventListener(type) { this.listeners.delete(type); }
    emit(type, data) { this.listeners.get(type)?.({ preventDefault() {}, repeat: false, ...data }); }
  }
  const scope = new Events();
  const root = { querySelectorAll: () => [], querySelector: () => null };
  const input = new InputController(root, scope);
  input.initialize();
  scope.emit("keydown", { code: "KeyD" });
  scope.emit("keydown", { code: "Space" });
  const first = input.snapshot();
  assert.equal(first.horizontal, 1);
  assert.equal(first.jumpPressed, true);
  assert.equal(input.snapshot().jumpPressed, false);
  scope.emit("keyup", { code: "KeyD" });
  assert.equal(input.snapshot().horizontal, 0);
  input.destroy();
});

test("save store accepts only Below Protocol version three data", async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const store = new SaveStore(storage);
  await store.save({ version: 3, player: { hp: 5 } });
  assert.equal((await store.load()).player.hp, 5);
  values.set("below-protocol.save.v1", JSON.stringify({ version: 2 }));
  assert.equal(await store.load(), null);
});

test("authored pixel atlases have exact runtime dimensions", () => {
  assert.deepEqual(pngSize("src/game/assets/below-protocol/heroine-side.png"), { width: 512, height: 480 });
  assert.deepEqual(pngSize("src/game/assets/below-protocol/hub-props.png"), { width: 512, height: 512 });
});

test("mobile shell is portrait, four-button, nearest-neighbor and Telegram-ready", () => {
  const html = readFileSync("index.html", "utf8");
  const css = readFileSync("src/styles.css", "utf8");
  assert.match(html, /screen-orientation[^>]+portrait/);
  for (const action of ["left", "right", "jump", "attack", "interact"]) assert.match(html, new RegExp(`data-control="${action}"`));
  assert.match(html, /telegram-web-app\.js/);
  assert.match(css, /image-rendering:\s*pixelated/);
  assert.doesNotMatch(html, /joystick|analog/i);
});
