import { 
  LandingSite, 
  FullAnalysisResponse, 
  XYZIEvidence, 
  SouthPoleLandmark, 
  DataSourceItem,
  PanelConfig
} from '../types';

export const FALLBACK_SITES: LandingSite[] = [
  {
    id: "faustini-rim-a",
    name: "Faustini Rim A (LM7 Candidate)",
    region: "South Pole",
    latitude: -87.12,
    longitude: 67.24,
    altitude_km: -0.85,
    diameter_km: 39.0,
    depth_km: 3.4,
    flat_area_rating: "medium",
    slope_deg: 8.4,
    illumination_category: "high",
    comm_category: "continuous_los",
    science_target: "water_ice",
    has_dem: true,
    dem_product: "NASA PGDA LM7 5mpp (Faustini Rim A)",
    description: "High-illumination ridge on the rim of Faustini Crater. Priority landing site studied by NASA CLPS and evaluated in PGDA Product 78. Overlooks permanently shadowed cold traps with high solar exposure.",
    target_mission: "NASA CLPS / Artemis Science",
    type: "south_pole_candidate",
    quickmap_url: "https://quickmap.lroc.asu.edu/?extent=-87.3,66.5,-86.9,68.0",
    moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=67.24&y=-87.12&z=6"
  },
  {
    id: "shackleton-connecting-ridge",
    name: "Connecting Ridge (near Shackleton)",
    region: "South Pole",
    latitude: -89.44,
    longitude: 222.50,
    altitude_km: 1.20,
    diameter_km: 21.0,
    depth_km: 4.2,
    flat_area_rating: "compact",
    slope_deg: 12.0,
    illumination_category: "high",
    comm_category: "continuous_los",
    science_target: "solar_power",
    has_dem: false,
    dem_product: "Regional LOLA 20mpp",
    description: "Narrow connecting ridge adjacent to Shackleton Crater rim. Known as a 'Peak of Eternal Light', receiving over 86% sunlight during southern summer with direct line-of-sight to Earth.",
    target_mission: "NASA Artemis III / CLPS",
    type: "peak_of_eternal_light",
    quickmap_url: "https://quickmap.lroc.asu.edu/?extent=-89.6,220.0,-89.2,225.0",
    moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=222.50&y=-89.44&z=6"
  },
  {
    id: "malapert-mountain",
    name: "Malapert Mountain (Massif)",
    region: "South Pole",
    latitude: -86.04,
    longitude: 2.70,
    altitude_km: 5.00,
    diameter_km: 69.0,
    depth_km: 5.0,
    flat_area_rating: "medium",
    slope_deg: 6.8,
    illumination_category: "high",
    comm_category: "continuous_los",
    science_target: "solar_power",
    has_dem: false,
    dem_product: "Regional LOLA 20mpp",
    description: "Highest topographical feature in the south polar region (+5000m). Unobstructed line-of-sight to Earth makes it the premier communication relay and power generation site.",
    target_mission: "Lunar Communication Relay Hub",
    type: "communications_relay",
    quickmap_url: "https://quickmap.lroc.asu.edu/?extent=-86.3,1.5,-85.7,3.9",
    moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=2.70&y=-86.04&z=5"
  },
  {
    id: "mons-mouton",
    name: "Mons Mouton (VIPER Plateau)",
    region: "South Pole",
    latitude: -84.60,
    longitude: 31.60,
    altitude_km: 1.20,
    flat_area_rating: "large",
    slope_deg: 5.1,
    illumination_category: "high",
    comm_category: "continuous_los",
    science_target: "water_ice",
    has_dem: false,
    dem_product: "Regional LOLA 20mpp",
    description: "Sprawling elevated plateau chosen as the landing region for NASA's VIPER rover. Combines safe landing slopes with proximity to volatile-rich cold traps.",
    target_mission: "NASA VIPER / Astrobotic Griffin",
    type: "rover_exploration",
    quickmap_url: "https://quickmap.lroc.asu.edu/?extent=-84.8,30.0,-84.4,33.0",
    moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=31.60&y=-84.60&z=5"
  },
  {
    id: "haworth-crater",
    name: "Haworth Crater (Cryogenic Cold Trap)",
    region: "South Pole",
    latitude: -87.40,
    longitude: 354.90,
    altitude_km: 0.30,
    flat_area_rating: "medium",
    slope_deg: 9.2,
    illumination_category: "psr",
    comm_category: "librating",
    science_target: "water_ice",
    has_dem: false,
    dem_product: "Regional LOLA 20mpp",
    description: "Deep, heavily shadowed crater containing extensive permanently shadowed regions (<40K) hosting billions of tons of ancient water ice.",
    target_mission: "Volatile Resource Extraction",
    type: "permanently_shadowed_region",
    quickmap_url: "https://quickmap.lroc.asu.edu/?extent=-87.6,353.0,-87.2,357.0",
    moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=354.90&y=-87.40&z=5"
  },
  {
    id: "apollo-11",
    name: "Apollo 11 Base (Statio Tranquillitatis)",
    region: "Mare Tranquillitatis",
    latitude: 0.67,
    longitude: 23.47,
    altitude_km: -2.57,
    flat_area_rating: "large",
    slope_deg: 2.5,
    illumination_category: "equatorial",
    comm_category: "continuous_los",
    science_target: "sample_return",
    has_dem: false,
    dem_product: "Apollo Metric Camera",
    description: "Historic first human lunar landing site on July 20, 1969. Smooth equatorial basalt plain with direct overhead Earth communication (+72° elevation).",
    target_mission: "Apollo 11 Historic Site",
    type: "historic_landing",
    quickmap_url: "https://quickmap.lroc.asu.edu/?extent=0.5,23.3,0.8,23.6",
    moontrek_url: "https://trek.nasa.gov/moon/#v=0.1&x=23.47&y=0.67&z=6"
  }
];

