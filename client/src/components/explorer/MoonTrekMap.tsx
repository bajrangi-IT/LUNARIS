import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMissionStore } from '../../stores/missionStore';
import { LandingSite } from '../../types';
import { 
  Layers, 
  Compass, 
  MapPin, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface MoonTrekMapProps {
  sites: LandingSite[];
  onSelectSite?: (site: LandingSite) => void;
  className?: string;
}

// Verified NASA Moon Trek WMTS Tile Endpoints
const TREK_LAYERS = {
  wac_global: {
    name: 'LRO WAC Global Photographic Mosaic (100m)',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    attribution: 'NASA / GSFC / ASU / Moon Trek',
    maxZoom: 7,
  },
  lola_shade: {
    name: 'LOLA Global Shaded Relief Topography',
    url: 'https://trek.nasa.gov/tiles/Moon/EQ/LOLA_shade_global_128ppd/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    attribution: 'NASA / GSFC / LOLA Science Team / Moon Trek',
    maxZoom: 7,
  }
};

export const MoonTrekMap: React.FC<MoonTrekMapProps> = ({ sites, onSelectSite, className = "h-[500px]" }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const { selectedSite, setSelectedSite, setCustomCoordinates } = useMissionStore();
  const [activeLayerKey, setActiveLayerKey] = React.useState<keyof typeof TREK_LAYERS>('wac_global');

  // Initialize Leaflet Map with NASA Moon Trek WMTS
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Lunar Equirectangular Map
    // Latitude: -90 to +90, Longitude: -180 to +180
    // We convert East-positive 0..360 to standard -180..+180 for Leaflet
    const toLeafletLon = (lonEast: number) => {
      let l = lonEast % 360;
      if (l > 180) l -= 360;
      return l;
    };

    const initialLat = selectedSite.latitude;
    const initialLon = toLeafletLon(selectedSite.longitude);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 3,
      minZoom: 1,
      maxZoom: 7,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Add Tile Layer
    const layerConf = TREK_LAYERS[activeLayerKey];
    const tileLayer = L.tileLayer(layerConf.url, {
      maxZoom: layerConf.maxZoom,
      noWrap: true,
      bounds: [[-90, -180], [90, 180]],
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Marker Group
    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;

    // Click on map to pick custom coordinate
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Math.max(-90, Math.min(90, e.latlng.lat));
      let lonEast = e.latlng.lng;
      lonEast = ((lonEast % 360) + 360) % 360; // Normalize to East-positive 0-360
      setCustomCoordinates(lat, lonEast);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer toggled
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layerConf = TREK_LAYERS[activeLayerKey];
    const newTileLayer = L.tileLayer(layerConf.url, {
      maxZoom: layerConf.maxZoom,
      noWrap: true,
      bounds: [[-90, -180], [90, 180]],
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [activeLayerKey]);

  // Update Markers and Fly-To when selectedSite or sites change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || sites.length === 0) return;

    markerGroup.clearLayers();

    const toLeafletLon = (lonEast: number) => {
      let l = lonEast % 360;
      if (l > 180) l -= 360;
      return l;
    };

    sites.forEach((site) => {
      const isSelected = site.id === selectedSite.id;
      const lat = site.latitude;
      const lon = toLeafletLon(site.longitude);

      const color = isSelected 
        ? '#00f0ff' 
        : (site.type === 'south_pole_candidate' ? '#f59e0b' : (site.type === 'permanently_shadowed_region' ? '#a855f7' : '#10b981'));

      const marker = L.circleMarker([lat, lon], {
        radius: isSelected ? 9 : 5,
        fillColor: color,
        color: '#ffffff',
        weight: isSelected ? 2.5 : 1,
        opacity: 1,
        fillOpacity: isSelected ? 0.95 : 0.7,
      });

      marker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px;">
          <strong>${site.name}</strong><br/>
          Lat: ${site.latitude.toFixed(2)}°, Lon: ${site.longitude.toFixed(2)}°E<br/>
          ${site.diameter_km ? `Diameter: ${site.diameter_km} km` : ''}
        </div>`,
        { direction: 'top', className: 'lunar-map-tooltip' }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedSite(site);
        if (onSelectSite) onSelectSite(site);
      });

      markerGroup.addLayer(marker);
    });

    // Smooth Fly-To selected site
    const targetLon = toLeafletLon(selectedSite.longitude);
    map.flyTo([selectedSite.latitude, targetLon], Math.max(map.getZoom(), 4), {
      duration: 1.2,
      easeLinearity: 0.25,
    });

  }, [selectedSite, sites]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden glass-panel border border-cyan-500/30 bg-space-950 shadow-2xl ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full cursor-crosshair z-0" />

      {/* Top Left: Active Target Readout */}
      <div className="absolute top-4 left-4 z-10 bg-space-950/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1 shadow-lg pointer-events-auto">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold uppercase tracking-wider">NASA Moon Trek Live WMTS</span>
        </div>
        <div className="text-slate-100 font-sans font-semibold text-sm">
          {selectedSite.name}
        </div>
        <div className="text-slate-400 text-[11px]">
          {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(2)}°N` : `${Math.abs(selectedSite.latitude).toFixed(2)}°S`}, {selectedSite.longitude.toFixed(2)}°E
          {selectedSite.diameter_km ? ` • Crater Ø: ${selectedSite.diameter_km} km` : ''}
        </div>
      </div>

      {/* Top Right: Layer Switcher & Zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 pointer-events-auto">
        {/* Layer Buttons */}
        <div className="flex items-center space-x-1 bg-space-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-xs font-mono shadow-lg">
          <button
            onClick={() => setActiveLayerKey('wac_global')}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeLayerKey === 'wac_global'
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LRO WAC Photo
          </button>
          <button
            onClick={() => setActiveLayerKey('lola_shade')}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeLayerKey === 'lola_shade'
                ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LOLA Topography
          </button>
        </div>

        {/* Zoom & Center Actions */}
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 rounded-lg bg-space-950/90 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 rounded-lg bg-space-950/90 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {selectedSite.moontrek_url && (
            <a
              href={selectedSite.moontrek_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-mono transition shadow-glow-cyan"
              title="Open full 3D viewer on NASA Moon Trek"
            >
              <span>NASA Trek 3D</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Bottom Bar: Instructions & Pin Legend */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 bg-space-950/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono pointer-events-auto">
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-cyan-300">Selected Site</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Artemis/CLPS Candidate</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-slate-300">Permanently Shadowed (PSR)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Historic Landing</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Click any crater to navigate • Click anywhere on surface to set custom coordinates
        </div>
      </div>
    </div>
  );
};
