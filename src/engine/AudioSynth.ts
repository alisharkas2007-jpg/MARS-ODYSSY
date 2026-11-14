import { RealmId } from '../types/game';

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private initialized = false;

  // Continuous loop nodes
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private padOsc1: OscillatorNode | null = null;
  private padOsc2: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private currentRealm: RealmId = 'space';
  private paused = false;

  public unlock(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended' && !this.paused) {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.45;
      this.masterGain.connect(this.ctx.destination);

      this.setupContinuousLoops();
      this.initialized = true;
    } catch {
      // Audio unavailable
    }
  }

  private setupContinuousLoops(): void {
    if (!this.ctx || !this.masterGain) return;

    // 1. Thruster noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 2.8;
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'bandpass';
    this.thrusterFilter.frequency.value = 340;
    this.thrusterFilter.Q.value = 1.2;

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.value = 0;

    noiseSrc.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.masterGain);
    noiseSrc.start();

    // 2. Ambient pad per realm
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    this.padOsc1.type = 'sine';
    this.padOsc2.type = 'triangle';

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 460;

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.045;

    this.padOsc1.connect(padFilter);
    this.padOsc2.connect(padFilter);
    padFilter.connect(this.padGain);
    this.padGain.connect(this.masterGain);

    this.padOsc1.start();
    this.padOsc2.start();
    this.applyRealmPad(this.currentRealm);
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.05);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (!this.ctx) return;
    if (paused) {
      this.updateLoops(0, false);
      if (this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    } else if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public setRealm(realm: RealmId): void {
    this.currentRealm = realm;
    this.applyRealmPad(realm);
  }

  private applyRealmPad(realm: RealmId): void {
    if (!this.ctx || !this.padOsc1 || !this.padOsc2 || !this.padGain) return;
    const now = this.ctx.currentTime;
    const chords: Record<RealmId, [number, number, number]> = {
      space: [130.81, 196.0, 0.05], // C3 + G3 airy space
      mars: [110.0, 164.81, 0.042], // A2 + E3 warm frontier
      solar: [146.83, 220.0, 0.055], // D3 + A3 cosmic shimmer
    };
    const [f1, f2, g] = chords[realm];
    this.padOsc1.frequency.setTargetAtTime(f1, now, 0.4);
    this.padOsc2.frequency.setTargetAtTime(f2, now, 0.4);
    this.padGain.gain.setTargetAtTime(g, now, 0.4);
  }

  public updateLoops(thrustAmount: number, isPlaying: boolean): void {
    if (!this.ctx || !this.thrusterGain || !this.thrusterFilter || !this.padGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (!isPlaying || this.paused) {
      this.thrusterGain.gain.setTargetAtTime(0, now, 0.08);
      this.padGain.gain.setTargetAtTime(0.025, now, 0.25);
      return;
    }

    const thrustGain = Math.min(0.18, thrustAmount * 0.16);
    this.thrusterGain.gain.setTargetAtTime(thrustGain, now, 0.05);
    this.thrusterFilter.frequency.setTargetAtTime(260 + thrustAmount * 520, now, 0.06);
  }

  public playClick(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.06);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playFootstep(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115 + Math.random() * 25, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playPickup(pitchBoost = 0): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const base = notes[pitchBoost % notes.length];

    [base, base * 1.25].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playFanfare(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.085;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playRadar(): void {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1420, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.45);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playBump(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.22);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public dispose(): void {
    try {
      this.padOsc1?.stop();
      this.padOsc2?.stop();
      void this.ctx?.close();
    } catch {
      // ignore cleanup errors
    }
    this.ctx = null;
    this.initialized = false;
  }
}