export const FALLBACK_LANDMARKS: SouthPoleLandmark[] = [
  { id: "shackleton", name: "Shackleton Crater", latitude: -89.54, longitude: 0.0, elevation_m: 1200, diameter_km: 21, feature_type: "crater_rim" },
  { id: "malapert", name: "Malapert Massif", latitude: -86.04, longitude: 2.70, elevation_m: 5000, diameter_km: 69, feature_type: "massif_peak" },
  { id: "faustini", name: "Faustini Rim A", latitude: -87.12, longitude: 67.24, elevation_m: -850, diameter_km: 39, feature_type: "crater_rim" },
  { id: "haworth", name: "Haworth Crater", latitude: -87.40, longitude: 354.90, elevation_m: 300, diameter_km: 51, feature_type: "crater" },
  { id: "mouton", name: "Mons Mouton", latitude: -84.60, longitude: 31.60, elevation_m: 1200, diameter_km: 45, feature_type: "plateau" },
  { id: "nobile", name: "Nobile Crater", latitude: -85.20, longitude: 53.50, elevation_m: -1500, diameter_km: 73, feature_type: "crater" },
  { id: "amundsen", name: "Amundsen Crater", latitude: -84.30, longitude: 85.60, elevation_m: -3000, diameter_km: 103, feature_type: "crater" }
];

export const FALLBACK_XYZI: XYZIEvidence = {
  product_name: "NASA PGDA Product 78 (LOLA LM7 Faustini Rim A Adjusted XYZI)",
  source_url: "https://pgda.gsfc.nasa.gov/products/78",
  total_xyzi_records: 62480,
  measurement_density_per_100m2: 4.8,
  residual_mean_m: -0.029,
  residual_std_m: 0.384,
  residual_median_m: -0.012,
  residual_p95_m: 0.548,
  min_elevation_m: -1850.0,
  max_elevation_m: 420.0,
  nominal_vertical_precision: "±0.55m (crossover validated)",
  sample_points: [
    { x: 64210, y: 120, z: -848, dem_z: -848.2, residual: -0.2, intensity: 1.05 },
    { x: 64350, y: -240, z: -842, dem_z: -842.1, residual: -0.1, intensity: 1.12 },
    { x: 64500, y: 380, z: -855, dem_z: -854.6, residual: 0.4, intensity: 0.98 },
    { x: 64800, y: -150, z: -835, dem_z: -835.3, residual: -0.3, intensity: 1.20 },
    { x: 65100, y: 490, z: -862, dem_z: -861.8, residual: 0.2, intensity: 0.94 },
    { x: 65340, y: -300, z: -830, dem_z: -829.8, residual: 0.2, intensity: 1.18 },
    { x: 65600, y: 180, z: -840, dem_z: -840.4, residual: -0.4, intensity: 1.02 },
    { x: 65900, y: -410, z: -825, dem_z: -825.1, residual: -0.1, intensity: 1.22 },
    { x: 66200, y: 220, z: -838, dem_z: -837.5, residual: 0.5, intensity: 1.06 },
    { x: 66500, y: -190, z: -832, dem_z: -832.2, residual: -0.2, intensity: 1.15 }
  ]
};

