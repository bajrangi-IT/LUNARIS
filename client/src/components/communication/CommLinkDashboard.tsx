import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { 
  Globe2, 
  Radio, 
  Signal, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ShieldAlert,
  Info
} from 'lucide-react';

export const CommLinkDashboard: React.FC = () => {
  const { 
    analysisData, 
    currentTimestampIndex 
  } = useMissionStore();

  const comm = analysisData?.communication;
  const curPoint = comm?.timeline?.[currentTimestampIndex];
  const windows = comm?.windows || [];
  const timeline = comm?.timeline || [];

  // SVG dimensions for Earth Clearance & Elevation chart
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minEl = -2.0;
  const maxEl = 14.0;

  const scaleX = (idx: number) => padding.left + (idx / Math.max(1, timeline.length - 1)) * plotWidth;
  const scaleY = (el: number) => padding.top + ((maxEl - el) / (maxEl - minEl)) * plotHeight;

  // Build Earth Elevation line and Terrain Clearance line
  const earthLinePath = timeline.length > 0
    ? `M ${timeline.map((p, i) => `${scaleX(i)},${scaleY(p.earth_elevation_deg)}`).join(' L ')}`
    : '';

  const clearanceLinePath = timeline.length > 0
    ? `M ${timeline.map((p, i) => `${scaleX(i)},${scaleY(p.terrain_clearance_deg)}`).join(' L ')}`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Metric 1: Line-of-sight Availability */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>DTE LINE-OF-SIGHT</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {comm ? `${comm.los_percentage}%` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {comm ? `${comm.los_hours}h of ${comm.total_hours}h analyzed` : 'Calculating...'}
          </div>
        </div>

        {/* Metric 2: Max Continuous Comm Window */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>MAX CONTINUOUS DTE</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {comm ? `${comm.max_continuous_los_hours}h` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Unbroken direct Earth link
          </div>
        </div>

        {/* Metric 3: Max Blackout Duration */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>LONGEST BLACKOUT</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold ${comm?.max_blackout_hours === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {comm ? `${comm.max_blackout_hours}h` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Duration requiring relay satellite
          </div>
        </div>

        {/* Metric 4: Earth Angular Radius */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>EARTH ANGULAR DISC</span>
            <Globe2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300">
            {comm ? `~${(comm.earth_angular_radius_deg * 2).toFixed(2)}°` : '1.90°'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Subtended diameter (~0.95° radius)
          </div>
        </div>
      </div>

      {/* Earth Elevation & Terrain Clearance Chart */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-space-950/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-mono uppercase font-semibold text-slate-200 flex items-center space-x-2">
              <Signal className="w-4 h-4 text-cyan-400" />
              <span>Direct-to-Earth Line-of-Sight & Terrain Clearance</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Target 399 (Earth) Observer Ephemeris vs Local LOLA Terrain Horizon Profile
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-space-900 px-3 py-1 rounded border border-slate-800 flex items-center space-x-3">
            <div>
              Earth Elevation:{' '}
              <span className="text-cyan-400 font-bold">
                {curPoint?.earth_elevation_deg?.toFixed(2) ?? '--'}°
              </span>
            </div>
            <div>
              Disc Status:{' '}
              <span className={`font-bold ${
                curPoint?.disc_status === 'FULL_DISC' ? 'text-emerald-400' : (curPoint?.disc_status === 'PARTIAL_LIMB' ? 'text-amber-400' : 'text-red-400')
              }`}>
                {curPoint?.disc_status ?? '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[650px] font-mono select-none">
            {/* Grid lines */}
            {[-2, 0, 4, 8, 12].map((el) => {
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

            {/* Earth Elevation Line */}
            {earthLinePath && (
              <path d={earthLinePath} fill="none" stroke="#00f0ff" strokeWidth={2.2} />
            )}

            {/* Clearance Line */}
            {clearanceLinePath && (
              <path d={clearanceLinePath} fill="none" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" />
            )}

            {/* Scrubber vertical line */}
            {timeline.length > 0 && (
              <line
                x1={scaleX(currentTimestampIndex)}
                y1={padding.top}
                x2={scaleX(currentTimestampIndex)}
                y2={height - padding.bottom}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            )}

            {/* Current point */}
            {curPoint && (
              <circle
                cx={scaleX(currentTimestampIndex)}
                cy={scaleY(curPoint.earth_elevation_deg)}
                r={5}
                fill="#00f0ff"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            )}

            {/* X-axis labels */}
            {timeline.filter((_, idx) => idx % Math.max(1, Math.floor(timeline.length / 6)) === 0).map((pt, i, arr) => {
              const actualIdx = timeline.indexOf(pt);
              return (
                <text
                  key={pt.timestamp_utc}
                  x={scaleX(actualIdx)}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {pt.timestamp_utc.split(' ')[1] || pt.timestamp_utc}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end space-x-6 text-[11px] font-mono text-slate-400 mt-2">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span>Earth Elevation</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 border-dashed" />
            <span>Terrain Clearance (Above Local Relief)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-sky-400" />
            <span>Horizon Line (0°)</span>
          </span>
        </div>
      </div>

      {/* DTE Windows Table & Radio Disclaimer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Windows Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/80 space-y-3">
          <h4 className="text-xs font-mono font-semibold uppercase text-slate-200 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Direct-to-Earth Communication Windows</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Continuous Line-of-Sight Periods
            </span>
          </h4>

          <div className="overflow-x-auto max-h-[190px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-space-900 text-slate-400 text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="p-2">Link Window</th>
                  <th className="p-2">Start Time (UTC)</th>
                  <th className="p-2">End Time (UTC)</th>
                  <th className="p-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {windows.map((w, idx) => (
                  <tr key={idx} className="hover:bg-space-900/40">
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        w.type === 'line_of_sight'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          : 'bg-red-950/80 text-red-400 border border-red-800/40'
                      }`}>
                        {w.type === 'line_of_sight' ? 'LINE-OF-SIGHT' : 'BLACKOUT'}
                      </span>
                    </td>
                    <td className="p-2 text-slate-300">{w.start_time_utc}</td>
                    <td className="p-2 text-slate-300">{w.end_time_utc}</td>
                    <td className="p-2 font-bold text-cyan-300">{w.duration_hours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technical Disclaimer Card (Prompt 8B requirement) */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/80 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase text-amber-300 flex items-center space-x-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Engineering Assumptions</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              This engine calculates <strong>geometric line-of-sight and terrain horizon clearance</strong>.
              It models Earth disc subtension (~1.9° diameter) and lunar curvature corrections.
            </p>
            <div className="mt-3 p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-200/90 leading-tight">
              <strong>Operational Disclaimer:</strong> Geometric line-of-sight does not guarantee active radio communication. Closing the link requires RF link-budget closure (EIRP, G/T, carrier frequency, atmospheric attenuation), Deep Space Network (DSN) tracking schedule, and lander high-gain antenna pointing accuracy.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500">
            Source: NASA JPL Horizons System (coord@301, Target 399)
          </div>
        </div>
      </div>
    </div>
  );
};
