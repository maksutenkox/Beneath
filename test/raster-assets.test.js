import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CharacterSpriteSheet } from '../src/game/rendering/CharacterSpriteSheet.js';

for (const [path,width,height] of [
  ['characters/heroine/heroine.png',768,640],
  ['characters/residents/npc.png',384,640],
  ['environment/props.png',384,384]
]) test(`published atlas ${path} has expected dimensions and transparency`,()=>{
  const png=readFileSync(new URL(`../src/game/assets/${path}`,import.meta.url));
  assert.equal(png.readUInt32BE(16),width);
  assert.equal(png.readUInt32BE(20),height);
  assert.equal(png[25],6,'RGBA atlas required');
});

test('undersized character atlas falls back instead of drawing invalid rectangles', async()=>{
  const sheet=new CharacterSpriteSheet({url:'test', imageFactory:()=>{
    const image={naturalWidth:64,naturalHeight:80};
    queueMicrotask(()=>image.onload()); return image;
  }});
  assert.equal(await sheet.load(),false);
  assert.equal(sheet.failed,true);
});
