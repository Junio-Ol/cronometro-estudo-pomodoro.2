import { useEffect, useRef } from 'react';
import { ambientAudio } from '../ambientAudio';

// Theme-specific color palettes for a highly integrated look
const themeColors: Record<string, {
  wave1: { start: string; mid: string; end: string };
  wave2: { start: string; mid: string; end: string };
  wave3: { start: string; mid: string; end: string };
}> = {
  violet: {
    wave1: { start: '#6c63ff', mid: '#0ea5e9', end: '#06b6d4' }, // violet - blue - cyan
    wave2: { start: '#8b5cf6', mid: '#ec4899', end: '#a78bfa' }, // purple - pink - violet
    wave3: { start: '#3b82f6', mid: '#a78bfa', end: '#22d3ee' }  // blue - purple - lightcyan
  },
  emerald: {
    wave1: { start: '#10b981', mid: '#14b8a6', end: '#a3e635' }, // emerald - teal - lime
    wave2: { start: '#059669', mid: '#10b981', end: '#34d399' }, // deep green - emerald - mint
    wave3: { start: '#84cc16', mid: '#10b981', end: '#06b6d4' }  // lime - emerald - cyan
  },
  ocean: {
    wave1: { start: '#0ea5e9', mid: '#3b82f6', end: '#6366f1' }, // sky blue - cool blue - indigo
    wave2: { start: '#06b6d4', mid: '#0ea5e9', end: '#a78bfa' }, // cyan - sky - lavender
    wave3: { start: '#6366f1', mid: '#0ea5e9', end: '#22d3ee' }  // indigo - sky - light cyan
  },
  amber: {
    wave1: { start: '#f59e0b', mid: '#f97316', end: '#ef4444' }, // amber - orange - red
    wave2: { start: '#d97706', mid: '#f59e0b', end: '#ec4899' }, // dark amber - yellow - pink
    wave3: { start: '#f43f5e', mid: '#fef08a', end: '#ef4444' }  // rose - yellow - red
  }
};

