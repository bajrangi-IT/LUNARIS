export interface LandingSite {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  altitude_km: number;
  diameter_km?: number;
  depth_km?: number;
  flat_area_rating?: 'compact' | 'medium' | 'large';
  slope_deg?: number;
  illumination_category?: 'high' | 'moderate' | 'psr' | 'equatorial';
  comm_category?: 'continuous_los' | 'librating' | 'relay_required';
  science_target?: 'water_ice' | 'solar_power' | 'geology' | 'astronomy' | 'sample_return';
  has_dem: boolean;
  dem_product?: string;
  description: string;
  target_mission: string;
  type: string;
  quickmap_url?: string;
  moontrek_url?: string;
}

export interface UnifiedEphemerisRecord {
  timestamp_utc: string;
  sun_azimuth_deg: number | null;
  sun_elevation_deg: number | null;
  earth_azimuth_deg: number | null;
  earth_elevation_deg: number | null;
  source?: string;
  retrieved_at?: string;
}

export interface HorizonPoint {
  azimuth_deg: number;
  horizon_elevation_deg: number;
  distance_km: number;
}

export interface HorizonProfileData {
  latitude_deg: number;
  longitude_east_deg: number;
  observer_height_m: number;
  terrain_available: boolean;
  local_elevation_m: number;
  local_slope_deg: number;
  source: string;
  curvature_corrected: boolean;
  lunar_radius_km: number;
  profile: HorizonPoint[];
}

export interface SolarTimelinePoint {
  timestamp_utc: string;
  solar_azimuth_deg: number;
  solar_elevation_deg: number;
  terrain_clearance_deg: number;
  geometric_visible: boolean;
  terrain_obstructed: boolean;
  effective_visible: boolean;
  incidence_angle_deg: number;
  instantaneous_power_w: number;
  cumulative_energy_kwh: number;
}

export interface SolarWindow {
  type: 'sunlight' | 'shadow';
  start_time_utc: string;
  end_time_utc: string;
  duration_hours: number;
}

export interface SolarAnalysis {
  parameters: {
    solar_constant_w_m2: number;
    panel_area_m2: number;
    efficiency: number;
    orientation_mode: string;
    tilt_deg?: number | null;
    tilt_azimuth_deg?: number | null;
  };
  total_hours: number;
  sunlight_hours: number;
  sunlight_percentage: number;
  accumulated_energy_wh: number;
  accumulated_energy_kwh: number;
  max_continuous_sunlight_hours: number;
  longest_shadow_hours: number;
  windows: SolarWindow[];
  timeline: SolarTimelinePoint[];
}

export interface CommTimelinePoint {
  timestamp_utc: string;
  earth_azimuth_deg: number;
  earth_elevation_deg: number;
  terrain_clearance_deg: number;
  geometric_los: boolean;
  terrain_obstructed: boolean;
  disc_status: 'FULL_DISC' | 'PARTIAL_LIMB' | 'OCCULTED';
  has_line_of_sight: boolean;
  earth_angular_radius_deg: number;
}

export interface CommWindow {
  type: 'line_of_sight' | 'blackout';
  start_time_utc: string;
  end_time_utc: string;
  duration_hours: number;
}

export interface CommAnalysis {
  earth_angular_radius_deg: number;
  total_hours: number;
  los_hours: number;
  los_percentage: number;
  max_continuous_los_hours: number;
  max_blackout_hours: number;
  disclaimer: string;
  windows: CommWindow[];
  timeline: CommTimelinePoint[];
}

export interface JointTimelinePoint {
  timestamp_utc: string;
  light: number; // 1 or 0
  contact: number; // 1 or 0
  joint: number; // 1 or 0
  solar_elevation_deg: number;
  solar_clearance_deg: number;
  earth_elevation_deg: number;
  earth_clearance_deg: number;
}

export interface JointWindow {
  start_utc: string;
  stop_utc: string;
  duration_hours: number;
}

export interface JointOperations {
  total_joint_hours: number;
  joint_percentage: number;
  max_continuous_joint_hours: number;
  timeline: JointTimelinePoint[];
  windows: JointWindow[];
}

export interface FullAnalysisResponse {
  site: {
    latitude_deg: number;
    longitude_east_deg: number;
    altitude_km: number;
    observer_height_m: number;
  };
  time_window: {
    start_utc: string;
    stop_utc: string;
    step_size: string;
    total_hours: number;
  };
  provenance: {
    sun_source: string;
    earth_source: string;
    terrain_source: string;
    is_fallback: boolean;
    retrieved_at: string;
  };
  terrain: {
    available: boolean;
    local_elevation_m: number;
    local_slope_deg: number;
    profile: HorizonPoint[];
  };
  solar: SolarAnalysis;
  communication: CommAnalysis;
  joint_operations?: JointOperations;
}

export interface XYZISamplePoint {
  x: number;
  y: number;
  z: number;
  dem_z: number | null;
  residual: number | null;
  intensity: number;
}

export interface XYZIEvidence {
  product_name: string;
  source_url: string;
  total_xyzi_records: number;
  measurement_density_per_100m2: number;
  residual_mean_m: number;
  residual_std_m: number;
  residual_median_m: number;
  residual_p95_m: number;
  min_elevation_m: number;
  max_elevation_m: number;
  nominal_vertical_precision: string;
  sample_points: XYZISamplePoint[];
}

export interface SouthPoleLandmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  diameter_km: number;
  feature_type: string;
}

export interface DataSourceItem {
  id: string;
  name: string;
  endpoint: string;
  type: string;
  status: string;
  citation: string;
  [key: string]: any;
}

export interface PanelConfig {
  area_m2: number;
  efficiency: number;
  orientation_mode: 'vertical_tracking' | 'horizontal' | 'fixed_tilt';
  tilt_deg: number;
  tilt_azimuth_deg: number;
}
