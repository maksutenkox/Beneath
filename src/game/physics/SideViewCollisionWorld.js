const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export class SideViewCollisionWorld {
  constructor(colliders = []) { this.colliders = colliders.map((item) => ({ ...item })); }

  intersects(rect) { return this.colliders.some((collider) => overlaps(rect, collider)); }

  move(body, dx, dy) {
    const result = { hitLeft: false, hitRight: false, hitCeiling: false, grounded: false };
    body.x += dx;
    for (const collider of this.colliders) {
      if (!overlaps(body, collider)) continue;
      if (dx > 0) { body.x = collider.x - body.width; result.hitRight = true; }
      else if (dx < 0) { body.x = collider.x + collider.width; result.hitLeft = true; }
    }
    body.y += dy;
    for (const collider of this.colliders) {
      if (!overlaps(body, collider)) continue;
      if (dy > 0) { body.y = collider.y - body.height; result.grounded = true; }
      else if (dy < 0) { body.y = collider.y + collider.height; result.hitCeiling = true; }
    }
    const probe = { x: body.x + 2, y: body.y + 1, width: Math.max(1, body.width - 4), height: body.height };
    if (!result.grounded) result.grounded = this.colliders.some((collider) => overlaps(probe, collider));
    return result;
  }
}

export { overlaps as rectanglesOverlap };

