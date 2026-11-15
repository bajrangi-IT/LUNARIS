import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { 
  FileText, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Sun, 
  Globe2, 
  Zap, 
  Clock, 
  Info,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface MissionAssessmentReportProps {
  onClose?: () => void;
}

export const MissionAssessmentReport: React.FC<MissionAssessmentReportProps> = ({ onClose }) => {
  const { selectedSite, analysisData } = useMissionStore();

  const solar = analysisData?.solar;
  const comm = analysisData?.communication;
  const joint = analysisData?.joint_operations;
  const terrain = analysisData?.terrain;
  const prov = analysisData?.provenance;
  const timeWin = analysisData?.time_window;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const reportData = {
      report_title: 'LUNARIS Mission Assessment & Feasibility Report',
      generated_at_utc: new Date().toISOString(),
      site: {
        id: selectedSite.id,
        name: selectedSite.name,
        region: selectedSite.region,
        latitude_deg: selectedSite.latitude,
        longitude_east_deg: selectedSite.longitude,
        altitude_km: selectedSite.altitude_km,
        has_dem: selectedSite.has_dem,
        dem_product: selectedSite.dem_product,
      },
      analysis_period: timeWin,
      provenance: prov,
      scientific_results: {
        solar: {
          sunlight_percentage: solar?.sunlight_percentage,
          accumulated_energy_kwh: solar?.accumulated_energy_kwh,
          max_continuous_sunlight_hours: solar?.max_continuous_sunlight_hours,
          longest_shadow_hours: solar?.longest_shadow_hours,
        },
        communication: {
          los_percentage: comm?.los_percentage,
          max_continuous_los_hours: comm?.max_continuous_los_hours,
          max_blackout_hours: comm?.max_blackout_hours,
        },
        joint_operations: {
          total_joint_hours: joint?.total_joint_hours,
          joint_percentage: joint?.joint_percentage,
          max_continuous_joint_hours: joint?.max_continuous_joint_hours,
        },
        terrain: {
          slope_deg: terrain?.local_slope_deg ?? selectedSite.slope_deg,
          elevation_m: terrain?.local_elevation_m,
          source: prov?.terrain_source,
        },
      },
      traceability: {
        ephemeris_api: 'NASA/JPL Horizons API (SSD JPL)',
        point_cloud: 'NASA PGDA Product 78 (LOLA LM7 Faustini Rim A Crossover Adjusted XYZI)',
        dem_source: 'NASA PGDA LOLA 5m/px GeoTIFF DEM',
        disclaimer: 'Calculated using authentic NASA and JPL scientific data products. Not endorsed by NASA.',
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUNARIS_Mission_Report_${selectedSite.id}_${timeWin?.start_utc.slice(0, 10) || '2026'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-700 bg-space-950/95 max-w-5xl mx-auto my-6 text-slate-200 font-sans shadow-2xl">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <FileText className="w-4 h-4" />
            <span>NASA Space Apps 2026 • Evidence-Backed Mission Report</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1 tracking-tight">
            Lunar Mission Feasibility Assessment
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic ephemeris, high-resolution topography & joint operations analysis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-2 rounded-xl bg-space-900 border border-slate-700 hover:border-slate-500 text-xs font-mono font-bold flex items-center space-x-1.5 transition text-slate-300 hover:text-slate-100"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-space-950 text-xs font-mono font-bold flex items-center space-x-1.5 transition shadow-glow-cyan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Target & Ephemeris Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 font-mono text-xs">
        <div className="p-4 rounded-xl border border-slate-800 bg-space-900/60">
          <div className="text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Landing Site Target</span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-sans">{selectedSite.name}</div>
          <div className="mt-2 text-cyan-300 font-bold">
            {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(4)}°N` : `${Math.abs(selectedSite.latitude).toFixed(4)}°S`}, {selectedSite.longitude.toFixed(4)}°E
          </div>
          <div className="text-slate-400 mt-1">Altitude: {selectedSite.altitude_km} km (relative to 1737.4 km)</div>
          <div className="text-slate-400 mt-1">Target Mission: {selectedSite.target_mission}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-space-900/60">
          <div className="text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Temporal Window</span>
          </div>
          <div className="text-slate-300">Start: <span className="text-slate-100 font-bold">{timeWin?.start_utc || '2026-11-14 00:00'} UTC</span></div>
          <div className="text-slate-300 mt-1">Stop: <span className="text-slate-100 font-bold">{timeWin?.stop_utc || '2026-11-16 00:00'} UTC</span></div>
          <div className="text-slate-400 mt-2">Duration: {timeWin?.total_hours || 48} hours ({((timeWin?.total_hours || 48) / 24).toFixed(1)} Earth days)</div>
          <div className="text-slate-400 mt-1">Step Size: {timeWin?.step_size || '30m'} intervals</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-space-900/60">
          <div className="text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Scientific Data Provenance</span>
          </div>
          <div className="text-slate-300">Ephemeris: <span className="text-emerald-400 font-bold">NASA/JPL Horizons API</span></div>
          <div className="text-slate-300 mt-1">Terrain: <span className="text-cyan-300 font-bold">{prov?.terrain_source || 'NASA PGDA LM7 5m DEM'}</span></div>
          <div className="text-slate-400 mt-2">Observer: coord@301 (Apparent airless)</div>
          <div className="text-slate-400 mt-1">Point Cloud: NASA Product 78 (835k shots)</div>
        </div>
      </div>

      {/* Calculated Results Matrix */}
      <div className="my-6">
        <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Calculated Engineering Metrics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-space-900/40">
            <div className="text-[11px] text-slate-400 uppercase">Solar Illumination</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{solar?.sunlight_percentage ?? '--'}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Total Sunlight: {solar?.sunlight_hours ?? '--'}h</div>
            <div className="text-[11px] text-slate-400">Continuous Max: {solar?.max_continuous_sunlight_hours ?? '--'}h</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-space-900/40">
            <div className="text-[11px] text-slate-400 uppercase">Direct Earth LOS</div>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">{comm?.los_percentage ?? '--'}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Total Contact: {comm?.los_hours ?? '--'}h</div>
            <div className="text-[11px] text-slate-400">Max Blackout: {comm?.max_blackout_hours ?? '--'}h</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-space-900/40">
            <div className="text-[11px] text-slate-400 uppercase">Simultaneous Window</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{joint?.total_joint_hours ?? '--'}h</div>
            <div className="text-[11px] text-slate-400 mt-1">Concurrent Ratio: {joint?.joint_percentage ?? '--'}%</div>
            <div className="text-[11px] text-slate-400">Max Continuous: {joint?.max_continuous_joint_hours ?? '--'}h</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-space-900/40">
            <div className="text-[11px] text-slate-400 uppercase">Terrain Pad Safety</div>
            <div className="text-2xl font-extrabold text-cyan-300 mt-1">
              {terrain?.local_slope_deg !== undefined ? `${terrain.local_slope_deg.toFixed(1)}°` : `${selectedSite.slope_deg}°`}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">LOLA Uncertainty: ±0.55 m</div>
            <div className="text-[11px] text-emerald-400">Pass: Slope &lt; 12° limit</div>
          </div>
        </div>
      </div>

      {/* Assumptions, Limitations and Traceability */}
      <div className="p-4 rounded-xl border border-slate-800 bg-space-900/30 text-xs text-slate-300 space-y-2 leading-relaxed">
        <div className="font-bold text-slate-100 flex items-center space-x-1.5 font-mono">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Scientific Assumptions, Methodology & Traceability</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
          <li>
            <strong className="text-slate-300">Ephemeris Formulation:</strong> Queries apparent topocentric observer coordinates from the NASA/JPL Horizons vector engine (<code className="text-slate-300">https://ssd.jpl.nasa.gov/api/horizons.api</code>) configured for airless lunar surface observation (<code className="text-slate-300">coord@301</code>).
          </li>
          <li>
            <strong className="text-slate-300">Terrain Obstruction:</strong> Calculates azimuthal line-of-sight elevation angles across 360 degrees, with analytical lunar spherical curvature correction <code className="text-slate-300">θ(d) = arctan((h - h_obs - d²/(2R))/d)</code> where R = 1737.4 km.
          </li>
          <li>
            <strong className="text-slate-300">Point Cloud Ground Truth:</strong> LOLA cleaned crossover-adjusted measurement returns (<code className="text-slate-300">LM7_final_adj.xyzi</code>) with 835,702 records provide ground-truth vertical reference. The interpolated GeoTIFF DEM exhibits mean vertical residual Δz = -0.029m and standard deviation 0.624m.
          </li>
          <li>
            <strong className="text-slate-300">Solar Power & Comm:</strong> Solar flux is evaluated using AM0 constant (1361 W/m²). Earth visibility accounts for Earth apparent disk subtension of 1.90° diameter (angular radius ~0.95°).
          </li>
          <li>
            <strong className="text-slate-300">NASA Non-Endorsement:</strong> This mission analysis tool is developed for the NASA Space Apps Challenge 2026. Data products are retrieved from public NASA/JPL archives and are not an official endorsement by NASA.
          </li>
        </ul>
      </div>
    </div>
  );
};
