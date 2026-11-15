import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LandingSite } from '../types';
import { MoonTrekMap } from '../components/explorer/MoonTrekMap';
import { SiteCataloguePanel } from '../components/explorer/SiteCataloguePanel';
import { Compass, Info, ShieldCheck, Layers } from 'lucide-react';
import { useMissionStore } from '../stores/missionStore';

export const LunarExplorerPage: React.FC = () => {
  const [sites, setSites] = useState<LandingSite[]>([]);
  const { setSelectedSite } = useMissionStore();

  useEffect(() => {
    api.getSites()
      .then((data) => setSites(data))
      .catch((err) => console.error("Failed to fetch sites:", err));
  }, []);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase font-bold tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Lunar Geospatial Navigation Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            NASA Moon Trek Multi-Zoom Explorer & Site Catalog
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>LIVE NASA MOON TREK WMTS TILES</span>
        </div>
      </div>

      {/* Main Split Grid: 7 cols Map, 5 cols Catalogue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <MoonTrekMap sites={sites} onSelectSite={(s) => setSelectedSite(s)} className="h-[580px]" />
        </div>
        <div className="lg:col-span-5">
          <SiteCataloguePanel sites={sites} />
        </div>
      </div>
    </div>
  );
};
