export class WorkbenchPanel {
  constructor(root) {
    this.panel = root.querySelector("[data-workbench-panel]"); this.weapon = root.querySelector("[data-workbench-weapon]"); this.stats = root.querySelector("[data-workbench-stats]");
    this.upgrade = root.querySelector("[data-workbench-upgrade]"); this.modify = root.querySelector("[data-workbench-modify]"); this.close = root.querySelector("[data-workbench-close]");
    this.close.addEventListener("click", () => this.hide());
  }
  get isOpen() { return !this.panel.hidden; }
  show(data, actions) {
    this.panel.hidden = false; this.weapon.textContent = data.name; this.stats.textContent = `LVL ${data.level}  ·  DMG ${data.damage}  ·  ${data.modifier.toUpperCase()}`;
    this.upgrade.disabled = data.level >= 3; this.upgrade.onclick = actions.upgrade; this.modify.onclick = actions.modify;
  }
  hide() { this.panel.hidden = true; }
}
