import React from 'react';
import { SiteComparisonDashboard } from '../components/comparison/SiteComparisonDashboard';
import { GitCompare, Award } from 'lucide-react';

export const SiteComparisonPage: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase">
            <GitCompare className="w-4 h-4" />
            <span>Mission Planning Decision Support System</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
            Side-by-Side Candidate Site Comparison & Ranking
          </h2>
        </div>

        <div className="text-xs font-mono text-slate-400">
          <span>Faustini Rim A vs Connecting Ridge vs Malapert</span>
        </div>
      </div>

      <SiteComparisonDashboard />
    </div>
  );
};
