export class SideViewCamera {
  constructor({ worldWidth, worldHeight, floorY, followSpeed = 7, lookAhead = 92, deadZoneX = 42, deadZoneY = 70 }) {
    Object.assign(this, { worldWidth, worldHeight, floorY, followSpeed, lookAhead, deadZoneX, deadZoneY });
  }
  setBounds({ width, height, floorY }) { this.worldWidth = width; this.worldHeight = height; this.floorY = floorY; }
  initialize(player, viewport = { width: 360, height: 640 }) {
    return { x: Math.max(0, player.x - viewport.width * .38), y: Math.max(0, this.floorY - viewport.height * .72), width: viewport.width, height: viewport.height };
  }
  update(camera, player, deltaSeconds, viewport = camera) {
    camera.width = viewport.width; camera.height = viewport.height;
    const playerCenter = player.x + player.width / 2;
    const desiredCenter = playerCenter + Math.sign(player.vx || player.facing) * Math.min(this.lookAhead, Math.abs(player.vx) * .38);
    const currentCenter = camera.x + camera.width / 2;
    let targetX = camera.x;
    if (desiredCenter < currentCenter - this.deadZoneX) targetX = desiredCenter - camera.width / 2 + this.deadZoneX;
    if (desiredCenter > currentCenter + this.deadZoneX) targetX = desiredCenter - camera.width / 2 - this.deadZoneX;
    const desiredY = this.floorY - camera.height * .72;
    const blend = 1 - Math.exp(-this.followSpeed * Math.max(0, deltaSeconds));
    camera.x += (targetX - camera.x) * blend;
    camera.y += (desiredY - camera.y) * (1 - Math.exp(-3.4 * Math.max(0, deltaSeconds)));
    camera.x = Math.max(0, Math.min(Math.max(0, this.worldWidth - camera.width), camera.x));
    camera.y = Math.max(0, Math.min(Math.max(0, this.worldHeight - camera.height), camera.y));
    return camera;
  }
}
