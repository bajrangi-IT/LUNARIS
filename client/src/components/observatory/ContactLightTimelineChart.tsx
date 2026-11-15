import React, { useMemo } from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { Sparkles, Sun, Radio, ShieldCheck, Clock, Zap } from 'lucide-react';

interface ContactLightTimelineProps {
  className?: string;
}

export const ContactLightTimelineChart: React.FC<ContactLightTimelineProps> = ({ className = '' }) => {
  const { analysisData, currentTimestampIndex, setCurrentTimestampIndex } = useMissionStore();

  const solarTimeline = analysisData?.solar?.timeline || [];
  const commTimeline = analysisData?.communication?.timeline || [];
  const jointOps = analysisData?.joint_operations;

  // Build combined timeline points
  const points = useMemo(() => {
    if (jointOps?.timeline && jointOps.timeline.length > 0) {
      return jointOps.timeline;
    }
    const count = Math.min(solarTimeline.length, commTimeline.length);
    const res = [];
    for (let i = 0; i < count; i++) {
      const s = solarTimeline[i];
      const c = commTimeline[i];
      const isLight = s?.effective_visible ? 1 : 0;
      const isContact = c?.has_line_of_sight ? 1 : 0;
      res.push({
        timestamp_utc: s?.timestamp_utc || c?.timestamp_utc || `T+${i * 0.5}h`,
        light: isLight,
        contact: isContact,
        joint: isLight && isContact ? 1 : 0,
        solar_elevation_deg: s?.solar_elevation_deg ?? 0,
        solar_clearance_deg: s?.terrain_clearance_deg ?? 0,
        earth_elevation_deg: c?.earth_elevation_deg ?? 0,
        earth_clearance_deg: c?.terrain_clearance_deg ?? 0,
      });
    }
    return res;
  }, [jointOps, solarTimeline, commTimeline]);

  // Statistics
  const totalPoints = points.length;
  const jointPointsCount = points.filter((p) => p.joint === 1).length;
  const lightPointsCount = points.filter((p) => p.light === 1).length;
  const contactPointsCount = points.filter((p) => p.contact === 1).length;

  const jointHours = jointOps?.total_joint_hours ?? Math.round(jointPointsCount * 0.5 * 10) / 10;
  const maxContinuousJoint = jointOps?.max_continuous_joint_hours ?? 0;
  const lightPct = totalPoints > 0 ? Math.round((lightPointsCount / totalPoints) * 100) : 0;
  const contactPct = totalPoints > 0 ? Math.round((contactPointsCount / totalPoints) * 100) : 0;

  // SVG dimensions
  const width = 800;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 45, left: 45 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Build SVG path strings with square-wave step behavior
  const { lightPath, contactPath, jointShades, timeLabels } = useMemo(() => {
    if (totalPoints === 0) {
      return { lightPath: '', contactPath: '', jointShades: [], timeLabels: [] };
    }

    const xStep = plotWidth / Math.max(1, totalPoints - 1);
    const yOff = padding.top;
    const yHigh = yOff + 20; // Active (1.0)
    const yLow = yOff + plotHeight - 10; // Inactive (0.0)

    let lPath = '';
    let cPath = '';
    const shades: { x: number; w: number }[] = [];
    let jointStartIdx: number | null = null;

    points.forEach((pt, i) => {
      const x = padding.left + i * xStep;
      const yL = pt.light === 1 ? yHigh : yLow;
      const yC = pt.contact === 1 ? yHigh : yLow;

      if (i === 0) {
        lPath += `M ${x} ${yL}`;
        cPath += `M ${x} ${yC}`;
      } else {
        const prevX = padding.left + (i - 1) * xStep;
        // Step line: horizontal to current X, then vertical to current Y
        lPath += ` H ${x} V ${yL}`;
        cPath += ` H ${x} V ${yC}`;
      }

      // Joint window shading
      if (pt.joint === 1) {
        if (jointStartIdx === null) jointStartIdx = i;
      } else {
        if (jointStartIdx !== null) {
          const startX = padding.left + jointStartIdx * xStep;
          const endX = x;
          shades.push({ x: startX, w: Math.max(xStep, endX - startX) });
          jointStartIdx = null;
        }
      }
    });

    if (jointStartIdx !== null) {
      const startX = padding.left + jointStartIdx * xStep;
      const endX = padding.left + (totalPoints - 1) * xStep;
      shades.push({ x: startX, w: Math.max(xStep, endX - startX) });
    }

    // Time labels (up to 5 evenly spaced across span)
    const labels = [];
    const stepCount = Math.min(5, totalPoints);
    for (let k = 0; k < stepCount; k++) {
      const idx = Math.floor((k / (stepCount - 1 || 1)) * (totalPoints - 1));
      const pt = points[idx];
      if (pt) {
        labels.push({
          x: padding.left + idx * xStep,
          text: pt.timestamp_utc.replace('T', ' '),
        });
      }
    }

    return { lightPath: lPath, contactPath: cPath, jointShades: shades, timeLabels: labels };
  }, [points, totalPoints, plotWidth, plotHeight, padding.left, padding.top]);

  // Current scrubber X position
  const currentScrubberX = useMemo(() => {
    if (totalPoints <= 1) return null;
    const clampedIdx = Math.max(0, Math.min(totalPoints - 1, currentTimestampIndex));
    const xStep = plotWidth / (totalPoints - 1);
    return padding.left + clampedIdx * xStep;
  }, [totalPoints, currentTimestampIndex, plotWidth, padding.left]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (totalPoints <= 1) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - svgRect.left;
    const relX = (clickX / svgRect.width) * width - padding.left;
    const fraction = Math.max(0, Math.min(1, relX / plotWidth));
    const targetIdx = Math.round(fraction * (totalPoints - 1));
    setCurrentTimestampIndex(targetIdx);
  };

  const activePoint = points[currentTimestampIndex] || points[0];

  return (
    <div className={`glass-panel rounded-xl border border-slate-800 bg-space-950/90 flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="p-3 sm:p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Operations Timeline
            </h4>
          </div>
          <p className="text-xs sm:text-sm font-sans font-medium text-slate-300 mt-0.5">
            Solar, communication and simultaneous windows.
          </p>
        </div>

        {/* Live Active Scrubber Status */}
        {activePoint && (
          <div className="text-right font-mono text-xs hidden sm:block">
            <div className="text-slate-400 text-[11px]">
              Scrubber: <span className="text-slate-100 font-bold">{activePoint.timestamp_utc}</span>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-0.5 text-[11px]">
              <span className={activePoint.light ? 'text-red-400 font-bold' : 'text-slate-500'}>
                Light: {activePoint.light ? 'ON' : 'OFF'}
              </span>
              <span className="text-slate-600">•</span>
              <span className={activePoint.contact ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                Contact: {activePoint.contact ? 'ON' : 'OFF'}
              </span>
              <span className="text-slate-600">•</span>
              <span className={activePoint.joint ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                Joint: {activePoint.joint ? 'ACTIVE' : 'NONE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-center overflow-hidden min-h-[200px]">
        {totalPoints === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
            <Clock className="w-6 h-6 mb-2 opacity-50" />
            <span>Ephemeris analysis in progress...</span>
          </div>
        ) : (
          <div className="w-full relative">
            {/* Title from screenshot: "Contact and Light Times" */}
            <div className="text-center font-sans font-bold text-slate-100 text-sm tracking-wide mb-1">
              Contact and Light Times
            </div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto cursor-crosshair select-none"
              onClick={handleSvgClick}
            >
              {/* Background Grid Lines */}
              <line
                x1={padding.left}
                y1={padding.top + 20}
                x2={width - padding.right}
                y2={padding.top + 20}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={padding.top + plotHeight - 10}
                x2={width - padding.right}
                y2={padding.top + plotHeight - 10}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Joint Operational Window Shaded Blocks */}
              {jointShades.map((shade, i) => (
                <rect
                  key={i}
                  x={shade.x}
                  y={padding.top + 10}
                  width={shade.w}
                  height={plotHeight - 15}
                  fill="#10b981"
                  fillOpacity="0.12"
                />
              ))}

              {/* Y Axis Labels */}
              <text
                x={padding.left - 10}
                y={padding.top + 24}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="end"
              >
                1.0
              </text>
              <text
                x={padding.left - 10}
                y={padding.top + plotHeight - 6}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="end"
              >
                0.0
              </text>

              {/* X Axis Step Grid Lines and Labels */}
              {timeLabels.map((lbl, idx) => (
                <g key={idx}>
                  <line
                    x1={lbl.x}
                    y1={padding.top + 10}
                    x2={lbl.x}
                    y2={padding.top + plotHeight - 5}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={lbl.x}
                    y={padding.top + plotHeight + 15}
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="IBM Plex Mono, monospace"
                    textAnchor="middle"
                  >
                    {lbl.text}
                  </text>
                </g>
              ))}

              {/* Axis Label: Time */}
              <text
                x={width / 2}
                y={padding.top + plotHeight + 30}
                fill="#64748b"
                fontSize="10"
                fontFamily="Manrope, sans-serif"
                fontWeight="600"
                textAnchor="middle"
              >
                Time (UTC)
              </text>

              {/* -- Light Square Wave (Red Dashed) */}
              <path
                d={lightPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.4"
                strokeDasharray="6 4"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />

              {/* — Contact Square Wave (Blue Solid) */}
              <path
                d={contactPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.4"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />

              {/* Current Time Scrubber Line */}
              {currentScrubberX !== null && (
                <g>
                  <line
                    x1={currentScrubberX}
                    y1={padding.top}
                    x2={currentScrubberX}
                    y2={padding.top + plotHeight - 5}
                    stroke="#00f0ff"
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={currentScrubberX}
                    cy={padding.top + (activePoint?.joint ? 20 : 60)}
                    r="4"
                    fill="#00f0ff"
                  />
                </g>
              )}
            </svg>

            {/* Legend exact matching screenshot: "-- Light" (red dashed) and "— Contact" (blue solid) */}
            <div className="flex items-center justify-center space-x-8 mt-1 text-xs font-sans font-medium text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-0 border-t-2 border-dashed border-red-500 inline-block" />
                <span className="text-slate-200">Light</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-0 border-t-2 border-solid border-blue-500 inline-block" />
                <span className="text-slate-200">Contact</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded-sm inline-block" />
                <span className="text-emerald-300">Simultaneous Window</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 sm:p-3 bg-space-900/60 border-t border-slate-800/80 font-mono text-xs shrink-0">
        <div className="p-2 rounded bg-space-950/60 border border-slate-800/60 min-w-0 overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">Simultaneous Window</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate">{jointHours} hrs</div>
          <div className="text-[10px] text-slate-400 truncate">Power + Comm link</div>
        </div>

        <div className="p-2 rounded bg-space-950/60 border border-slate-800/60 min-w-0 overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">Max Continuous</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5 truncate">{maxContinuousJoint} hrs</div>
          <div className="text-[10px] text-slate-400 truncate">Uninterrupted mission</div>
        </div>

        <div className="p-2 rounded bg-space-950/60 border border-slate-800/60 min-w-0 overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">Solar Illumination</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5 truncate">{lightPct}%</div>
          <div className="text-[10px] text-slate-400 truncate">Unshadowed sunlight</div>
        </div>

        <div className="p-2 rounded bg-space-950/60 border border-slate-800/60 min-w-0 overflow-hidden">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">Direct Earth LOS</div>
          <div className="text-sm font-bold text-blue-400 mt-0.5 truncate">{contactPct}%</div>
          <div className="text-[10px] text-slate-400 truncate">Unobstructed link</div>
        </div>
      </div>
    </div>
  );
};
