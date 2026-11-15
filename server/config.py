import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CACHE_DIR = BASE_DIR / "cache"

DATA_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# NASA JPL Horizons API Endpoint
HORIZONS_API_URL = os.getenv("HORIZONS_API_URL", "https://ssd.jpl.nasa.gov/api/horizons.api")

# NASA Moon Trek WMTS Base
MOON_TREK_WMTS_BASE = os.getenv("MOON_TREK_WMTS_BASE", "https://trek.nasa.gov/tiles")

# LM7 Faustini Data directory / GeoTIFF
LM7_DEM_DIR = Path(os.getenv("LM7_DEM_DIR", str(DATA_DIR / "lm7")))
LM7_DEM_DIR.mkdir(parents=True, exist_ok=True)

# Solar Constants
SOLAR_CONSTANT_AM0_W_M2 = 1361.0  # W/m^2 at 1 AU (Total Solar Irradiance)
LUNAR_RADIUS_KM = 1737.4  # Mean lunar volumetric radius
EARTH_RADIUS_KM = 6371.0  # Earth mean radius
EARTH_MOON_AVG_DIST_KM = 384400.0
EARTH_ANGULAR_RADIUS_DEG = 0.95  # Approximate apparent angular radius of Earth viewed from Moon
