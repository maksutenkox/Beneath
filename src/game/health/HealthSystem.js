export const heartStates = (hp, maxHp = 6) => Array.from({ length: Math.ceil(maxHp / 2) }, (_, index) => {
  const units = Math.max(0, Math.min(2, hp - index * 2));
  return units === 2 ? "full" : units === 1 ? "half" : "empty";
});

export class HealthSystem {
  constructor(maxHp = 6) { this.maxHp = maxHp; }
  normalize(value) { return Math.max(0, Math.min(this.maxHp, Number.isFinite(value) ? value : this.maxHp)); }
  heal(player, amount) { const before = player.hp; player.hp = this.normalize(player.hp + amount); return player.hp - before; }
}

