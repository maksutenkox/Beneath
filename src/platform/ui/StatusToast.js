export class StatusToast {
  constructor(root) { this.element = root.querySelector("[data-status-toast]"); this.timeout = 0; }
  show(message) {
    this.element.textContent = message;
    this.element.hidden = false;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { this.element.hidden = true; }, 3200);
  }
}
