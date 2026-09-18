const KEY_TO_DIRECTION = {
  ArrowUp: "north", KeyW: "north", ArrowDown: "south", KeyS: "south",
  ArrowLeft: "west", KeyA: "west", ArrowRight: "east", KeyD: "east"
};

export class InputController {
  constructor(root = document) {
    this.root = root;
    this.active = new Set();
    this.analog = { x: 0, y: 0 };
    this.bindings = [];
    this.interactions = 0;
  }

  initialize() {
    const keyDown = (event) => {
      if (event.code === "KeyE" && !event.repeat) { event.preventDefault(); this.interactions += 1; return; }
      const direction = KEY_TO_DIRECTION[event.code];
      if (!direction) return;
      event.preventDefault();
      this.active.add(direction);
    };
    const keyUp = (event) => {
      const direction = KEY_TO_DIRECTION[event.code];
      if (direction) this.active.delete(direction);
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    this.bindings.push(() => window.removeEventListener("keydown", keyDown), () => window.removeEventListener("keyup", keyUp));

    const stick = this.root.querySelector("[data-stick]");
    const knob = this.root.querySelector("[data-stick-knob]");
    let pointerId = null;
    const updateStick = (event) => {
      if (event.pointerId !== pointerId) return;
      const rect = stick.getBoundingClientRect();
      const radius = rect.width * .34;
      let x = event.clientX - (rect.left + rect.width / 2);
      let y = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(x, y);
      if (distance > radius) { x = x / distance * radius; y = y / distance * radius; }
      const strength = Math.min(1, distance / radius);
      this.analog = strength < .14 ? { x: 0, y: 0 } : { x: x / radius, y: y / radius };
      knob.style.transform = `translate(${x}px, ${y}px)`;
    };
    const pressStick = (event) => {
      event.preventDefault();
      pointerId = event.pointerId;
      stick.setPointerCapture?.(pointerId);
      updateStick(event);
    };
    const releaseStick = (event) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      this.analog = { x: 0, y: 0 };
      knob.style.transform = "translate(0, 0)";
    };
    stick.addEventListener("pointerdown", pressStick);
    stick.addEventListener("pointermove", updateStick);
    stick.addEventListener("pointerup", releaseStick);
    stick.addEventListener("pointercancel", releaseStick);

    const action = this.root.querySelector("[data-interact]");
    const pressAction = (event) => { event.preventDefault(); if (!action.disabled) this.interactions += 1; };
    action.addEventListener("pointerdown", pressAction);
    this.bindings.push(
      () => stick.removeEventListener("pointerdown", pressStick),
      () => stick.removeEventListener("pointermove", updateStick),
      () => stick.removeEventListener("pointerup", releaseStick),
      () => stick.removeEventListener("pointercancel", releaseStick),
      () => action.removeEventListener("pointerdown", pressAction)
    );
  }

  vector() {
    const x = Number(this.active.has("east")) - Number(this.active.has("west"));
    const y = Number(this.active.has("south")) - Number(this.active.has("north"));
    if (x || y) { const length = Math.hypot(x, y); return { x: x / length, y: y / length }; }
    return { ...this.analog };
  }

  consumeInteraction() {
    if (!this.interactions) return false;
    this.interactions -= 1;
    return true;
  }

  setInteractionAvailable(available, label = "Действие") {
    const button = this.root.querySelector("[data-interact]");
    if (!button) return;
    button.disabled = !available;
    const text = button.querySelector("[data-interact-label]");
    if (text) text.textContent = label;
  }

  destroy() { this.bindings.forEach((unbind) => unbind()); this.bindings = []; this.active.clear(); }
}
