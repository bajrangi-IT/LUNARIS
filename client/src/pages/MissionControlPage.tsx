import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissionStore } from '../stores/missionStore';
import { api } from '../services/api';
import { LandingSite } from '../types';
import { GlobalLunarExplorer } from '../components/observatory/GlobalLunarExplorer';
import { MissionOverviewPanel } from '../components/observatory/MissionOverviewPanel';
import { TerrainIntelligenceViewer } from '../components/observatory/TerrainIntelligenceViewer';
import { ContactLightTimelineChart } from '../components/observatory/ContactLightTimelineChart';
import { PanoramicHorizonChart } from '../components/observatory/PanoramicHorizonChart';
import { TimelineController } from '../components/common/TimelineController';
import { MissionLandingWizard } from '../components/navigation/MissionLandingWizard';
import { MissionAssessmentReport } from '../components/common/MissionAssessmentReport';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  HelpCircle,
  Eye,
  CheckCircle2,
  Sparkles,
  GitCompare,
  X
} from 'lucide-react';

export const MissionControlPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    selectedSite, 
    setSelectedSite,
    setCustomCoordinates,
    timeWindow,
    setTimeWindow,
    fetchAnalysis,
    analysisData,
    isLoadingAnalysis
  } = useMissionStore();

  const [sites, setSites] = useState<LandingSite[]>([]);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showPanoramic, setShowPanoramic] = useState<boolean>(false);
  const [showCustomCoords, setShowCustomCoords] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<number>(-87.12);
  const [customLon, setCustomLon] = useState<number>(67.24);
  const [customAlt, setCustomAlt] = useState<number>(-0.85);
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(2);

  // Load sites on mount
  useEffect(() => {
    api.getSites()
      .then((data) => setSites(data))
      .catch((err) => console.error("Failed to load sites:", err));
  }, []);

  const handleNavigateToSite = (site: LandingSite) => {
    setSelectedSite(site);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateStr = e.target.value; // YYYY-MM-DD
    if (!newDateStr) return;
    const startUtc = `${newDateStr} 00:00`;
    const startDate = new Date(`${newDateStr}T00:00:00Z`);
    const stopDate = new Date(startDate.getTime() + selectedDurationDays * 24 * 3600 * 1000);
    const stopUtc = `${stopDate.toISOString().slice(0, 10)} ${stopDate.toISOString().slice(11, 16)}`;
    
    setTimeWindow(startUtc, stopUtc, timeWindow?.step || '30m');
    fetchAnalysis();
  };

  const handleDurationChange = (days: number) => {
    setSelectedDurationDays(days);
    const curStart = timeWindow?.start || '2026-11-14 00:00';
    const startDate = new Date(`${curStart.slice(0, 10)}T${curStart.slice(11, 16)}:00Z`);
    const stopDate = new Date(startDate.getTime() + days * 24 * 3600 * 1000);
    const stopUtc = `${stopDate.toISOString().slice(0, 10)} ${stopDate.toISOString().slice(11, 16)}`;

    setTimeWindow(curStart, stopUtc, timeWindow?.step || '30m');
    fetchAnalysis();
  };

  const handleSeasonPreset = (dateStr: string) => {
    const startUtc = `${dateStr} 00:00`;
    const startDate = new Date(`${dateStr}T00:00:00Z`);
    const stopDate = new Date(startDate.getTime() + selectedDurationDays * 24 * 3600 * 1000);
    const stopUtc = `${stopDate.toISOString().slice(0, 10)} ${stopDate.toISOString().slice(11, 16)}`;
    setTimeWindow(startUtc, stopUtc, timeWindow?.step || '30m');
    fetchAnalysis();
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-16 font-sans">
      {/* 1. Mission Configuration & Action Bar */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 bg-space-950/85 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Site & Mission Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Site:
            </span>
          </div>

          <select
            value={selectedSite.id}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setShowCustomCoords(true);
                return;
              }
              const s = sites.find((x) => x.id === e.target.value);
              if (s) setSelectedSite(s);
            }}
            className="bg-space-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:border-cyan-400 focus:outline-none"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.latitude >= 0 ? `${s.latitude.toFixed(1)}°N` : `${Math.abs(s.latitude).toFixed(1)}°S`}, {s.longitude.toFixed(1)}°E)
              </option>
            ))}
            <option value="__custom__">+ Enter Custom Coordinates...</option>
          </select>

          <button
            onClick={() => setShowCustomCoords(!showCustomCoords)}
            className={`px-2 py-1 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition ${
              showCustomCoords
                ? 'bg-cyan-500 text-space-950 font-bold border-cyan-400'
                : 'bg-space-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
            title="Custom Lunar Surface Coordinates"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Custom Coords</span>
          </button>

          <span className="text-slate-500 text-xs hidden sm:inline">•</span>

          {/* Temporal Picker & Season Helpers */}
          <div className="flex items-center space-x-1.5 font-mono text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="date"
              value={(timeWindow?.start || '2026-11-14').slice(0, 10)}
              onChange={handleDateChange}
              className="bg-space-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Quick Season Presets */}
          <div className="flex items-center space-x-1 font-mono text-[11px]">
            <button
              onClick={() => handleSeasonPreset('2026-12-15')}
              className={`px-2 py-0.5 rounded border transition flex items-center space-x-1 ${
                (timeWindow?.start || '').startsWith('2026-12-15')
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-space-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Lunar Southern Summer Solstice (High Illumination Window)"
            >
              <span>☀️ Dec Solstice (Prime Sun)</span>
            </button>
            <button
              onClick={() => handleSeasonPreset('2026-11-14')}
              className={`px-2 py-0.5 rounded border transition flex items-center space-x-1 ${
                (timeWindow?.start || '').startsWith('2026-11-14')
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-space-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Lunar Southern Winter (Shadow Assessment)"
            >
              <span>🌙 Nov Window</span>
            </button>
          </div>

          {/* Duration Pills */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            {[2, 7, 14].map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={`px-2 py-0.5 rounded text-[11px] border transition ${
                  selectedDurationDays === d
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-space-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalysis()}
            disabled={isLoadingAnalysis}
            className="p-1 rounded-lg border border-slate-700 hover:border-cyan-400 text-cyan-400 hover:bg-cyan-500/10 transition"
            title="Recompute Horizons Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Right: Modal / Drawer Action Triggers */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => setShowWizard(!showWizard)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showWizard
                ? 'bg-cyan-500 text-space-950 font-bold'
                : 'bg-space-900 border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Wizard</span>
          </button>

          <button
            onClick={() => navigate('/site-comparison')}
            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-space-900 text-slate-300 hover:text-slate-100 hover:border-slate-500 flex items-center space-x-1.5 transition"
          >
            <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => setShowPanoramic(!showPanoramic)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showPanoramic
                ? 'bg-cyan-500 text-space-950 font-bold'
                : 'bg-space-900 border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>360° Horizon</span>
          </button>

          <button
            onClick={() => setShowReport(!showReport)}
            className={`px-3 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showReport
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/25'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* 2. Candidate Landing Sites Showcase Ribbon (Quick Guided Navigator) */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 bg-space-950/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              Candidate Landing Sites Showcase • 3D Flight Navigator
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Click any candidate to fly 3D cameras and inspect solar clearance & comm link
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2.5 font-mono text-xs">
          {[
            {
              id: 'faustini-rim-a',
              badge: 'CLPS PRIORITY',
              badgeCol: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
              name: 'Faustini Rim A',
              coords: '87.12°S, 67.24°E',
              elev: '-850m • 8.4°',
              why: 'NASA PGDA LM7 • Ridge above PSR'
            },
            {
              id: 'shackleton-connecting-ridge',
              badge: 'PEAK OF LIGHT',
              badgeCol: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              name: 'Shackleton Ridge',
              coords: '89.44°S, 222.50°E',
              elev: '+1200m • 12.0°',
              why: '92% Sun • Direct Earth LOS'
            },
            {
              id: 'malapert-mountain',
              badge: 'HIGHEST MASSIF',
              badgeCol: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
              name: 'Malapert Mountain',
              coords: '86.04°S, 2.70°E',
              elev: '+5000m • 6.8°',
              why: '100% Earth Comm • Relay Hub'
            },
            {
              id: 'mons-mouton',
              badge: 'SAFEST PAD',
              badgeCol: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              name: 'Mons Mouton',
              coords: '84.60°S, 31.60°E',
              elev: '+1200m • 5.1°',
              why: 'Flat Plateau • VIPER Target'
            },
            {
              id: 'haworth-crater',
              badge: 'ICE RESERVOIR',
              badgeCol: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
              name: 'Haworth PSR',
              coords: '87.40°S, 354.90°E',
              elev: '+300m • 9.2°',
              why: 'Cryogenic PSR Cold Trap (<40K)'
            },
            {
              id: 'apollo-11',
              badge: 'HISTORIC SITE',
              badgeCol: 'bg-slate-700/50 text-slate-300 border-slate-600',
              name: 'Apollo 11 Base',
              coords: '0.67°N, 23.47°E',
              elev: '-2570m • 2.5°',
              why: 'Equatorial Mare • +72° Overhead Comm'
            }
          ].map((item) => {
            const isCur = selectedSite.id.includes(item.id) || selectedSite.id === item.id;
            const fullSite = sites.find((s) => s.id.includes(item.id) || s.id === item.id);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (fullSite) {
                    handleNavigateToSite(fullSite);
                  }
                }}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between min-w-0 overflow-hidden ${
                  isCur
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-glow-cyan'
                    : 'bg-space-900/60 border-slate-800 hover:border-slate-700 hover:bg-space-900'
                }`}
              >
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-between mb-1.5 min-w-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold truncate max-w-[110px] ${item.badgeCol}`}>
                      {item.badge}
                    </span>
                    {isCur && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0 ml-1" />}
                  </div>
                  <div className="font-bold text-slate-100 text-xs font-sans truncate">{item.name}</div>
                  <div className="text-[10px] text-cyan-300 mt-0.5 font-mono truncate">{item.coords}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{item.elev}</div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] min-w-0 gap-1 w-full">
                  <span className="text-slate-400 truncate text-[9px]">{item.why.split('•')[0]}</span>
                  <span className={`font-bold shrink-0 text-[10px] ${isCur ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {isCur ? 'ACTIVE' : 'NAVIGATE →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Lunar Coordinates Drawer */}
      {showCustomCoords && (
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/40 bg-space-950/95 shadow-glow-cyan animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                Custom Lunar Surface Observer Coordinates
              </h4>
            </div>
            <button
              onClick={() => setShowCustomCoords(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCustomCoordinates(Number(customLat), Number(customLon), Number(customAlt));
              setShowCustomCoords(false);
            }}
            className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs items-end"
          >
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Latitude (°): [-90.0 to +90.0]
              </label>
              <input
                type="number"
                step="0.001"
                min="-90"
                max="90"
                value={customLat}
                onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                className="w-full bg-space-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Longitude (°E): [0.0 to 360.0]
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="360"
                value={customLon}
                onChange={(e) => setCustomLon(parseFloat(e.target.value) || 0)}
                className="w-full bg-space-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Surface Altitude (km):
              </label>
              <input
                type="number"
                step="0.05"
                min="-10"
                max="10"
                value={customAlt}
                onChange={(e) => setCustomAlt(parseFloat(e.target.value) || 0)}
                className="w-full bg-space-900 border border-slate-700 text-slate-100 rounded px-2.5 py-1.5 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-space-950 font-bold px-3 py-1.5 rounded transition shadow-glow-cyan"
              >
                Apply Coordinates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Interactive Landing Site Decision Wizard (Expandable) */}
      {showWizard && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <MissionLandingWizard 
            sites={sites} 
            onNavigateToSite={(site) => {
              handleNavigateToSite(site);
              setShowWizard(false);
            }} 
          />
        </div>
      )}

      {/* 3. Mission Assessment Report (Expandable) */}
      {showReport && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <MissionAssessmentReport onClose={() => setShowReport(false)} />
        </div>
      )}

      {/* 4. 360-Degree Panoramic Horizon Projection (Expandable) */}
      {showPanoramic && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <PanoramicHorizonChart />
        </div>
      )}

      {/* 5. THE FOUR QUADRANTS (Exact visual structure from user screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        {/* Quadrant 1 (Top Left): Global Lunar Explorer */}
        <GlobalLunarExplorer
          sites={sites}
          onSelectSite={handleNavigateToSite}
          className="min-h-[480px] lg:min-h-[530px] xl:min-h-[550px] h-auto flex flex-col justify-between"
        />

        {/* Quadrant 2 (Top Right): Mission Overview */}
        <MissionOverviewPanel
          onNavigateSite={handleNavigateToSite}
          className="min-h-[480px] lg:min-h-[530px] xl:min-h-[550px] h-auto flex flex-col justify-between"
        />

        {/* Quadrant 3 (Bottom Left): Terrain Intelligence */}
        <TerrainIntelligenceViewer
          sites={sites}
          onSelectSite={handleNavigateToSite}
          className="min-h-[480px] lg:min-h-[530px] xl:min-h-[550px] h-auto flex flex-col justify-between"
        />

        {/* Quadrant 4 (Bottom Right): Operations Timeline */}
        <ContactLightTimelineChart
          className="min-h-[480px] lg:min-h-[530px] xl:min-h-[550px] h-auto flex flex-col justify-between"
        />
      </div>

      {/* 6. Synchronized Timeline Controller */}
      <TimelineController />
    </div>
  );
};
