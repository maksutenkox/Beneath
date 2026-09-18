export class CameraController {
  constructor({ width, height, followSpeed = 5.5 }) {
    this.width = width;
    this.height = height;
    this.followSpeed = followSpeed;
  }

  initialize(target) {
    return { x: target.x, y: target.y };
  }

  update(camera, target, deltaSeconds) {
    const blend = 1 - Math.exp(-this.followSpeed * deltaSeconds);
    camera.x += (target.x - camera.x) * blend;
    camera.y += (target.y - camera.y) * blend;
    camera.x = Math.max(.5, Math.min(this.width - .5, camera.x));
    camera.y = Math.max(.5, Math.min(this.height - .5, camera.y));
    return camera;
  }
}
