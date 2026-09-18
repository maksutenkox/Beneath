# BENEATH — raster art integration

Cloudflare: https://beneath-byz.pages.dev/
GitHub: https://github.com/maksutenkox/Beneath

## Current state

Synchronized the existing main branch through commit 1b72510 before changing art. Existing camera, interactions, repairs, inventory, population and map changes are retained.

The provided heroine concept sheet is the identity/style reference. New cleaned raster sheets were generated from it with the built-in image generation tool, then cut into runtime frames. These are derived production assets, not a claim that the original presentation sheet was a ready-to-use animation atlas.

- Heroine: 64×80 frame, 12 columns × 8 directions. Four idle slots and eight walking slots per direction, 96 exported PNG frames plus one runtime atlas. North-east uses a mirrored north-west view. Animation needs further artistic cleanup before it can be described as a final hand-authored cycle.
- Residents: eight appearances, six poses each (idle, two walk poses, back idle, sitting, working). West views mirror the authored side. Full eight-direction NPC walk cycles, animated sitting/working transitions and unique equipment layers are not finished.
- Props: sixteen detailed isometric assets, 96×96 padded frames. Props and characters retain the existing collision/map locations.
- Materials: seven sector floor materials and one wall material, projected into cached floor tiles. Raster sprites use nearest-neighbor scaling.
- Combat, running, death, climbing and crouching from the concept sheet are not gameplay features and have not been added.

## Image generation prompts (built-in tool)

Heroine: production atlas derived from supplied red-haired heroine; olive work jacket, blue jeans, brown boots, no backpack; detailed survival pixel art; eight directional rows; four idle and eight walking frames; separated full-body sprites, no labels, no weapons. The generated output did not obey exact sheet geometry or transparency; preparation normalizes frame sizes and removes the background.

Residents: eight distinct adult bunker residents (engineer, medic, technician, worker, security, cook, older worker, female technician); six poses each; matching detailed pixel art, solid magenta extraction background, no weapons, no text.

Props: a 4×4 atlas of bed, crates, locker, generator, terminal, decontamination unit, broken machinery, rubble, cables, medical monitor, workbench, airlock panel, compressor, beacon, mess table and vent; 2:1 isometric survival pixel art; magenta extraction background.

Materials: a 4×2 flat texture atlas: industrial concrete, olive linoleum, warehouse concrete, generator grating, medical ceramic, workshop concrete, airlock checker plate and riveted bunker wall with conduit; restrained worn pixel-art surfaces without painted lighting.

## Asset paths

src/game/assets/characters/heroine/heroine.png
src/game/assets/characters/residents/npc.png
src/game/assets/environment/props.png
src/game/assets/environment/materials.png

Offline preparation: scripts/prepare-character-atlas.cjs (requires sharp, or SHARP_MODULE pointing to its installed module). Runtime has no image processing dependency.

The shared ChatGPT URL could not be read during this pass. Project history and current source were inspected instead.
