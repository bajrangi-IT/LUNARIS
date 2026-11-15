import React, { useState } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { LandingSite } from '../../types';
import { 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  Check, 
  ExternalLink,
  PlusCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const SiteCataloguePanel: React.FC<{ sites: LandingSite[] }> = ({ sites }) => {
  const { 
    selectedSite, 
    setSelectedSite, 
    bookmarks, 
    addBookmark, 
    removeBookmark,
    setCustomCoordinates
  } = useMissionStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Custom coordinate input modal state
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<string>('-87.12');
  const [customLon, setCustomLon] = useState<string>('67.24');
  const [customAlt, setCustomAlt] = useState<string>('0.0');
  const [customError, setCustomError] = useState<string | null>(null);

  // Filter sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.region.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'south_pole') return matchesSearch && site.latitude <= -80.0;
    if (selectedFilter === 'historic') return matchesSearch && site.type === 'historic_landing';
    if (selectedFilter === 'bookmarked') return matchesSearch && bookmarks.some((b) => b.id === site.id);
    return matchesSearch;
  });

  const handleApplyCustomCoords = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    const alt = parseFloat(customAlt) || 0.0;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setCustomError('Latitude must be between -90° (South) and +90° (North)');
      return;
    }
    if (isNaN(lon)) {
      setCustomError('Longitude must be a valid number');
      return;
    }

    setCustomError(null);
    setCustomCoordinates(lat, lon, alt);
    setShowCustomModal(false);
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 bg-space-950/80 flex flex-col h-full space-y-4">
      {/* Header & Search */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono font-semibold uppercase text-slate-200">
            Landing Sites Catalogue
          </div>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Custom Lat/Lon</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crater, candidate, or mission..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-space-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 mt-2.5 overflow-x-auto text-[11px] font-mono">
          {[
            { id: 'all', label: 'All Sites' },
            { id: 'south_pole', label: 'South Pole Targets' },
            { id: 'historic', label: 'Historic Missions' },
            { id: 'bookmarked', label: `Bookmarks (${bookmarks.length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-2.5 py-0.5 rounded whitespace-nowrap transition ${
                selectedFilter === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-space-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sites List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
        {filteredSites.map((site) => {
          const isSelected = site.id === selectedSite.id;
          const isBookmarked = bookmarks.some((b) => b.id === site.id);

          return (
            <div
              key={site.id}
              onClick={() => setSelectedSite(site)}
              className={`p-3 rounded-lg border transition cursor-pointer relative group ${
                isSelected
                  ? 'bg-space-900 border-cyan-500/60 shadow-glow-cyan'
                  : 'bg-space-900/40 border-slate-800 hover:border-slate-700 hover:bg-space-900/70'
              }`}
            >
              {/* Site Name & Bookmark */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold text-xs ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {site.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500 text-space-950 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {site.target_mission} • {site.region}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isBookmarked ? removeBookmark(site.id) : addBookmark(site);
                  }}
                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Site'}
                  className="text-slate-500 hover:text-cyan-400 p-1"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Coordinates Readout */}
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-300 bg-space-950/70 px-2 py-1 rounded border border-slate-800/80">
                <span>
                  Lat: {site.latitude >= 0 ? `${site.latitude.toFixed(2)}°N` : `${Math.abs(site.latitude).toFixed(2)}°S`}
                </span>
                <span>Lon: {site.longitude.toFixed(2)}°E</span>
                <span>Alt: {site.altitude_km} km</span>
              </div>

              {/* Description */}
              <p className="mt-2 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {site.description}
              </p>

              {/* Badges */}
              {site.has_dem && (
                <div className="mt-2 flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NASA PGDA LM7 5m DEM Verified</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredSites.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No lunar landing sites match your search filter.
          </div>
        )}
      </div>

      {/* Custom Coordinate Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-5 rounded-xl border border-cyan-500/40 bg-space-950 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-semibold text-cyan-300 font-mono uppercase mb-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Input Custom Lunar Coordinates</span>
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Enter observer coordinates on the lunar surface. Coordinates will be normalized to standard East-positive (0° to 360°) convention.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Latitude (-90° to +90°):</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="-87.12"
                  className="w-full bg-space-900 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Longitude (East-positive, 0° to 360° or -180° to 180°):</label>
                <input
                  type="text"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  placeholder="67.24"
                  className="w-full bg-space-900 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Altitude (km relative to mean radius):</label>
                <input
                  type="text"
                  value={customAlt}
                  onChange={(e) => setCustomAlt(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-space-900 border border-slate-700 rounded p-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {customError && (
                <div className="text-red-400 text-xs flex items-center space-x-1.5 mt-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{customError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 mt-5">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded bg-space-900 hover:bg-space-800 text-slate-400 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomCoords}
                className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-space-950 font-bold text-xs font-mono shadow-glow-cyan"
              >
                Lock Coordinates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
