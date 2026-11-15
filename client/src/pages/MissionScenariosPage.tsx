import React, { useState } from 'react';
import { useMissionStore } from '../stores/missionStore';
import { 
  SlidersHorizontal, 
  Download, 
  FileText, 
  Printer, 
  Calendar, 
  MapPin, 
  RotateCw, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Radio,
  Clock
} from 'lucide-react';

export const MissionScenariosPage: React.FC = () => {
  const { 
    selectedSite, 
    timeWindow, 
    setTimeWindow, 
    analysisData, 
    isLoadingAnalysis, 
    fetchAnalysis,
    panelConfig
  } = useMissionStore();

  const [startDate, setStartDate] = useState<string>(timeWindow.start.split(' ')[0] || "2026-11-14");
  const [stopDate, setStopDate] = useState<string>(timeWindow.stop.split(' ')[0] || "2026-11-16");
  const [reportCopied, setReportCopied] = useState<boolean>(false);

  const solar = analysisData?.solar;
  const comm = analysisData?.communication;
  const terrain = analysisData?.terrain;

  const handleApplyNewDates = () => {
    setTimeWindow(`${startDate} 00:00`, `${stopDate} 00:00`);
  };

  // Generate scientific Markdown Report
  const generateMarkdownReport = (): string => {
    return `# LUNARIS MISSION FEASIBILITY REPORT
**Project**: LUNARIS (Lunar Mission Intelligence & Landing Site Navigator)
**Generated (UTC)**: ${new Date().toISOString()}
**Challenge**: 2026 NASA Space Apps Challenge

---

## 1. LANDING SITE TELEMETRY
- **Target Site**: ${selectedSite.name}
- **Coordinates**: Latitude ${selectedSite.latitude.toFixed(4)}°, East Longitude ${selectedSite.longitude.toFixed(4)}°
- **Altitude Reference**: ${selectedSite.altitude_km} km
- **Terrain Dataset**: ${terrain?.available ? 'NASA PGDA LM7 5mpp (Product 78)' : 'Spherical Moon / Regional LOLA'}
- **Local Terrain Slope**: ${terrain?.local_slope_deg ?? 0}°

---

## 2. TEMPORAL ANALYSIS WINDOW
- **Analysis Start**: ${timeWindow.start} UTC
- **Analysis Stop**: ${timeWindow.stop} UTC
- **Total Duration**: ${solar?.total_hours ?? 0} hours (${((solar?.total_hours ?? 0) / 24).toFixed(1)} Earth days)
- **Step Size**: ${timeWindow.step}

---

## 3. PHOTOVOLTAIC POWER ASSESSMENT
- **Formula**: P(t) = A × η × S(t) × max(0, cos θ_inc)
- **Assumed Solar Constant (AM0)**: 1361 W/m²
- **Panel Area (A)**: ${panelConfig.area_m2} m²
- **Cell Efficiency (η)**: ${(panelConfig.efficiency * 100).toFixed(0)}%
- **Array Architecture**: ${panelConfig.orientation_mode}
- **Sunlight Availability**: ${solar?.sunlight_percentage ?? 0}% (${solar?.sunlight_hours ?? 0} hours)
- **Longest Continuous Sun**: ${solar?.max_continuous_sunlight_hours ?? 0} hours
- **Maximum Shadow Duration**: ${solar?.longest_shadow_hours ?? 0} hours
- **Total Generated Energy**: ${solar?.accumulated_energy_kwh ?? 0} kWh (${solar?.accumulated_energy_wh ?? 0} Wh)

---

## 4. DIRECT-TO-EARTH COMMUNICATION LINK
- **Earth Angular Subtension**: ~1.90° diameter (0.95° radius)
- **Direct-to-Earth LOS**: ${comm?.los_percentage ?? 0}% (${comm?.los_hours ?? 0} hours)
- **Max Continuous LOS Window**: ${comm?.max_continuous_los_hours ?? 0} hours
- **Longest Comm Blackout**: ${comm?.max_blackout_hours ?? 0} hours
- **Radio Link Disclaimer**: Geometric and terrain horizon line-of-sight only. Transceiver link-budget closure, DSN scheduling, and pointing accuracy must be verified by mission operations.

---

## 5. DATA PROVENANCE & CITATIONS
- **Ephemeris Engine**: ${analysisData?.provenance?.sun_source ?? 'NASA/JPL Horizons System'}
- **Cartography**: NASA Moon Trek WMTS
- **Topography**: NASA Planetary Geodynamics Data Archive (PGDA) Product 78
- **Disclaimer**: Developed independently for the 2026 NASA Space Apps Challenge. Not certified for flight operations.
`;
  };

  const handleDownloadReport = () => {
    const reportText = generateMarkdownReport();
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUNARIS_Report_${selectedSite.id}_${startDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const exportData = {
      site: selectedSite,
      timeWindow,
      panelConfig,
      analysis: analysisData,
      exported_at_utc: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUNARIS_Data_${selectedSite.id}_${startDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Replanning Controls Panel */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/80">
        <h3 className="text-xs font-mono font-semibold uppercase text-slate-200 flex items-center space-x-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>Mission Replanning Engine</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4 font-sans">
          Simulate launch delays, hardware development shifts, or alternate landing dates. Adjusting dates triggers real-time ephemeris recomputation through JPL Horizons.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="text-slate-300 block mb-1">Landing Date (Start UTC):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-space-900 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Mission End (Stop UTC):</label>
            <input
              type="date"
              value={stopDate}
              onChange={(e) => setStopDate(e.target.value)}
              className="w-full bg-space-900 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyNewDates}
              disabled={isLoadingAnalysis}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-space-950 font-bold font-mono transition shadow-glow-cyan"
            >
              <RotateCw className={`w-4 h-4 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
              <span>Recompute Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exportable Assessment Report */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-200 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Scientific Mission Assessment Report</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Comprehensive mission documentation with data provenance and mathematical foundations
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-300 text-xs font-mono transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{reportCopied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-800 text-cyan-300 text-xs font-mono transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-mono transition shadow-glow-cyan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Raw JSON</span>
            </button>
          </div>
        </div>

        {/* Report Preview Box */}
        <div className="bg-space-950 rounded-lg p-4 border border-slate-800/80 font-mono text-xs text-slate-300 max-h-[380px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {generateMarkdownReport()}
        </div>
      </div>
    </div>
  );
};
