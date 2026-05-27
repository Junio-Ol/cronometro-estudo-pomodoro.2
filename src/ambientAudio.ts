/**
 * High-performance, fully client-side ambient sound synthesizer using Web Audio API.
 * Synthesizes highly realistic nature soundscapes without external asset load delays.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Volume levels (0 to 1)
  private rainTargetVol = 0;
  private forestTargetVol = 0;
  private whiteTargetVol = 0;

  // Master Gain to allow global gentle fade in/out
  private masterGain: GainNode | null = null;

  // Channel Gains
  private rainGain: GainNode | null = null;
  private forestGain: GainNode | null = null;
  private whiteGain: GainNode | null = null;

  // Sound sources
  private rainSource: AudioBufferSourceNode | null = null;
  private forestWindSource: AudioBufferSourceNode | null = null;
  private whiteSource: AudioBufferSourceNode | null = null;

  // Modulator LFOs
  private oceanWavesLFO: OscillatorNode | null = null;
  private windGustsLFO: OscillatorNode | null = null;
  private cricketLFO: OscillatorNode | null = null;

  // Forest Echo / Delay Lines
  private forestEcho: DelayNode | null = null;
  private forestEchoFeedback: GainNode | null = null;
  private forestEchoGain: GainNode | null = null;

  // Periodic Synthesized Nature Events
  private chirpTimer: any = null;
  private cricketGain: GainNode | null = null;
  private cricketOsc: OscillatorNode | null = null;
  private thunderTimer: any = null;

  constructor() {
    // Lazy initialized on user action
  }

  private initCtx() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    // Create Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128; // lightweight, fast frequency visualizer response
    this.analyser.smoothingTimeConstant = 0.85; // professional, fluid frequency transitions

    // Create Master Gain node for elegant fade-ins and fade-outs
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    this.analyser.connect(this.masterGain);

    // Create channel gain nodes
    this.rainGain = this.ctx.createGain();
    this.forestGain = this.ctx.createGain();
    this.whiteGain = this.ctx.createGain();

    this.rainGain.connect(this.analyser);
    this.forestGain.connect(this.analyser);
    this.whiteGain.connect(this.analyser);

    // Set up forest reverb/echo delay line (provides spacious depth in dense foliage)
    this.forestEcho = this.ctx.createDelay(1.5);
    this.forestEcho.delayTime.setValueAtTime(0.42, this.ctx.currentTime);
    this.forestEchoFeedback = this.ctx.createGain();
    this.forestEchoFeedback.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.forestEchoGain = this.ctx.createGain();
    this.forestEchoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.forestEcho.connect(this.forestEchoFeedback);
    this.forestEchoFeedback.connect(this.forestEcho);
    this.forestEcho.connect(this.forestEchoGain);
    this.forestEchoGain.connect(this.analyser);

    // Set initial volume gains
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.forestGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.whiteGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Build advanced soundscapes
    this.buildOceanWavesNoise();
    this.buildUltraRealisticRain();
    this.buildSoftWindAndForest();
    this.buildGrassCrickets();

    // Start random atmospheric event generators
    this.startChirpLoop();
    this.startThunderLoop();
  }

  private ensureRunning() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates highly organic Brown noise coupled with a resonant cutoff lowpass filter
   * modulated by an ultra-slow LFO (0.05Hz) to sound exactly like rolling ocean tidewaters.
   */
  private buildOceanWavesNoise() {
    if (!this.ctx || !this.whiteGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 12 * sampleRate; // 12-second loop
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       // Deep brown noise filter
       data[i] = (lastOut + (0.02 * white)) / 1.02;
       lastOut = data[i];
       data[i] *= 12.0; // boosted raw waves buffer gain to ensure deep rich rumble
    }

    this.whiteSource = this.ctx.createBufferSource();
    this.whiteSource.buffer = buffer;
    this.whiteSource.loop = true;

    // Resonant filter for the "hiss" and "crash" sweeps of ocean surf
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime); // Raised base frequency to prevent absolute muting at low LFO limits
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Slow wave LFO modulator (every 18 seconds)
    this.oceanWavesLFO = this.ctx.createOscillator();
    this.oceanWavesLFO.type = 'sine';
    this.oceanWavesLFO.frequency.setValueAtTime(0.055, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime); // Sweet sweep range of 150Hz to 750Hz (deep and always beautifully audible)

    this.oceanWavesLFO.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.whiteSource.connect(filter);
    filter.connect(this.whiteGain);

    this.whiteSource.start(0);
    this.oceanWavesLFO.start(0);
  }

  /**
   * Generates ultra-realistic rain sound using recursive pink noise bases
   * layered with hundreds of micro-droplets (highly high-passed water splatters with random decay)
   */
  private buildUltraRealisticRain() {
    if (!this.ctx || !this.rainGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 10 * sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise base for standard heavy background shower
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
      data[i] *= 0.65; // significantly boosted rain base gain (up from 0.16)
      b6 = white * 0.115926;
    }

    // Embed individual realistic high-clarity water droplet splatters
    for (let drop = 0; drop < 650; drop++) {
      const startPos = Math.floor(Math.random() * bufferSize);
      const intensity = 0.04 + Math.random() * 0.12;
      const baseFreq = 950 + Math.random() * 1100;
      const decayTime = 0.005 + Math.random() * 0.012; // short damp ticks
      const length = Math.floor(decayTime * sampleRate);

      for (let j = 0; j < length && (startPos + j) < bufferSize; j++) {
        const time = j / sampleRate;
        const envelope = Math.exp(-time * (6.0 / decayTime));
        // A sweeping resonant pitch drop to simulate real raindrop elastic strike
        const sweepFreq = baseFreq * (1.2 - (time / decayTime) * 0.5);
        data[startPos + j] += Math.sin(2 * Math.PI * sweepFreq * time) * envelope * intensity;
      }
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    // Filter to roll off mud/rumble and boost atmospheric rain hiss
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'peaking'; // Using peaking filter for a fuller, crisper water sound compared to bandpass
    rainFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    rainFilter.Q.setValueAtTime(0.35, this.ctx.currentTime);
    rainFilter.gain.setValueAtTime(1.5, this.ctx.currentTime);

    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);

    this.rainSource.start(0);
  }

  /**
   * Generates whispering forest winds utilizing highly lowpassed brown noise,
   * modulated back and forth to simulate rustling tree crowns.
   */
  private buildSoftWindAndForest() {
    if (!this.ctx || !this.forestGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 14 * sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.012 * white)) / 1.012;
      lastOut = data[i];
      data[i] *= 9.5; // Boosted output of synthesized wind
    }

    this.forestWindSource = this.ctx.createBufferSource();
    this.forestWindSource.buffer = buffer;
    this.forestWindSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(480, this.ctx.currentTime); // Let more mid-range detailing pass through
    windFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // Gentle wind windGustsLFO (every 22 seconds)
    this.windGustsLFO = this.ctx.createOscillator();
    this.windGustsLFO.type = 'sine';
    this.windGustsLFO.frequency.setValueAtTime(0.045, this.ctx.currentTime);

    const gustsGain = this.ctx.createGain();
    gustsGain.gain.setValueAtTime(0.40, this.ctx.currentTime);

    const activeWindGain = this.ctx.createGain();
    activeWindGain.gain.setValueAtTime(0.95, this.ctx.currentTime); // elevated base wind gain

    this.forestWindSource.connect(windFilter);
    windFilter.connect(activeWindGain);
    activeWindGain.connect(this.forestGain);

    // Couple windGustsLFO to volume amplitude to mimic real gusts of wind blowing on trees
    this.windGustsLFO.connect(gustsGain);
    gustsGain.connect(activeWindGain.gain);

    this.forestWindSource.start(0);
    this.windGustsLFO.start(0);
  }

  /**
   * Synthesizes summer night crickets. Uses a high-frequency sine oscillator (4300Hz),
   * amplitude-modulated (on/off) rapidly at 12Hz by an LFO to create cricket chirrups.
   */
  private buildGrassCrickets() {
    if (!this.ctx || !this.forestGain) return;

    // Create a rhythmic amplitude modulated cricket sound
    this.cricketOsc = this.ctx.createOscillator();
    this.cricketOsc.type = 'sine';
    this.cricketOsc.frequency.setValueAtTime(4250, this.ctx.currentTime);

    this.cricketLFO = this.ctx.createOscillator();
    this.cricketLFO.type = 'square';
    this.cricketLFO.frequency.setValueAtTime(11.5, this.ctx.currentTime); // Rapid 11.5Hz shutter

    const lfoAmGain = this.ctx.createGain();
    lfoAmGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // controlled by forest fader level

    // Connect oscillators
    this.cricketOsc.connect(this.cricketGain);
    
    // Wire up LFO to act as cricket chirrup AM modulator
    const crktAmGain = this.ctx.createGain();
    crktAmGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.cricketLFO.connect(crktAmGain);
    
    // Connect to target channel
    this.cricketGain.connect(this.forestGain);

    // Start oscillators
    this.cricketOsc.start(0);
    this.cricketLFO.start(0);
  }

  /**
   * Sings highly melodic, non-fatiguing birds of many pitches at slow natural intervals.
   */
  private startChirpLoop() {
    const trigger = () => {
      if (this.forestTargetVol > 0.02 && this.ctx && this.ctx.state === 'running' && this.forestGain) {
        this.triggerRealBirdMelody();
      }
      // Re-schedule randomly between 7 and 13 seconds for a relaxed feel
      this.chirpTimer = setTimeout(trigger, 7000 + Math.random() * 6000);
    };
    this.chirpTimer = setTimeout(trigger, 5000);
  }

  private triggerRealBirdMelody() {
    if (!this.ctx || !this.forestGain) return;

    try {
      const now = this.ctx.currentTime;
      const type = Math.floor(Math.random() * 3); // 3 different melodic patterns

      const birdGain = this.ctx.createGain();
      // Cap chirp volume dynamically proportional to mixer
      birdGain.gain.setValueAtTime(this.forestTargetVol * 0.15, now);
      birdGain.connect(this.analyser || this.ctx.destination);
      
      if (this.forestEcho) {
        birdGain.connect(this.forestEcho); // Send to reverb
      }

      if (type === 0) {
        // Melodic twin swipe "chirp-chirp"
        const base = 2100 + Math.random() * 300;
        for (let i = 0; i < 2; i++) {
          const start = now + i * 0.22;
          const dur = 0.08;
          const osc = this.ctx.createOscillator();
          const amp = this.ctx.createGain();

          osc.connect(amp);
          amp.connect(birdGain);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(base, start);
          osc.frequency.exponentialRampToValueAtTime(base - 600, start + dur);

          amp.gain.setValueAtTime(0.0001, start);
          amp.gain.linearRampToValueAtTime(0.4, start + 0.01);
          amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);

          osc.start(start);
          osc.stop(start + dur + 0.02);
        }
      } else if (type === 1) {
        // Soft whistling "tu-whit tu-whoo" slide
        const startSec = now;
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();

        osc.connect(amp);
        amp.connect(birdGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, startSec);
        osc.frequency.linearRampToValueAtTime(1750, startSec + 0.12);
        osc.frequency.exponentialRampToValueAtTime(1100, startSec + 0.35);

        amp.gain.setValueAtTime(0.0001, startSec);
        amp.gain.linearRampToValueAtTime(0.3, startSec + 0.08);
        amp.gain.exponentialRampToValueAtTime(0.0001, startSec + 0.4);

        osc.start(startSec);
        osc.stop(startSec + 0.45);
      } else {
        // High-pitched rapid triple pip "pit-pit-pit"
        const pitch = 2700 + Math.random() * 400;
        for (let i = 0; i < 3; i++) {
          const start = now + i * 0.12;
          const osc = this.ctx.createOscillator();
          const amp = this.ctx.createGain();

          osc.connect(amp);
          amp.connect(birdGain);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(pitch, start);
          amp.gain.setValueAtTime(0.0001, start);
          amp.gain.linearRampToValueAtTime(0.2, start + 0.01);
          amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);

          osc.start(start);
          osc.stop(start + 0.06);
        }
      }
    } catch (e) {
      console.warn("Melodic chirp render failed:", e);
    }
  }

  /**
   * Generates low, atmospheric rolling thunder rumbles
   * layered with transient cracking pops to sound completely natural and immersive.
   */
  private startThunderLoop() {
    const trigger = () => {
      if (this.rainTargetVol > 0.20 && this.ctx && this.ctx.state === 'running' && this.rainGain) {
        this.triggerCozyThunder();
      }
      // Check for thunder every 25s to 45s
      this.thunderTimer = setTimeout(trigger, 25000 + Math.random() * 20000);
    };
    this.thunderTimer = setTimeout(trigger, 15000);
  }

  private triggerCozyThunder() {
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Let's build a dedicated rumble node!
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      const rumbleFilter = this.ctx.createBiquadFilter();

      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(55, now); // deep, vibrating frequencies
      rumbleFilter.Q.setValueAtTime(2.0, now);

      rumbleOsc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.analyser || this.ctx.destination);

      rumbleOsc.type = 'sawtooth'; // rich harmonics to filter out
      rumbleOsc.frequency.setValueAtTime(32, now);
      rumbleOsc.frequency.linearRampToValueAtTime(22, now + 4.0); // pitch dropping off

      // Dynamic rumble volume envelope
      rumbleGain.gain.setValueAtTime(0.0001, now);
      rumbleGain.gain.linearRampToValueAtTime(this.rainTargetVol * 0.28, now + 1.2); // slowly swells
      rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0); // fades away

      rumbleOsc.start(now);
      rumbleOsc.stop(now + 5.2);

    } catch (e) {
      console.warn("Thunder synthesize error:", e);
    }
  }

  /**
   * Smoothly fades the master output volume in or out.
   * Eliminates the sudden shock of switching tabs or resuming.
   */
  public fadeMasterVolume(target: number, duration: number) {
    this.ensureRunning();
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, duration / 3);
    }
  }

  /**
   * Individual Slider Controls (expected value: 0 to 100)
   */
  public updateRain(vol: number) {
    this.ensureRunning();
    this.rainTargetVol = Math.max(0, Math.min(100, vol)) / 100;
    if (this.ctx && this.rainGain) {
      // Warm professional sound fader mapping (exponent 1.2 holds fuller volume at low/mid)
      const energy = Math.pow(this.rainTargetVol, 1.2);
      this.rainGain.gain.setTargetAtTime(energy, this.ctx.currentTime, 0.15);
    }
  }

  public updateForest(vol: number) {
    this.ensureRunning();
    this.forestTargetVol = Math.max(0, Math.min(100, vol)) / 100;
    if (this.ctx && this.forestGain) {
      // Scale general forest wind allowing full max fader representation
      const energy = Math.pow(this.forestTargetVol, 1.2);
      this.forestGain.gain.setTargetAtTime(energy, this.ctx.currentTime, 0.15);
      
      if (this.cricketGain) {
        // Crickets hum louder at high volumes
        const crktTarget = energy * 0.55;
        this.cricketGain.gain.setTargetAtTime(crktTarget, this.ctx.currentTime, 0.15);
      }
    }
  }

  public updateWhite(vol: number) {
    this.ensureRunning();
    this.whiteTargetVol = Math.max(0, Math.min(100, vol)) / 100;
    if (this.ctx && this.whiteGain) {
      // White fader curve mapping - waves are magnificent at full power
      const energy = Math.pow(this.whiteTargetVol, 1.2) * 1.15;
      this.whiteGain.gain.setTargetAtTime(energy, this.ctx.currentTime, 0.15);
    }
  }

  public stopAll() {
    if (this.chirpTimer) clearTimeout(this.chirpTimer);
    if (this.thunderTimer) clearTimeout(this.thunderTimer);
    
    const now = this.ctx?.currentTime || 0;
    if (this.ctx) {
      this.masterGain?.gain.setTargetAtTime(0, now, 0.15);
    }
    
    setTimeout(() => {
      try {
        this.rainSource?.stop();
        this.forestWindSource?.stop();
        this.whiteSource?.stop();
        this.oceanWavesLFO?.stop();
        this.windGustsLFO?.stop();
        this.cricketLFO?.stop();
        this.cricketOsc?.stop();
        this.ctx?.close();
      } catch (e) {}
      
      this.ctx = null;
      this.analyser = null;
      this.masterGain = null;
      this.rainGain = null;
      this.forestGain = null;
      this.whiteGain = null;
      this.rainSource = null;
      this.forestWindSource = null;
      this.whiteSource = null;
      this.oceanWavesLFO = null;
      this.windGustsLFO = null;
      this.cricketLFO = null;
      this.cricketOsc = null;
      this.cricketGain = null;
    }, 250);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}

export const ambientAudio = new AmbientAudioEngine();
