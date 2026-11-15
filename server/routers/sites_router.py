import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from server.config import DATA_DIR

router = APIRouter(prefix="/api/sites", tags=["sites"])
CATALOG_FILE = DATA_DIR / "catalog.json"

class CoordinateValidationRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Lunar latitude in degrees (-90 to +90)")
    longitude: float = Field(..., description="Lunar longitude (-180 to 180 or 0 to 360)")
    altitude_km: Optional[float] = Field(0.0, description="Altitude in km")

def _load_catalog() -> List[Dict[str, Any]]:
    if CATALOG_FILE.exists():
        with open(CATALOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@router.get("")
def list_sites(search: Optional[str] = None, region: Optional[str] = None):
    sites = _load_catalog()
    if search:
        q = search.lower()
        sites = [s for s in sites if q in s["name"].lower() or q in s["description"].lower()]
    if region:
        sites = [s for s in sites if s.get("region", "").lower() == region.lower()]
    return sites

@router.get("/{site_id}")
def get_site(site_id: str):
    sites = _load_catalog()
    for s in sites:
        if s["id"] == site_id:
            return s
    raise HTTPException(status_code=404, detail=f"Landing site '{site_id}' not found")

@router.post("/validate")
def validate_coordinates(req: CoordinateValidationRequest):
    """
    Validate coordinates and normalize to standard East-positive convention (0 to 360 deg).
    """
    raw_lon = req.longitude
    # Normalize to 0-360 East positive
    norm_lon = (raw_lon % 360.0 + 360.0) % 360.0

    is_south_pole = req.latitude <= -80.0
    is_polar_dem_faustini = (-87.45 <= req.latitude <= -86.85) and (65.0 <= norm_lon <= 72.0)

    # External resource deep links
    quickmap_url = f"https://quickmap.lroc.asu.edu/?extent={req.latitude - 0.2:.2f},{norm_lon - 0.5:.2f},{req.latitude + 0.2:.2f},{norm_lon + 0.5:.2f}"
    moontrek_url = f"https://trek.nasa.gov/moon/#v=0.1&x={norm_lon:.4f}&y={req.latitude:.4f}&z=6"

    return {
        "valid": True,
        "input": {
            "latitude": req.latitude,
            "longitude": req.longitude,
            "altitude_km": req.altitude_km
        },
        "normalized": {
            "latitude_deg": req.latitude,
            "longitude_east_deg": round(norm_lon, 5),
            "altitude_km": req.altitude_km,
            "convention": "East-positive (0° to 360°)"
        },
        "region_classification": "South Polar Region" if is_south_pole else ("Equatorial / Mid-latitudes" if abs(req.latitude) < 60 else "High Latitudes"),
        "has_highres_faustini_dem": is_polar_dem_faustini,
        "dem_coverage": "NASA PGDA LM7 5mpp Available" if is_polar_dem_faustini else "LOLA Regional Topography (20mpp / Global)",
        "external_links": {
            "quickmap": quickmap_url,
            "moontrek": moontrek_url
        }
    }
