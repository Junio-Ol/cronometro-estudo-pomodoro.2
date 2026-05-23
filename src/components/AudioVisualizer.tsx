import { useEffect, useRef } from 'react';
import { ambientAudio } from '../ambientAudio';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const checkAndDraw = () => {
      const analyser = ambientAudio.getAnalyser();
      if (!canvas) return;
      
      if (!analyser) {
        // Draw subtle idle lines
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        
        // elegant sine-wave like idle line
        const time = Date.now() * 0.003;
        for (let ix = 0; ix < canvas.width; ix++) {
          const iy = canvas.height / 2 + Math.sin(ix * 0.05 + time) * 3;
          ctx.lineTo(ix, iy);
        }
        ctx.strokeStyle = '#1c1c32';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#52526e';
        ctx.font = '9px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AGUARDANDO AUDIO...', canvas.width / 2, canvas.height / 2 + 18);

        animationFrameId = requestAnimationFrame(checkAndDraw);
        return;
      }

      // Analyser is active! Get standard frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // We only visualize up to about 80% of frequencies to ignore high pitch noise
      const activeBins = Math.floor(bufferLength * 0.7);
      const barWidth = canvas.width / activeBins;
      let barHeight;
      let x = 0;

      // Create highly polished theme-specific linear gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#6c63ff'); // Accent violet
      gradient.addColorStop(0.5, '#50e3c2'); // Cool teal
      gradient.addColorStop(1, '#3dffa0'); // Neon green

      for (let i = 0; i < activeBins; i++) {
        barHeight = dataArray[i];

        // scale frequency values into canvas size
        const scaledHeight = (barHeight / 255) * canvas.height * 0.85;

        ctx.fillStyle = gradient;
        
        // Draw rounded bars (curved corner bars for top)
        ctx.beginPath();
        const drawX = x;
        const drawY = canvas.height - Math.max(2, scaledHeight);
        const drawW = Math.max(1, barWidth - 1.5);
        const drawH = Math.max(2, scaledHeight);
        
        if (ctx.roundRect) {
          ctx.roundRect(drawX, drawY, drawW, drawH, [1, 1, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(drawX, drawY, drawW, drawH);
        }

        x += barWidth;
      }

      // Continuous frequency line tracker overlay
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < activeBins; i++) {
        barHeight = dataArray[i];
        const scaledHeight = (barHeight / 255) * canvas.height * 0.85;
        const y = canvas.height - Math.max(2, scaledHeight);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += barWidth;
      }
      ctx.strokeStyle = 'rgba(61, 255, 160, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(checkAndDraw);
    };

    checkAndDraw();

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
      <div className="w-full bg-black/40 rounded-xl p-2 flex justify-center items-center">
        <canvas ref={canvasRef} className="block w-full" style={{ height: '70px' }} />
      </div>
    </div>
  );
}
