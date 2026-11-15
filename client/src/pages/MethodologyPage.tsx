import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DataSourceItem } from '../types';
import { 
  BookOpen, 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  Code2,
  FolderPlus,
  FileCode,
  Layers,
  Server
} from 'lucide-react';

const STATIC_SOURCES: DataSourceItem[] = [
  {
    id: "jpl_horizons",
    name: "NASA/JPL Solar System Dynamics (SSD) Horizons System",
    endpoint: "https://ssd.jpl.nasa.gov/api/horizons.api",
    type: "Real-time Lunar Surface Astrometry & Ephemeris",
    status: "LIVE / OPERATIONAL",
    citation: "NASA Jet Propulsion Laboratory Solar System Dynamics Group (Giorgini et al., 1996)"
  },
  {
    id: "moon_trek_wmts",
    name: "NASA Moon Trek Web Map Tile Service (WMTS)",
    endpoint: "https://trek.nasa.gov/tiles",
    type: "Multi-Resolution Lunar Cartography & Global Mosaics",
    status: "LIVE / OPERATIONAL",
    citation: "NASA Jet Propulsion Laboratory / Solar System Treks Project"
  },
  {
    id: "pgda_lola_lm7",
    name: "NASA PGDA LOLA LM7 Faustini Rim A (Product 78)",
    endpoint: "https://pgda.gsfc.nasa.gov/products/78",
    type: "High-Resolution 5m/pixel Digital Elevation Model (DEM)",
    status: "ONLINE / CALIBRATED",
    citation: "NASA Planetary Geodynamics Data Archive (PGDA), Goddard Space Flight Center"
  },
  {
    id: "lroc_quickmap",
    name: "Arizona State University / NASA LROC QuickMap",
    endpoint: "https://quickmap.lroc.asu.edu/",
    type: "External Lunar Reconnaissance Orbiter Verification",
    status: "LINKED",
    citation: "Lunar Reconnaissance Orbiter Camera (LROC) / Arizona State University"
  }
];

