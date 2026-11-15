import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { LandingSite } from '../../types';
import { 
  Sun, 
  Globe2, 
  Radio, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Clock, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Compass
} from 'lucide-react';

interface MissionOverviewPanelProps {
  className?: string;
  onNavigateSite?: (site: LandingSite) => void;
}

export const MissionOverviewPanel: React.FC<MissionOverviewPanelProps> = ({ className = '', onNavigateSite }) => {
  const { selectedSite, analysisData, currentTimestampIndex } = useMissionStore();

  const curSolar = analysisData?.solar?.timeline?.[currentTimestampIndex];
  const curComm = analysisData?.communication?.timeline?.[currentTimestampIndex];
  const solar = analysisData?.solar;
  const comm = analysisData?.communication;
  const jointOps = analysisData?.joint_operations;
  const terrain = analysisData?.terrain;

  // Active status conditions
  const isSunlit = curSolar?.effective_visible ?? false;
  const hasEarthLOS = curComm?.has_line_of_sight ?? false;
  const isJoint = isSunlit && hasEarthLOS;

  // Mission status message
  let missionStatusText = 'ANALYZING HORIZONS';
  let missionStatusColor = 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300';
  let missionStatusIcon = <Sparkles className="w-4 h-4 text-cyan-400" />;

  if (analysisData) {
    if (isJoint) {
      missionStatusText = 'NOMINAL JOINT OPS';
      missionStatusColor = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300';
      missionStatusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    } else if (isSunlit && !hasEarthLOS) {
      missionStatusText = 'SOLAR ACTIVE • OCCULTED';
      missionStatusColor = 'bg-amber-500/15 border-amber-500/50 text-amber-300';
      missionStatusIcon = <Sun className="w-4 h-4 text-amber-400" />;
    } else if (!isSunlit && hasEarthLOS) {
      missionStatusText = 'EARTH LINK • SHADOW';
      missionStatusColor = 'bg-blue-500/15 border-blue-500/50 text-blue-300';
      missionStatusIcon = <Radio className="w-4 h-4 text-blue-400" />;
    } else {
      missionStatusText = 'TERRAIN BLACKOUT';
      missionStatusColor = 'bg-red-500/15 border-red-500/50 text-red-300';
      missionStatusIcon = <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  }

  // Formatting helpers
  const sunElevationStr = curSolar?.solar_elevation_deg !== undefined
    ? `${curSolar.solar_elevation_deg >= 0 ? '+' : ''}${curSolar.solar_elevation_deg.toFixed(2)}°`
    : '--';

  const earthElevationStr = curComm?.earth_elevation_deg !== undefined
    ? `${curComm.earth_elevation_deg >= 0 ? '+' : ''}${curComm.earth_elevation_deg.toFixed(2)}°`
    : '--';

  const jointHoursStr = jointOps?.total_joint_hours !== undefined
    ? `${jointOps.total_joint_hours} hrs`
    : '--';

  const slopeStr = terrain?.local_slope_deg !== undefined
    ? `${terrain.local_slope_deg.toFixed(1)}°`
    : selectedSite.slope_deg !== undefined
    ? `${selectedSite.slope_deg.toFixed(1)}°`
    : '--';

  // Elapsed hours string from scrubber
  const elapsedHours = (currentTimestampIndex * 0.5).toFixed(1);

  // Operational Countdowns: Time remaining before Sunset and Earthset (Problem Statement Core Requirement)
  const solarTimeline = solar?.timeline || [];
  const commTimeline = comm?.timeline || [];
  const totalTimelineLen = Math.max(solarTimeline.length, commTimeline.length);
  const remainingHoursInWindow = Math.max(0, (totalTimelineLen - 1 - currentTimestampIndex) * 0.5);

  let sunsetCountdownText = '--';
  let sunsetIsWarning = false;
  let earthsetCountdownText = '--';
  let earthsetIsWarning = false;

  // 1. Calculate time to sunset / sunrise
  if (solarTimeline.length > 0 && currentTimestampIndex < solarTimeline.length) {
    if (isSunlit) {
      let sunsetIdx = -1;
      for (let i = currentTimestampIndex + 1; i < solarTimeline.length; i++) {
        if (!solarTimeline[i].effective_visible) {
          sunsetIdx = i;
          break;
        }
      }
      if (sunsetIdx !== -1) {
        const hrs = (sunsetIdx - currentTimestampIndex) * 0.5;
        sunsetCountdownText = `${hrs.toFixed(1)} hrs remaining`;
        sunsetIsWarning = hrs <= 6;
      } else {
        sunsetCountdownText = `Continuous Sun (> ${remainingHoursInWindow.toFixed(0)}h)`;
      }
    } else {
      let sunriseIdx = -1;
      for (let i = currentTimestampIndex + 1; i < solarTimeline.length; i++) {
        if (solarTimeline[i].effective_visible) {
          sunriseIdx = i;
          break;
        }
      }
      if (sunriseIdx !== -1) {
        const hrs = (sunriseIdx - currentTimestampIndex) * 0.5;
        sunsetCountdownText = `Sunrise in ${hrs.toFixed(1)} hrs`;
      } else {
        sunsetCountdownText = `Shadowed (> ${remainingHoursInWindow.toFixed(0)}h)`;
      }
    }
  }

  // 2. Calculate time to Earthset / Earthrise
  if (commTimeline.length > 0 && currentTimestampIndex < commTimeline.length) {
    if (hasEarthLOS) {
      let earthsetIdx = -1;
      for (let i = currentTimestampIndex + 1; i < commTimeline.length; i++) {
        if (!commTimeline[i].has_line_of_sight) {
          earthsetIdx = i;
          break;
        }
      }
      if (earthsetIdx !== -1) {
        const hrs = (earthsetIdx - currentTimestampIndex) * 0.5;
        earthsetCountdownText = `${hrs.toFixed(1)} hrs remaining`;
        earthsetIsWarning = hrs <= 6;
      } else {
        earthsetCountdownText = `Continuous LOS (> ${remainingHoursInWindow.toFixed(0)}h)`;
      }
    } else {
      let earthriseIdx = -1;
      for (let i = currentTimestampIndex + 1; i < commTimeline.length; i++) {
        if (commTimeline[i].has_line_of_sight) {
          earthriseIdx = i;
          break;
        }
      }
      if (earthriseIdx !== -1) {
        const hrs = (earthriseIdx - currentTimestampIndex) * 0.5;
        earthsetCountdownText = `Earthrise in ${hrs.toFixed(1)} hrs`;
      } else {
        earthsetCountdownText = `Occulted (> ${remainingHoursInWindow.toFixed(0)}h)`;
      }
    }
  }

  return (
    <div className={`glass-panel rounded-xl border border-slate-800 bg-space-950/90 flex flex-col justify-between overflow-hidden ${className}`}>
      {/* 1. Header */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800/80 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Mission Overview
              </h4>
            </div>
            <p className="text-xs font-sans font-medium text-slate-300 mt-0.5">
              Four important metrics, one clear mission status.
            </p>
          </div>

          {/* Mission Status Badge */}
          <div className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex items-center space-x-1.5 shrink-0 ${missionStatusColor}`}>
            {missionStatusIcon}
            <span>{missionStatusText}</span>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-slate-400">TIMER:</span>
            <span className="text-slate-100 font-bold bg-space-900 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
              T+{Math.floor(Number(elapsedHours) / 24).toString().padStart(3, '0')}d {(Number(elapsedHours) % 24).toFixed(1)}h
            </span>
          </div>

          <div className="flex items-center space-x-1.5 truncate max-w-[200px] sm:max-w-[260px]">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-200 font-bold truncate text-[11px]">{selectedSite.name}</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline truncate">
              ({selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(1)}°N` : `${Math.abs(selectedSite.latitude).toFixed(1)}°S`})
            </span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 text-[11px]">
            <span className="text-slate-400">DEM:</span>
            <span className="text-emerald-400 font-bold">
              {selectedSite.has_dem ? 'NASA LM7 (5m)' : 'LOLA (20m)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Operational Horizon Countdowns (Direct Problem Statement Requirement) */}
      <div className="px-3 sm:px-3.5 pt-2.5 pb-0.5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
        {/* Countdown 1: Time to Sunset / Sunrise */}
        <div className={`p-2 rounded-xl border flex items-center justify-between min-w-0 overflow-hidden ${
          isSunlit 
            ? (sunsetIsWarning ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-space-900/80 border-slate-800 text-slate-200')
            : 'bg-space-900/50 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isSunlit ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <Sun className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 truncate">
                {isSunlit ? 'Time to Sunset' : 'Time to Sunrise'}
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-100 truncate">
                {sunsetCountdownText}
              </div>
            </div>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
            isSunlit ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30' : 'bg-slate-800 text-slate-400'
          }`}>
            {isSunlit ? 'SUNLIT' : 'NIGHT'}
          </span>
        </div>

        {/* Countdown 2: Time to Earthset / Earthrise */}
        <div className={`p-2 rounded-xl border flex items-center justify-between min-w-0 overflow-hidden ${
          hasEarthLOS
            ? (earthsetIsWarning ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' : 'bg-space-900/80 border-slate-800 text-slate-200')
            : 'bg-space-900/50 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${hasEarthLOS ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              <Globe2 className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 truncate">
                {hasEarthLOS ? 'Time to Earthset' : 'Time to Earthrise'}
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-100 truncate">
                {earthsetCountdownText}
              </div>
            </div>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
            hasEarthLOS ? 'bg-blue-400/10 text-blue-300 border border-blue-400/30' : 'bg-red-950 text-red-400 border border-red-800/40'
          }`}>
            {hasEarthLOS ? 'DIRECT LOS' : 'OCCULTED'}
          </span>
        </div>
      </div>

      {/* 3. Four Important Metrics (The core of the panel matching screenshot) */}
      <div className="p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
        {/* Metric 1: Sun Elevation */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-space-900/60 flex flex-col justify-between hover:border-amber-500/40 transition min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider font-semibold truncate text-[11px]">1. Sun Elevation</span>
            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0 ml-1.5">
              <Sun className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1 sm:my-1.5 min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono tracking-tight truncate">
              {sunElevationStr}
            </div>
            <div className="text-[11px] font-mono font-bold mt-0.5 text-slate-200 flex items-center space-x-1.5 min-w-0 truncate">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSunlit ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span className="truncate text-[10px]">{isSunlit ? '100% ILLUMINATED' : 'SHADOWED / OCCULTED'}</span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60 flex items-center justify-between min-w-0 gap-1">
            <span className="truncate">Terrain Clearance:</span>
            <span className={`shrink-0 font-bold ${curSolar?.terrain_clearance_deg && curSolar.terrain_clearance_deg > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
              {curSolar?.terrain_clearance_deg ? `${curSolar.terrain_clearance_deg > 0 ? '+' : ''}${curSolar.terrain_clearance_deg.toFixed(2)}°` : '--'}
            </span>
          </div>
        </div>

        {/* Metric 2: Earth Line-of-Sight */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-space-900/60 flex flex-col justify-between hover:border-blue-500/40 transition min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider font-semibold truncate text-[11px]">2. Earth Line-of-Sight</span>
            <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0 ml-1.5">
              <Globe2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1 sm:my-1.5 min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-blue-400 font-mono tracking-tight truncate">
              {earthElevationStr}
            </div>
            <div className="text-[11px] font-mono font-bold mt-0.5 text-slate-200 flex items-center space-x-1.5 min-w-0 truncate">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasEarthLOS ? 'bg-blue-400' : 'bg-red-500'}`} />
              <span className="truncate text-[10px]">{hasEarthLOS ? 'DIRECT LOS (CLEAR)' : 'TERRAIN OCCULTED'}</span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60 flex items-center justify-between min-w-0 gap-1">
            <span className="truncate">Terrain Clearance:</span>
            <span className={`shrink-0 font-bold ${curComm?.terrain_clearance_deg && curComm.terrain_clearance_deg > 0 ? 'text-blue-300' : 'text-red-400'}`}>
              {curComm?.terrain_clearance_deg ? `${curComm.terrain_clearance_deg > 0 ? '+' : ''}${curComm.terrain_clearance_deg.toFixed(2)}°` : '--'}
            </span>
          </div>
        </div>

        {/* Metric 3: Joint Operational Window */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-space-900/60 flex flex-col justify-between hover:border-emerald-500/40 transition min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider font-semibold truncate text-[11px]">3. Simultaneous Window</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0 ml-1.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1 sm:my-1.5 min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tight truncate">
              {jointHoursStr}
            </div>
            <div className="text-[11px] font-mono font-bold mt-0.5 text-slate-200 flex items-center space-x-1.5 min-w-0 truncate">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isJoint ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className="truncate text-[10px]">{isJoint ? 'POWER + COMM ACTIVE' : 'NON-SIMULTANEOUS'}</span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60 flex items-center justify-between min-w-0 gap-1">
            <span className="truncate">Max Continuous:</span>
            <span className="text-emerald-300 font-bold shrink-0">
              {jointOps?.max_continuous_joint_hours !== undefined ? `${jointOps.max_continuous_joint_hours} hrs` : '--'}
            </span>
          </div>
        </div>

        {/* Metric 4: Terrain Safety */}
        <div className="p-2.5 sm:p-3 rounded-xl border border-slate-800/80 bg-space-900/60 flex flex-col justify-between hover:border-cyan-500/40 transition min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider font-semibold truncate text-[11px]">4. Terrain Safety</span>
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shrink-0 ml-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1 sm:my-1.5 min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 font-mono tracking-tight truncate">
              {slopeStr}
            </div>
            <div className="text-[11px] font-mono font-bold mt-0.5 text-slate-200 flex items-center space-x-1.5 min-w-0 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="truncate text-[10px]">{selectedSite.has_dem ? 'NASA LM7 VERIFIED' : 'REGIONAL PROFILE'}</span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 pt-1.5 border-t border-slate-800/60 flex items-center justify-between min-w-0 gap-1">
            <span className="truncate">Uncertainty:</span>
            <span className="text-cyan-300 font-bold shrink-0">
              {selectedSite.has_dem ? '±0.55 m (XYZI)' : '±2.5 m (LOLA)'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Footer Telemetry Note */}
      <div className="p-2.5 sm:p-3 bg-space-900/40 border-t border-slate-800/60 text-[10px] sm:text-[11px] font-mono text-slate-400 flex items-center justify-between shrink-0 min-w-0">
        <div className="flex items-center space-x-1.5 truncate">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Ephemeris: NASA/JPL Horizons API (SSD JPL)</span>
        </div>
        <span className="text-slate-400 shrink-0 ml-2">Step: 30m</span>
      </div>
    </div>
  );
};
