// Soothing Ambient Music Synthesizer for TV Panel using Web Audio API
class RelaxingMusicSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning: boolean = false;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private chimeInterval: number | null = null;
  private chordInterval: number | null = null;
  private volume: number = 0.35;

  private chordNotes = [
    [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9 (C4, E4, G4, B4, D5)
    [220.00, 261.63, 329.63, 392.00, 440.00], // Am9 (A3, C4, E4, G4, A4)
    [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj7 (F3, A3, C4, E4, G4)
    [196.00, 246.94, 293.66, 392.00, 440.00], // Gsus4/9 (G3, B3, D4, G4, A4)
  ];

  private chimePitches = [
    523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51
  ]; // C5, D5, E5, G5, A5, B5, C6, D6, E6

  private currentChordIndex = 0;

  public start() {
    if (this.isRunning) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isRunning = true;
      this.playAmbientChord();

      // Cycle chord every 12 seconds with gentle crossfade
      this.chordInterval = window.setInterval(() => {
        if (!this.isRunning) return;
        this.currentChordIndex = (this.currentChordIndex + 1) % this.chordNotes.length;
        this.playAmbientChord();
      }, 12000);

      // Play soft random harp/chime note every 2.5 to 5 seconds
      this.scheduleNextChime();

    } catch (e) {
      console.warn('Unable to start relaxing music audio context:', e);
    }
  }

  private playAmbientChord() {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;

    const freqs = this.chordNotes[this.currentChordIndex];
    const now = this.ctx.currentTime;
    const fadeDuration = 5;

    freqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft sine / triangle mix for warm pad
      osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Low pass filter for warm relaxing tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + fadeDuration);

      // Gentle fade in & out
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + fadeDuration);
      gain.gain.linearRampToValueAtTime(0.0001, now + 11.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 12);

      this.activeOscillators.push(osc);
      this.activeGains.push(gain);
    });
  }

  private scheduleNextChime() {
    if (!this.isRunning) return;

    const delay = 2500 + Math.random() * 3000; // 2.5 - 5.5s
    this.chimeInterval = window.setTimeout(() => {
      if (this.isRunning) {
        this.playChimeNote();
        this.scheduleNextChime();
      }
    }, delay);
  }

  private playChimeNote() {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;

    const now = this.ctx.currentTime;
    const pitch = this.chimePitches[Math.floor(Math.random() * this.chimePitches.length)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    // Bell envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.6);
  }

  public stop() {
    this.isRunning = false;

    if (this.chimeInterval) {
      clearTimeout(this.chimeInterval);
      this.chimeInterval = null;
    }
    if (this.chordInterval) {
      clearInterval(this.chordInterval);
      this.chordInterval = null;
    }

    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
    this.activeGains = [];

    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const relaxingMusicPlayer = new RelaxingMusicSynthesizer();
