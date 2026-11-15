import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from server.services.scenario_service import ScenarioService

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])
scenario_service = ScenarioService()

class ScenarioItem(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    altitude_km: float = 0.0
    start_time_utc: str = "2026-11-14 00:00"
    stop_time_utc: str = "2026-11-16 00:00"
    panel_area_m2: float = 2.0
    panel_efficiency: float = 0.28
    observer_height_m: float = 2.0

class ScenarioComparisonRequest(BaseModel):
    scenarios: List[ScenarioItem]
    weight_power: float = Field(0.40, ge=0.0, le=1.0)
    weight_comm: float = Field(0.35, ge=0.0, le=1.0)
    weight_terrain: float = Field(0.25, ge=0.0, le=1.0)

@router.post("/compare")
async def compare_scenarios(req: ScenarioComparisonRequest):
    """
    Compare multiple lunar landing scenarios side-by-side using real ephemeris
    and multi-attribute utility theory.
    """
    if not req.scenarios:
        raise HTTPException(status_code=400, detail="At least one scenario must be provided")

    # Evaluate all candidate scenarios concurrently in parallel
    tasks = [
        scenario_service.evaluate_single_scenario(
            scenario_id=sc.id,
            name=sc.name,
            latitude_deg=sc.latitude,
            longitude_east_deg=sc.longitude,
            altitude_km=sc.altitude_km,
            start_time_utc=sc.start_time_utc,
            stop_time_utc=sc.stop_time_utc,
            panel_area_m2=sc.panel_area_m2,
            panel_efficiency=sc.panel_efficiency,
            observer_height_m=sc.observer_height_m
        )
        for sc in req.scenarios
    ]

    evaluated_scenarios = await asyncio.gather(*tasks)

    matrix = scenario_service.compute_decision_matrix(
        scenarios=list(evaluated_scenarios),
        weight_power=req.weight_power,
        weight_comm=req.weight_comm,
        weight_terrain=req.weight_terrain
    )

    return matrix
