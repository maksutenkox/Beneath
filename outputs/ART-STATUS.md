# BENEATH — raster art integration

Cloudflare: https://beneath-byz.pages.dev/
GitHub: https://github.com/maksutenkox/Beneath

## Current state

Synchronized the existing main branch through commit 1b72510 before changing art. Existing camera, interactions, repairs, inventory, population and map changes are retained.

The provided heroine concept sheet is the identity/style reference. The final heroine is cut directly from the user's original sheet. A generated heroine trial was rejected after reading the shared conversation's anti-chibi requirement. NPC and environment sheets use the built-in image generation tool. All sheets are cut into transparent runtime frames.

- Heroine: 64×80 frame, 12 columns × 8 direction slots. 96 exported PNG frames plus one runtime atlas. The original contains three pose rows; slots repeat these poses, not 96 unique authored poses. Its WALK section does not actually contain back walk views despite the labels. Back directions currently reuse the source's back-view pose variations; left walking mirrors a front-side walk. A full hand-authored eight-direction cycle is unfinished. Equipment visible in original back poses is baked into those source images; separable replacement equipment still needs dedicated art.
- Residents: eight appearances, six poses each (idle, two walk poses, back idle, sitting, working). West views mirror the authored side. Full eight-direction NPC walk cycles, animated sitting/working transitions and unique equipment layers are not finished.
- Props: sixteen detailed isometric assets, 96×96 padded frames. Props and characters retain the existing collision/map locations.
- Materials: seven sector floor materials and one wall material, projected into cached floor tiles. Raster sprites use nearest-neighbor scaling.
- Combat, running, death, climbing and crouching from the concept sheet are not gameplay features and have not been added.

## Image generation prompts (built-in tool)

Heroine: production atlas derived from supplied red-haired heroine; olive work jacket, blue jeans, brown boots, no backpack; detailed survival pixel art; eight directional rows; four idle and eight walking frames; separated full-body sprites, no labels, no weapons. The generated output did not obey exact sheet geometry or transparency; preparation normalizes frame sizes and removes the background.

Residents: eight distinct adult bunker residents (engineer, medic, technician, worker, security, cook, older worker, female technician); six poses each; matching detailed pixel art, solid magenta extraction background, no weapons, no text. The final replacement explicitly requests small heads, longer legs and adult seven-head proportions, avoiding the first cartoon-like trial. Source: exec-544c8335-c226-4394-81a9-5e04ea3e85b2.png.

Props: a 4×4 atlas of bed, crates, locker, generator, terminal, decontamination unit, broken machinery, rubble, cables, medical monitor, workbench, airlock panel, compressor, beacon, mess table and vent; 2:1 isometric survival pixel art; magenta extraction background.

Materials: a 4×2 flat texture atlas: industrial concrete, olive linoleum, warehouse concrete, generator grating, medical ceramic, workshop concrete, airlock checker plate and riveted bunker wall with conduit; restrained worn pixel-art surfaces without painted lighting.

## Asset paths

src/game/assets/characters/heroine/heroine.png
src/game/assets/characters/residents/npc.png
src/game/assets/environment/props.png
src/game/assets/environment/materials.png

Offline preparation: scripts/prepare-character-atlas.cjs (requires sharp, or SHARP_MODULE pointing to its installed module). Runtime has no image processing dependency.

The shared ChatGPT conversation loaded later in the pass. It explicitly rejects chibi/big-head character variants and asks for serious detailed pixel art, smaller heads, longer legs, adult anatomy and optional modular equipment. The original heroine extraction replaces the first generated trial accordingly.
