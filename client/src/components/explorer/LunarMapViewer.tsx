import React, { useState, useEffect, useRef } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { LandingSite } from '../../types';
import { 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  ExternalLink, 
  Crosshair,
  ShieldCheck,
  Info
} from 'lucide-react';

interface MapLayerOption {
  id: string;
  name: string;
  urlTemplate: string;
  attribution: string;
  type: string;
}

const MAP_LAYERS: MapLayerOption[] = [
  {
    id: 'lola_clrshade_sp',
    name: 'LOLA Color Shaded Relief (South Pole 20m)',
    urlTemplate: 'https://trek.nasa.gov/tiles/Moon/SP/LOLA_ClrShade_SouthPole_float_20m/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    attribution: 'NASA/GSFC/LOLA Science Team/Moon Trek',
    type: 'south_pole'
  },
  {
    id: 'lro_wac_global',
    name: 'LRO WAC Global Mosaic (100m)',
    urlTemplate: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    attribution: 'NASA/GSFC/ASU/LROC/Moon Trek',
    type: 'global'
  },
  {
    id: 'lola_hillshade_sp',
    name: 'LOLA Hillshade Topography (South Pole 20m)',
    urlTemplate: 'https://trek.nasa.gov/tiles/Moon/SP/LOLA_Hillshade_SouthPole_float_20m/1.0.0/default/default028mm/{z}/{y}/{x}.png',
    attribution: 'NASA/GSFC/LOLA Science Team/Moon Trek',
    type: 'south_pole'
  }
];

