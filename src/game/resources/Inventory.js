export class Inventory {
  constructor(amounts = {}) { this.amounts = amounts; }
  count(resourceId) { return Math.max(0, this.amounts[resourceId] ?? 0); }
  add(resourceId, amount) { this.amounts[resourceId] = this.count(resourceId) + Math.max(0, amount); }
  has(requirements) { return requirements.every(({ resourceId, amount }) => this.count(resourceId) >= amount); }
  consume(requirements) {
    if (!this.has(requirements)) return false;
    for (const { resourceId, amount } of requirements) this.amounts[resourceId] = this.count(resourceId) - amount;
    return true;
  }
}
