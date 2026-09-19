const sharp = require(process.env.SHARP_MODULE || 'sharp');
const fs = require('node:fs/promises');
const path = require('node:path');

async function removeChecker(source) {
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],min=Math.min(r,g,b),max=Math.max(r,g,b);
    if(min>150 && max-min<13) data[i+3]=0;
  }
  return sharp(data,{raw:info}).png().toBuffer();
}
async function paddedFrame(clean, box, size, inset) {
  const cropped=await sharp(clean).extract(box).png().toBuffer();
  const trimmed=await sharp(cropped).trim({background:'#00000000',threshold:8}).png().toBuffer();
  const resized=await sharp(trimmed).resize({width:size.width-inset*2,height:size.height-inset*2,fit:'inside',kernel:'nearest'}).png().toBuffer();
  const metadata=await sharp(resized).metadata();
  return sharp({create:{width:size.width,height:size.height,channels:4,background:'#00000000'}})
    .composite([{input:resized,left:Math.round((size.width-metadata.width)/2),top:size.height-metadata.height}]).png().toBuffer();
}
async function heroine(source,destination){
  const clean=await removeChecker(source), frame={width:64,height:96}, parts=[];
  const bands=[[0,210],[210,420],[420,635],[635,835],[835,1024]];
  for(let row=0;row<5;row++) for(let col=0;col<8;col++){
    const [top,bottom]=bands[row];
    const box=row===0?{left:55+col*163,top,width:150,height:bottom-top}:{left:col*192,top,width:192,height:bottom-top};
    const tile=await paddedFrame(clean,box,frame,3);
    parts.push({input:tile,left:col*frame.width,top:row*frame.height});
    await fs.writeFile(path.join(destination,`hero-${row}-${col}.png`),tile);
  }
  await sharp({create:{width:512,height:480,channels:4,background:'#00000000'}}).composite(parts).png().toFile(path.join(destination,'heroine-side.png'));
}
async function props(source,destination){
  const clean=await removeChecker(source), parts=[];
  for(let row=0;row<4;row++) for(let col=0;col<4;col++){
    const left=Math.floor(col*1254/4),right=Math.floor((col+1)*1254/4),top=Math.floor(row*1254/4),bottom=Math.floor((row+1)*1254/4);
    const tile=await paddedFrame(clean,{left,top,width:right-left,height:bottom-top},{width:128,height:128},4);
    parts.push({input:tile,left:col*128,top:row*128});
  }
  await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite(parts).png().toFile(path.join(destination,'hub-props.png'));
}
async function main(){
  const [heroSource,propSource,destination]=process.argv.slice(2); if(!heroSource||!propSource||!destination)throw new Error('Usage: node prepare-below-protocol-assets.cjs HERO PROPS DEST');
  await fs.mkdir(destination,{recursive:true}); await heroine(heroSource,destination); await props(propSource,destination);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
