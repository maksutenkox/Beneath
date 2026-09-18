export const DETAIL_KINDS = Object.freeze(['bench','stool','shelf','vent','pipe','cable','tools','wallpanel','weaponRack','pistolCase','ammoBox','shotgun','medicalCabinet','waterCan','foodCrate','backpack']);
const SIZES = {bench:52,stool:27,shelf:68,vent:34,pipe:44,cable:36,tools:30,wallpanel:38,weaponRack:68,pistolCase:32,ammoBox:42,shotgun:39,medicalCabinet:60,waterCan:33,foodCrate:48,backpack:31};
// Visual substitutions only: entity IDs, positions, interactions and collisions stay unchanged.
export function detailKind(item) {
  if(item.id==='storage-shelf-b') return 'weaponRack';
  if(item.id==='workshop-tools') return 'pistolCase';
  if(item.id==='storage-crate-c') return 'ammoBox';
  if(item.id==='storage-crate-a') return 'foodCrate';
  if(item.id==='medical-cabinet') return 'medicalCabinet';
  if(item.id==='additional-personal') return 'backpack';
  return item.kind;
}
export class DetailAtlas {
  constructor(imageFactory=()=>new Image()) {
    this.ready=false; this.image=imageFactory();
    this.image.onload=()=>{this.ready=this.image.naturalWidth===384 && this.image.naturalHeight===384;};
    this.image.onerror=()=>{this.ready=false;};
    this.image.src=new URL('../assets/environment/details/details.png',import.meta.url).href;
  }
  draw(ctx,kind,x,y,scale=1,time=0) {
    const index=DETAIL_KINDS.indexOf(kind);
    if(!this.ready || index<0) return false;
    const size=SIZES[kind]*scale;
    ctx.save(); ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='rgb(0 0 0 / 25%)'; ctx.beginPath();
    ctx.ellipse(Math.round(x),Math.round(y),size*.29,size*.075,0,0,Math.PI*2); ctx.fill();
    ctx.drawImage(this.image,index%4*96,Math.floor(index/4)*96,96,96,Math.round(x-size/2),Math.round(y-size),Math.round(size),Math.round(size));
    if(kind==='vent') {
      // Subtle moving specular ticks preserve the original ambient fan motion.
      ctx.translate(Math.round(x-size*.05),Math.round(y-size*.48));
      ctx.scale(1,.8); ctx.rotate(time*3.5); ctx.fillStyle='rgb(128 143 139 / 38%)';
      for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(2*scale,-scale,5*scale,scale);}
    }
    ctx.restore(); return true;
  }
}
