import { DEFAULT_CHARACTER_CLIPS } from "../../animation/CharacterAnimation.js";

export const HEROINE_SPRITE_MANIFEST = Object.freeze({
  id: "heroine-v1",
  frameWidth: 64,
  frameHeight: 80,
  directions: 8,
  clips: DEFAULT_CHARACTER_CLIPS,

  appearance: Object.freeze({
    hair: "copper-red",
    hairstyle: "high-messy-ponytail",
    jacket: "olive-work-jacket",
    trousers: "blue-jeans",
    footwear: "work-boots",
    backpackByDefault: false
  }),

  equipment: Object.freeze({
    layered: true,
    frameAligned: true,
    slots: Object.freeze([
      "back",
      "outerwear",
      "head",
      "hands"
    ]),
    defaultLoadout: Object.freeze({
      back: null,
      outerwear: null,
      head: null,
      hands: null
    })
  }),

  layout: Object.freeze({
    rows: [
      "south",
      "south-west",
      "west",
      "north-west",
      "north",
      "north-east",
      "east",
      "south-east"
    ],
    columns: Object.freeze({
      idle: Object.freeze([0, 1, 2, 3]),
      walk: Object.freeze([4, 5, 6, 7, 8, 9, 10, 11])
    })
  })
});
