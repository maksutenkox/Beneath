const KEY_BINDINGS = Object.freeze({
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  Space: "jump", KeyW: "jump", KeyJ: "attack", KeyE: "interact"
});

export class InputController {
  constructor(root = document, scope = window) {
    this.root = root; this.scope = scope; this.held = new Set(); this.pressed = new Map(); this.bindings = [];
  }
  initialize() {
    const down = (event) => {
      const action = KEY_BINDINGS[event.code]; if (!action) return;
      event.preventDefault();
      if (!event.repeat && !this.held.has(action)) this.#press(action);
      this.held.add(action);
    };
    const up = (event) => { const action = KEY_BINDINGS[event.code]; if (action) { event.preventDefault(); this.held.delete(action); } };
    this.scope.addEventListener("keydown", down); this.scope.addEventListener("keyup", up);
    this.bindings.push(() => this.scope.removeEventListener("keydown", down), () => this.scope.removeEventListener("keyup", up));
    for (const button of this.root.querySelectorAll?.("[data-control]") ?? []) {
      const action = button.dataset.control, pointerIds = new Set();
      const press = (event) => { event.preventDefault(); pointerIds.add(event.pointerId); button.setPointerCapture?.(event.pointerId); if (!this.held.has(action)) this.#press(action); this.held.add(action); };
      const release = (event) => { if (!pointerIds.has(event.pointerId)) return; pointerIds.delete(event.pointerId); if (!pointerIds.size) this.held.delete(action); };
      button.addEventListener("pointerdown", press); button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release); button.addEventListener("lostpointercapture", release);
      this.bindings.push(() => button.removeEventListener("pointerdown", press), () => button.removeEventListener("pointerup", release), () => button.removeEventListener("pointercancel", release), () => button.removeEventListener("lostpointercapture", release));
    }
    const canvas = this.root.querySelector?.("#game-canvas");
    const mouseAttack = (event) => { if (event.pointerType === "mouse" && event.button === 0) this.#press("attack"); };
    canvas?.addEventListener("pointerdown", mouseAttack); this.bindings.push(() => canvas?.removeEventListener("pointerdown", mouseAttack));
  }
  snapshot() {
    return { horizontal: Number(this.held.has("right")) - Number(this.held.has("left")), jumpHeld: this.held.has("jump"), jumpPressed: this.consume("jump"), attackPressed: this.consume("attack"), interactPressed: this.consume("interact") };
  }
  consume(action) { const count = this.pressed.get(action) ?? 0; if (!count) return false; this.pressed.set(action, count - 1); return true; }
  setInteractionAvailable(available, label = "ВЗАИМОДЕЙСТВОВАТЬ") {
    const button = this.root.querySelector?.("[data-control='interact']"); if (!button) return;
    button.hidden = !available; button.disabled = !available;
    const text = button.querySelector?.("[data-interact-label]"); if (text) text.textContent = label;
  }
  clear() { this.held.clear(); this.pressed.clear(); }
  destroy() { this.bindings.forEach((unbind) => unbind()); this.bindings = []; this.clear(); }
  #press(action) { this.pressed.set(action, (this.pressed.get(action) ?? 0) + 1); }
}