export const MethodologyPage: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>(STATIC_SOURCES);
  const [activeTab, setActiveTab] = useState<'apis' | 'datasets' | 'formulas'>('apis');

  useEffect(() => {
    api.getDataSources()
      .then((data) => {
        if (data?.sources?.length > 0) {
          setSources(data.sources);
        }
      })
      .catch((err) => {
        console.warn("Using offline fallback data source registry:", err);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>DATA PROVENANCE & ARCHITECTURE DIRECTORY</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
          System APIs, Dataset Guide & Scientific Methodology
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete breakdown of APIs used, endpoints called, instructions for dropping in custom datasets, and mathematical formulations.
        </p>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 mt-4 font-mono text-xs">
          {[
            { id: 'apis', label: '1. APIs Used & Where', icon: Server },
            { id: 'datasets', label: '2. Where to Add Datasets', icon: FolderPlus },
            { id: 'formulas', label: '3. Mathematical Models', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-space-950 font-bold border-cyan-400 shadow-glow-cyan'
                    : 'bg-space-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: APIs Used & Endpoints */}
      {activeTab === 'apis' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-space-950/80 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>External & Internal APIs Used Across the Platform</span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {/* API 1: JPL Horizons */}
              <div className="p-4 rounded-xl bg-space-900/60 border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-sm text-cyan-300">1. NASA / JPL Horizons Ephemeris API</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px]">
                    LIVE NASA API
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Official Endpoint:</strong> <code className="text-cyan-300">https://ssd.jpl.nasa.gov/api/horizons.api</code>
                </div>
                <div className="text-slate-300 text-[11px] font-sans">
                  <strong>Where it is used:</strong> Called by <code className="text-cyan-300">server/services/horizons_client.py</code> through endpoints <code className="text-cyan-300">/api/ephemeris/sun</code>, <code className="text-cyan-300">/api/ephemeris/earth</code>, and <code className="text-cyan-300">/api/analysis/full</code>.
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Parameters Passed:</strong> Target 10 (Sun) & Target 399 (Earth) observed from <code className="text-cyan-300">coord@301</code> (lunar surface observer at selected latitude, longitude, and altitude). Requests Quantity 4 (Apparent airless Azimuth & Elevation).
                </div>
              </div>

              {/* API 2: Moon Trek WMTS */}
              <div className="p-4 rounded-xl bg-space-900/60 border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-sm text-amber-300">2. NASA Moon Trek WMTS Tile API</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px]">
                    LIVE NASA TILES
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Official Endpoint:</strong> <code className="text-amber-300">https://trek.nasa.gov/tiles/Moon/...</code>
                </div>
                <div className="text-slate-300 text-[11px] font-sans">
                  <strong>Where it is used:</strong> Directly requested by <code className="text-amber-300">MoonTrekMap.tsx</code> and <code className="text-amber-300">server/services/trek_service.py</code>.
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Layers Served:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                    <li>LRO WAC Global Photographic Mosaic (100 m/pixel)</li>
                    <li>LOLA Color Shaded Relief South Pole (20 m/pixel)</li>
                    <li>LOLA Hillshade Topography (20 m/pixel)</li>
                  </ul>
                </div>
              </div>

              {/* API 3: PGDA Product 78 */}
              <div className="p-4 rounded-xl bg-space-900/60 border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-sm text-emerald-300">3. NASA PGDA Product 78 (LOLA LM7 Faustini)</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 text-[10px]">
                    HIGH-RES TERRAIN
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Catalogue URL:</strong> <code className="text-emerald-300">https://pgda.gsfc.nasa.gov/products/78</code>
                </div>
                <div className="text-slate-300 text-[11px] font-sans">
                  <strong>Where it is used:</strong> Managed by <code className="text-emerald-300">server/services/terrain_service.py</code> for 360° terrain horizon obscuration calculations accounting for lunar curvature.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Where to Add Custom Datasets */}
      {activeTab === 'datasets' && (
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-space-950/80 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center space-x-2">
              <FolderPlus className="w-4 h-4" />
              <span>Where to Add Your Own Datasets & Custom Files</span>
            </h3>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              You can easily drop your own lunar datasets into the project. The system is designed to pick them up automatically:
            </p>

            <div className="space-y-4 font-mono text-xs">
              {/* Dataset Location 1: GeoTIFF DEMs */}
              <div className="p-4 rounded-xl bg-space-900/80 border border-cyan-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>1. Adding GeoTIFF Elevation & Slope Rasters (DEM)</span>
                </div>
                <div className="p-2 rounded bg-space-950 text-cyan-300 text-[11px]">
                  Directory: <code>z:\PROJECTS\LUNA\server\data\lm7\</code>
                </div>
                <div className="text-slate-300 text-[11px] font-sans leading-relaxed">
                  Drop your GeoTIFF files into this directory. The service recognizes:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                    <li><code className="text-cyan-300">LM7_final_adj_5mpp_surf.tif</code> — Surface elevation DEM raster</li>
                    <li><code className="text-cyan-300">LM7_final_adj_5mpp_slp.tif</code> — Surface slope raster</li>
                    <li><code className="text-cyan-300">LM7_final_adj_5mpp_toterr.tif</code> — Total vertical uncertainty raster</li>
                  </ul>
                  When present, <code className="text-cyan-300">Rasterio</code> automatically loads them and reads pixel-level elevations.
                </div>
              </div>

              {/* Dataset Location 2: Custom Craters & Landing Sites */}
              <div className="p-4 rounded-xl bg-space-900/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>2. Adding Custom Craters & Candidate Sites</span>
                </div>
                <div className="p-2 rounded bg-space-950 text-amber-300 text-[11px]">
                  File: <code>z:\PROJECTS\LUNA\server\data\catalog.json</code>
                </div>
                <div className="text-slate-300 text-[11px] font-sans leading-relaxed">
                  Simply open this JSON file and add your candidate crater object with:
                  <pre className="p-2 mt-1 rounded bg-space-950 text-slate-300 text-[10px] overflow-x-auto">
{`{
  "id": "my-custom-crater",
  "name": "My Crater Name",
  "region": "South Pole",
  "latitude": -88.50,
  "longitude": 125.00,
  "altitude_km": 1.2,
  "diameter_km": 45.0,
  "depth_km": 3.1,
  "flat_area_rating": "large",
  "slope_deg": 5.4,
  "illumination_category": "high",
  "comm_category": "continuous_los",
  "science_target": "water_ice",
  "has_dem": false,
  "description": "Custom site description..."
}`}
                  </pre>
                  The landing wizard, 3D Moon Globe, 2D Moon Trek map, and comparison matrix will immediately display your new crater!
                </div>
              </div>

              {/* Dataset Location 3: Pre-computed Offline Ephemeris */}
              <div className="p-4 rounded-xl bg-space-900/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>3. Offline Ephemeris JSON Cache</span>
                </div>
                <div className="p-2 rounded bg-space-950 text-emerald-300 text-[11px]">
                  Directory: <code>z:\PROJECTS\LUNA\server\cache\horizons\</code>
                </div>
                <div className="text-slate-300 text-[11px] font-sans leading-relaxed">
                  Cached Horizons API JSON queries are saved here. If you are operating completely offline without an internet connection, cached files are served immediately with zero latency.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Mathematical Formulations */}
      {activeTab === 'formulas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Formula 1: Lunar Curvature */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-300 uppercase">1. Lunar Curvature Horizon Profile</h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Apparent elevation angle θ(d) at distance d considering lunar sphere radius R_moon = 1737.4 km:
              </p>
              <div className="p-2.5 rounded bg-space-900 text-cyan-400 font-bold">
                θ(d) = arctan [ ( h_terrain - h_obs - (d² / 2·R_moon) ) / d ]
              </div>
            </div>

            {/* Formula 2: Solar Power */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-300 uppercase">2. Photovoltaic Power P(t)</h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Instantaneous power with panel area A, efficiency η, and AM0 solar constant S(t) = 1361 W/m²:
              </p>
              <div className="p-2.5 rounded bg-space-900 text-amber-400 font-bold">
                P(t) = A × η × S(t) × max(0, cos θ_inc)
              </div>
            </div>

            {/* Formula 3: Direct-to-Earth Comm */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-sky-300 uppercase">3. Earth Disc Subtension</h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Earth subtends an angular diameter of ~1.90° (apparent radius r_E = 0.95°):
              </p>
              <div className="p-2.5 rounded bg-space-900 text-sky-400 font-bold">
                Clearance = Elevation_Earth - Horizon_Elevation(Azimuth)
              </div>
            </div>

            {/* Formula 4: Multi-Attribute Utility */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-emerald-300 uppercase">4. Decision Scoring Matrix</h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Weighted composite ranking across normalized Power, Communication, and Safety dimensions:
              </p>
              <div className="p-2.5 rounded bg-space-900 text-emerald-400 font-bold">
                Score = W_power × S_p + W_comm × S_c + W_terrain × S_t
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
