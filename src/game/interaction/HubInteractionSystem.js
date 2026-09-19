export class HubInteractionSystem {
  constructor(interactables = []) { this.interactables = interactables; }
  setInteractables(interactables = []) { this.interactables = interactables; }
  nearest(player) {
    const px = player.x + player.width / 2, py = player.y + player.height / 2;
    let nearest = null, distance = Infinity;
    for (const target of this.interactables) {
      const current = Math.hypot(target.x - px, target.y - py);
      if (current <= target.range && current < distance) { nearest = target; distance = current; }
    }
    return nearest;
  }
  interact(target) {
    if (!target) return null;
    if (target.type === "workbench") return { type: "workbench", openPanel: true };
    if (target.type === "expedition") return { type: "expedition", transition: "office" };
    if (target.type === "return-hub") return { type: "return-hub", transition: "hub" };
    if (target.type === "next-floor") return { type: "next-floor", transition: "next-floor" };
    return { type: target.type };
  }
}
