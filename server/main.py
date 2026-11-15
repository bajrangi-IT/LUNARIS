import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from server.routers import (
    ephemeris_router,
    sites_router,
    terrain_router,
    analysis_router,
    scenarios_router,
    system_router
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lunaris.main")

app = FastAPI(
    title="LUNARIS — Lunar Mission Intelligence API",
    description="Scientific Ephemeris, Lunar Terrain Horizon & Power/Communication Intelligence Engine",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all module routers under /api
app.include_router(ephemeris_router.router)
app.include_router(sites_router.router)
app.include_router(terrain_router.router)
app.include_router(analysis_router.router)
app.include_router(scenarios_router.router)
app.include_router(system_router.router)

# Mount Built Frontend (SPA) if dist directory exists
DIST_DIR = Path(__file__).resolve().parent.parent / "client" / "dist"
if DIST_DIR.exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(DIST_DIR / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "project": "LUNARIS",
            "title": "Lunar Mission Intelligence & Landing Site Navigator",
            "status": "OPERATIONAL",
            "message": "Frontend not built yet. Start Vite dev server on port 5173 or run 'npm run build' in client/."
        }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting LUNARIS FastAPI Server on 127.0.0.1:8000...")
    uvicorn.run("server.main:app", host="127.0.0.1", port=8000, reload=True)
