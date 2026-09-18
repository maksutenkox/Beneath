const ZONES={central:0,living:1,storage:2,generator:3,medical:4,workshop:5,airlock:6,additional:2,unknownNorth:3,unknownSouth:3};
export class MaterialAtlas {
  constructor() {
    this.tiles=[]; this.wall=null;
    const image=new Image();
    image.onload=()=>{
      for(let i=0;i<7;i++) {
        const tile=document.createElement('canvas');tile.width=64;tile.height=32;
        const ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;
        ctx.setTransform(1,.5,-1,.5,32,0);
        ctx.drawImage(image,i%4*image.width/4,Math.floor(i/4)*image.height/2,image.width/4,image.height/2,0,0,32,32);
        this.tiles.push(tile);
      }
      const wall=document.createElement('canvas');wall.width=48;wall.height=48;
      const ctx=wall.getContext('2d');ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,3*image.width/4,image.height/2,image.width/4,image.height/2,0,0,48,48);
      this.wall=wall;
    };
    image.src=new URL('../assets/environment/materials.png',import.meta.url).href;
  }
  floor(ctx,zone,x,y,width,height) {
    const tile=this.tiles[ZONES[zone]??0];if(!tile)return;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.53;
    ctx.drawImage(tile,Math.round(x-width/2),Math.round(y),width,height);ctx.restore();
  }
  wallFace(ctx,top,endTop,bottom) {
    if(!this.wall)return;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.43;
    ctx.transform((endTop.x-top.x)/48,(endTop.y-top.y)/48,0,(bottom.y-top.y)/48,top.x,top.y);
    ctx.drawImage(this.wall,0,0);ctx.restore();
  }
  panel(ctx,x,y,width,height) {
    if(!this.wall)return;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.6;
    ctx.drawImage(this.wall,x,y,width,height);ctx.restore();
  }
}
