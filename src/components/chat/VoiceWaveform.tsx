import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceWaveformProps {
  duration?: string;
  wavesCount?: number;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  duration = "0:12",
  wavesCount = 28,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Generate static random wave heights
  const waveHeights = useRef(
    Array.from({ length: wavesCount }, () => Math.floor(Math.random() * 16) + 6)
  ).current;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-3 bg-white border border-[#1A2421]/10 rounded-2xl p-3 shadow-sm max-w-[240px] my-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="w-8 h-8 rounded-xl bg-[#0C1412]/5 hover:bg-[#0C1412] hover:text-white text-[#0C1412] transition-all duration-200 flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
      </Button>

      {/* Waveform graphic */}
      <div className="flex items-center gap-[2px] h-8 flex-1 select-none">
        {waveHeights.map((height, index) => {
          const waveProgressPercent = (index / wavesCount) * 100;
          const isPlayed = progress > waveProgressPercent;

          return (
            <div
              key={index}
              style={{ height: `${height * 1.5}px` }}
              className={`w-[3px] rounded-full transition-all duration-300 ${
                isPlayed ? "bg-[#0C1412]" : "bg-[#1A2421]/15"
              }`}
            />
          );
        })}
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-[10px] font-bold text-[#0C1412]">{duration}</span>
        <Volume2 className="w-3 h-3 text-[#1A2421]/45" />
      </div>
    </div>
  );
};
export default VoiceWaveform;
