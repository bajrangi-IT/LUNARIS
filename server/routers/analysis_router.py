from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from server.services.horizons_client import HorizonsClient
from server.services.terrain_service import TerrainService
from server.services.solar_service import SolarService
from server.services.comm_service import CommService

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

horizons_client = HorizonsClient()
terrain_service = TerrainService()
solar_service = SolarService(terrain_service)
comm_service = CommService(terrain_service)

class AnalysisRequest(BaseModel):
    latitude: float = Field(-87.12, description="Latitude in degrees")
    longitude: float = Field(67.24, description="East longitude in degrees")
    altitude_km: float = Field(-0.85, description="Altitude in km")
    start_time_utc: str = Field("2026-11-14 00:00", description="Start UTC (YYYY-MM-DD HH:MM)")
    stop_time_utc: str = Field("2026-11-16 00:00", description="Stop UTC (YYYY-MM-DD HH:MM)")
    step_size: str = Field("30m", description="Step size")
    observer_height_m: float = Field(2.0, description="Observer mast height in meters")
    panel_area_m2: float = Field(2.0, description="Solar panel area in m^2")
    panel_efficiency: float = Field(0.28, description="Solar panel efficiency (0.0 to 1.0)")
    orientation_mode: str = Field("vertical_tracking", description="Panel orientation mode")
    tilt_deg: float = Field(85.0, description="Panel tilt from horizontal in degrees")
    tilt_azimuth_deg: float = Field(0.0, description="Panel tilt azimuth in degrees")

