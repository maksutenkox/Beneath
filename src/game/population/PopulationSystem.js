export const CONSUMPTION_PER_PERSON_PER_MINUTE = Object.freeze({
  food: .04,
  water: .06,
  power: .03,
  medicine: .004
});

export class PopulationSystem {
  initialize(population, residents) {
    return { count: residents.length, elapsedSeconds: population?.elapsedSeconds ?? 0 };
  }

  update(population, resources, deltaSeconds, residents) {
    population.count = residents.length;
    population.elapsedSeconds += deltaSeconds;
    for (const [resourceId, rate] of Object.entries(CONSUMPTION_PER_PERSON_PER_MINUTE)) {
      resources[resourceId] = Math.max(0, (resources[resourceId] ?? 0) - rate * population.count * deltaSeconds / 60);
    }
  }
}
