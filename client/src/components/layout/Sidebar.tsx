import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Eye,
  SunMedium,
  RadioTower,
  GitCompare,
  SlidersHorizontal,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useMissionStore } from '../../stores/missionStore';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Mission Operations', path: '/mission-control', icon: LayoutDashboard, badge: '4-QUAD' },
  { name: 'Site & Date Comparison', path: '/site-comparison', icon: GitCompare, badge: 'Trade-Off' },
  { name: 'Lunar Basemap Explorer', path: '/lunar-explorer', icon: Compass, badge: 'WMTS' },
  { name: 'Data & Methodology', path: '/methodology', icon: BookOpen, badge: 'NASA API' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { selectedSite, analysisData } = useMissionStore();

  return (
    <aside
      className={`border-r border-slate-800 bg-space-950 flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top: Nav Menu */}
      <div className="flex-1 py-4">
        {/* Section title */}
        {!collapsed && (
          <div className="px-4 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Navigation Modules
          </div>
        )}

        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-900 border border-transparent'
                  }`
                }
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-space-800 text-cyan-400 border border-cyan-500/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Selected Target Quick View */}
        {!collapsed && (
          <div className="mt-8 mx-3 p-3 rounded-lg bg-space-900/60 border border-slate-800/80 text-xs">
            <div className="text-[10px] uppercase font-mono text-slate-500 mb-1 flex items-center justify-between">
              <span>Active Target</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LOCKED</span>
              </span>
            </div>
            <div className="font-semibold text-slate-200 truncate">{selectedSite.name}</div>
            <div className="font-mono text-[11px] text-cyan-400 mt-1">
              {selectedSite.latitude >= 0 ? `${selectedSite.latitude.toFixed(2)}°N` : `${Math.abs(selectedSite.latitude).toFixed(2)}°S`}
              {", "}
              {selectedSite.longitude.toFixed(2)}°E
            </div>
            {selectedSite.has_dem && (
              <div className="mt-2 text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">NASA PGDA LM7 High-Res</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom: Collapse Toggle & Status */}
      <div className="p-3 border-t border-slate-800/80 bg-space-900/40">
        {!collapsed && (
          <div className="mb-2 px-1 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>NASA HORIZONS</span>
            <span className="text-cyan-400">COORD@301</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-space-900 hover:bg-space-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition text-xs"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
