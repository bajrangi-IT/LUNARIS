import React, { useState } from 'react';
import { RealMoonGlobe3D } from './RealMoonGlobe3D';
import { MoonTrekMap } from '../explorer/MoonTrekMap';
import { LandingSite } from '../../types';
import { useMissionStore } from '../../stores/missionStore';
import { 
  Globe2, 
  Layers, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Compass, 
  MapPin,
  Sparkles
} from 'lucide-react';

interface GlobalLunarExplorerProps {
  sites: LandingSite[];
  onSelectSite?: (site: LandingSite) => void;
  className?: string;
}

export const GlobalLunarExplorer: React.FC<GlobalLunarExplorerProps> = ({
  sites,
  onSelectSite,
  className = ''
}) => {
  const [explorerMode, setExplorerMode] = useState<'globe' | 'tiles'>('globe');
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const { selectedSite, setSelectedSite } = useMissionStore();

  const handleSiteClick = (site: LandingSite) => {
    setSelectedSite(site);
    setFocusTrigger((prev) => prev + 1);
    if (onSelectSite) onSelectSite(site);
  };

  return (
    <div className={`glass-panel rounded-xl border border-slate-800 bg-space-950/90 flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Global Lunar Explorer
            </h4>
          </div>
          <p className="text-xs sm:text-sm font-sans font-medium text-slate-300 mt-0.5">
            Full Moon, smooth rotation, real global imagery.
          </p>
        </div>

        {/* Explorer Layer Mode Switcher */}
        <div className="flex items-center space-x-1.5 bg-space-900 p-1 rounded-xl border border-slate-800 font-mono text-xs shrink-0">
          <button
            onClick={() => setExplorerMode('globe')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center space-x-1.5 transition text-[11px] sm:text-xs ${
              explorerMode === 'globe'
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D Full Globe</span>
          </button>

          <button
            onClick={() => setExplorerMode('tiles')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center space-x-1.5 transition text-[11px] sm:text-xs ${
              explorerMode === 'tiles'
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Moon Trek Tiles</span>
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="relative flex-1 min-h-[320px] h-[340px] sm:h-[380px] lg:h-[400px] w-full bg-space-950 overflow-hidden">
        {explorerMode === 'globe' ? (
          <RealMoonGlobe3D
            sites={sites}
            onSelectSite={handleSiteClick}
            targetFocusTrigger={focusTrigger}
          />
        ) : (
          <MoonTrekMap
            sites={sites}
            onSelectSite={handleSiteClick}
            className="h-full min-h-[320px]"
          />
        )}

        {/* Selected target badge on top of viewport */}
        <div className="absolute top-2.5 left-2.5 bg-space-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 flex items-center space-x-2 pointer-events-none z-10 max-w-[240px] truncate">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold truncate">{selectedSite.name}</span>
          <span className="text-slate-400 text-[10px] shrink-0">
            {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(1)}°N` : `${Math.abs(selectedSite.latitude).toFixed(1)}°S`}
          </span>
        </div>
      </div>

      {/* Explorer Footer with Fast Location Jump */}
      <div className="p-2.5 sm:p-3 bg-space-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 min-w-0">
        <div className="flex items-center space-x-1 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Fly-To:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['Faustini Rim A', 'Shackleton', 'Malapert', 'Mons Mouton', 'Apollo 11'].map((name) => {
            const siteMatch = sites.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
            if (!siteMatch) return null;
            const isCur = selectedSite.id === siteMatch.id;
            return (
              <button
                key={siteMatch.id}
                onClick={() => handleSiteClick(siteMatch)}
                className={`px-2 py-0.5 rounded text-[11px] border transition ${
                  isCur
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-space-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
