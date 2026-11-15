import asyncio
from server.services.horizons_client import HorizonsClient
from server.services.terrain_service import TerrainService
from server.services.solar_service import SolarService
from server.services.comm_service import CommService

async def test_all():
    client = HorizonsClient()
    terrain = TerrainService()
    solar = SolarService(terrain)
    comm = CommService(terrain)

    # Test Sun ephemeris for Faustini Rim A
    print("Testing Sun ephemeris...")
    sun = await client.fetch_observer_ephemeris(
        target_id="10",
        latitude_deg=-87.12,
        longitude_east_deg=67.24,
        altitude_km=-0.85,
        start_time_utc="2026-11-14 00:00",
        stop_time_utc="2026-11-15 00:00",
        step_size="1h"
    )
    print("Sun records count:", len(sun["records"]), "source:", sun["source"])
    first_sun = sun["records"][0]
    print(f"First sun point: {first_sun['timestamp_utc']} | Az: {first_sun['azimuth_deg']}° | El: {first_sun['elevation_deg']}°")

    # Test Earth ephemeris
    print("Testing Earth ephemeris...")
    earth = await client.fetch_observer_ephemeris(
        target_id="399",
        latitude_deg=-87.12,
        longitude_east_deg=67.24,
        altitude_km=-0.85,
        start_time_utc="2026-11-14 00:00",
        stop_time_utc="2026-11-15 00:00",
        step_size="1h"
    )
    print("Earth records count:", len(earth["records"]), "source:", earth["source"])
    first_earth = earth["records"][0]
    print(f"First earth point: {first_earth['timestamp_utc']} | Az: {first_earth['azimuth_deg']}° | El: {first_earth['elevation_deg']}°")

    # Horizon profile
    h_data = terrain.compute_horizon_profile(-87.12, 67.24, 2.0)
    h_prof = h_data["profile"]

    # Solar analysis
    solar_res = solar.compute_solar_analysis(sun["records"], h_prof, 2.0, 0.28, "vertical_tracking")
    print(f"Solar analysis: Sunlight %: {solar_res['sunlight_percentage']}%, Energy: {solar_res['accumulated_energy_kwh']} kWh")

    # Comm analysis
    comm_res = comm.compute_communication_analysis(earth["records"], h_prof)
    print(f"Comm analysis: LOS %: {comm_res['los_percentage']}%, Max Blackout: {comm_res['max_blackout_hours']} h")

    print("=== EPHEMERIS, SOLAR & COMM TESTS PASSED ===")

asyncio.run(test_all())
