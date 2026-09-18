import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const hud = html.match(/<section class="resource-hud"[\s\S]*?<\/section>/)?.[0] ?? "";

test("main HUD contains only the four requested metrics", () => {
  assert.match(hud, /data-population/);
  assert.match(hud, /data-resource="food"/);
  assert.match(hud, /data-resource="water"/);
  assert.match(hud, /data-resource="power"/);
  assert.doesNotMatch(hud, /medicine|controlModule|airFilter/i);
});
