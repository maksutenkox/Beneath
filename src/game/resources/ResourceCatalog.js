export const RESOURCE_CATEGORIES = Object.freeze({ BASIC: "basic", TECHNICAL: "technical" });

export const resourceCatalog = Object.freeze([
  { id: "food", name: "Food", category: "basic", icon: "F", initial: 12 },
  { id: "water", name: "Water", category: "basic", icon: "W", initial: 10 },
  { id: "power", name: "Power", category: "basic", icon: "P", initial: 20 },
  { id: "medicine", name: "Medicine", category: "basic", icon: "M", initial: 3 },
  { id: "controlModule", name: "Control Module", category: "technical", icon: "CM", initial: 2 },
  { id: "industrialCable", name: "Industrial Cable", category: "technical", icon: "IC", initial: 2 },
  { id: "airFilter", name: "Air Filter", category: "technical", icon: "AF", initial: 1 },
  { id: "mechanicalComponent", name: "Mechanical Component", category: "technical", icon: "MC", initial: 2 },
  { id: "electronicComponents", name: "Electronic Components", category: "technical", icon: "EC", initial: 3 }
]);

export function createInitialInventory(catalog = resourceCatalog) {
  return Object.fromEntries(catalog.map((resource) => [resource.id, resource.initial ?? 0]));
}

export function resourceById(id, catalog = resourceCatalog) {
  return catalog.find((resource) => resource.id === id) ?? null;
}
