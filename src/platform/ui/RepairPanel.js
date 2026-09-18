export class RepairPanel {
  constructor(root) {
    this.root = root;
    this.panel = root.querySelector("[data-repair-panel]");
    this.list = root.querySelector("[data-repair-list]");
    this.repairButton = root.querySelector("[data-repair-action]");
    this.closeButton = root.querySelector("[data-repair-close]");
    this.closeButton.addEventListener("click", () => this.hide());
  }

  get isOpen() { return !this.panel.hidden; }

  show(details, onRepair) {
    this.panel.hidden = false;
    this.root.querySelector("[data-repair-name]").textContent = details.name;
    this.root.querySelector("[data-repair-status]").textContent = details.status;
    this.root.querySelector("[data-repair-status]").dataset.state = details.status;
    this.list.replaceChildren(...details.requirements.map((item) => {
      const row = document.createElement("li");
      row.className = item.enough ? "enough" : "missing";
      row.innerHTML = `<span>${item.name}</span><b>${item.available} / ${item.amount}</b>`;
      return row;
    }));
    this.repairButton.disabled = !details.canRepair;
    this.repairButton.onclick = () => onRepair();
  }

  hide() { this.panel.hidden = true; }
}
