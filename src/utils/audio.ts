// Web Audio API sound generator for realistic scanner and action feedback

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Crisp high-pitch beep for successful scan / RFID tap
  playSuccessBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio fallback suppressed
    }
  }

  // Melodic two-tone chime for check-in / status update
  playActionChime(type: 'in' | 'out' | 'overdue' | 'error') {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (type === 'in') {
        this.playChord([880, 1174], 0.18, 'sine');
      } else if (type === 'out') {
        this.playChord([987, 784], 0.2, 'sine');
      } else if (type === 'overdue') {
        this.playChord([440, 370], 0.35, 'triangle');
      } else {
        this.playChord([300, 250], 0.3, 'sawtooth');
      }
    } catch {
      // ignore
    }
  }

  private playChord(freqs: number[], duration: number, type: OscillatorType = 'sine') {
    const ctx = this.getContext();
    if (!ctx) return;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.06);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + duration);
    });
  }
}

export const sounds = new SoundEffects();
