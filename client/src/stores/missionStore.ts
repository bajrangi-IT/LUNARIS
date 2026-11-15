import { create } from 'zustand';
import { LandingSite, FullAnalysisResponse, PanelConfig } from '../types';
import { api } from '../services/api';

// Initial focus: Faustini Rim A (LM7 Candidate) as mandated by Prompt 3
const INITIAL_SITE: LandingSite = {
  id: "faustini-rim-a",
  name: "Faustini Rim A (LM7 Candidate)",
  region: "South Pole",
  latitude: -87.12,
  longitude: 67.24,
  altitude_km: -0.85,
  has_dem: true,
  dem_product: "NASA PGDA LM7 5mpp (Faustini Rim A)",
  description: "High-illumination ridge on the rim of Faustini Crater. Priority landing site studied by NASA CLPS and evaluated in PGDA Product 78.",
  target_mission: "NASA CLPS / Artemis Science",
  type: "south_pole_candidate",
  quickmap_url: "https://quickmap.lroc.asu.edu/?extent=-87.3,66.5,-86.9,68.0",
  moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=67.24&y=-87.12&z=6&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A3031"
};

interface MissionState {
  selectedSite: LandingSite;
  isCustomLocation: boolean;
  observerHeight: number;
  timeWindow: {
    start: string;
    stop: string;
    step: string;
  };
  currentTimestampIndex: number;
  panelConfig: PanelConfig;
  isPlaying: boolean;
  playbackSpeed: number; // 1, 5, 15, 60
  bookmarks: LandingSite[];
  analysisData: FullAnalysisResponse | null;
  isLoadingAnalysis: boolean;
  analysisError: string | null;

  // Actions
  setSelectedSite: (site: LandingSite) => void;
  setCustomCoordinates: (lat: number, lon: number, alt?: number) => void;
  setObserverHeight: (height: number) => void;
  setTimeWindow: (start: string, stop: string, step?: string) => void;
  setCurrentTimestampIndex: (index: number) => void;
  stepTimeline: (direction: 1 | -1) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPanelConfig: (config: Partial<PanelConfig>) => void;
  addBookmark: (site: LandingSite) => void;
  removeBookmark: (siteId: string) => void;
  fetchAnalysis: () => Promise<void>;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  selectedSite: INITIAL_SITE,
  isCustomLocation: false,
  observerHeight: 2.0,
  timeWindow: {
    start: "2026-11-14 00:00",
    stop: "2026-11-16 00:00",
    step: "30m"
  },
  currentTimestampIndex: 0,
  panelConfig: {
    area_m2: 2.0,
    efficiency: 0.28,
    orientation_mode: "vertical_tracking",
    tilt_deg: 85.0,
    tilt_azimuth_deg: 0.0
  },
  isPlaying: false,
  playbackSpeed: 1,
  bookmarks: [INITIAL_SITE],
  analysisData: null,
  isLoadingAnalysis: false,
  analysisError: null,

  setSelectedSite: (site) => {
    set({ selectedSite: site, isCustomLocation: false, currentTimestampIndex: 0 });
    get().fetchAnalysis();
  },

  setCustomCoordinates: (lat, lon, alt = 0.0) => {
    // East-positive normalization
    const normLon = ((lon % 360) + 360) % 360;
    const customSite: LandingSite = {
      id: `custom-${lat.toFixed(3)}-${normLon.toFixed(3)}`,
      name: `Custom Site (${lat >= 0 ? `${lat.toFixed(3)}°N` : `${Math.abs(lat).toFixed(3)}°S`}, ${normLon.toFixed(3)}°E)`,
      region: lat <= -80 ? "South Polar Region" : (lat >= 80 ? "North Polar Region" : "Mid/Equatorial Latitudes"),
      latitude: lat,
      longitude: normLon,
      altitude_km: alt,
      has_dem: (-87.45 <= lat && lat <= -86.85 && 65.0 <= normLon && normLon <= 72.0),
      description: "User-defined custom lunar surface observer coordinates.",
      target_mission: "User Defined Evaluation",
      type: "custom",
      quickmap_url: `https://quickmap.lroc.asu.edu/?extent=${lat - 0.2},${normLon - 0.5},${lat + 0.2},${normLon + 0.5}`,
      moontrek_url: `https://trek.nasa.gov/moon/#v=0.1&x=${normLon}&y=${lat}&z=6`
    };
    set({ selectedSite: customSite, isCustomLocation: true, currentTimestampIndex: 0 });
    get().fetchAnalysis();
  },

  setObserverHeight: (height) => {
    set({ observerHeight: height });
    get().fetchAnalysis();
  },

  setTimeWindow: (start, stop, step = "30m") => {
    set({ timeWindow: { start, stop, step }, currentTimestampIndex: 0 });
    get().fetchAnalysis();
  },

  setCurrentTimestampIndex: (index) => {
    set({ currentTimestampIndex: index });
  },

  stepTimeline: (direction) => {
    const { currentTimestampIndex, analysisData } = get();
    if (!analysisData?.solar?.timeline?.length) return;
    const maxIdx = analysisData.solar.timeline.length - 1;
    const nextIdx = Math.max(0, Math.min(maxIdx, currentTimestampIndex + direction));
    set({ currentTimestampIndex: nextIdx });
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setPanelConfig: (config) => {
    set((state) => ({
      panelConfig: { ...state.panelConfig, ...config }
    }));
    get().fetchAnalysis();
  },

  addBookmark: (site) => {
    set((state) => {
      if (state.bookmarks.some(b => b.id === site.id)) return state;
      return { bookmarks: [...state.bookmarks, site] };
    });
  },

  removeBookmark: (siteId) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter(b => b.id !== siteId)
    }));
  },

  fetchAnalysis: async () => {
    const { selectedSite, timeWindow, observerHeight, panelConfig } = get();
    set({ isLoadingAnalysis: true, analysisError: null });

    try {
      const data = await api.runFullAnalysis(
        selectedSite.latitude,
        selectedSite.longitude,
        selectedSite.altitude_km,
        timeWindow.start,
        timeWindow.stop,
        timeWindow.step,
        observerHeight,
        panelConfig
      );
      set({ analysisData: data, isLoadingAnalysis: false, currentTimestampIndex: 0 });
    } catch (err: any) {
      set({
        analysisError: err?.message || "Failed to fetch astronomical analysis",
        isLoadingAnalysis: false
      });
    }
  }
}));
