import React, { useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AudioVisualizerProps {
  isListening: boolean;
  isMatched: boolean;
  errorMessage?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  isMatched,
  errorMessage,
}) => {
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10]);

  // Infinite wave heartbeat when listening
  useEffect(() => {
    if (!isListening) {
      setWaveHeights([4, 4, 4, 4, 4, 4, 4, 4]);
      return;
    }

    const interval = setInterval(() => {
      setWaveHeights(prev =>
        prev.map(() => {
          // Speak / noise spike simulation or standard rhythmic bounce
          const min = isMatched ? 15 : 6;
          const max = isMatched ? 40 : 25;
          return Math.floor(Math.random() * (max - min + 1) + min);
        })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [isListening, isMatched]);

  return (
    <div
      className={`border-2 rounded-3xl p-5 flex flex-col items-center justify-between transition-all shadow-sm ${
        isMatched
          ? 'bg-emerald-50 border-emerald-300 shadow-emerald-100'
          : isListening
          ? 'bg-sky-50 border-sky-300 shadow-sky-100/50'
          : 'bg-white border-slate-100'
      }`}
      id="equalizer-vocal-microphone"
    >
      <div className="flex items-center gap-4 w-full">
        {/* Pulsing micro indicator with absolute ping animation */}
        <div className="relative flex items-center justify-center">
          {isListening && (
            <div className="absolute inset-0 bg-sky-400/20 rounded-full animate-ping" />
          )}
          <div
            className={`p-3 rounded-full z-10 transition-all border-2 ${
              isMatched
                ? 'bg-emerald-100 border-emerald-400 text-emerald-600'
                : isListening
                ? 'bg-sky-100 border-sky-400 text-sky-600 shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {isListening ? (
              <Mic className="w-5 h-5 stroke-[2.5]" id="mic-indicator-active" />
            ) : (
              <MicOff className="w-5 h-5 stroke-[2.5]" id="mic-indicator-inactive" />
            )}
          </div>
        </div>

        {/* Waves or error messages */}
        <div className="flex-1">
          {errorMessage ? (
            <p className="text-xs text-rose-600 font-bold leading-relaxed">
              Error: {errorMessage}
            </p>
          ) : (
            <div className="flex flex-col">
              <span className={`text-xs font-black uppercase tracking-widest ${isMatched ? 'text-emerald-600' : isListening ? 'text-sky-600 animate-pulse' : 'text-slate-400'}`}>
                {isMatched ? 'GREAT SPEAKING!' : isListening ? 'LISTENING NOW...' : 'MICROPHONE OFF'}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight font-bold mt-0.5">
                {isMatched
                  ? 'Perfect! The car swerved smoothly to the target lane!'
                  : isListening
                  ? 'Speak the target English word aloud to drive!'
                  : 'Click Start in the menu to turn on the microphone.'}
              </span>
            </div>
          )}
        </div>

        {/* Bouncing audio wavelengths with vibrant theme colors */}
        <div className="flex items-center gap-1 h-8 px-2">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isMatched
                  ? 'bg-emerald-400/90'
                  : isListening
                  ? i % 2 === 0 
                    ? 'bg-sky-450' 
                    : 'bg-pink-400'
                  : 'bg-slate-200'
              }`}
              style={{
                height: `${h}px`,
                transform: `scaleY(${isListening ? 1.0 : 0.4})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
