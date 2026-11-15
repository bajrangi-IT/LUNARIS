from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any
from server.services.horizons_client import HorizonsClient

router = APIRouter(prefix="/api/ephemeris", tags=["ephemeris"])
horizons_client = HorizonsClient()

@router.get("/sun")
async def get_sun_ephemeris(
    lat: float = Query(-87.12, description="Observer latitude in degrees (-90 to +90)"),
    lon: float = Query(67.24, description="Observer east longitude in degrees (0 to 360)"),
    alt: float = Query(-0.85, description="Observer altitude in km"),
    start: str = Query("2026-11-14 00:00", description="Start UTC (YYYY-MM-DD HH:MM)"),
    stop: str = Query("2026-11-16 00:00", description="Stop UTC (YYYY-MM-DD HH:MM)"),
    step: str = Query("30m", description="Step size (e.g. 10m, 30m, 1h, 1d)")
):
    try:
        data = await horizons_client.fetch_observer_ephemeris(
            target_id="10",
            latitude_deg=lat,
            longitude_east_deg=lon,
            altitude_km=alt,
            start_time_utc=start,
            stop_time_utc=stop,
            step_size=step
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/earth")
async def get_earth_ephemeris(
    lat: float = Query(-87.12, description="Observer latitude in degrees (-90 to +90)"),
    lon: float = Query(67.24, description="Observer east longitude in degrees (0 to 360)"),
    alt: float = Query(-0.85, description="Observer altitude in km"),
    start: str = Query("2026-11-14 00:00", description="Start UTC (YYYY-MM-DD HH:MM)"),
    stop: str = Query("2026-11-16 00:00", description="Stop UTC (YYYY-MM-DD HH:MM)"),
    step: str = Query("30m", description="Step size (e.g. 10m, 30m, 1h, 1d)")
):
    try:
        data = await horizons_client.fetch_observer_ephemeris(
            target_id="399",
            latitude_deg=lat,
            longitude_east_deg=lon,
            altitude_km=alt,
            start_time_utc=start,
            stop_time_utc=stop,
            step_size=step
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unified")
async def get_unified_ephemeris(
    lat: float = Query(-87.12, description="Observer latitude in degrees (-90 to +90)"),
    lon: float = Query(67.24, description="Observer east longitude in degrees (0 to 360)"),
    alt: float = Query(-0.85, description="Observer altitude in km"),
    start: str = Query("2026-11-14 00:00", description="Start UTC (YYYY-MM-DD HH:MM)"),
    stop: str = Query("2026-11-16 00:00", description="Stop UTC (YYYY-MM-DD HH:MM)"),
    step: str = Query("30m", description="Step size (e.g. 10m, 30m, 1h, 1d)")
):
    """
    Combined query for Sun (10) and Earth (399) aligned by timestamp.
    Prompt 5 unified output schema.
    """
    try:
        sun_data = await horizons_client.fetch_observer_ephemeris("10", lat, lon, alt, start, stop, step)
        earth_data = await horizons_client.fetch_observer_ephemeris("399", lat, lon, alt, start, stop, step)

        sun_records = {r["timestamp_utc"]: r for r in sun_data.get("records", [])}
        earth_records = {r["timestamp_utc"]: r for r in earth_data.get("records", [])}

        all_timestamps = sorted(list(set(list(sun_records.keys()) + list(earth_records.keys()))))
        unified_series = []

        for ts in all_timestamps:
            s_rec = sun_records.get(ts)
            e_rec = earth_records.get(ts)
            unified_series.append({
                "timestamp_utc": ts,
                "sun_azimuth_deg": s_rec["azimuth_deg"] if s_rec else None,
                "sun_elevation_deg": s_rec["elevation_deg"] if s_rec else None,
                "earth_azimuth_deg": e_rec["azimuth_deg"] if e_rec else None,
                "earth_elevation_deg": e_rec["elevation_deg"] if e_rec else None,
                "source": sun_data.get("source"),
                "retrieved_at": sun_data.get("retrieved_at")
            })

        return {
            "observer": sun_data.get("observer"),
            "start_time_utc": start,
            "stop_time_utc": stop,
            "step_size": step,
            "provenance": {
                "source": sun_data.get("source"),
                "is_fallback": sun_data.get("is_fallback") or earth_data.get("is_fallback"),
                "retrieved_at": sun_data.get("retrieved_at")
            },
            "records": unified_series
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
