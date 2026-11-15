import React, { useState, useEffect, useMemo } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { api } from '../../services/api';
import { 
  GitCompare, 
  Award, 
  Sun, 
  Radio, 
  Mountain, 
  RotateCw,
  TrendingUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ScenarioResult {
  scenario_id: string;
  name: string;
  composite_score: number;
  power_score: number;
  comm_score: number;
  terrain_score: number;
  details: any;
}

export const SiteComparisonDashboard: React.FC = () => {
  const { timeWindow, panelConfig } = useMissionStore();

  const [weightPower, setWeightPower] = useState<number>(0.40);
  const [weightComm, setWeightComm] = useState<number>(0.35);
  const [weightTerrain, setWeightTerrain] = useState<number>(0.25);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rawScenarios, setRawScenarios] = useState<any[] | null>(null);
  const [decisionAnalysis, setDecisionAnalysis] = useState<string>('');

  // 3 Verified Candidate Scenarios
  const candidateScenarios = useMemo(() => [
    {
      id: "faustini-rim-a",
      name: "Faustini Rim A (LM7)",
      latitude: -87.12,
      longitude: 67.24,
      altitude_km: -0.85,
      start_time_utc: timeWindow.start,
      stop_time_utc: timeWindow.stop,
      panel_area_m2: panelConfig.area_m2,
      panel_efficiency: panelConfig.efficiency,
      observer_height_m: 2.0
    },
    {
      id: "shackleton-connecting-ridge",
      name: "Connecting Ridge (near Shackleton)",
      latitude: -89.44,
      longitude: 222.50,
      altitude_km: 1.20,
      start_time_utc: timeWindow.start,
      stop_time_utc: timeWindow.stop,
      panel_area_m2: panelConfig.area_m2,
      panel_efficiency: panelConfig.efficiency,
      observer_height_m: 2.0
    },
    {
      id: "malapert-mountain",
      name: "Malapert Mountain (Massif)",
      latitude: -86.04,
      longitude: 2.70,
      altitude_km: 5.00,
      start_time_utc: timeWindow.start,
      stop_time_utc: timeWindow.stop,
      panel_area_m2: panelConfig.area_m2,
      panel_efficiency: panelConfig.efficiency,
      observer_height_m: 2.0
    }
  ], [timeWindow.start, timeWindow.stop, panelConfig.area_m2, panelConfig.efficiency]);

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      const res = await api.compareScenarios(candidateScenarios, {
        power: weightPower,
        comm: weightComm,
        terrain: weightTerrain
      });
      if (res?.rankings) {
        setRawScenarios(res.rankings.map((r: any) => r.details));
        setDecisionAnalysis(res.decision_analysis || '');
      }
    } catch (err) {
      console.error("Comparison fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch only when time window changes or on initial mount
  useEffect(() => {
    fetchScenarios();
  }, [timeWindow.start, timeWindow.stop]);

  // Instantaneous (0ms latency) client-side recalculation of rankings when weights change
  const rankings: ScenarioResult[] = useMemo(() => {
    if (!rawScenarios || rawScenarios.length === 0) return [];

    const totalW = weightPower + weightComm + weightTerrain || 1.0;
    const wp = weightPower / totalW;
    const wc = weightComm / totalW;
    const wt = weightTerrain / totalW;

    const scored = rawScenarios.map((dt) => {
      const sm = dt.solar_metrics || {};
      const cm = dt.comm_metrics || {};
      const tm = dt.terrain_context || {};

      // Power score (0-100)
      const sunPct = sm.sunlight_percentage ?? 0;
      const maxSunH = sm.max_continuous_sunlight_hours ?? 0;
      const powerScore = Math.min(100, sunPct * 0.7 + (maxSunH / 48.0) * 30.0);

      // Comm score (0-100)
      const losPct = cm.los_percentage ?? 0;
      const maxBlackoutH = cm.max_blackout_hours ?? 0;
      const blackoutPenalty = Math.max(0, (maxBlackoutH - 6.0) * 2.5);
      const commScore = Math.max(0, Math.min(100, losPct - blackoutPenalty));

      // Terrain score (0-100)
      const slope = tm.local_slope_deg ?? 10.0;
      let terrainScore = 95.0;
      if (slope <= 8.0) terrainScore = 95.0;
      else if (slope <= 15.0) terrainScore = Math.max(20, 95.0 - (slope - 8.0) * 4.0);
      else terrainScore = Math.max(0, 67.0 - (slope - 15.0) * 6.0);

      const composite = Math.round((powerScore * wp + commScore * wc + terrainScore * wt) * 10) / 10;

      return {
        scenario_id: dt.id,
        name: dt.name,
        composite_score: composite,
        power_score: Math.round(powerScore * 10) / 10,
        comm_score: Math.round(commScore * 10) / 10,
        terrain_score: Math.round(terrainScore * 10) / 10,
        details: dt
      };
    });

    return scored.sort((a, b) => b.composite_score - a.composite_score);
  }, [rawScenarios, weightPower, weightComm, weightTerrain]);

  return (
    <div className="space-y-5">
      {/* Top Header & Priority Sliders Controller */}
      <div className="glass-panel rounded-xl p-4 sm:p-5 border border-slate-800 bg-space-950/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Multi-Criteria Mission Decision Engine</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Instantaneous trade-off scoring powered by NASA Horizons ephemeris and LOLA topography
            </p>
          </div>

          <button
            onClick={fetchScenarios}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-mono transition shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Fetching Ephemeris...' : 'Refresh Telemetry'}</span>
          </button>
        </div>

        {/* Priority Weight Sliders (Interactive 0ms response) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-slate-800/80 font-mono text-xs">
          {/* Power Weight */}
          <div className="bg-space-900/50 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex justify-between items-center text-slate-300 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Power Priority</span>
              </span>
              <span className="text-amber-400 font-bold">{(weightPower * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={weightPower}
              onChange={(e) => setWeightPower(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Comm Weight */}
          <div className="bg-space-900/50 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex justify-between items-center text-slate-300 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">Direct Comm Priority</span>
              </span>
              <span className="text-cyan-400 font-bold">{(weightComm * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={weightComm}
              onChange={(e) => setWeightComm(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Terrain Weight */}
          <div className="bg-space-900/50 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex justify-between items-center text-slate-300 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Landing Safety Priority</span>
              </span>
              <span className="text-emerald-400 font-bold">{(weightTerrain * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={weightTerrain}
              onChange={(e) => setWeightTerrain(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Decision Analysis Synthesis Banner */}
      {decisionAnalysis && (
        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/30 bg-space-950/90 shadow-glow-cyan flex items-start space-x-3">
          <Award className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs min-w-0">
            <div className="text-cyan-300 font-mono font-bold uppercase mb-0.5 text-[11px]">
              Mission Planner Synthesis & Strategic Trade-Off
            </div>
            <p className="text-slate-200 leading-relaxed font-sans text-xs">
              {decisionAnalysis}
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton if no data yet */}
      {isLoading && (!rankings || rankings.length === 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/50 animate-pulse space-y-4">
              <div className="h-5 bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded w-2/3" />
              <div className="space-y-2 py-4">
                <div className="h-2 bg-slate-800 rounded" />
                <div className="h-2 bg-slate-800 rounded" />
                <div className="h-2 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {rankings.map((sc, rankIdx) => {
          const isWinner = rankIdx === 0;
          const dt = sc.details || {};
          const sm = dt.solar_metrics || {};
          const cm = dt.comm_metrics || {};
          const tm = dt.terrain_context || {};
          const coords = dt.coordinates || {};

          return (
            <div
              key={sc.scenario_id}
              className={`glass-panel p-4 sm:p-5 rounded-xl border relative flex flex-col justify-between transition min-w-0 overflow-hidden ${
                isWinner
                  ? 'border-cyan-500/60 bg-space-900/90 shadow-glow-cyan ring-1 ring-cyan-500/30'
                  : 'border-slate-800 bg-space-950/70'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    isWinner ? 'bg-cyan-400 text-space-950' : 'bg-space-800 text-slate-400'
                  }`}>
                    RANK #{rankIdx + 1}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">Score: </span>
                    <span className={`text-base sm:text-lg font-bold font-mono ${isWinner ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {sc.composite_score}/100
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-100 truncate mb-0.5">{sc.name}</h4>
                <div className="text-[11px] font-mono text-cyan-400 mb-3 truncate">
                  {coords.latitude_deg !== undefined
                    ? `${coords.latitude_deg >= 0 ? `${coords.latitude_deg.toFixed(2)}°N` : `${Math.abs(coords.latitude_deg).toFixed(2)}°S`}, ${coords.longitude_east_deg.toFixed(2)}°E`
                    : '--'}
                </div>

                {/* Subscores Breakdown */}
                <div className="space-y-2 mb-4 font-mono text-xs bg-space-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-amber-300">Power Score</span>
                      <span className="text-amber-400 font-bold">{sc.power_score}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                      <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${sc.power_score}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-cyan-300">Comm Score</span>
                      <span className="text-cyan-400 font-bold">{sc.comm_score}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                      <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${sc.comm_score}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-emerald-300">Safety Score</span>
                      <span className="text-emerald-400 font-bold">{sc.terrain_score}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                      <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${sc.terrain_score}%` }} />
                    </div>
                  </div>
                </div>

                {/* Raw Metric Comparison (Clean Table, No Overflows) */}
                <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">Solar Illum:</span>
                    <span className="font-bold text-amber-300 shrink-0">
                      {sm.sunlight_percentage ?? 0}% ({sm.sunlight_hours ?? 0}h)
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">Max Sun Window:</span>
                    <span className="text-slate-200 shrink-0">{sm.max_continuous_sunlight_hours ?? 0}h</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">Energy Yield:</span>
                    <span className="font-bold text-cyan-300 shrink-0">{sm.accumulated_energy_kwh ?? 0} kWh</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">Earth LOS:</span>
                    <span className="font-bold text-cyan-400 shrink-0">
                      {cm.los_percentage ?? 0}% ({cm.los_hours ?? 0}h)
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">Max Blackout:</span>
                    <span className={`shrink-0 font-bold ${(cm.max_blackout_hours ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {cm.max_blackout_hours ?? 0}h
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">Local Slope:</span>
                    <span className="text-slate-200 shrink-0">{tm.local_slope_deg ?? 0}°</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-slate-400 truncate">DEM Product:</span>
                    <span className={`shrink-0 font-bold ${tm.dem_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {tm.dem_available ? 'LM7 (5m)' : 'LOLA (20m)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer status */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between min-w-0">
                <span className="truncate">Source: {dt.provenance?.sun_source?.split(' ')?.[0] || 'Horizons'}</span>
                {isWinner && (
                  <span className="text-cyan-400 font-bold flex items-center space-x-1 shrink-0">
                    <Sparkles className="w-3 h-3" />
                    <span>RECOMMENDED</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
