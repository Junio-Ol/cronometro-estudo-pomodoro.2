/**
 * High-performance, fully client-side ambient sound synthesizer using Web Audio API.
 * Eliminates the need for external server assets or fragile media links.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Volume levels (0 to 1)
  private rainTargetVol = 0;
  private forestTargetVol = 0;
  private whiteTargetVol = 0;

  // Audio nodes
  private rainGain: GainNode | null = null;
  private forestGain: GainNode | null = null;
  private whiteGain: GainNode | null = null;

  // Sound sources
  private rainSource: AudioBufferSourceNode | null = null;
  private forestWindSource: AudioBufferSourceNode | null = null;
  private whiteSource: AudioBufferSourceNode | null = null;

  // Modulator LFOs (for natural variations)
  private rainLFO: OscillatorNode | null = null;
  private windLFO: OscillatorNode | null = null;

  // Chirp interval timer
  private chirpTimer: any = null;

  constructor() {
    // Audio context is lazy initialized on user interaction
  }

  private initCtx() {
    if (this.ctx) return;
    
    // Create AudioContext (handling standard & legacy prefix browsers)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Create Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128; // high performance, crisp slice of frequency spectrum
    this.analyser.connect(this.ctx.destination);

    // Create central nodes
    this.rainGain = this.ctx.createGain();
    this.forestGain = this.ctx.createGain();
    this.whiteGain = this.ctx.createGain();

    this.rainGain.connect(this.analyser);
    this.forestGain.connect(this.analyser);
    this.whiteGain.connect(this.analyser);

    // Set initial volumes
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.forestGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.whiteGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Build generators
    this.buildWhiteNoise();
    this.buildRainSound();
    this.buildForestSound();

    // Start bird chirp loop for forest
    this.startChirpLoop();
  }

  private ensureRunning() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates Brown Noise (softer and deeper than White Noise, excellent for deep focus)
   */
  private buildWhiteNoise() {
    if (!this.ctx || !this.whiteGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 10 * sampleRate; // 10s loop
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration formula
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }

    this.whiteSource = this.ctx.createBufferSource();
    this.whiteSource.buffer = buffer;
    this.whiteSource.loop = true;

    // Connect and start
    this.whiteSource.connect(this.whiteGain);
    this.whiteSource.start(0);
  }

  /**
   * Generates Rain Sound using filtered Pink Noise + Highpass clicks
   */
  private buildRainSound() {
    if (!this.ctx || !this.rainGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 8 * sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise generator (Voss-McCartney algorithm)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Volume compensation
      b6 = white * 0.115926;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    // Filter to make it sound like rain falling (remove muddy lows, sculpt mids)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.6, this.ctx.currentTime);

    // Gentle micro-wind gust modulator
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow 12s cycle
    lfoGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    const filterModGain = this.ctx.createGain();
    filterModGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    // Chain nodes
    this.rainSource.connect(bandpass);
    bandpass.connect(this.rainGain);
    
    this.rainSource.start(0);
  }

  /**
   * Generates wind rustle for forest sound using randomized low-pass brown noise wind
   */
  private buildForestSound() {
    if (!this.ctx || !this.forestGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 12 * sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.015 * white)) / 1.015;
      lastOut = data[i];
      data[i] *= 4.0;
    }

    this.forestWindSource = this.ctx.createBufferSource();
    this.forestWindSource.buffer = buffer;
    this.forestWindSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, this.ctx.currentTime); // deep whispering wind rustle

    // LFO to modulate wind gusts
    this.windLFO = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.windLFO.type = 'sine';
    this.windLFO.frequency.setValueAtTime(0.04, this.ctx.currentTime); // 25s wind rise/fall
    lfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const windGainNode = this.ctx.createGain();
    windGainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);

    // Connect wind
    this.forestWindSource.connect(lowpass);
    lowpass.connect(windGainNode);
    windGainNode.connect(this.forestGain);

    this.windLFO.connect(lfoGain);
    lfoGain.connect(windGainNode.gain);

    this.forestWindSource.start(0);
    this.windLFO.start(0);
  }

  /**
   * Periodically schedules high pitched bird chirps to create a living forest atmosphere
   */
  private startChirpLoop() {
    const trigger = () => {
      // Only chirp if forest volume is active and audio context is playing
      if (this.forestTargetVol > 0.02 && this.ctx && this.ctx.state === 'running' && this.forestGain) {
        this.triggerBirdChirp();
      }
      // Re-schedule randomly between 4s and 9s
      this.chirpTimer = setTimeout(trigger, 4000 + Math.random() * 5000);
    };
    this.chirpTimer = setTimeout(trigger, 3000);
  }

  private triggerBirdChirp() {
    if (!this.ctx || !this.forestGain) return;

    try {
      const now = this.ctx.currentTime;
      const count = 2 + Math.floor(Math.random() * 2); // 2 or 3 rapid chirp pulses

      // Create a local gain node for the chirp channel
      const chirpGain = this.ctx.createGain();
      // Set relative volume capped in proportion to the forest mixer level
      chirpGain.gain.setValueAtTime(this.forestTargetVol * 0.12, now);
      chirpGain.connect(this.analyser || this.ctx.destination);

      for (let p = 0; p < count; p++) {
        const osc = this.ctx.createOscillator();
        const envelope = this.ctx.createGain();

        osc.connect(envelope);
        envelope.connect(chirpGain);

        const pulseStart = now + p * 0.16;
        const duration = 0.05 + Math.random() * 0.04;

        osc.type = 'sine';
        // Elegant downwards swept frequency envelope (classic bird sound)
        const baseFreq = 3800 + Math.random() * 600;
        osc.frequency.setValueAtTime(baseFreq, pulseStart);
        osc.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 200, pulseStart + duration);

        // Smooth volume envelope to prevent sound pop clicks
        envelope.gain.setValueAtTime(0.0001, pulseStart);
        envelope.gain.linearRampToValueAtTime(0.4 + Math.random() * 0.4, pulseStart + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.0001, pulseStart + duration);

        osc.start(pulseStart);
        osc.stop(pulseStart + duration + 0.01);
      }
    } catch (e) {
      console.warn("Chirp synth trigger error:", e);
    }
  }

  /**
   * Volume Controls (Value expected 0 to 100)
   */
  public updateRain(vol: number) {
    this.ensureRunning();
    this.rainTargetVol = Math.max(0, Math.min(100, vol)) / 100;
    if (this.ctx && this.rainGain) {
      // Smooth volume ramp to avoid clicks
      this.rainGain.gain.setTargetAtTime(this.rainTargetVol, this.ctx.currentTime, 0.15);
    }
  }

  public updateForest(vol: number) {
    this.ensureRunning();
    this.forestTargetVol = Math.max(0, Math.min(100, vol)) / 100;
    if (this.ctx && this.forestGain) {
      this.forestGain.gain.setTargetAtTime(this.forestTargetVol * 0.7, this.ctx.currentTime, 0.15); // scaled slightly for balance
    }
  }

  public updateWhite(vol: number) {
    this.ensureRunning();
    this.whiteTargetVol = Math.max(0, Math.min(100, vol)) / 100;
    if (this.ctx && this.whiteGain) {
      // Deep brown noise is highly intense, scale it nicely for a comfortable soft room tone
      this.whiteGain.gain.setTargetAtTime(this.whiteTargetVol * 0.35, this.ctx.currentTime, 0.15);
    }
  }

  public stopAll() {
    if (this.chirpTimer) {
      clearTimeout(this.chirpTimer);
    }
    
    // Smooth ramp down of all gains
    const now = this.ctx?.currentTime || 0;
    if (this.ctx) {
      this.rainGain?.gain.setTargetAtTime(0, now, 0.1);
      this.forestGain?.gain.setTargetAtTime(0, now, 0.1);
      this.whiteGain?.gain.setTargetAtTime(0, now, 0.1);
    }
    
    setTimeout(() => {
      try {
        this.rainSource?.stop();
        this.forestWindSource?.stop();
        this.whiteSource?.stop();
        this.windLFO?.stop();
        this.rainLFO?.stop();
        this.ctx?.close();
      } catch (e) {}
      
      this.ctx = null;
      this.analyser = null;
      this.rainGain = null;
      this.forestGain = null;
      this.whiteGain = null;
      this.rainSource = null;
      this.forestWindSource = null;
      this.whiteSource = null;
      this.windLFO = null;
      this.rainLFO = null;
    }, 200);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}

// Export a singleton instance of the synthesis engine
export const ambientAudio = new AmbientAudioEngine();
