from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from server.services.terrain_service import TerrainService

router = APIRouter(prefix="/api/terrain", tags=["terrain"])
terrain_service = TerrainService()

@router.get("/metadata")
def get_terrain_metadata():
    return terrain_service.get_dataset_metadata()

@router.get("/horizon")
def get_horizon_profile(
    lat: float = Query(-87.12, description="Latitude in degrees"),
    lon: float = Query(67.24, description="East longitude in degrees"),
    observer_height: float = Query(2.0, description="Observer mast height in meters"),
    step: float = Query(5.0, description="Azimuth step in degrees (e.g. 5.0)")
):
    try:
        profile_data = terrain_service.compute_horizon_profile(
            lat=lat,
            lon_east=lon,
            observer_height_m=observer_height,
            azimuth_step_deg=step
        )
        return profile_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mesh")
def get_terrain_mesh(
    lat: float = Query(-87.12, description="Latitude in degrees"),
    lon: float = Query(67.24, description="East longitude in degrees"),
    grid_size: int = Query(33, description="Grid resolution (e.g. 33)")
):
    try:
        return terrain_service.generate_local_terrain_mesh(lat=lat, lon_east=lon, grid_size=grid_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/xyzi")
def get_xyzi_evidence():
    """
    Return NASA PGDA Product 78 raw LOLA XYZI point cloud measurements
    and residual comparison against the interpolated DEM.
    """
    try:
        return terrain_service.get_xyzi_evidence()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/landmarks")
def get_south_pole_landmarks():
    """
    Return coordinates and elevations for prominent South Pole crater landmarks.
    """
    try:
        return terrain_service.get_south_pole_landmarks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
