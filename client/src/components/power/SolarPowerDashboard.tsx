import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { 
  Sun, 
  BatteryCharging, 
  Zap, 
  Clock, 
  RotateCw, 
  Sliders, 
  Info,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const SolarPowerDashboard: React.FC = () => {
  const { 
    analysisData, 
    currentTimestampIndex, 
    panelConfig, 
    setPanelConfig 
  } = useMissionStore();

  const solar = analysisData?.solar;
  const curPoint = solar?.timeline?.[currentTimestampIndex];
  const windows = solar?.windows || [];
  const timeline = solar?.timeline || [];

  // SVG dimensions for Power curve
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 55 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxPower = Math.max(100, ...timeline.map((p) => p.instantaneous_power_w * 1.15));

  const scaleX = (idx: number) => padding.left + (idx / Math.max(1, timeline.length - 1)) * plotWidth;
  const scaleY = (p: number) => padding.top + ((maxPower - p) / maxPower) * plotHeight;

  // Build Power area polygon
  let powerAreaPath = '';
  let powerLinePath = '';
  if (timeline.length > 0) {
    const pts = timeline.map((pt, i) => `${scaleX(i)},${scaleY(pt.instantaneous_power_w)}`);
    powerLinePath = `M ${pts.join(' L ')}`;
    powerAreaPath = `M ${scaleX(0)},${scaleY(0)} L ${pts.join(' L ')} L ${scaleX(timeline.length - 1)},${scaleY(0)} Z`;
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        {/* Metric 1: Illumination % */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>SUNLIGHT AVAILABILITY</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {solar ? `${solar.sunlight_percentage}%` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {solar ? `${solar.sunlight_hours}h of ${solar.total_hours}h analyzed` : 'Calculating...'}
          </div>
        </div>

        {/* Metric 2: Accumulated Energy */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>TOTAL ENERGY</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {solar ? `${solar.accumulated_energy_kwh} kWh` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {solar ? `${solar.accumulated_energy_wh.toFixed(0)} Watt-hours integrated` : 'Calculating...'}
          </div>
        </div>

        {/* Metric 3: Longest Sunlight Window */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>MAX CONTINUOUS SUN</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {solar ? `${solar.max_continuous_sunlight_hours}h` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Uninterrupted generation window
          </div>
        </div>

        {/* Metric 4: Longest Shadow Window */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>LONGEST SHADOW</span>
            <BatteryCharging className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {solar ? `${solar.longest_shadow_hours}h` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Battery storage sizing requirement
          </div>
        </div>
      </div>

      {/* Main Power Generation Curve Chart */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-space-950/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-mono uppercase font-semibold text-slate-200 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instantaneous Solar Power Curve P(t)</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              P(t) = A × η × S(t) × max(0, cos θ_inc) • S(t) = 1361 W/m² (AM0 Solar Constant)
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-space-900 px-3 py-1 rounded border border-slate-800">
            Current Power:{' '}
            <span className="text-amber-400 font-bold">
              {curPoint?.instantaneous_power_w?.toFixed(1) ?? '0.0'} W
            </span>
            {' • '}
            Incidence:{' '}
            <span className="text-cyan-400">
              {curPoint?.incidence_angle_deg?.toFixed(1) ?? '90.0'}°
            </span>
          </div>
        </div>

        {/* Power SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[650px] font-mono select-none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
              const pVal = frac * maxPower;
              const y = scaleY(pVal);
              return (
                <g key={frac}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10">
                    {pVal.toFixed(0)} W
                  </text>
                </g>
              );
            })}

            {/* Power Area */}
            {powerAreaPath && (
              <path d={powerAreaPath} fill="rgba(245, 158, 11, 0.15)" />
            )}

            {/* Power Line */}
            {powerLinePath && (
              <path d={powerLinePath} fill="none" stroke="#f59e0b" strokeWidth={2} />
            )}

            {/* Scrubber vertical line */}
            {timeline.length > 0 && (
              <line
                x1={scaleX(currentTimestampIndex)}
                y1={padding.top}
                x2={scaleX(currentTimestampIndex)}
                y2={height - padding.bottom}
                stroke="#00f0ff"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            )}

            {/* Active Data Point Circle */}
            {curPoint && (
              <circle
                cx={scaleX(currentTimestampIndex)}
                cy={scaleY(curPoint.instantaneous_power_w)}
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
      </div>

      {/* Solar Panel Hardware Configuration Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel Parameters Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/80 space-y-4">
          <h4 className="text-xs font-mono font-semibold uppercase text-slate-200 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Photovoltaic Panel Setup</span>
          </h4>

          <div className="space-y-3 font-mono text-xs">
            {/* Area */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Panel Area (A):</span>
                <span className="text-cyan-400">{panelConfig.area_m2} m²</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={panelConfig.area_m2}
                onChange={(e) => setPanelConfig({ area_m2: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Efficiency */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Cell Efficiency (η):</span>
                <span className="text-cyan-400">{(panelConfig.efficiency * 100).toFixed(0)}% (Triple-Junction GaAs)</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.38"
                step="0.01"
                value={panelConfig.efficiency}
                onChange={(e) => setPanelConfig({ efficiency: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Tracking Mode */}
            <div>
              <label className="text-slate-300 block mb-1">Tracking Architecture:</label>
              <select
                value={panelConfig.orientation_mode}
                onChange={(e) => setPanelConfig({ orientation_mode: e.target.value as any })}
                className="w-full bg-space-900 border border-slate-700 rounded p-1.5 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              >
                <option value="vertical_tracking">Azimuthal Vertical Tracking (Recommended for South Pole)</option>
                <option value="horizontal">Horizontal Lay-Flat (Faces Zenith)</option>
                <option value="fixed_tilt">Fixed Tilt Array</option>
              </select>
            </div>
          </div>
        </div>

        {/* Illumination & Shadow Intervals Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-slate-800 bg-space-950/80 space-y-3">
          <h4 className="text-xs font-mono font-semibold uppercase text-slate-200 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Illumination vs Shadow Windows</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Terrain Obstruction Accounted
            </span>
          </h4>

          <div className="overflow-x-auto max-h-[190px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-space-900 text-slate-400 text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="p-2">Status</th>
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
                        w.type === 'sunlight'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {w.type}
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
      </div>
    </div>
  );
};
