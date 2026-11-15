import logging
from typing import Dict, List, Any
from server.config import MOON_TREK_WMTS_BASE

logger = logging.getLogger("lunaris.trek")

class MoonTrekService:
    """
    NASA Moon Trek WMTS Data Connector.
    Provides verified tile layers, projection metadata, and service registry
    for Lunar South Pole and Global cartography.
    """

    LAYERS = [
        {
            "id": "lro_wac_global",
            "name": "LRO WAC Global Morphologic Mosaic",
            "type": "imagery",
            "instrument": "Lunar Reconnaissance Orbiter Camera (LROC) Wide Angle Camera",
            "resolution": "100 m/pixel (303 pixels/deg)",
            "projection": "EPSG:4326 (Equirectangular)",
            "url_template": f"{MOON_TREK_WMTS_BASE}/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd/1.0.0/default/default028mm/{{z}}/{{y}}/{{x}}.jpg",
            "min_zoom": 0,
            "max_zoom": 7,
            "bounds": [-90, -180, 90, 180],
            "attribution": "NASA / GSFC / ASU / Moon Trek"
        },
        {
            "id": "lola_clrshade_sp",
            "name": "LOLA Color Shaded Relief (South Pole)",
            "type": "elevation",
            "instrument": "Lunar Orbiter Laser Altimeter (LOLA)",
            "resolution": "20 m/pixel",
            "projection": "EPSG:3031 (Lunar South Polar Stereographic)",
            "url_template": f"{MOON_TREK_WMTS_BASE}/Moon/SP/LOLA_ClrShade_SouthPole_float_20m/1.0.0/default/default028mm/{{z}}/{{y}}/{{x}}.png",
            "min_zoom": 0,
            "max_zoom": 8,
            "bounds": [-90, -180, -60, 180],
            "attribution": "NASA / GSFC / LOLA Science Team / Moon Trek"
        },
        {
            "id": "lola_hillshade_sp",
            "name": "LOLA Hillshade Topography (South Pole)",
            "type": "topography",
            "instrument": "Lunar Orbiter Laser Altimeter (LOLA)",
            "resolution": "20 m/pixel",
            "projection": "EPSG:3031 (Lunar South Polar Stereographic)",
            "url_template": f"{MOON_TREK_WMTS_BASE}/Moon/SP/LOLA_Hillshade_SouthPole_float_20m/1.0.0/default/default028mm/{{z}}/{{y}}/{{x}}.png",
            "min_zoom": 0,
            "max_zoom": 8,
            "bounds": [-90, -180, -60, 180],
            "attribution": "NASA / GSFC / LOLA Science Team / Moon Trek"
        }
    ]

    def get_supported_layers(self) -> List[Dict[str, Any]]:
        return self.LAYERS

    def get_layer(self, layer_id: str) -> Dict[str, Any]:
        for layer in self.LAYERS:
            if layer["id"] == layer_id:
                return layer
        return self.LAYERS[0]
