import React, { useEffect, useRef } from 'react';

interface LiveBarVisualizerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  color?: string;
}

const LiveBarVisualizer: React.FC<LiveBarVisualizerProps> = ({ 
  audioContext, 
  sourceNode, 
  color = '#6366f1' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!audioContext || !sourceNode || !canvasRef.current) return;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64; // Low count for chunky bars
    analyser.smoothingTimeConstant = 0.5;
    
    // Connect source to analyser
    // Note: In a real graph, we might need a splitter if the source is already connected elsewhere,
    // but typically we can fan-out connections in WebAudio.
    try {
        sourceNode.connect(analyser);
    } catch (e) {
        // Already connected or invalid state
    }
    
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!ctx) return;
      rafRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Chatterbox style: Bars centered vertically
      const barWidth = (width / bufferLength) * 0.8;
      const gap = (width / bufferLength) * 0.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Mirror the visualization for symmetry
        const index = i < bufferLength / 2 ? i : bufferLength - 1 - i;
        const value = dataArray[index]; // 0 - 255
        
        const percent = value / 255;
        const barHeight = Math.max(4, height * percent * 0.8); // Scale height
        
        const y = (height - barHeight) / 2;

        ctx.fillStyle = color;
        
        // Rounded caps logic
        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();

        x += barWidth + gap;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Don't disconnect sourceNode here as it might break the audio chain for the main output
      // purely visual disconnection is fine.
    };
  }, [audioContext, sourceNode, color]);

  return (
    <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className="w-full h-full max-w-[300px] max-h-[100px]"
    />
  );
};

export default LiveBarVisualizer;
