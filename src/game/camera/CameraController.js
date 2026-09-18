export class CameraController {
  constructor({ width, height, followSpeed = 7.2, lookAhead = .65, lookAheadSpeed = 4.8 }) {
    this.width = width;
    this.height = height;
    this.followSpeed = followSpeed;
    this.lookAhead = lookAhead;
    this.lookAheadSpeed = lookAheadSpeed;
  }

  initialize(target) {
    return {
      x: target.x,
      y: target.y,
      lookAheadX: 0,
      lookAheadY: 0,
      lastTargetX: target.x,
      lastTargetY: target.y
    };
  }

  update(camera, target, deltaSeconds) {
    camera.lookAheadX ??= 0;
    camera.lookAheadY ??= 0;
    camera.lastTargetX ??= target.x;
    camera.lastTargetY ??= target.y;

    const safeDelta = Math.max(deltaSeconds, 1 / 240);
    const velocityX = (target.x - camera.lastTargetX) / safeDelta;
    const velocityY = (target.y - camera.lastTargetY) / safeDelta;
    const speed = Math.hypot(velocityX, velocityY);
    const moving = speed > .08;
    const desiredLookX = moving ? velocityX / speed * this.lookAhead : 0;
    const desiredLookY = moving ? velocityY / speed * this.lookAhead : 0;
    const lookBlend = 1 - Math.exp(-this.lookAheadSpeed * deltaSeconds);
    camera.lookAheadX += (desiredLookX - camera.lookAheadX) * lookBlend;
    camera.lookAheadY += (desiredLookY - camera.lookAheadY) * lookBlend;

    const desiredX = target.x + camera.lookAheadX;
    const desiredY = target.y + camera.lookAheadY;
    const followBlend = 1 - Math.exp(-this.followSpeed * deltaSeconds);
    camera.x += (desiredX - camera.x) * followBlend;
    camera.y += (desiredY - camera.y) * followBlend;

    camera.x = Math.max(.5, Math.min(this.width - .5, camera.x));
    camera.y = Math.max(.5, Math.min(this.height - .5, camera.y));
    camera.lastTargetX = target.x;
    camera.lastTargetY = target.y;
    return camera;
  }
}
