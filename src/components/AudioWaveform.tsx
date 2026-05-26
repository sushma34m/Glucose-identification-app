import React from 'react';
import { motion } from 'motion/react';

interface AudioWaveformProps {
  isPlaying: boolean;
  type: 'synth' | 'mic';
}

export default function AudioWaveform({ isPlaying, type }: AudioWaveformProps) {
  const bars = Array.from({ length: 15 });
  const baseColor = type === 'synth' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div id="audio-waveform-container" className="flex items-center justify-center gap-[4px] h-10 w-full px-4 bg-slate-900/5 dark:bg-slate-100/5 rounded-full mt-2">
      <span className="text-xs font-mono text-slate-500 mr-2 flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse' : ''} ${baseColor}`} />
        {type === 'synth' ? 'AI Voice Out' : 'Listening...'}
      </span>
      <div className="flex items-center gap-[3px] h-6">
        {bars.map((_, i) => (
          <motion.div
            key={i}
            className={`w-[3px] rounded-full ${baseColor}`}
            initial={{ height: i === 7 ? 14 : 4 }}
            animate={
              isPlaying
                ? {
                    height: [
                      Math.max(4, Math.sin(i * 0.5) * 24),
                      Math.max(4, Math.cos(i * 0.8) * 20),
                      Math.max(4, Math.random() * 24),
                      Math.max(4, Math.sin(i * 0.5) * 24),
                    ],
                  }
                : { height: 4 }
            }
            transition={{
              repeat: Infinity,
              duration: 1 + (i % 3) * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
