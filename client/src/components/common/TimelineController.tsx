import React, { useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Calendar,
  FastForward,
  ChevronRight
} from 'lucide-react';

export const TimelineController: React.FC = () => {
  const {
    analysisData,
    currentTimestampIndex,
    setCurrentTimestampIndex,
    stepTimeline,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    timeWindow,
    setTimeWindow
  } = useMissionStore();

  const timeline = analysisData?.solar?.timeline || [];
  const maxIdx = Math.max(0, timeline.length - 1);
  const currentRecord = timeline[currentTimestampIndex];

  // Animation playback effect
  useEffect(() => {
    if (!isPlaying || timeline.length === 0) return;

    const intervalTime = Math.max(50, 1000 / playbackSpeed);
    const timer = setInterval(() => {
      const next = (currentTimestampIndex + 1) % timeline.length;
      setCurrentTimestampIndex(next);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, currentTimestampIndex, timeline.length, playbackSpeed, setCurrentTimestampIndex]);

  // Handle Preset Duration selection
  const handleDurationPreset = (hours: number) => {
    // Current start date
    const startStr = timeWindow.start.split(' ')[0] || "2026-11-14";
    const startDate = new Date(`${startStr}T00:00:00Z`);
    const stopDate = new Date(startDate.getTime() + hours * 3600 * 1000);
    
    const fmt = (d: Date) => d.toISOString().substring(0, 16).replace('T', ' ');
    setTimeWindow(fmt(startDate), fmt(stopDate), hours > 72 ? "1h" : "30m");
  };

  return (
    <div className="glass-panel rounded-xl p-3 border border-slate-800 bg-space-950/80 shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Playback Controls & Timestamp Readout */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Step Back */}
          <button
            onClick={() => stepTimeline(-1)}
            disabled={timeline.length === 0}
            className="p-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
            title="Step Previous Timestamp"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={timeline.length === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-glow-cyan'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={() => stepTimeline(1)}
            disabled={timeline.length === 0}
            className="p-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
            title="Step Next Timestamp"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-space-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            {[1, 5, 15, 60].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  playbackSpeed === s ? 'bg-cyan-500 text-space-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Timestamp Display */}
          <div className="font-mono text-xs bg-space-900 px-3 py-1 rounded-lg border border-slate-800 text-cyan-300 flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentRecord?.timestamp_utc || timeWindow.start} UTC</span>
          </div>
        </div>

        {/* Timeline Scrubber Slider */}
        <div className="flex-1 w-full mx-2 flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-500">T0</span>
          <input
            type="range"
            min={0}
            max={maxIdx}
            value={currentTimestampIndex}
            onChange={(e) => setCurrentTimestampIndex(parseInt(e.target.value, 10))}
            disabled={timeline.length === 0}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-slate-500">
            {timeline.length > 0 ? `+${(timeline.length * 0.5).toFixed(0)}h` : '0h'}
          </span>
        </div>

        {/* Preset Duration Buttons */}
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-slate-500 text-[10px] font-mono mr-1 hidden lg:inline">SPAN:</span>
          {[
            { label: '24h', hours: 24 },
            { label: '48h', hours: 48 },
            { label: '7d', hours: 168 },
            { label: '14d', hours: 336 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleDurationPreset(preset.hours)}
              className="px-2 py-1 rounded bg-space-900 hover:bg-space-800 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