export function AudioVisualizer({ theme = 'violet' }: { theme?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef(theme);

  // Keep the theme ref synchronized dynamically to avoid re-initializing the rendering effect
  themeRef.current = theme;

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set correct display size relative to container
    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth - 24; // offset padding
        canvas.height = 70;
      }
    };
    
    // Initial size
    resizeCanvas();
    
    // Observe sizes with a ResizeObserver for precision
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Phase counters for smooth wave movement over time
    let phase1 = 0;
    let phase2 = 1.5;
    let phase3 = 3.0;

    // Direct local state variables to guarantee high-frequency smooth rendering
    let smoothedLows = 0.08;
    let smoothedMids = 0.06;
    let smoothedHighs = 0.04;

    const renderWaves = () => {
      const analyser = ambientAudio.getAnalyser();
      if (!canvas || !ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Access theme colors dynamically from the ref to ensure uninterrupted flow
      const currentColors = themeColors[themeRef.current] || themeColors.violet;

      // Soft trail background fill instead of instant clearRect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, width, height);

      if (analyser) {
        // Dynamic reading from live Audio API buffer
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Map energy bins (lows, mids, highs) with physical accuracy
        const offsetLows = Math.floor(bufferLength * 0.15); // first 15%
        const offsetMids = Math.floor(bufferLength * 0.45); // middle 30%

        let lowSum = 0;
        let midSum = 0;
        let highSum = 0;

        for (let i = 0; i < offsetLows; i++) {
          lowSum += dataArray[i];
        }
        for (let i = offsetLows; i < offsetMids; i++) {
          midSum += dataArray[i];
        }
        for (let i = offsetMids; i < bufferLength; i++) {
          highSum += dataArray[i];
        }

        const rawLows = lowSum / (offsetLows || 1) / 255;
        const rawMids = midSum / ((offsetMids - offsetLows) || 1) / 255;
        const rawHighs = highSum / ((bufferLength - offsetMids) || 1) / 255;

        // Ultra smooth interpolate transition (optimized for a silky organic glide)
        smoothedLows += (rawLows - smoothedLows) * 0.05;
        smoothedMids += (rawMids - smoothedMids) * 0.05;
        smoothedHighs += (rawHighs - smoothedHighs) * 0.05;
      } else {
        // Smooth ambient idle breathe mode when audio is suspended or offline
        const timeFactor = Date.now() * 0.001;
        const breatheLows = 0.08 + Math.abs(Math.sin(timeFactor)) * 0.06;
        const breatheMids = 0.05 + Math.abs(Math.cos(timeFactor * 1.3)) * 0.04;
        const breatheHighs = 0.03 + Math.abs(Math.sin(timeFactor * 1.7)) * 0.03;

        smoothedLows += (breatheLows - smoothedLows) * 0.02;
        smoothedMids += (breatheMids - smoothedMids) * 0.02;
        smoothedHighs += (breatheHighs - smoothedHighs) * 0.02;
      }

      // Increment phases with meticulously calibrated low speed to guarantee premium fluid motion
      phase1 += 0.008 + smoothedLows * 0.012;  // moves gently in positive direction
      phase2 -= 0.010 + smoothedMids * 0.015;  // moves gently in reverse
      phase3 += 0.012 + smoothedHighs * 0.018; // detail wave flows with premium grace

      // Wave configurations: different bands dictate different wave scales
      // 1. Primary Wave (Bass / Lows)
      const maxAmp1 = height * 0.45;
      const amp1 = Math.max(3, smoothedLows * maxAmp1);
      drawSineWave(ctx, width, centerY, amp1, 0.007, phase1, currentColors.wave1, 2.5, 0.9);

      // 2. Secondary Wave (Mids)
      const maxAmp2 = height * 0.35;
      const amp2 = Math.max(2, smoothedMids * maxAmp2);
      drawSineWave(ctx, width, centerY, amp2, 0.012, phase2, currentColors.wave2, 1.8, 0.65);

      // 3. Tertiary Detail Wave (Treble / Highs)
      const maxAmp3 = height * 0.22;
      const amp3 = Math.max(1, smoothedHighs * maxAmp3);
      drawSineWave(ctx, width, centerY, amp3, 0.022, phase3, currentColors.wave3, 1.0, 0.45);

      animationFrameId = requestAnimationFrame(renderWaves);
    };

    /**
     * Draws a single smooth sinesoid line with tight boundaries at both sides
     * using a beautiful bell-curve windowing function (envelope).
     */
    const drawSineWave = (
      cContext: CanvasRenderingContext2D,
      w: number,
      cY: number,
      amplitude: number,
      frequency: number,
      phase: number,
      colors: { start: string; mid: string; end: string },
      lineWidth: number,
      opacity: number
    ) => {
      cContext.beginPath();

      for (let x = 0; x <= w; x += 1.5) {
        // Bell shape envelope to taper off perfectly at both leftmost and rightmost edges (no sharp endings)
        const percent = x / w;
        const envelope = Math.pow(Math.sin(Math.PI * percent), 1.6);
        
        // Compute standard sine displacement
        const y = cY + Math.sin(x * frequency + phase) * amplitude * envelope;

        if (x === 0) {
          cContext.moveTo(x, y);
        } else {
          cContext.lineTo(x, y);
        }
      }

      // Draw with an elegant linear neon gradient
      const gradient = cContext.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, colors.start);
      gradient.addColorStop(0.5, colors.mid);
      gradient.addColorStop(1, colors.end);

      cContext.strokeStyle = gradient;
      cContext.lineWidth = lineWidth;
      cContext.globalAlpha = opacity;
      cContext.stroke();
      
      // Reset alpha for next calls
      cContext.globalAlpha = 1.0;
    };

    renderWaves();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="w-full bg-[#10101c] border border-[#1c1c32] rounded-2xl p-3 mt-4 text-center">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[9px] font-mono tracking-widest text-[#52526e] uppercase">
          Analisador de Frequência
        </span>
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 rounded-full bg-[#3dffa0] animate-pulse"></span>
          <span className="text-[8px] font-mono text-[#3dfa9f]/80 tracking-tight">WEB AUDIO LIVE</span>
        </div>
      </div>
      <div className="w-full bg-black/40 rounded-xl p-2 flex justify-center items-center overflow-hidden">
        <canvas ref={canvasRef} className="block w-full" style={{ height: '70px' }} />
      </div>
    </div>
  );
}
