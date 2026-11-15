import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { 
  Radio, 
  Sun, 
  Globe2, 
  Layers, 
  Satellite, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw,
  ExternalLink
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { 
    selectedSite, 
    analysisData, 
    currentTimestampIndex, 
    isLoadingAnalysis, 
    fetchAnalysis 
  } = useMissionStore();

  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentSolarPoint = analysisData?.solar?.timeline?.[currentTimestampIndex];
  const currentCommPoint = analysisData?.communication?.timeline?.[currentTimestampIndex];
  const isFallback = analysisData?.provenance?.is_fallback;

  return (
    <header className="h-14 border-b border-cyan-500/20 bg-space-950/90 backdrop-blur-md px-4 flex items-center justify-between z-40 sticky top-0">
      {/* Left: Brand & Telemetry Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-glow-cyan">
            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-slate-100 text-sm">LUNARIS</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v1.0 • NASA SPACE APPS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              LUNAR MISSION INTELLIGENCE & LANDING SITE NAVIGATOR
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 hidden md:block" />

        {/* Active Landing Site Readout */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="text-slate-400">TARGET:</span>
          <span className="font-mono font-medium text-cyan-300 bg-space-900 px-2 py-1 rounded border border-slate-800">
            {selectedSite.name}
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(2)}°N` : `${Math.abs(selectedSite.latitude).toFixed(2)}°S`}
            {", "}
            {selectedSite.longitude.toFixed(2)}°E
          </span>
        </div>
      </div>

      {/* Center: Real-time Telemetry Readouts */}
      <div className="hidden xl:flex items-center space-x-6 text-xs font-mono">
        {/* Sun Telemetry */}
        <div className="flex items-center space-x-2 bg-space-900/80 px-2.5 py-1 rounded border border-slate-800">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">SUN EL:</span>
          <span className={`font-semibold ${currentSolarPoint?.solar_elevation_deg && currentSolarPoint.solar_elevation_deg > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
            {currentSolarPoint ? `${currentSolarPoint.solar_elevation_deg.toFixed(2)}°` : '--'}
          </span>
          {currentSolarPoint && (
            <span className={`text-[9px] px-1 rounded uppercase ${currentSolarPoint.effective_visible ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-slate-800 text-slate-400'}`}>
              {currentSolarPoint.effective_visible ? 'SUNLIT' : 'SHADOW'}
            </span>
          )}
        </div>

        {/* Earth Telemetry */}
        <div className="flex items-center space-x-2 bg-space-900/80 px-2.5 py-1 rounded border border-slate-800">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">EARTH EL:</span>
          <span className={`font-semibold ${currentCommPoint?.earth_elevation_deg && currentCommPoint.earth_elevation_deg > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
            {currentCommPoint ? `${currentCommPoint.earth_elevation_deg.toFixed(2)}°` : '--'}
          </span>
          {currentCommPoint && (
            <span className={`text-[9px] px-1 rounded uppercase ${currentCommPoint.has_line_of_sight ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-red-950 text-red-400 border border-red-800/40'}`}>
              {currentCommPoint.has_line_of_sight ? 'LOS OK' : 'BLACKOUT'}
            </span>
          )}
        </div>

        {/* Data Source / Pipeline Status */}
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${isFallback ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="text-slate-400">EPHEMERIS:</span>
          <span className={isFallback ? 'text-amber-400' : 'text-emerald-400'}>
            {isFallback ? 'IAU ANALYTICAL' : 'JPL HORIZONS'}
          </span>
        </div>
      </div>

      {/* Right: Live UTC Clock & Refresh */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="font-mono bg-space-900 px-3 py-1 rounded border border-cyan-500/20 text-cyan-200 tracking-wider flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>{utcTime || 'SYNCHRONIZING UTC...'}</span>
        </div>

        <button
          onClick={() => fetchAnalysis()}
          disabled={isLoadingAnalysis}
          title="Refresh Ephemeris & Telemetry"
          className="p-1.5 rounded bg-space-900 hover:bg-space-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition"
        >
          <RotateCw className={`w-4 h-4 ${isLoadingAnalysis ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
