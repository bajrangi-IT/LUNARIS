import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../stores/missionStore';
import { api } from '../services/api';
import { LandingSite } from '../types';
import { RealMoonGlobe3D } from '../components/observatory/RealMoonGlobe3D';
import { CelestialSphere3D } from '../components/observatory/CelestialSphere3D';
import { PanoramicHorizonChart } from '../components/observatory/PanoramicHorizonChart';
import { TimelineController } from '../components/common/TimelineController';
import { 
  Eye, 
  Sun, 
  Globe2, 
  Clock, 
  Compass, 
  ShieldCheck, 
  Layers,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';

export const ObservatoryPage: React.FC = () => {
  const { 
    selectedSite, 
    analysisData, 
    currentTimestampIndex,
    setSelectedSite 
  } = useMissionStore();

  const [sites, setSites] = useState<LandingSite[]>([]);
  const [viewMode, setViewMode] = useState<'globe' | 'horizon'>('globe');

  useEffect(() => {
    api.getSites()
      .then((data) => setSites(data))
      .catch((err) => console.error("Failed to load sites:", err));
  }, []);

  const curSolar = analysisData?.solar?.timeline?.[currentTimestampIndex];
  const curComm = analysisData?.communication?.timeline?.[currentTimestampIndex];
  const solarTimeline = analysisData?.solar?.timeline || [];
  const commTimeline = analysisData?.communication?.timeline || [];

  // Calculate Next Sunrise / Sunset event
  let nextSolarEvent = { type: 'Sunset', time: 'None in window', hoursRemaining: 0 };
  if (curSolar && solarTimeline.length > 0) {
    const isCurrentlyVisible = curSolar.effective_visible;
    const targetType = !isCurrentlyVisible;
    for (let i = currentTimestampIndex + 1; i < solarTimeline.length; i++) {
      if (solarTimeline[i].effective_visible === targetType) {
        nextSolarEvent = {
          type: targetType ? 'Sunrise' : 'Sunset',
          time: solarTimeline[i].timestamp_utc,
          hoursRemaining: (i - currentTimestampIndex) * 0.5
        };
        break;
      }
    }
  }

  // Calculate Next Earthrise / Earthset event
  let nextEarthEvent = { type: 'Earthset', time: 'Continuous LOS', hoursRemaining: 0 };
  if (curComm && commTimeline.length > 0) {
    const isCurrentlyLOS = curComm.has_line_of_sight;
    const targetType = !isCurrentlyLOS;
    for (let i = currentTimestampIndex + 1; i < commTimeline.length; i++) {
      if (commTimeline[i].has_line_of_sight === targetType) {
        nextEarthEvent = {
          type: targetType ? 'Earthrise' : 'Earthset',
          time: commTimeline[i].timestamp_utc,
          hoursRemaining: (i - currentTimestampIndex) * 0.5
        };
        break;
      }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
            <Eye className="w-4 h-4" />
            <span>Lunar Surface Astronomical Observatory</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            Sun & Earth Celestial Horizon Observatory
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-space-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setViewMode('globe')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewMode === 'globe'
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D Moon Globe & Craters</span>
          </button>

          <button
            onClick={() => setViewMode('horizon')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              viewMode === 'horizon'
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Surface Sky Viewport</span>
          </button>
        </div>
      </div>

      {/* Synchronized Global Timeline Scrubber */}
      <TimelineController />

      {/* 3D Viewport (Globe or Ground Sky) */}
      {viewMode === 'globe' ? (
        <RealMoonGlobe3D sites={sites} onSelectSite={(s) => setSelectedSite(s)} />
      ) : (
        <CelestialSphere3D />
      )}

      {/* Next Astronomical Events Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-mono text-xs">
        {/* Next Sunrise/Sunset */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-space-950/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="uppercase tracking-wider">Next Solar Event</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">
            {nextSolarEvent.type}
          </div>
          <div className="text-slate-300 text-xs mt-1">
            {nextSolarEvent.time}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Remaining: <span className="text-amber-300 font-bold">{nextSolarEvent.hoursRemaining > 0 ? `~${nextSolarEvent.hoursRemaining}h` : 'N/A'}</span>
          </div>
        </div>

        {/* Next Earthrise/Earthset */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-space-950/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="uppercase tracking-wider">Next Earth Event</span>
            <Globe2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300">
            {nextEarthEvent.type}
          </div>
          <div className="text-slate-300 text-xs mt-1">
            {nextEarthEvent.time}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Remaining: <span className="text-cyan-300 font-bold">{nextEarthEvent.hoursRemaining > 0 ? `~${nextEarthEvent.hoursRemaining}h` : 'N/A'}</span>
          </div>
        </div>

        {/* Solar Clearance */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-space-950/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="uppercase tracking-wider">Sun Clearance</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">
            {curSolar?.terrain_clearance_deg ? `${curSolar.terrain_clearance_deg.toFixed(2)}°` : '--'}
          </div>
          <div className="text-slate-400 text-xs mt-1">
            Above local terrain mask
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Status:{' '}
            <span className={curSolar?.effective_visible ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {curSolar?.effective_visible ? 'SUNLIT' : 'SHADOW'}
            </span>
          </div>
        </div>

        {/* Earth Clearance */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-space-950/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="uppercase tracking-wider">Earth Clearance</span>
            <Globe2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400">
            {curComm?.terrain_clearance_deg ? `${curComm.terrain_clearance_deg.toFixed(2)}°` : '--'}
          </div>
          <div className="text-slate-400 text-xs mt-1">
            Above local terrain mask
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Link:{' '}
            <span className={curComm?.has_line_of_sight ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {curComm?.has_line_of_sight ? 'DIRECT LOS OK' : 'OCCULTED'}
            </span>
          </div>
        </div>
      </div>

      {/* 2D Panoramic Cylindrical Projection Chart */}
      <PanoramicHorizonChart />
    </div>
  );
};
