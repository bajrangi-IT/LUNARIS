import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMissionStore } from './stores/missionStore';
import { TopNavbar } from './components/layout/TopNavbar';
import { Sidebar } from './components/layout/Sidebar';

import { MissionControlPage } from './pages/MissionControlPage';
import { LunarExplorerPage } from './pages/LunarExplorerPage';
import { ObservatoryPage } from './pages/ObservatoryPage';
import { PowerAnalysisPage } from './pages/PowerAnalysisPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { SiteComparisonPage } from './pages/SiteComparisonPage';
import { MissionScenariosPage } from './pages/MissionScenariosPage';
import { MethodologyPage } from './pages/MethodologyPage';

export const App: React.FC = () => {
  const { fetchAnalysis, isLoadingAnalysis, analysisError } = useMissionStore();

  useEffect(() => {
    fetchAnalysis();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-space-950 text-slate-200 sci-grid-bg">
        {/* Top Mission Status Bar */}
        <TopNavbar />

        {/* Global Loading / Error Bar */}
        {isLoadingAnalysis && (
          <div className="h-0.5 bg-cyan-950 w-full overflow-hidden z-50">
            <div className="h-full bg-cyan-400 animate-pulse w-1/3" />
          </div>
        )}

        {analysisError && (
          <div className="bg-red-950/80 border-b border-red-800 text-red-200 text-xs px-4 py-1.5 flex items-center justify-between font-mono z-50">
            <span>Alert: {analysisError}</span>
            <button
              onClick={() => fetchAnalysis()}
              className="underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Workstation Body: Sidebar + Dynamic Content */}
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <Routes>
              <Route path="/" element={<Navigate to="/mission-control" replace />} />
              <Route path="/mission-control" element={<MissionControlPage />} />
              <Route path="/lunar-explorer" element={<LunarExplorerPage />} />
              <Route path="/sun-earth-observatory" element={<ObservatoryPage />} />
              <Route path="/power-analysis" element={<PowerAnalysisPage />} />
              <Route path="/communication-analysis" element={<CommunicationPage />} />
              <Route path="/site-comparison" element={<SiteComparisonPage />} />
              <Route path="/mission-scenarios" element={<MissionScenariosPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="*" element={<Navigate to="/mission-control" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