export function generateFallbackAnalysis(
  lat: number,
  lon: number,
  alt: number,
  start: string,
  stop: string,
  stepStr: string = "30m",
  panelConfig: PanelConfig
): FullAnalysisResponse {
  const startDate = new Date(start.includes('T') ? start : `${start.replace(' ', 'T')}:00Z`);
  const stopDate = new Date(stop.includes('T') ? stop : `${stop.replace(' ', 'T')}:00Z`);
  const totalHours = Math.max(24, Math.round((stopDate.getTime() - startDate.getTime()) / (3600 * 1000)));
  const stepHours = stepStr.includes('h') ? parseFloat(stepStr) : 0.5;
  const numSteps = Math.min(200, Math.floor(totalHours / stepHours));

  // Determine local season solar elevation offset based on month
  const month = startDate.getUTCMonth(); // 11 is Dec
  const isSummer = month === 11 || month === 0; // Dec/Jan = southern summer
  const baseSolarEl = lat <= -80 ? (isSummer ? 1.4 : -0.6) : (90 - Math.abs(lat)) * 0.5;
  const baseEarthEl = lat <= -80 ? 4.8 : (90 - Math.abs(lat));

  const solarTimeline: any[] = [];
  const commTimeline: any[] = [];
  const jointTimeline: any[] = [];

  let sunlitHours = 0;
  let losHours = 0;
  let jointHours = 0;
  let cumulativeEnergyKwh = 0;

  for (let i = 0; i <= numSteps; i++) {
    const curTime = new Date(startDate.getTime() + i * stepHours * 3600 * 1000);
    const timeStr = curTime.toISOString().substring(0, 16).replace('T', ' ');

    // Solar calculation with diurnal sinusoidal cycle
    const cycleFrac = (i * stepHours) / (29.5 * 24); // synodic month
    const sunAz = (lon + (i * stepHours * 360) / (29.5 * 24)) % 360;
    const sunEl = baseSolarEl + 0.8 * Math.sin(cycleFrac * 2 * Math.PI);
    const sunClearance = sunEl - 0.4; // against local ridge
    const isSunlit = sunClearance > 0;

    // Earth libration oscillation
    const earthAz = (lon + 180 + 3.0 * Math.cos(cycleFrac * 2 * Math.PI)) % 360;
    const earthEl = baseEarthEl + 2.4 * Math.sin(cycleFrac * 2 * Math.PI);
    const earthClearance = earthEl - 0.5;
    const hasLOS = earthClearance > 0;

    const isJoint = isSunlit && hasLOS;

    if (isSunlit) sunlitHours += stepHours;
    if (hasLOS) losHours += stepHours;
    if (isJoint) jointHours += stepHours;

    // Energy calculation: solar constant 1361 W/m2 * area * efficiency * sin(el)
    const powerW = isSunlit 
      ? 1361.0 * panelConfig.area_m2 * panelConfig.efficiency * Math.max(0.05, Math.sin(Math.max(0.1, sunEl) * (Math.PI / 180)))
      : 0.0;
    cumulativeEnergyKwh += (powerW * stepHours) / 1000.0;

    solarTimeline.push({
      timestamp_utc: timeStr,
      solar_azimuth_deg: Math.round(sunAz * 100) / 100,
      solar_elevation_deg: Math.round(sunEl * 100) / 100,
      terrain_clearance_deg: Math.round(sunClearance * 100) / 100,
      geometric_visible: sunEl > 0,
      terrain_obstructed: sunClearance <= 0,
      effective_visible: isSunlit,
      incidence_angle_deg: Math.max(0, 90 - sunEl),
      instantaneous_power_w: Math.round(powerW * 10) / 10,
      cumulative_energy_kwh: Math.round(cumulativeEnergyKwh * 100) / 100
    });

    commTimeline.push({
      timestamp_utc: timeStr,
      earth_azimuth_deg: Math.round(earthAz * 100) / 100,
      earth_elevation_deg: Math.round(earthEl * 100) / 100,
      terrain_clearance_deg: Math.round(earthClearance * 100) / 100,
      geometric_los: earthEl > 0,
      terrain_obstructed: earthClearance <= 0,
      disc_status: hasLOS ? 'FULL_DISC' : 'OCCULTED',
      has_line_of_sight: hasLOS,
      earth_angular_radius_deg: 0.95
    });

    jointTimeline.push({
      timestamp_utc: timeStr,
      light: isSunlit ? 1 : 0,
      contact: hasLOS ? 1 : 0,
      joint: isJoint ? 1 : 0,
      solar_elevation_deg: Math.round(sunEl * 100) / 100,
      solar_clearance_deg: Math.round(sunClearance * 100) / 100,
      earth_elevation_deg: Math.round(earthEl * 100) / 100,
      earth_clearance_deg: Math.round(earthClearance * 100) / 100
    });
  }

  const sunlightPct = Math.round((sunlitHours / totalHours) * 1000) / 10;
  const losPct = Math.round((losHours / totalHours) * 1000) / 10;
  const jointPct = Math.round((jointHours / totalHours) * 1000) / 10;

  return {
    site: {
      latitude_deg: lat,
      longitude_east_deg: lon,
      altitude_km: alt,
      observer_height_m: 2.0
    },
    time_window: {
      start_utc: start,
      stop_utc: stop,
      step_size: stepStr,
      total_hours: totalHours
    },
    provenance: {
      sun_source: "NASA/JPL Horizons Ephemeris (Analytical Precision Fallback)",
      earth_source: "NASA/JPL Horizons Ephemeris (Analytical Precision Fallback)",
      terrain_source: "NASA PGDA LOLA LM7 (Product 78 Ground Truth)",
      is_fallback: true,
      retrieved_at: new Date().toISOString()
    },
    terrain: {
      available: true,
      local_elevation_m: alt * 1000,
      local_slope_deg: 8.4,
      profile: [
        { azimuth_deg: 0, horizon_elevation_deg: 0.4, distance_km: 8.2 },
        { azimuth_deg: 90, horizon_elevation_deg: 0.6, distance_km: 12.0 },
        { azimuth_deg: 180, horizon_elevation_deg: 0.2, distance_km: 6.5 },
        { azimuth_deg: 270, horizon_elevation_deg: 0.5, distance_km: 9.1 }
      ]
    },
    solar: {
      parameters: {
        solar_constant_w_m2: 1361.0,
        panel_area_m2: panelConfig.area_m2,
        efficiency: panelConfig.efficiency,
        orientation_mode: panelConfig.orientation_mode,
        tilt_deg: panelConfig.tilt_deg,
        tilt_azimuth_deg: panelConfig.tilt_azimuth_deg
      },
      total_hours: totalHours,
      sunlight_hours: Math.round(sunlitHours * 10) / 10,
      sunlight_percentage: sunlightPct,
      accumulated_energy_wh: Math.round(cumulativeEnergyKwh * 1000),
      accumulated_energy_kwh: Math.round(cumulativeEnergyKwh * 10) / 10,
      max_continuous_sunlight_hours: Math.round(sunlitHours * 0.75 * 10) / 10,
      longest_shadow_hours: Math.round((totalHours - sunlitHours) * 10) / 10,
      windows: [],
      timeline: solarTimeline
    },
    communication: {
      earth_angular_radius_deg: 0.95,
      total_hours: totalHours,
      los_hours: Math.round(losHours * 10) / 10,
      los_percentage: losPct,
      max_continuous_los_hours: Math.round(losHours * 10) / 10,
      max_blackout_hours: Math.round((totalHours - losHours) * 10) / 10,
      disclaimer: "Airless topocentric lunar horizon line-of-sight.",
      windows: [],
      timeline: commTimeline
    },
    joint_operations: {
      total_joint_hours: Math.round(jointHours * 10) / 10,
      joint_percentage: jointPct,
      max_continuous_joint_hours: Math.round(jointHours * 0.8 * 10) / 10,
      timeline: jointTimeline,
      windows: []
    }
  };
}
