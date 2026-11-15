import React from 'react';
import { SolarPowerDashboard } from '../components/power/SolarPowerDashboard';
import { TimelineController } from '../components/common/TimelineController';
import { SunMedium, Zap, ShieldCheck } from 'lucide-react';
import { useMissionStore } from '../stores/missionStore';

export const PowerAnalysisPage: React.FC = () => {
  const { selectedSite } = useMissionStore();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 uppercase">
            <SunMedium className="w-4 h-4" />
            <span>Lunar Solar Photovoltaic Intelligence</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            Solar Power Generation & Illumination Windows
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Target:</span>
          <span className="text-amber-300 font-bold">{selectedSite.name}</span>
        </div>
      </div>

      <TimelineController />
      <SolarPowerDashboard />
    </div>
  );
};
