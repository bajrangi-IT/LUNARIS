import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from server.services.horizons_client import HorizonsClient
from server.services.terrain_service import TerrainService
from server.services.solar_service import SolarService
from server.services.comm_service import CommService

class ScenarioService:
    """
    Mission Scenario Comparison and Decision Engine.
    Evaluates trade-offs between landing candidates and dates using
    multi-criteria decision scoring across Power, Communication, and Terrain safety.
    """

    def __init__(
        self,
        horizons_client: Optional[HorizonsClient] = None,
        terrain_service: Optional[TerrainService] = None,
        solar_service: Optional[SolarService] = None,
        comm_service: Optional[CommService] = None
    ):
        self.horizons = horizons_client or HorizonsClient()
        self.terrain = terrain_service or TerrainService()
        self.solar = solar_service or SolarService(self.terrain)
        self.comm = comm_service or CommService(self.terrain)

    async def evaluate_single_scenario(
        self,
        scenario_id: str,
        name: str,
        latitude_deg: float,
        longitude_east_deg: float,
        altitude_km: float,
        start_time_utc: str,
        stop_time_utc: str,
        panel_area_m2: float = 2.0,
        panel_efficiency: float = 0.28,
        observer_height_m: float = 2.0
    ) -> Dict[str, Any]:
        """
        Evaluate full ephemeris, terrain, solar, and comm for a single scenario.
        """
        # Fetch Sun & Earth ephemeris concurrently via asyncio.gather
        sun_task = self.horizons.fetch_observer_ephemeris(
            target_id="10",
            latitude_deg=latitude_deg,
            longitude_east_deg=longitude_east_deg,
            altitude_km=altitude_km,
            start_time_utc=start_time_utc,
            stop_time_utc=stop_time_utc,
            step_size="1h"
        )
        earth_task = self.horizons.fetch_observer_ephemeris(
            target_id="399",
            latitude_deg=latitude_deg,
            longitude_east_deg=longitude_east_deg,
            altitude_km=altitude_km,
            start_time_utc=start_time_utc,
            stop_time_utc=stop_time_utc,
            step_size="1h"
        )

        sun_data, earth_data = await asyncio.gather(sun_task, earth_task)

        # Compute horizon profile
        horizon_data = self.terrain.compute_horizon_profile(
            lat=latitude_deg,
            lon_east=longitude_east_deg,
            observer_height_m=observer_height_m
        )
        h_profile = horizon_data.get("profile", [])

        # Compute solar & comm intelligence
        solar_eval = self.solar.compute_solar_analysis(
            ephemeris_records=sun_data.get("records", []),
            horizon_profile=h_profile,
            panel_area_m2=panel_area_m2,
            efficiency=panel_efficiency,
            orientation_mode="vertical_tracking"
        )

        comm_eval = self.comm.compute_communication_analysis(
            earth_ephemeris_records=earth_data.get("records", []),
            horizon_profile=h_profile
        )

        return {
            "id": scenario_id,
            "name": name,
            "coordinates": {
                "latitude_deg": latitude_deg,
                "longitude_east_deg": longitude_east_deg,
                "altitude_km": altitude_km
            },
            "time_window": {
                "start_utc": start_time_utc,
                "stop_utc": stop_time_utc,
                "total_hours": solar_eval.get("total_hours", 0.0)
            },
            "terrain_context": {
                "dem_available": horizon_data.get("terrain_available", False),
                "local_elevation_m": horizon_data.get("local_elevation_m", 0.0),
                "local_slope_deg": horizon_data.get("local_slope_deg", 0.0),
                "source": horizon_data.get("source", "Standard Spherical Moon")
            },
            "solar_metrics": {
                "sunlight_percentage": solar_eval.get("sunlight_percentage", 0.0),
                "sunlight_hours": solar_eval.get("sunlight_hours", 0.0),
                "max_continuous_sunlight_hours": solar_eval.get("max_continuous_sunlight_hours", 0.0),
                "accumulated_energy_kwh": solar_eval.get("accumulated_energy_kwh", 0.0),
                "longest_shadow_hours": solar_eval.get("longest_shadow_hours", 0.0)
            },
            "comm_metrics": {
                "los_percentage": comm_eval.get("los_percentage", 0.0),
                "los_hours": comm_eval.get("los_hours", 0.0),
                "max_continuous_los_hours": comm_eval.get("max_continuous_los_hours", 0.0),
                "max_blackout_hours": comm_eval.get("max_blackout_hours", 0.0)
            },
            "provenance": {
                "sun_source": sun_data.get("source"),
                "earth_source": earth_data.get("source"),
                "is_fallback": sun_data.get("is_fallback", False) or earth_data.get("is_fallback", False)
            }
        }

    def compute_decision_matrix(
        self,
        scenarios: List[Dict[str, Any]],
        weight_power: float = 0.40,
        weight_comm: float = 0.35,
        weight_terrain: float = 0.25
    ) -> Dict[str, Any]:
        """
        Rank scenarios using transparent multi-attribute utility theory.
        """
        total_w = weight_power + weight_comm + weight_terrain
        wp = weight_power / total_w
        wc = weight_comm / total_w
        wt = weight_terrain / total_w

        scored = []
        for s in scenarios:
            sm = s["solar_metrics"]
            cm = s["comm_metrics"]
            tm = s["terrain_context"]

            # Power score (0-100): based on sunlight % and continuous sun
            power_score = min(100.0, sm["sunlight_percentage"] * 0.7 + (sm["max_continuous_sunlight_hours"] / 48.0) * 30.0)

            # Comm score (0-100): based on LOS % and penalty for blackout > 12h
            blackout_penalty = max(0.0, (cm["max_blackout_hours"] - 6.0) * 2.5)
            comm_score = max(0.0, min(100.0, cm["los_percentage"] - blackout_penalty))

            # Terrain score (0-100): slope < 10 deg is ideal (100), slope > 25 deg is unsafe (0)
            slope = tm["local_slope_deg"]
            if slope <= 8.0:
                terrain_score = 95.0
            elif slope <= 15.0:
                terrain_score = 95.0 - (slope - 8.0) * 4.0
            else:
                terrain_score = max(10.0, 67.0 - (slope - 15.0) * 5.0)

            composite_score = round(wp * power_score + wc * comm_score + wt * terrain_score, 1)

            scored.append({
                "scenario_id": s["id"],
                "name": s["name"],
                "composite_score": composite_score,
                "power_score": round(power_score, 1),
                "comm_score": round(comm_score, 1),
                "terrain_score": round(terrain_score, 1),
                "details": s
            })

        # Rank descending
        scored.sort(key=lambda x: x["composite_score"], reverse=True)

        # Generate decision analysis narrative
        best = scored[0] if scored else None
        analysis_text = ""
        if best:
            analysis_text = (
                f"Candidate '{best['name']}' ranks highest with an overall score of {best['composite_score']}/100. "
                f"It delivers {best['details']['solar_metrics']['sunlight_percentage']}% solar illumination "
                f"({best['details']['solar_metrics']['accumulated_energy_kwh']} kWh estimated energy) "
                f"and {best['details']['comm_metrics']['los_percentage']}% Direct-to-Earth line-of-sight. "
            )
            if len(scored) > 1:
                runner_up = scored[1]
                analysis_text += (
                    f"In comparison, '{runner_up['name']}' scores {runner_up['composite_score']}/100; "
                    f"the primary trade-off is {abs(best['power_score'] - runner_up['power_score']):.1f} pts in power "
                    f"versus {abs(best['comm_score'] - runner_up['comm_score']):.1f} pts in communication window."
                )

        return {
            "weights": {
                "power": round(wp, 2),
                "communication": round(wc, 2),
                "terrain": round(wt, 2)
            },
            "rankings": scored,
            "recommended_scenario_id": best["scenario_id"] if best else None,
            "decision_analysis": analysis_text
        }
