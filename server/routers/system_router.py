from datetime import datetime, timezone
from fastapi import APIRouter
from server.config import HORIZONS_API_URL, MOON_TREK_WMTS_BASE, CACHE_DIR
from server.services.terrain_service import TerrainService
from server.services.trek_service import MoonTrekService

router = APIRouter(prefix="/api/system", tags=["system"])
terrain_service = TerrainService()
trek_service = MoonTrekService()

@router.get("/health")
def get_system_health():
    return {
        "status": "healthy",
        "app_name": "LUNARIS",
        "full_name": "Lunar Mission Intelligence & Landing Site Navigator",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0-spaceapps2026",
        "service": "Online"
    }

@router.get("/sources")
def get_data_sources_registry():
    """
    Centralized data source registry as specified in Prompt 1, 4 & 10.
    """
    tm_meta = terrain_service.get_dataset_metadata()
    trek_layers = trek_service.get_supported_layers()

    # Count cached Horizons queries
    horizons_cache_count = len(list((CACHE_DIR / "horizons").glob("*.json"))) if (CACHE_DIR / "horizons").exists() else 0

    return {
        "status": "OPERATIONAL",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "sources": [
            {
                "id": "jpl_horizons",
                "name": "NASA/JPL Solar System Dynamics (SSD) Horizons System",
                "endpoint": HORIZONS_API_URL,
                "type": "Ephemeris Engine",
                "status": "LIVE",
                "cached_queries_count": horizons_cache_count,
                "observer_body": "301 (Moon, coord@301)",
                "quantities": "4 (Apparent Azimuth and Elevation, Airless)",
                "citation": "Giorgini, J.D., et al. (1996). JPL's On-Line Solar System Data Service and Ephemeris Computation System. BAAS 28(3), 1158."
            },
            {
                "id": "moon_trek_wmts",
                "name": "NASA Moon Trek Web Map Tile Service (WMTS)",
                "endpoint": MOON_TREK_WMTS_BASE,
                "type": "Lunar Cartography & Tiles",
                "status": "LIVE",
                "layers": trek_layers,
                "citation": "NASA Jet Propulsion Laboratory Solar System Treks (trek.nasa.gov)"
            },
            {
                "id": "pgda_lola_lm7",
                "name": "NASA PGDA LOLA LM7 Faustini Rim A (Product 78)",
                "endpoint": "https://pgda.gsfc.nasa.gov/products/78",
                "type": "High-Resolution Terrain Raster (5m/px)",
                "status": "ONLINE (Reference Profile Active)" if not tm_meta.get("dem_mounted_locally") else "LOCAL RASTER LOADED",
                "metadata": tm_meta,
                "citation": "NASA Planetary Geodynamics Data Archive (PGDA), Goddard Space Flight Center"
            },
            {
                "id": "lroc_quickmap",
                "name": "Arizona State University / NASA LROC QuickMap",
                "endpoint": "https://quickmap.lroc.asu.edu/",
                "type": "External Verification Resource",
                "status": "LINKED",
                "citation": "NASA Lunar Reconnaissance Orbiter Camera (LROC) / Arizona State University"
            }
        ],
        "disclaimer": "This tool is an independent scientific planning instrument developed for the NASA Space Apps Challenge 2026. NASA does not endorse any non-U.S. Government entity or certify mission operational feasibility."
    }
