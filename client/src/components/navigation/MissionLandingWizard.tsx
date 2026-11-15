import React, { useState, useMemo } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { LandingSite } from '../../types';
import { 
  Rocket, 
  CheckCircle2, 
  Compass, 
  MapPin, 
  ArrowRight, 
  Sun, 
  Radio, 
  Mountain, 
  Sparkles,
  Layers,
  ChevronRight,
  Maximize,
  Check,
  ShieldCheck
} from 'lucide-react';

interface WizardProps {
  sites: LandingSite[];
  onNavigateToSite?: (site: LandingSite) => void;
}

export const MissionLandingWizard: React.FC<WizardProps> = ({ sites, onNavigateToSite }) => {
  const { selectedSite, setSelectedSite } = useMissionStore();

  // Wizard Question States
  const [spaceNeeded, setSpaceNeeded] = useState<'any' | 'compact' | 'medium' | 'large'>('large');
  const [scienceGoal, setScienceGoal] = useState<'any' | 'water_ice' | 'solar_power' | 'comm' | 'geology'>('water_ice');
  const [regionFilter, setRegionFilter] = useState<'any' | 'south_pole' | 'nearside' | 'farside'>('south_pole');

  // Dynamic Matching & Scoring Algorithm
  const scoredSites = useMemo(() => {
    return sites.map((site) => {
      let score = 50; // Base score

      // 1. Space & Footprint Match (Max 25 pts)
      if (spaceNeeded === 'large') {
        if (site.flat_area_rating === 'large') score += 25;
        else if (site.flat_area_rating === 'medium') score += 12;
        else score -= 15; // Unsafe for heavy lander
      } else if (spaceNeeded === 'medium') {
        if (site.flat_area_rating === 'medium' || site.flat_area_rating === 'large') score += 25;
        else score += 10;
      } else if (spaceNeeded === 'compact') {
        score += 25; // Compact landers can land anywhere
      } else {
        score += 20;
      }

      // Slope safety check for lander size
      if (site.slope_deg) {
        if (spaceNeeded === 'large' && site.slope_deg > 10.0) score -= 20;
        if (site.slope_deg <= 7.0) score += 10;
      }

      // 2. Science & Priority Match (Max 30 pts)
      if (scienceGoal === 'water_ice') {
        if (site.science_target === 'water_ice' || site.type === 'permanently_shadowed_region') score += 30;
        else if (site.region === 'South Pole') score += 18;
      } else if (scienceGoal === 'solar_power') {
        if (site.illumination_category === 'high' || site.science_target === 'solar_power') score += 30;
        else if (site.type === 'south_pole_candidate') score += 15;
      } else if (scienceGoal === 'comm') {
        if (site.comm_category === 'continuous_los') score += 30;
        else if (site.comm_category === 'relay_required') score -= 30;
      } else if (scienceGoal === 'geology') {
        if (site.science_target === 'geology' || site.type === 'crater') score += 30;
      } else {
        score += 15;
      }

      // 3. Region Match (Max 20 pts)
      if (regionFilter === 'south_pole') {
        if (site.latitude <= -80.0) score += 20;
        else score -= 25;
      } else if (regionFilter === 'nearside') {
        if (site.latitude > -80.0 && site.comm_category !== 'relay_required') score += 20;
        else score -= 20;
      } else if (regionFilter === 'farside') {
        if (site.comm_category === 'relay_required' || site.region.includes('Farside')) score += 20;
        else score -= 25;
      } else {
        score += 15;
      }

      // Clamp between 45% and 99%
      const matchPct = Math.max(45, Math.min(99, score));

      return {
        site,
        matchPct,
      };
    }).sort((a, b) => b.matchPct - a.matchPct);
  }, [sites, spaceNeeded, scienceGoal, regionFilter]);

  const topRecommendations = scoredSites.slice(0, 4);

  const handleEngageNavigation = (site: LandingSite) => {
    setSelectedSite(site);
    if (onNavigateToSite) {
      onNavigateToSite(site);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 bg-space-950/90 shadow-2xl space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono uppercase font-bold tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Automated Mission Site Decision Assistant</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            Where should your mission touch down?
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Answer 3 quick mission parameters to evaluate safe landing ellipses, lighting, and communication across all major lunar craters.
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-space-900 px-3 py-1.5 rounded-lg border border-cyan-500/20">
          Evaluated Sites: <span className="font-bold text-cyan-400">{sites.length} Major Craters</span>
        </div>
      </div>

      {/* 3 Interactive Question Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Q1: Space & Footprint */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center space-x-1.5">
            <Maximize className="w-4 h-4 text-cyan-400" />
            <span>1. Space & Lander Footprint Needed?</span>
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'large', label: 'Heavy Lander (>500m safe plain)', sub: 'e.g. Artemis HLS / Starship (Slope < 7°)' },
              { id: 'medium', label: 'Medium Lander (100–300m ellipse)', sub: 'e.g. NASA CLPS / IM Nova-C (Slope < 10°)' },
              { id: 'compact', label: 'Compact / Micro-Lander (<50m)', sub: 'e.g. Rover / Pinpoint Lander (Slope < 15°)' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSpaceNeeded(opt.id as any)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between ${
                  spaceNeeded === opt.id
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-glow-cyan'
                    : 'bg-space-900/60 border-slate-800 text-slate-300 hover:bg-space-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{opt.sub}</div>
                </div>
                {spaceNeeded === opt.id && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Q2: Primary Science Objective */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center space-x-1.5">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>2. Primary Mission Science Goal?</span>
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'water_ice', label: 'Water Ice & Volatile Traps', sub: 'Permanently shadowed cold traps (40 K)' },
              { id: 'solar_power', label: 'Continuous Solar Illumination', sub: 'Peaks of eternal light / high ridges (>80% sun)' },
              { id: 'comm', label: 'Direct High-Bandwidth Earth Comm', sub: 'Uninterrupted direct radio link to Earth' },
              { id: 'geology', label: 'Deep Geology & Impact Melts', sub: 'Central peaks, terraced walls, mare basalt' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setScienceGoal(opt.id as any)}
                className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between ${
                  scienceGoal === opt.id
                    ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-glow-amber'
                    : 'bg-space-900/60 border-slate-800 text-slate-300 hover:bg-space-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{opt.sub}</div>
                </div>
                {scienceGoal === opt.id && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Q3: Region Preference */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>3. Target Geographic Region?</span>
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'south_pole', label: 'South Polar Region (-80° to -90°)', sub: 'Artemis & CLPS target zone' },
              { id: 'nearside', label: 'Nearside Maria & Highlands', sub: 'Smooth plains, continuous Earth LOS' },
              { id: 'farside', label: 'Far Side of the Moon', sub: 'Radio-quiet, requires relay satellite' },
              { id: 'any', label: 'Any Region (Global Best Match)', sub: 'Find highest optimal score across Moon' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setRegionFilter(opt.id as any)}
                className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between ${
                  regionFilter === opt.id
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200 shadow-glow-emerald'
                    : 'bg-space-900/60 border-slate-800 text-slate-300 hover:bg-space-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{opt.sub}</div>
                </div>
                {regionFilter === opt.id && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Candidate Sites (Multiple Available Sites) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center space-x-2">
            <span>Optimal Landing Candidates Found:</span>
            <span className="text-cyan-400">({topRecommendations.length} Recommended Sites)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click 'Engage Navigation' to fly directly to any site
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {topRecommendations.map(({ site, matchPct }, index) => {
            const isCurrentlySelected = selectedSite.id === site.id;

            return (
              <div
                key={site.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative min-w-0 overflow-hidden ${
                  isCurrentlySelected
                    ? 'bg-space-900 border-cyan-400 shadow-glow-cyan'
                    : 'bg-space-900/60 border-slate-800 hover:border-slate-700 hover:bg-space-900'
                }`}
              >
                <div className="min-w-0">
                  {/* Match Score Badge */}
                  <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase truncate ${
                      index === 0
                        ? 'bg-cyan-500 text-space-950 font-extrabold shadow-glow-cyan'
                        : 'bg-space-800 text-cyan-300'
                    }`}>
                      {matchPct}% MATCH {index === 0 ? '• TOP CHOICE' : ''}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      Slope: {site.slope_deg ?? 6}°
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 font-sans mb-1 truncate">
                    {site.name}
                  </h4>

                  <div className="text-xs font-mono text-cyan-400 mb-2">
                    {site.latitude >= 0 ? `${site.latitude.toFixed(2)}°N` : `${Math.abs(site.latitude).toFixed(2)}°S`}
                    {", "}
                    {site.longitude.toFixed(2)}°E
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {site.description}
                  </p>

                  {/* Terrain & Specs Pills */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono mb-4">
                    <span className="px-2 py-0.5 rounded bg-space-950 text-slate-300 border border-slate-800">
                      Zone: {site.flat_area_rating?.toUpperCase() ?? 'MEDIUM'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-space-950 text-amber-300 border border-slate-800">
                      Sun: {site.illumination_category?.toUpperCase() ?? 'HIGH'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-space-950 text-sky-300 border border-slate-800">
                      Comm: {site.comm_category === 'continuous_los' ? 'DIRECT LOS' : (site.comm_category === 'relay_required' ? 'RELAY REQ' : 'LIBRATING')}
                    </span>
                  </div>
                </div>

                {/* Navigation Button */}
                <button
                  onClick={() => handleEngageNavigation(site)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition ${
                    isCurrentlySelected
                      ? 'bg-cyan-500 text-space-950 shadow-glow-cyan'
                      : 'bg-space-800 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>{isCurrentlySelected ? 'CURRENT ACTIVE TARGET' : 'ENGAGE NAVIGATION & FLY'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
