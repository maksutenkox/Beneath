// Offline atlas preparation. Requires sharp; never runs in the game.
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const [mode, source, destination] = process.argv.slice(2);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const background = mode === 'details'
      ? Math.min(r,g,b) > 165 && Math.max(r,g,b)-Math.min(r,g,b) < 10
      : mode === 'reference'
      ? r < 45 && g < 49 && b < 50 && g >= r * .93 && b >= r * .93
      : mode === 'hero'
      ? Math.min(r,g,b) > 165 && Math.max(r,g,b)-Math.min(r,g,b) < 18
      : r > g * 1.35 && b > g * 1.35 && r + b > 100 && r-g > 20 && b-g > 20;
    if (background) data[i + 3] = 0;
  }
  const clean = await sharp(data,{raw:info}).png().toBuffer();
  await fs.mkdir(destination,{recursive:true});
  const directions=['south','south-west','west','north-west','north','north-east','east','south-east'];
  if(mode==='reference') {
    const idleX=[282,337,392,449,506,566,628,689,750];
    const walkX=[777,830,884,938,990,1044,1095,1144,1195];
    const bands=[[96,212],[226,344],[355,481]], pieces=[];
    for(let row=0;row<8;row++) for(let column=0;column<12;column++) {
      const frameIndex=column<4?[0,1,2,1][column]:[0,1,2,1,0,1,2,1][column-4];
      const backView=[3,4,5].includes(row);
      const useIdle=column<4 || backView;
      const bounds=useIdle?idleX:walkX;
      const sourceDirection=useIdle?[0,2,2,1,4,6,7,7][row]:([1,2].includes(row)?0:row);
      const [top,bottom]=bands[frameIndex];
      const cropped=await sharp(clean).extract({left:bounds[sourceDirection],top,width:bounds[sourceDirection+1]-bounds[sourceDirection],height:bottom-top}).png().toBuffer();
      const trimmed=await sharp(cropped).trim({background:'#00000000',threshold:10}).png().toBuffer();
      let pose=sharp(trimmed);
      if(!useIdle && [1,2].includes(row))pose=pose.flop();
      const resized=await pose.resize({width:54,height:72,fit:'inside',kernel:'nearest'}).png().toBuffer();
      const m=await sharp(resized).metadata();
      const tile=await sharp({create:{width:64,height:80,channels:4,background:'#00000000'}}).composite([{input:resized,left:Math.round((64-m.width)/2),top:80-m.height}]).png().toBuffer();
      pieces.push({input:tile,left:column*64,top:row*80});
      await fs.writeFile(path.join(destination,`${directions[row]}-${column<4?'idle':'walk'}-${column<4?column:column-4}.png`),tile);
    }
    await sharp({create:{width:768,height:640,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(path.join(destination,'heroine.png'));
  } else if(mode==='hero') {
    const bands=[ [16,148],[151,277],[281,408],[411,538],[541,670],[677,806],[812,962] ];
    const rows=[0,1,2,3,4,3,5,6];
    const pieces=[];
    for(let row=0;row<8;row++) for(let column=0;column<12;column++) {
      const [top,bottom]=bands[rows[row]];
      const left=Math.round(36+column*97.2), width=95;
      const cropped=await sharp(clean).extract({left,top,width,height:bottom-top}).png().toBuffer();
      let frame=sharp(cropped).trim({background:'#00000000',threshold:10});
      if(row===5) frame=frame.flop();
      const trimmed=await frame.png().toBuffer();
      const resized=await sharp(trimmed).resize({width:54,height:72,fit:'inside',kernel:'nearest'}).png().toBuffer();
      const m=await sharp(resized).metadata();
      const tile=await sharp({create:{width:64,height:80,channels:4,background:'#00000000'}}).composite([{input:resized,left:Math.round((64-m.width)/2),top:80-m.height}]).png().toBuffer();
      pieces.push({input:tile,left:column*64,top:row*80});
      await fs.writeFile(path.join(destination,`${directions[row]}-${column<4?'idle':'walk'}-${column<4?column:column-4}.png`),tile);
    }
    await sharp({create:{width:768,height:640,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(path.join(destination,'heroine.png'));
  } else {
    const propNames=mode==='details'
      ? ['bench','stool','shelf','vent','pipe','cable','tools','wallpanel','weaponRack','pistolCase','ammoBox','shotgun','medicalCabinet','waterCan','foodCrate','backpack']
      : ['bed','crate','locker','generator','terminal','decon','damaged','rubble','wire','screen','workstation','airlockPanel','compressor','beacon','table','vent'];
    const isProp=['props','details'].includes(mode);
    const cols=isProp?4:6, rows=isProp?4:8;
    const targetWidth=isProp?96:64, targetHeight=isProp?96:80;
    const pieces=[];
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
      const bounds=Array.from({length:rows+1},(_,i)=>Math.floor(i*info.height/rows));
      const cropped=await sharp(clean).extract({left:Math.floor(col*info.width/cols),top:bounds[row],width:Math.floor(info.width/cols),height:bounds[row+1]-bounds[row]}).png().toBuffer();
      const trimmed=await sharp(cropped).trim({background:'#00000000',threshold:10}).png().toBuffer();
      const resized=await sharp(trimmed).resize({width:targetWidth-8,height:targetHeight-8,fit:'inside',kernel:'nearest'}).png().toBuffer();
      const m=await sharp(resized).metadata();
      const tile=await sharp({create:{width:targetWidth,height:targetHeight,channels:4,background:'#00000000'}}).composite([{input:resized,left:Math.round((targetWidth-m.width)/2),top:targetHeight-m.height}]).png().toBuffer();
      pieces.push({input:tile,left:col*targetWidth,top:row*targetHeight});
      await fs.writeFile(path.join(destination,isProp?`${propNames[row*cols+col]}.png`:`resident-${row}-${col}.png`),tile);
    }
    await sharp({create:{width:cols*targetWidth,height:rows*targetHeight,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(path.join(destination,`${mode}.png`));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
