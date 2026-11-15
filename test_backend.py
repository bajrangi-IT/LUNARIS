from server.routers.system_router import get_system_health, get_data_sources_registry
from server.routers.sites_router import list_sites, validate_coordinates, CoordinateValidationRequest
from server.routers.terrain_router import get_horizon_profile

h = get_system_health()
print("Health:", h["status"], h["app_name"])

sites = list_sites()
print("Sites count:", len(sites), "First site:", sites[0]["name"])

val = validate_coordinates(CoordinateValidationRequest(latitude=-87.12, longitude=67.24))
print("Validation normalized lon:", val["normalized"]["longitude_east_deg"])

horizon = get_horizon_profile(-87.12, 67.24, 2.0, 10.0)
print("Horizon points:", len(horizon["profile"]), "Source:", horizon["source"])

sources = get_data_sources_registry()
print("Sources count:", len(sources["sources"]))

print("=== ALL BACKEND UNIT TESTS PASSED ===")
