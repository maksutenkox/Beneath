import { heartStates } from "../../game/health/HealthSystem.js";
export class HeartsHud {
  constructor(root) { this.root = root.querySelector("[data-hearts]"); this.last = ""; }
  render(hp, maxHp = 6) {
    const signature = `${hp}/${maxHp}`; if (signature === this.last) return; this.last = signature;
    this.root.replaceChildren(...heartStates(hp, maxHp).map((state) => {
      const heart = document.createElement("span"); heart.className = `heart heart--${state}`; heart.setAttribute("aria-label", state); return heart;
    }));
    this.root.setAttribute("aria-label", `Здоровье ${hp} из ${maxHp}`);
  }
}