@router.post("/full")
async def run_full_mission_analysis(req: AnalysisRequest):
    """
    Run complete simultaneous Solar Power & Direct-to-Earth Communication Intelligence analysis.
    """
    try:
        # 1. Fetch Sun and Earth Ephemerides
        sun_data = await horizons_client.fetch_observer_ephemeris(
            target_id="10",
            latitude_deg=req.latitude,
            longitude_east_deg=req.longitude,
            altitude_km=req.altitude_km,
            start_time_utc=req.start_time_utc,
            stop_time_utc=req.stop_time_utc,
            step_size=req.step_size
        )

        earth_data = await horizons_client.fetch_observer_ephemeris(
            target_id="399",
            latitude_deg=req.latitude,
            longitude_east_deg=req.longitude,
            altitude_km=req.altitude_km,
            start_time_utc=req.start_time_utc,
            stop_time_utc=req.stop_time_utc,
            step_size=req.step_size
        )

        # 2. Compute local 360-degree terrain horizon profile
        horizon_data = terrain_service.compute_horizon_profile(
            lat=req.latitude,
            lon_east=req.longitude,
            observer_height_m=req.observer_height_m
        )
        h_profile = horizon_data.get("profile", [])

        # 3. Solar Intelligence calculation
        solar_eval = solar_service.compute_solar_analysis(
            ephemeris_records=sun_data.get("records", []),
            horizon_profile=h_profile,
            panel_area_m2=req.panel_area_m2,
            efficiency=req.panel_efficiency,
            orientation_mode=req.orientation_mode,
            tilt_deg=req.tilt_deg,
            tilt_azimuth_deg=req.tilt_azimuth_deg
        )

        # 4. Direct-to-Earth Communication calculation
        comm_eval = comm_service.compute_communication_analysis(
            earth_ephemeris_records=earth_data.get("records", []),
            horizon_profile=h_profile
        )

        # 5. Joint Operations Intelligence (Simultaneous Contact and Light Times)
        solar_tl = solar_eval.get("timeline", [])
        comm_tl = comm_eval.get("timeline", [])
        n_points = min(len(solar_tl), len(comm_tl))

        total_hours = solar_eval.get("total_hours", 0.0)
        step_min = (total_hours / max(1, len(solar_tl))) * 60.0 if total_hours > 0 else 30.0

        joint_timeline = []
        joint_minutes = 0.0
        current_joint_run_min = 0.0
        max_continuous_joint_min = 0.0
        joint_windows = []
        in_joint_window = False
        window_start = None

        for idx in range(n_points):
            s_pt = solar_tl[idx]
            c_pt = comm_tl[idx]
            is_light = bool(s_pt.get("effective_visible", False))
            is_contact = bool(c_pt.get("has_line_of_sight", False))
            is_joint = is_light and is_contact
            ts = s_pt.get("timestamp_utc") or c_pt.get("timestamp_utc")

            if is_joint:
                joint_minutes += step_min
                current_joint_run_min += step_min
                if current_joint_run_min > max_continuous_joint_min:
                    max_continuous_joint_min = current_joint_run_min
                if not in_joint_window:
                    in_joint_window = True
                    window_start = ts
            else:
                if in_joint_window:
                    joint_windows.append({
                        "start_utc": window_start,
                        "stop_utc": ts,
                        "duration_hours": round(current_joint_run_min / 60.0, 2)
                    })
                    in_joint_window = False
                    current_joint_run_min = 0.0

            joint_timeline.append({
                "timestamp_utc": ts,
                "light": 1 if is_light else 0,
                "contact": 1 if is_contact else 0,
                "joint": 1 if is_joint else 0,
                "solar_elevation_deg": s_pt.get("solar_elevation_deg", 0.0),
                "solar_clearance_deg": s_pt.get("terrain_clearance_deg", 0.0),
                "earth_elevation_deg": c_pt.get("earth_elevation_deg", 0.0),
                "earth_clearance_deg": c_pt.get("terrain_clearance_deg", 0.0)
            })

        if in_joint_window and window_start and joint_timeline:
            joint_windows.append({
                "start_utc": window_start,
                "stop_utc": joint_timeline[-1]["timestamp_utc"],
                "duration_hours": round(current_joint_run_min / 60.0, 2)
            })

        total_joint_hours = round(joint_minutes / 60.0, 2)
        joint_pct = round((total_joint_hours / total_hours * 100.0) if total_hours > 0 else 0.0, 1)

        # Scientific Feasibility Assessment
        sun_pct = solar_eval.get("sunlight_percentage", 0.0)
        los_pct = comm_eval.get("los_percentage", 0.0)

        if joint_pct >= 60.0 or (sun_pct >= 50.0 and los_pct >= 50.0):
            feasibility_rating = "PRIME CANDIDATE (High Power & Unbroken Comm)"
            feasibility_color = "emerald"
        elif joint_pct >= 20.0 or (sun_pct >= 20.0 and los_pct >= 30.0):
            feasibility_rating = "VIABLE (Periodic Sim Windows)"
            feasibility_color = "amber"
        elif sun_pct == 0.0 and los_pct > 0.0:
            feasibility_rating = "CRYOGENIC PSR (Perpetual Shadow, Active Comm)"
            feasibility_color = "purple"
        elif los_pct == 0.0:
            feasibility_rating = "FARSIDE/RELAY REQUIRED (No Direct-to-Earth)"
            feasibility_color = "rose"
        else:
            feasibility_rating = "CONSTRAINED (Limited Operational Windows)"
            feasibility_color = "slate"

        joint_eval = {
            "total_joint_hours": total_joint_hours,
            "joint_percentage": joint_pct,
            "max_continuous_joint_hours": round(max_continuous_joint_min / 60.0, 2),
            "feasibility_rating": feasibility_rating,
            "feasibility_color": feasibility_color,
            "timeline": joint_timeline,
            "windows": joint_windows
        }

        return {
            "site": {
                "latitude_deg": req.latitude,
                "longitude_east_deg": req.longitude,
                "altitude_km": req.altitude_km,
                "observer_height_m": req.observer_height_m
            },
            "time_window": {
                "start_utc": req.start_time_utc,
                "stop_utc": req.stop_time_utc,
                "step_size": req.step_size,
                "total_hours": solar_eval.get("total_hours", 0.0)
            },
            "provenance": {
                "sun_source": sun_data.get("source"),
                "earth_source": earth_data.get("source"),
                "terrain_source": horizon_data.get("source"),
                "is_fallback": sun_data.get("is_fallback") or earth_data.get("is_fallback"),
                "retrieved_at": sun_data.get("retrieved_at")
            },
            "terrain": {
                "available": horizon_data.get("terrain_available", False),
                "local_elevation_m": horizon_data.get("local_elevation_m", 0.0),
                "local_slope_deg": horizon_data.get("local_slope_deg", 0.0),
                "profile": h_profile
            },
            "solar": solar_eval,
            "communication": comm_eval,
            "joint_operations": joint_eval
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
