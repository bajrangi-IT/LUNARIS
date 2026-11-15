import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from server.config import EARTH_ANGULAR_RADIUS_DEG
from server.services.terrain_service import TerrainService

class CommService:
    """
    Direct-to-Earth (DTE) Communication Intelligence Engine.
    Evaluates geometric Earth line-of-sight, terrain horizon occlusion,
    Earth disc limb grazing (angular radius ~0.95°), and blackout periods.
    """

    def __init__(self, terrain_service: Optional[TerrainService] = None):
        self.terrain_service = terrain_service or TerrainService()

    def compute_communication_analysis(
        self,
        earth_ephemeris_records: List[Dict[str, Any]],
        horizon_profile: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Analyze Earth visibility windows, occultations and blackout intervals.
        """
        if not earth_ephemeris_records:
            return {
                "total_hours": 0.0,
                "los_hours": 0.0,
                "los_percentage": 0.0,
                "max_continuous_los_hours": 0.0,
                "max_blackout_hours": 0.0,
                "timeline": [],
                "windows": []
            }

        timeline = []
        total_los_minutes = 0.0

        def parse_ts(ts_str: str) -> datetime:
            for fmt in ("%Y-%m-%d %H:%M", "%Y-%b-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S"):
                try:
                    return datetime.strptime(ts_str, fmt).replace(tzinfo=timezone.utc)
                except ValueError:
                    pass
            return datetime.now(timezone.utc)

        # Determine uniform step hours from records
        default_dt_hours = 0.5
        if len(earth_ephemeris_records) >= 2:
            dt0 = parse_ts(earth_ephemeris_records[0]["timestamp_utc"])
            dt1 = parse_ts(earth_ephemeris_records[1]["timestamp_utc"])
            diff = (dt1 - dt0).total_seconds()
            if diff > 0:
                default_dt_hours = diff / 3600.0

        step_minutes = default_dt_hours * 60.0
        total_time_minutes = len(earth_ephemeris_records) * step_minutes

        for rec in earth_ephemeris_records:
            ts_str = rec["timestamp_utc"]
            earth_az = rec["azimuth_deg"]
            earth_el = rec["elevation_deg"]

            # Geometric line-of-sight to Earth's center
            geometric_los = earth_el > 0.0

            # Terrain horizon check
            is_obstructed = False
            terrain_clearance_deg = earth_el
            if horizon_profile:
                is_obstructed, terrain_clearance_deg = self.terrain_service.check_obstruction(
                    earth_az, earth_el, horizon_profile
                )

            # Account for Earth apparent angular radius (~0.95°)
            # Disc states:
            # - FULL: clearance > +0.95° (Entire Earth disc clears terrain)
            # - PARTIAL: -0.95° <= clearance <= +0.95° (Earth disc partially eclipsed by horizon)
            # - OCCULTED: clearance < -0.95° (Complete Earth occultation)
            if terrain_clearance_deg > EARTH_ANGULAR_RADIUS_DEG:
                disc_status = "FULL_DISC"
                has_link = True
            elif terrain_clearance_deg >= -EARTH_ANGULAR_RADIUS_DEG:
                disc_status = "PARTIAL_LIMB"
                has_link = True
            else:
                disc_status = "OCCULTED"
                has_link = False

            if has_link:
                total_los_minutes += step_minutes

            timeline.append({
                "timestamp_utc": ts_str,
                "earth_azimuth_deg": earth_az,
                "earth_elevation_deg": earth_el,
                "terrain_clearance_deg": round(terrain_clearance_deg, 3),
                "geometric_los": geometric_los,
                "terrain_obstructed": is_obstructed,
                "disc_status": disc_status,
                "has_line_of_sight": has_link,
                "earth_angular_radius_deg": EARTH_ANGULAR_RADIUS_DEG
            })

        # Extract communication windows and blackout intervals
        windows = self._extract_comm_windows(timeline)

        total_hours = total_time_minutes / 60.0
        los_hours = total_los_minutes / 60.0
        los_pct = (los_hours / total_hours * 100.0) if total_hours > 0 else 0.0

        max_continuous_los_h = max([w["duration_hours"] for w in windows if w["type"] == "line_of_sight"], default=0.0)
        max_blackout_h = max([w["duration_hours"] for w in windows if w["type"] == "blackout"], default=0.0)

        return {
            "earth_angular_radius_deg": EARTH_ANGULAR_RADIUS_DEG,
            "total_hours": round(total_hours, 2),
            "los_hours": round(los_hours, 2),
            "los_percentage": round(los_pct, 1),
            "max_continuous_los_hours": round(max_continuous_los_h, 2),
            "max_blackout_hours": round(max_blackout_h, 2),
            "disclaimer": "Geometric and terrain line-of-sight only. Actual RF communication link requires transponder RF link-budget analysis, antenna pointing accuracy, and ground-station schedule.",
            "windows": windows,
            "timeline": timeline
        }

    def _extract_comm_windows(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not timeline:
            return []

        windows = []
        current_type = "line_of_sight" if timeline[0]["has_line_of_sight"] else "blackout"
        start_ts = timeline[0]["timestamp_utc"]
        count = 1

        for i in range(1, len(timeline)):
            has_los = timeline[i]["has_line_of_sight"]
            t_type = "line_of_sight" if has_los else "blackout"
            if t_type == current_type:
                count += 1
            else:
                end_ts = timeline[i-1]["timestamp_utc"]
                windows.append({
                    "type": current_type,
                    "start_time_utc": start_ts,
                    "end_time_utc": end_ts,
                    "duration_hours": round(count * 0.5, 2)
                })
                current_type = t_type
                start_ts = timeline[i]["timestamp_utc"]
                count = 1

        end_ts = timeline[-1]["timestamp_utc"]
        windows.append({
            "type": current_type,
            "start_time_utc": start_ts,
            "end_time_utc": end_ts,
            "duration_hours": round(count * 0.5, 2)
        })

        return windows
