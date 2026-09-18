import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DETAIL_KINDS, DetailAtlas, detailKind} from '../src/game/rendering/DetailAtlas.js';
import {shelterMap} from '../src/game/map/ShelterMap.js';

test('all sixteen detail sprites have individually exported frames',()=>{
  assert.equal(DETAIL_KINDS.length,16);
  assert.equal(new Set(DETAIL_KINDS).size,16);
  for(const kind of DETAIL_KINDS){
    const frame=readFileSync(new URL(`../src/game/assets/environment/details/${kind}.png`,import.meta.url));
    assert.equal(frame.readUInt32BE(16),96);
    assert.equal(frame.readUInt32BE(20),96);
  }
});
test('visual item substitutions preserve existing map and interaction objects',()=>{
  const before=JSON.stringify(shelterMap);
  const crate=shelterMap.obstacles.find(item=>item.id==='storage-crate-c');
  assert.equal(detailKind(crate),'ammoBox');
  assert.equal(crate.type,'container');
  assert.equal(detailKind(shelterMap.decorations.find(item=>item.id==='storage-shelf-b')),'weaponRack');
  assert.equal(JSON.stringify(shelterMap),before);
});
test('detail renderer fails safely while missing or malformed and accepts exact atlas',()=>{
  const image={naturalWidth:96,naturalHeight:96};
  const atlas=new DetailAtlas(()=>image);
  assert.equal(atlas.draw({},'shelf',0,0),false);
  image.onload(); assert.equal(atlas.ready,false);
  image.naturalWidth=384; image.naturalHeight=384; image.onload();
  assert.equal(atlas.ready,true);
  assert.equal(atlas.draw({},'unknown',0,0),false);
  image.onerror(); assert.equal(atlas.ready,false);
});
