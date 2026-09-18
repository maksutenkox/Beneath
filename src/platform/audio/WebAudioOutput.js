const CUES = {
  footstep: { frequency: 95, duration: .045, type: "square" },
  doorMove: { frequency: 68, duration: .18, type: "sawtooth" },
  equipmentUse: { frequency: 310, duration: .09, type: "square" },
  uiAction: { frequency: 520, duration: .045, type: "square" },
  npcTalk: { frequency: 180, duration: .07, type: "triangle" },
  repair: { frequency: 420, duration: .22, type: "triangle" },
  bunkerHum: { frequency: 48, duration: .8, type: "sine" },
  bunkerTheme: { frequency: 110, duration: 1.2, type: "sine" }
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
