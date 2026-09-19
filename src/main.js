import { GameCore } from "./game/core/GameCore.js";
import { hubMap } from "./game/map/HubMap.js";
import { OfficeLevelGenerator } from "./game/map/OfficeLevelGenerator.js";
import { SideViewCollisionWorld } from "./game/physics/SideViewCollisionWorld.js";
import { PlayerController } from "./game/player/PlayerController.js";
import { SideViewCamera } from "./game/camera/SideViewCamera.js";
import { HubInteractionSystem } from "./game/interaction/HubInteractionSystem.js";
import { MeleeSystem } from "./game/combat/MeleeSystem.js";
import { HealthSystem } from "./game/health/HealthSystem.js";
import { ZombieSystem } from "./game/enemy/ZombieSystem.js";
import { HubScene } from "./game/rendering/HubScene.js";
import { InputController } from "./game/input/InputController.js";
import { SaveStore } from "./game/save/SaveStore.js";
import { HeartsHud } from "./platform/ui/HeartsHud.js";
import { RunHud } from "./platform/ui/RunHud.js";
import { WorkbenchPanel } from "./platform/ui/WorkbenchPanel.js";
import { StatusToast } from "./platform/ui/StatusToast.js";
import { AudioSystem } from "./game/audio/AudioSystem.js";
import { WebAudioOutput } from "./platform/audio/WebAudioOutput.js";
import { createPlatform } from "./platform/createPlatform.js";

const canvas = document.querySelector("#game-canvas"), platform = createPlatform();
const touchUi = platform.name === "Telegram Mini App" || (navigator.maxTouchPoints ?? 0) > 0 || window.matchMedia?.("(pointer: coarse)")?.matches;
document.documentElement.classList.toggle("touch-ui", Boolean(touchUi)); document.documentElement.classList.toggle("desktop-ui", !touchUi);

const collisionWorld = new SideViewCollisionWorld(hubMap.colliders);
const renderer = new HubScene(canvas, hubMap);
const input = new InputController(document, window);
const audio = new AudioSystem(new WebAudioOutput(window));
const game = new GameCore({
  map: hubMap, renderer, saveStore: new SaveStore(window.localStorage), input,
  playerController: new PlayerController(collisionWorld),
  camera: new SideViewCamera({ worldWidth: hubMap.width, worldHeight: hubMap.height, floorY: hubMap.floorY }),
  interactions: new HubInteractionSystem(hubMap.interactables), melee: new MeleeSystem(), health: new HealthSystem(),
  zombies: new ZombieSystem(collisionWorld), levelGenerator: new OfficeLevelGenerator(),
  heartsHud: new HeartsHud(document), runHud: new RunHud(document), workbenchPanel: new WorkbenchPanel(document), statusToast: new StatusToast(document), audio
});

platform.initialize(); input.initialize();
document.querySelector("#platform-status").textContent = platform.name === "Telegram Mini App" ? "TELEGRAM LINK ACTIVE" : "HUB SYSTEM ONLINE";
const unlockAudio = () => audio.unlock();
window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true }); window.addEventListener("keydown", unlockAudio, { once: true });
const removePauseListener = platform.onPause(() => game.save());
window.addEventListener("resize", () => renderer.resize(), { passive: true }); window.addEventListener("pagehide", () => game.save(), { passive: true });
window.addEventListener("beforeunload", () => { removePauseListener(); input.destroy(); }, { once: true });
await game.start();
