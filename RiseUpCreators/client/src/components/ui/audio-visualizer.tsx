import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioUrl?: string;
  height?: number;
  bars?: number;
  className?: string;
}

export default function AudioVisualizer({ 
  isPlaying, 
  audioUrl, 
  height = 40, 
  bars = 20,
  className = "" 
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(bars));

  useEffect(() => {
    if (!audioUrl) return;

    const setupAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        setAudioData(new Uint8Array(bufferLength));
      } catch (error) {
        console.error("Error setting up audio context:", error);
      }
    };

    setupAudioContext();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl]);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bars;
    let x = 0;

    // Draw bars
    for (let i = 0; i < bars; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      gradient.addColorStop(0, "hsl(9, 100%, 58%)"); // ruc-red
      gradient.addColorStop(1, "hsl(9, 100%, 25%)"); // ruc-red-dark
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
      
      x += barWidth;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawVisualizer);
    }
  };

  // Fallback animated bars when no audio analysis is available
  const drawFallbackBars = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bars;
    let x = 0;
    const time = Date.now() * 0.005;

    for (let i = 0; i < bars; i++) {
      const barHeight = (Math.sin(time + i * 0.5) * 0.5 + 0.5) * canvas.height * 0.8;
      
      const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
      gradient.addColorStop(0, "hsl(9, 100%, 58%)");
      gradient.addColorStop(1, "hsl(9, 100%, 25%)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
      
      x += barWidth;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(drawFallbackBars);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      if (analyserRef.current) {
        drawVisualizer();
      } else {
        drawFallbackBars();
      }
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
      data-testid="audio-visualizer"
    />
  );
}
