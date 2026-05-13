import React, { useEffect, useRef, useState, useMemo } from 'react';

interface WaveformDisplayProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number; // 0 to duration
  onSeek: (time: number) => void;
  zoom: number; // New zoom prop
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  audioBuffer,
  isPlaying,
  currentTime,
  onSeek,
  zoom
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Constants for Chatterbox styling
  const BASE_BAR_WIDTH = 4;
  const BAR_GAP = 2;
  const BAR_RADIUS = 2;
  const PLAYED_COLOR = '#6366f1'; // Indigo 500
  const UNPLAYED_COLOR = '#334155'; // Slate 700
  const HOVER_COLOR = '#818cf8'; // Indigo 400
  const BG_COLOR = '#0f172a'; // Slate 900
  const RULER_HEIGHT = 24;
  const RULER_COLOR = '#475569'; // Slate 600
  const TEXT_COLOR = '#94a3b8'; // Slate 400

  // Optimize data processing
  const waveformData = useMemo(() => {
    if (!audioBuffer) return null;
    return audioBuffer.getChannelData(0);
  }, [audioBuffer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      // Calculate logical width based on zoom
      const containerWidth = container.clientWidth;
      const zoomedWidth = containerWidth * zoom;

      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = zoomedWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      
      canvas.style.width = `${zoomedWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      
      draw(zoomedWidth, container.clientHeight);
    };

    // Resize observer for container
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);
    
    // Initial call
    resizeCanvas();

    return () => resizeObserver.disconnect();
  }, [audioBuffer, currentTime, hoverTime, zoom]);

  const draw = (width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) {
       // Draw empty state logic similar to before, but simplified for brevity
       if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = BG_COLOR;
                ctx.fillRect(0, 0, width, height);
                // Grid lines
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for(let i=0; i<width; i+=100) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
                ctx.stroke();
                
                // Centered Text
                if (width < 5000) { // Only draw text if not insanely zoomed/huge
                    ctx.font = '500 14px Inter';
                    ctx.fillStyle = '#475569';
                    ctx.textAlign = 'center';
                    // We need to find the visible center if scrolled, but here we just center in canvas
                    // For empty state zoom is usually 1, so this is fine.
                    ctx.fillText("Ready to synthesize", width / 2, height / 2 + 10);
                }
            }
       }
       return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const graphHeight = height - RULER_HEIGHT;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Draw Ruler
    drawRuler(ctx, width, RULER_HEIGHT, audioBuffer.duration);

    // Process Waveform Data for Visuals
    const data = audioBuffer.getChannelData(0);
    const totalBarWidth = BASE_BAR_WIDTH + BAR_GAP;
    const numBars = Math.floor(width / totalBarWidth);
    const step = Math.floor(data.length / numBars);

    for (let i = 0; i < numBars; i++) {
        let max = 0;
        // Optimization: Don't scan everything if step is huge
        const searchStep = Math.max(1, Math.floor(step / 10)); 
        for (let j = 0; j < step; j += searchStep) {
            const val = Math.abs(data[(i * step) + j]);
            if (val > max) max = val;
        }

        const barHeight = Math.max(2, max * (graphHeight * 0.9)); // 90% height max
        const x = i * totalBarWidth;
        const y = RULER_HEIGHT + (graphHeight - barHeight) / 2;

        const timeStart = (i / numBars) * audioBuffer.duration;
        const timeEnd = ((i + 1) / numBars) * audioBuffer.duration;
        
        let color = UNPLAYED_COLOR;
        if (timeStart < currentTime) color = PLAYED_COLOR;
        if (hoverTime !== null && timeStart <= hoverTime && hoverTime < timeEnd) color = HOVER_COLOR;

        ctx.fillStyle = color;
        ctx.beginPath();
        roundRect(ctx, x, y, BASE_BAR_WIDTH, barHeight, BAR_RADIUS);
        ctx.fill();
    }

    // Draw Playhead
    const playheadX = (currentTime / audioBuffer.duration) * width;
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Playhead Knob
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, RULER_HEIGHT);
    ctx.lineTo(playheadX + 6, RULER_HEIGHT);
    ctx.lineTo(playheadX, RULER_HEIGHT + 8);
    ctx.fill();
  };

  const drawRuler = (ctx: CanvasRenderingContext2D, width: number, height: number, duration: number) => {
    ctx.fillStyle = '#0f172a'; // Match BG for seamless look
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';

    // Dynamic interval based on zoom
    const pxPerSec = width / duration;
    let tickInterval = 1;
    if (pxPerSec < 20) tickInterval = 5;
    if (pxPerSec < 5) tickInterval = 10;
    if (pxPerSec > 100) tickInterval = 0.5;

    for (let t = 0; t <= duration; t += tickInterval) {
        const x = t * pxPerSec;
        
        // Major tick
        ctx.fillRect(x, height - 10, 1, 10);
        
        // Text
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        const ms = Math.floor((t % 1) * 10);
        
        let timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        if (tickInterval < 1) timeStr += `.${ms}`;

        if (x < width - 20) {
            ctx.fillText(timeStr, x + 4, height - 3);
        }

        // Minor ticks
        if (pxPerSec > 50) { 
             const halfX = (t + tickInterval/2) * pxPerSec;
             if (halfX < width) ctx.fillRect(halfX, height - 5, 1, 5);
        }
    }
    
    // Bottom border
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, height - 1, width, 1);
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const time = ratio * audioBuffer.duration;
    onSeek(time);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setHoverTime(ratio * audioBuffer.duration);
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[160px] bg-slate-900 overflow-hidden relative group rounded-lg">
      <div 
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden custom-scrollbar relative"
      >
          <canvas
            ref={canvasRef}
            className="block cursor-pointer"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverTime(null)}
          />
      </div>
      
      {/* Floating Tooltip */}
      {hoverTime !== null && audioBuffer && (
          <div 
            className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-xs text-white px-2 py-1 rounded shadow-lg border border-slate-600 pointer-events-none z-10"
          >
            {hoverTime.toFixed(2)}s
          </div>
      )}
    </div>
  );
};

export default WaveformDisplay;
