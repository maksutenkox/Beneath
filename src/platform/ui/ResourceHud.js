import { resourceCatalog } from "../../game/resources/ResourceCatalog.js";

export class ResourceHud {
  constructor(root) { this.root = root; }
  render(amounts, population = null) {
    const populationTarget = this.root.querySelector("[data-population]");
    if (populationTarget && population !== null) populationTarget.textContent = String(population);
    for (const resource of resourceCatalog.filter(({ category }) => category === "basic")) {
      const target = this.root.querySelector(`[data-resource="${resource.id}"]`);
      const amount = amounts[resource.id] ?? 0;
      if (target) target.textContent = amount >= 10 ? String(Math.floor(amount)) : amount.toFixed(1);
    }
  }
}
