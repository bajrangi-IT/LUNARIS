import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { Sun, Globe2, ShieldAlert, CheckCircle } from 'lucide-react';

export const PanoramicHorizonChart: React.FC = () => {
  const { analysisData, currentTimestampIndex } = useMissionStore();

  const horizonProfile = analysisData?.terrain?.profile || [];
  const solarTimeline = analysisData?.solar?.timeline || [];
  const commTimeline = analysisData?.communication?.timeline || [];

  const curSolar = solarTimeline[currentTimestampIndex];
  const curComm = commTimeline[currentTimestampIndex];

  // SVG Chart bounds:
  // Azimuth: 0 to 360 deg
  // Elevation: -5 to +20 deg
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minEl = -5.0;
  const maxEl = 15.0;

  const scaleX = (az: number) => padding.left + (az / 360.0) * plotWidth;
  const scaleY = (el: number) => padding.top + ((maxEl - el) / (maxEl - minEl)) * plotHeight;

  // Build Terrain Horizon Polygon Path
  let terrainPathD = '';
  if (horizonProfile.length > 0) {
    const points = horizonProfile.map((p) => `${scaleX(p.azimuth_deg)},${scaleY(p.horizon_elevation_deg)}`);
    terrainPathD = `M ${points[0]} L ${points.join(' L ')} L ${scaleX(360)},${scaleY(minEl)} L ${scaleX(0)},${scaleY(minEl)} Z`;
  }

  // Build Sun trajectory polyline
  const sunPathPoints = solarTimeline.map((p) => `${scaleX(p.solar_azimuth_deg)},${scaleY(p.solar_elevation_deg)}`).join(' ');

  // Build Earth trajectory polyline
  const earthPathPoints = commTimeline.map((p) => `${scaleX(p.earth_azimuth_deg)},${scaleY(p.earth_elevation_deg)}`).join(' ');

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 bg-space-950/70">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase text-slate-400">Panoramic Horizon & Celestial Elevation</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-900 text-cyan-400 border border-slate-800">
            360° Cylindrical Projection
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300">Sun Path</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-cyan-300">Earth Path</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className={`w-3 h-1 ${analysisData?.terrain?.available ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            <span>{analysisData?.terrain?.available ? 'PGDA LOLA Horizon' : 'Spherical Horizon'}</span>
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[650px] font-mono select-none">
          {/* Elevation Grid Lines */}
          {[-5, 0, 5, 10, 15].map((el) => {
            const y = scaleY(el);
            return (
              <g key={el}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={el === 0 ? '#38bdf8' : '#1e293b'}
                  strokeWidth={el === 0 ? 1.5 : 1}
                  strokeDasharray={el === 0 ? 'none' : '3 3'}
                />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10">
                  {el > 0 ? `+${el}°` : `${el}°`}
                </text>
              </g>
            );
          })}

          {/* Azimuth Cardinal Lines (N, E, S, W, N) */}
          {[
            { az: 0, label: '0° N' },
            { az: 90, label: '90° E' },
            { az: 180, label: '180° S' },
            { az: 270, label: '270° W' },
            { az: 360, label: '360° N' },
          ].map(({ az, label }) => {
            const x = scaleX(az);
            return (
              <g key={az}>
                <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="#1e293b" strokeWidth={1} />
                <text x={x} y={height - padding.bottom + 16} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  {label}
                </text>
              </g>
            );
          })}

          {/* Terrain Horizon Shaded Area */}
          {terrainPathD && (
            <path
              d={terrainPathD}
              fill="rgba(16, 185, 129, 0.12)"
              stroke={analysisData?.terrain?.available ? '#10b981' : '#64748b'}
              strokeWidth={1.8}
            />
          )}

          {/* Sun Trajectory Line */}
          {sunPathPoints && (
            <polyline
              points={sunPathPoints}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              opacity={0.65}
            />
          )}

          {/* Earth Trajectory Line */}
          {earthPathPoints && (
            <polyline
              points={earthPathPoints}
              fill="none"
              stroke="#00f0ff"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              opacity={0.65}
            />
          )}

          {/* Current Sun Marker */}
          {curSolar && (
            <g transform={`translate(${scaleX(curSolar.solar_azimuth_deg)}, ${scaleY(curSolar.solar_elevation_deg)})`}>
              <circle r={8} fill="#f59e0b" opacity={0.3} className="animate-ping" />
              <circle r={6} fill="#fbbf24" stroke="#ffffff" strokeWidth={1.5} />
              <text x={10} y={-4} fill="#fef08a" fontSize="10" fontWeight="bold">
                Sun ({curSolar.solar_elevation_deg.toFixed(1)}°)
              </text>
            </g>
          )}

          {/* Current Earth Marker */}
          {curComm && (
            <g transform={`translate(${scaleX(curComm.earth_azimuth_deg)}, ${scaleY(curComm.earth_elevation_deg)})`}>
              <circle r={8} fill="#0284c7" opacity={0.3} className="animate-ping" />
              <circle r={6} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} />
              <text x={10} y={-4} fill="#bae6fd" fontSize="10" fontWeight="bold">
                Earth ({curComm.earth_elevation_deg.toFixed(1)}°)
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
