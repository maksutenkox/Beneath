export class RunHud {
  constructor(root) { this.root = root.querySelector("[data-run-hud]"); this.floor = root.querySelector("[data-run-floor]"); this.enemies = root.querySelector("[data-run-enemies]"); }
  render(scene, enemyList = []) {
    const active = scene.kind === "office"; this.root.hidden = !active;
    if (!active) return;
    this.floor.textContent = `FLOOR ${String(scene.levelNumber).padStart(2, "0")}`;
    this.enemies.textContent = `${enemyList.filter((enemy) => enemy.hp > 0).length} HOSTILES`;
  }
}
