const KINDS = ['bed','crate','locker','generator','terminal','decon','damaged','rubble','wire','screen','workstation','airlockPanel','compressor','beacon','table','vent'];
const ALIASES = {debris:'rubble',cabinet:'locker'};
export class EnvironmentAtlas {
  constructor() {
    this.image = new Image(); this.ready = false;
    this.image.onload = () => { this.ready = true; };
    this.image.src = new URL('../assets/environment/props.png', import.meta.url).href;
  }
  draw(ctx,kind,x,y,size) {
    const index=KINDS.indexOf(ALIASES[kind]??kind);
    if(!this.ready || index<0) return false;
    ctx.save(); ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.image,index%4*96,Math.floor(index/4)*96,96,96,Math.round(x-size/2),Math.round(y-size),Math.round(size),Math.round(size));
    ctx.restore(); return true;
  }
}
