import React from 'react';
import { CommLinkDashboard } from '../components/communication/CommLinkDashboard';
import { TimelineController } from '../components/common/TimelineController';
import { RadioTower, Globe2, Signal } from 'lucide-react';
import { useMissionStore } from '../stores/missionStore';

export const CommunicationPage: React.FC = () => {
  const { selectedSite } = useMissionStore();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase">
            <RadioTower className="w-4 h-4" />
            <span>Direct-to-Earth Communication Link Engine</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            Line-of-Sight Visibility & Blackout Intervals
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Target:</span>
          <span className="text-cyan-300 font-bold">{selectedSite.name}</span>
        </div>
      </div>

      <TimelineController />
      <CommLinkDashboard />
    </div>
  );
};
