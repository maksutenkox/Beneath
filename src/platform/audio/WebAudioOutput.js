const CUES = {
  footstep: { frequency: 72, duration: .055, type: "triangle" },
  jump: { frequency: 155, duration: .09, type: "sine" }, land: { frequency: 58, duration: .11, type: "triangle" },
  attack: { frequency: 108, duration: .13, type: "sawtooth" }, hit: { frequency: 63, duration: .16, type: "square" }, hurt: { frequency: 120, duration: .18, type: "sawtooth" },
  equipmentUse: { frequency: 285, duration: .1, type: "triangle" }, upgrade: { frequency: 390, duration: .22, type: "triangle" }, uiAction: { frequency: 430, duration: .05, type: "sine" },
  officeHum: { frequency: 46, duration: .9, type: "sine" }, alarmPulse: { frequency: 174, duration: .32, type: "triangle" }, hubTheme: { frequency: 92, duration: 1.4, type: "sine" }
};

export class WebAudioOutput {
  constructor(scope = window) { this.scope = scope; this.context = null; }
  async unlock() {
    const AudioContext = this.scope.AudioContext ?? this.scope.webkitAudioContext;
    if (!AudioContext) return false;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    return true;
  }
  play(cue, { gain = .2, pitch = 1 } = {}) {
    if (!this.context || this.context.state !== "running") return;
    const definition = CUES[cue];
    if (!definition) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = definition.type;
    oscillator.frequency.setValueAtTime(definition.frequency * pitch, now);
    envelope.gain.setValueAtTime(Math.min(.18, gain * .16), now);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + definition.duration);
    oscillator.connect(envelope).connect(this.context.destination);
    oscillator.start(now); oscillator.stop(now + definition.duration);
  }
}