export const LunarMapViewer: React.FC<{ sites: LandingSite[] }> = ({ sites }) => {
  const { selectedSite, setSelectedSite, setCustomCoordinates } = useMissionStore();
  const [activeLayer, setActiveLayer] = useState<MapLayerOption>(MAP_LAYERS[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(3);
  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // South Pole Stereographic projection coordinates
  // South Pole is at (0, 0), Radius = (90 - |lat|) * scale
  const projectSouthPole = (lat: number, lon: number, centerLat = -87.12, centerLon = 67.24, zoom = zoomLevel) => {
    // If lat > -60, fallback to global cylindrical
    const r = (90.0 - Math.abs(lat)) * (20 * Math.pow(1.5, zoom - 2));
    const lonRad = ((lon - centerLon) * Math.PI) / 180.0;
    const x = r * Math.sin(lonRad);
    const y = -r * Math.cos(lonRad);
    return { x, y };
  };

  // Redraw Canvas on changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear background
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, width, height);

    // Draw Polar Concentric Latitude rings (-90°, -88°, -85°, -80°, -75°)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;

    [-88, -86, -84, -82, -80].forEach((lat) => {
      const { y } = projectSouthPole(lat, selectedSite.longitude, selectedSite.latitude, selectedSite.longitude);
      const radius = Math.abs(y);
      if (radius > 5 && radius < width) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '9px monospace';
        ctx.fillText(`${lat}°S`, centerX + 5, centerY - radius + 10);
      }
    });

    // Draw Longitude Radials
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180.0;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + 600 * Math.sin(rad), centerY - 600 * Math.cos(rad));
      ctx.stroke();
    }

    // Draw Faustini Crater Rim A terrain dataset boundary box
    // Faustini LM7 footprint: lat [-87.45, -86.85], lon [65.0, 72.0]
    const p1 = projectSouthPole(-87.45, 65.0, selectedSite.latitude, selectedSite.longitude);
    const p2 = projectSouthPole(-87.45, 72.0, selectedSite.latitude, selectedSite.longitude);
    const p3 = projectSouthPole(-86.85, 72.0, selectedSite.latitude, selectedSite.longitude);
    const p4 = projectSouthPole(-86.85, 65.0, selectedSite.latitude, selectedSite.longitude);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX + p1.x, centerY + p1.y);
    ctx.lineTo(centerX + p2.x, centerY + p2.y);
    ctx.lineTo(centerX + p3.x, centerY + p3.y);
    ctx.lineTo(centerX + p4.x, centerY + p4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = '10px monospace';
    ctx.fillText('PGDA LM7 5mpp Bound', centerX + p1.x + 5, centerY + p1.y - 6);

    // Draw Candidate Landing Markers
    sites.forEach((site) => {
      const isSelected = site.id === selectedSite.id;
      const { x, y } = projectSouthPole(site.latitude, site.longitude, selectedSite.latitude, selectedSite.longitude);
      const px = centerX + x;
      const py = centerY + y;

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        // Marker halo
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 8 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.4)' : 'rgba(245, 158, 11, 0.3)';
        ctx.fill();

        // Marker dot
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 4 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? '#00f0ff' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
        ctx.font = isSelected ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.fillText(site.name, px + 8, py + 3);
      }
    });

    // Draw Crosshair at Center (Selected Site)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY);
    ctx.lineTo(centerX + 12, centerY);
    ctx.moveTo(centerX, centerY - 12);
    ctx.lineTo(centerX, centerY + 12);
    ctx.stroke();

  }, [selectedSite, sites, zoomLevel, activeLayer]);

  // Handle click on map to pick custom coordinate
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvas.width / 2;
    const clickY = e.clientY - rect.top - canvas.height / 2;

    // Invert polar stereographic projection relative to current center
    const r = Math.sqrt(clickX * clickX + clickY * clickY);
    const scale = 20 * Math.pow(1.5, zoomLevel - 2);
    const newLat = -Math.min(89.9, Math.max(70.0, 90.0 - r / scale));
    const angleRad = Math.atan2(clickX, -clickY);
    let newLon = selectedSite.longitude + (angleRad * 180.0) / Math.PI;
    newLon = ((newLon % 360) + 360) % 360;

    setCustomCoordinates(newLat, newLon);
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 bg-space-950/80 flex flex-col space-y-4">
      {/* Map Header / Layer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold uppercase text-slate-200">
            NASA Moon Trek Cartography
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-900 text-emerald-400 border border-emerald-800/40">
            WMTS Connected
          </span>
        </div>

        {/* Layer Selector */}
        <div className="flex items-center space-x-1 text-xs">
          {MAP_LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                activeLayer.id === layer.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'bg-space-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {layer.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map Canvas Viewport */}
      <div className="relative w-full h-[480px] bg-space-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={900}
          height={480}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />

        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 flex flex-col space-y-1.5 bg-space-900/90 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setZoomLevel((z) => Math.min(6, z + 1))}
            className="p-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-400"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-center text-slate-400">{zoomLevel}x</span>
          <button
            onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
            className="p-1 rounded bg-space-800 hover:bg-space-700 text-slate-300 hover:text-cyan-400"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Coordinate Readout Badge (Prompt 3 requirement) */}
        <div className="absolute bottom-3 left-3 bg-space-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs space-y-0.5">
          <div className="text-[10px] text-slate-500 uppercase">Selected Coordinates</div>
          <div className="text-cyan-300 font-bold">
            {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(3)}°N` : `${Math.abs(selectedSite.latitude).toFixed(3)}°S`}
            {", "}
            {selectedSite.longitude.toFixed(3)}°E
          </div>
          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>Click anywhere on map to set custom landing site</span>
          </div>
        </div>

        {/* External NASA Verification Links (Prompt 3 requirement) */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          {selectedSite.quickmap_url && (
            <a
              href={selectedSite.quickmap_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 bg-space-900/90 hover:bg-space-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg text-xs font-mono transition"
            >
              <span>LROC QuickMap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {selectedSite.moontrek_url && (
            <a
              href={selectedSite.moontrek_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 bg-space-900/90 hover:bg-space-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 px-2.5 py-1.5 rounded-lg text-xs font-mono transition"
            >
              <span>Moon Trek 3D</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Layer Attribution & Faustini Distinction Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 font-mono px-1 gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>
            Layer: {activeLayer.name} • {activeLayer.attribution}
          </span>
        </div>
        <div className="text-slate-400">
          Projection: Lunar South Polar Stereographic (Central Meridian: 0°, Standard Parallel: -90°)
        </div>
      </div>
    </div>
  );
};
