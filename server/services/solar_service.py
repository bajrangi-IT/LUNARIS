import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from server.config import SOLAR_CONSTANT_AM0_W_M2
from server.services.terrain_service import TerrainService

class SolarService:
    """
    Lunar Solar Power Intelligence Engine.
    Calculates instantaneous power, accumulated energy (Wh/kWh),
    and illumination vs shadow windows using real ephemeris and terrain horizon.
    """

    def __init__(self, terrain_service: Optional[TerrainService] = None):
        self.terrain_service = terrain_service or TerrainService()

    def compute_solar_analysis(
        self,
        ephemeris_records: List[Dict[str, Any]],
        horizon_profile: Optional[List[Dict[str, Any]]] = None,
        panel_area_m2: float = 2.0,
        efficiency: float = 0.28,
        orientation_mode: str = "vertical_tracking",  # "vertical_tracking", "horizontal", "fixed_tilt"
        tilt_deg: float = 85.0,  # For fixed_tilt: vertical is 90 deg, horizontal is 0 deg
        tilt_azimuth_deg: float = 0.0  # For fixed_tilt: direction normal points
    ) -> Dict[str, Any]:
        """
        Evaluate solar illumination and power output over ephemeris time-series.
        Formula: P(t) = A * eta * S(t) * max(0, cos theta_inc)
        """
        if not ephemeris_records:
            return {
                "total_hours": 0.0,
                "sunlight_hours": 0.0,
                "sunlight_percentage": 0.0,
                "accumulated_energy_wh": 0.0,
                "accumulated_energy_kwh": 0.0,
                "max_continuous_sunlight_hours": 0.0,
                "longest_shadow_hours": 0.0,
                "timeline": [],
                "windows": []
            }

        timeline = []
        accumulated_wh = 0.0
        total_sunlight_minutes = 0.0

        # Calculate time step from records if available
        def parse_ts(ts_str: str) -> datetime:
            for fmt in ("%Y-%m-%d %H:%M", "%Y-%b-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S"):
                try:
                    return datetime.strptime(ts_str, fmt).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass
            return datetime.now(timezone.utc)

        # Determine uniform step hours from records
        default_dt_hours = 0.5
        if len(ephemeris_records) >= 2:
            dt0 = parse_ts(ephemeris_records[0]["timestamp_utc"])
            dt1 = parse_ts(ephemeris_records[1]["timestamp_utc"])
            diff = (dt1 - dt0).total_seconds()
            if diff > 0:
                default_dt_hours = diff / 3600.0

        total_time_minutes = 0.0

        for i, rec in enumerate(ephemeris_records):
            ts_str = rec["timestamp_utc"]
            dt_hours = default_dt_hours

            sun_az = rec["azimuth_deg"]
            sun_el = rec["elevation_deg"]

            # Geometric visibility: Sun above astronomical horizon
            geometric_visible = sun_el > 0.0

            # Terrain visibility: Sun not obstructed by local relief
            is_obstructed = False
            terrain_clearance_deg = sun_el
            if horizon_profile:
                is_obstructed, terrain_clearance_deg = self.terrain_service.check_obstruction(
                    sun_az, sun_el, horizon_profile
                )

            effective_visible = geometric_visible and not is_obstructed

            # Incidence angle theta_inc:
            cos_theta = 0.0
            if effective_visible and sun_el > 0:
                el_rad = math.radians(sun_el)
                az_rad = math.radians(sun_az)

                if orientation_mode == "vertical_tracking":
                    # Panel vertical (normal is horizontal) and tracks sun in azimuth
                    # cos(theta_inc) = cos(elevation)
                    cos_theta = math.cos(el_rad)

                elif orientation_mode == "horizontal":
                    # Panel lays flat facing local zenith
                    # cos(theta_inc) = sin(elevation)
                    cos_theta = math.sin(el_rad)

                elif orientation_mode == "fixed_tilt":
                    # Panel tilted by tilt_deg from horizontal, pointing towards tilt_azimuth_deg
                    # Normal vector: nx = sin(tilt)*sin(tilt_az), ny = sin(tilt)*cos(tilt_az), nz = cos(tilt)
                    # Sun vector: sx = cos(el)*sin(az), sy = cos(el)*cos(az), sz = sin(el)
                    tilt_rad = math.radians(tilt_deg)
                    t_az_rad = math.radians(tilt_azimuth_deg)
                    cos_theta = (
                        math.cos(el_rad) * math.sin(tilt_rad) * math.cos(az_rad - t_az_rad)
                        + math.sin(el_rad) * math.cos(tilt_rad)
                    )

            cos_theta = max(0.0, min(1.0, cos_theta))

            # Instantaneous power in Watts:
            # P(t) = A * eta * S(t) * max(0, cos theta)
            power_w = panel_area_m2 * efficiency * SOLAR_CONSTANT_AM0_W_M2 * cos_theta if effective_visible else 0.0

            # Trapezoidal numerical integration for energy (Watt-hours)
            energy_step_wh = power_w * dt_hours
            accumulated_wh += energy_step_wh

            if effective_visible:
                total_sunlight_minutes += dt_hours * 60.0
            total_time_minutes += dt_hours * 60.0

            timeline.append({
                "timestamp_utc": ts_str,
                "solar_azimuth_deg": sun_az,
                "solar_elevation_deg": sun_el,
                "terrain_clearance_deg": terrain_clearance_deg,
                "geometric_visible": geometric_visible,
                "terrain_obstructed": is_obstructed,
                "effective_visible": effective_visible,
                "incidence_angle_deg": round(math.degrees(math.acos(cos_theta)), 2) if effective_visible else 90.0,
                "instantaneous_power_w": round(power_w, 2),
                "cumulative_energy_kwh": round(accumulated_wh / 1000.0, 4)
            })

        # Find continuous sunlight and shadow windows
        windows = self._extract_windows(timeline)

        total_hours = total_time_minutes / 60.0
        sunlight_hours = total_sunlight_minutes / 60.0
        sunlight_pct = (sunlight_hours / total_hours * 100.0) if total_hours > 0 else 0.0

        max_continuous_sunlight_h = max([w["duration_hours"] for w in windows if w["type"] == "sunlight"], default=0.0)
        longest_shadow_h = max([w["duration_hours"] for w in windows if w["type"] == "shadow"], default=0.0)

        return {
            "parameters": {
                "solar_constant_w_m2": SOLAR_CONSTANT_AM0_W_M2,
                "panel_area_m2": panel_area_m2,
                "efficiency": efficiency,
                "orientation_mode": orientation_mode,
                "tilt_deg": tilt_deg if orientation_mode == "fixed_tilt" else None,
                "tilt_azimuth_deg": tilt_azimuth_deg if orientation_mode == "fixed_tilt" else None,
            },
            "total_hours": round(total_hours, 2),
            "sunlight_hours": round(sunlight_hours, 2),
            "sunlight_percentage": round(sunlight_pct, 1),
            "accumulated_energy_wh": round(accumulated_wh, 2),
            "accumulated_energy_kwh": round(accumulated_wh / 1000.0, 3),
            "max_continuous_sunlight_hours": round(max_continuous_sunlight_h, 2),
            "longest_shadow_hours": round(longest_shadow_h, 2),
            "windows": windows,
            "timeline": timeline
        }

    def _extract_windows(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not timeline:
            return []

        windows = []
        current_type = "sunlight" if timeline[0]["effective_visible"] else "shadow"
        start_ts = timeline[0]["timestamp_utc"]
        count = 1

        for i in range(1, len(timeline)):
            is_vis = timeline[i]["effective_visible"]
            t_type = "sunlight" if is_vis else "shadow"
            if t_type == current_type:
                count += 1
            else:
                end_ts = timeline[i-1]["timestamp_utc"]
                duration_h = count * 0.5  # 30 min step
                windows.append({
                    "type": current_type,
                    "start_time_utc": start_ts,
                    "end_time_utc": end_ts,
                    "duration_hours": round(duration_h, 2)
                })
                current_type = t_type
                start_ts = timeline[i]["timestamp_utc"]
                count = 1

        # Last window
        end_ts = timeline[-1]["timestamp_utc"]
        windows.append({
            "type": current_type,
            "start_time_utc": start_ts,
            "end_time_utc": end_ts,
            "duration_hours": round(count * 0.5, 2)
        })

        return windows
