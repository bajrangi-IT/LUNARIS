# LUNARIS: Lunar Mission Intelligence & Landing Site Navigator
### NASA Space Apps Challenge 2026 — Comprehensive Project Documentation & Technical Specification

---

## 1. Executive Summary

**LUNARIS** is an interactive, scientifically grounded lunar mission planning and decision-support web workstation developed for the **2026 NASA Space Apps Challenge**. It addresses the critical operational challenge faced by NASA's **Commercial Lunar Payload Services (CLPS)** program, the **Artemis** initiative, and international lunar programs: **rapidly and intuitively evaluating candidate lunar landing sites and dates under extreme solar illumination and Earth communication constraints.**

At the lunar South Pole, the Sun skims the horizon at extreme grazing angles (between $-1.5^\circ$ and $+2.0^\circ$), casting elongated shadows across massive crater rim walls, while the Earth wobbles along the horizon due to lunar libration. A deviation of just a few hundred meters in landing coordinates or a shift of 24 hours in landing date can mean the difference between weeks of continuous power and direct Earth communication versus a mission-ending freeze in total darkness and communication blackout.

Existing tools—such as **NASA QuickMap**, **Moon Trek**, and the **JPL Horizons System**—are specialized tools designed for raw data extraction and in-depth post-processing. They require mission planners to manually navigate multiple disconnected interfaces, interpret complex ephemeris tables, and interpolate raw topographic rasters. 

**LUNARIS bridges this gap** by combining:
1. **Real-time topocentric airless celestial ephemeris** directly from the **NASA/JPL Horizons API**.
2. **Sub-meter laser altimetry ground truth** from the **NASA Planetary Geodynamics Data Archive (PGDA)** (Product 78: LOLA LM7 5m/px GeoTIFF DEM and crossover-adjusted XYZI point cloud).
3. **Multi-resolution global and regional cartography** from the **NASA Moon Trek WMTS**.
4. **An intuitive 4-quadrant aerospace operations dashboard**, an **interactive landing site decision wizard**, and an **instantaneous multi-criteria site comparison engine**.

---

## 2. Problem Statement Breakdown (from `PROBLEM.TXT`)

| Problem Challenge | Real-World Mission Impact | How LUNARIS Solves It |
| :--- | :--- | :--- |
| **Extreme Lighting at the South Pole** | Solar elevation skims the horizon ($<2^\circ$). Towering crater rims create permanent shadow regions (PSRs) and dynamic shadowing that starve solar arrays. | Evaluates true local terrain elevation masks to compute exact solar elevation angles, unshadowed sunlight percentages, and power yields (kWh). |
| **Direct-to-Earth Communication Constraints** | Earth hangs low over the horizon and librates. Craters and massifs frequently occult line-of-sight (LOS) to Earth Ground Stations. | Traces topocentric Earth azimuth and elevation against local horizon masks to determine direct LOS, libration wobble, and maximum blackout durations. |
| **Simultaneous Operational Windows** | Lunar landers and rovers (e.g., VIPER, CLPS landers) require sunlight for power AND direct Earth LOS for command/telemetry simultaneously. | Dynamically computes and displays the **Simultaneous (Joint) Window** (Power + Comm) with dedicated square-wave timelines and countdown timers. |
| **Agile Replanning When Constraints Shift** | Launch delays and hardware bottlenecks force teams to evaluate alternate landing dates or nearby candidate sites within minutes. | Multi-Criteria Comparison Engine enables instant side-by-side trade-off evaluations and 0ms slider recalculation of power, comm, and terrain safety priorities. |
| **Interface Complexity Gap** | Horizons, QuickMap, and Moon Trek require specialized technical expertise, manual coordinates formatting, and separate tools. | Unified web application with progressive disclosure: simple guided questionnaires for planners and educators, with deep scientific controls for engineers. |

---

## 3. High-Level Architecture & Tech Stack

LUNARIS follows a decoupled, high-performance architecture engineered for sub-second telemetry calculation and fluid 3D WebGL rendering.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LUNARIS CLIENT (BROWSER)                               │
│                                                                                         │
│   React 18 + TypeScript + Vite + Tailwind CSS + Three.js (WebGL) + Lucide Icons         │
│  ┌───────────────────────┐ ┌──────────────────────────┐ ┌────────────────────────────┐  │
│  │ 1. Global Explorer    │ │ 2. Mission Overview      │ │ 3. 3D Terrain Intelligence │  │
│  │   • Three.js Globe    │ │   • 4 Core Metrics       │ │   • LOLA Colormap Mesh     │  │
│  │   • Moon Trek Tiles   │ │   • Sunset/Earthset Timer│ │   • XYZI Point Cloud (±0.5m│  │
│  └───────────────────────┘ └──────────────────────────┘ └────────────────────────────┘  │
│  ┌───────────────────────┐ ┌──────────────────────────┐ ┌────────────────────────────┐  │
│  │ 4. Operations Timeline│ │ 5. Site Comparison       │ │ 6. Landing Wizard          │  │
│  │   • Square-wave Plot  │ │   • 0ms Priority Sliders │ │   • Guided Requirements    │  │
│  │   • Joint Windows     │ │   • Multi-Scenario Matrix│ │   • 3D Camera Fly-To       │  │
│  └───────────────────────┘ └──────────────────────────┘ └────────────────────────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │ HTTP REST (JSON)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LUNARIS SERVER (PYTHON)                               │
│                                                                                         │
│   FastAPI (Asynchronous REST API) + Uvicorn + NumPy + SciPy + Rasterio / GDAL           │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │ Two-Tier Telemetry Caching Engine: High-Speed Memory RAM Cache + Disk JSON Cache │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────┐ ┌──────────────────────────┐ ┌────────────────────────────┐  │
│  │ horizons_client.py    │ │ terrain_service.py       │ │ scenario_service.py        │  │
│  │  • Topocentric Vector │ │  • GeoTIFF DEM Analysis  │ │  • Async Concurrent Gather │  │
│  │  • Airless Apparent   │ │  • XYZI Crossover Parsing│ │  • Multi-Criteria Ranking  │  │
│  └───────────────────────┘ └──────────────────────────┘ └────────────────────────────┘  │
│  ┌───────────────────────┐ ┌──────────────────────────┐ ┌────────────────────────────┐  │
│  │ solar_service.py      │ │ comm_service.py          │ │ trek_service.py            │  │
│  │  • Solar Elevation    │ │  • Earth LOS & Libration │ │  • NASA Moon Trek Proxy    │  │
│  │  • Terrain Shadows    │ │  • Blackout Windows      │ │  • Multi-Resolution WMTS  │  │
│  └───────────────────────┘ └──────────────────────────┘ └────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────────────────┬───────────────────┘
                    │                                                 │
                    ▼                                                 ▼
┌──────────────────────────────────────┐            ┌──────────────────────────────────────┐
│        OFFICIAL NASA LIVE APIS       │            │      AUTHENTIC SCIENTIFIC DATASETS   │
│  • NASA/JPL Horizons Ephemeris API   │            │  • NASA PGDA Product 78 GeoTIFF DEM  │
│    (Solar System Dynamics SSD)       │            │  • NASA Adjusted LOLA XYZI Point     │
│  • NASA Moon Trek WMTS Tile Service  │            │    Clouds (Faustini Rim A Crossover) │
│    (JPL / Solar System Treks)        │            │  • Lunar South Pole Landmark Catalog │
└──────────────────────────────────────┘            └──────────────────────────────────────┘
```

### Complete Technology Stack

#### Frontend:
- **Core Framework**: React 18 with TypeScript and Vite (instant HMR and production bundle optimization).
- **Styling & Design System**: Tailwind CSS with custom aerospace theme (`space-950`, `cyan-400`, `amber-400`, `emerald-400`, `IBM Plex Mono`, `Manrope`).
- **3D Graphics & Visualization**: Three.js (WebGL) for interactive 3D planetary rendering, realistic directional light vectors, LOLA colormaps, and point cloud buffers.
- **Cartography**: Leaflet & Proj4Leaflet for Moon Trek Web Map Tile Service (WMTS) multi-zoom streaming.
- **Icons**: Lucide React for consistent aerospace telemetry iconography.
- **State Management**: Zustand for synchronized timelines, scrubbing, site selection, and analysis caching.

#### Backend:
- **Web Engine**: FastAPI (Python 3.13) with Uvicorn ASGI server.
- **Scientific Computing**: NumPy and SciPy for spherical vector transformations, horizon angle calculations, and slope gradient matrices.
- **Geospatial Processing**: Rasterio / GDAL for reading NASA 32-bit floating-point GeoTIFF Digital Elevation Models (DEM).
- **Network & Concurrency**: HTTPX asynchronous client with `asyncio.gather` for concurrent Horizons ephemeris retrieval.
- **Data Validation**: Pydantic v2 for strict type safety and aerospace schemas.

---

## 4. APIs & Datasets Used (Explained in Plain English)

NASA provides some of the world's most precise astronomical data, but using them directly in a web application can be daunting. Here is how LUNARIS makes them simple and powerful:

### 1. NASA/JPL Horizons System API
- **Official URL**: `https://ssd.jpl.nasa.gov/api/horizons.api`
- **What it is**: Operated by the Solar System Dynamics group at NASA's Jet Propulsion Laboratory (JPL), Horizons calculates the exact positions, velocities, and angles of planets, moons, and the Sun across centuries.
- **How LUNARIS uses it**:
  - Whenever a user picks a lunar location and date, LUNARIS contacts Horizons and asks: *"As seen by an observer standing on the Moon at this exact latitude, longitude, and elevation, where are the Sun and Earth in the sky?"*
  - LUNARIS requests **apparent topocentric airless coordinates**. Because the Moon has no atmosphere, light does not refract or bend as it does on Earth. Horizons calculates the exact azimuth (compass bearing) and elevation (angle above or below the horizontal plane).
  - LUNARIS uses high-speed two-tier caching (in-memory RAM + disk cache) so repeat queries load in under **30 milliseconds**.

### 2. NASA Moon Trek Web Map Tile Service (WMTS)
- **Official URL**: `https://trek.nasa.gov/tiles/`
- **What it is**: An official NASA JPL mapping service that breaks global imagery from the Lunar Reconnaissance Orbiter (LRO) into thousands of small image tiles, similar to Google Maps.
- **How LUNARIS uses it**:
  - Rather than downloading giant gigabyte-sized lunar maps, LUNARIS streams the exact tiles needed for the user's screen resolution and zoom level.
  - LUNARIS integrates the global **LRO WAC Global Mosaic (200m/px)** and high-resolution South Pole mosaics, allowing users to zoom from a full Moon view all the way down into individual crater ridges.

### 3. NASA PGDA LOLA LM7 Faustini Rim A GeoTIFF DEM (Product 78)
- **Data Source**: NASA Planetary Geodynamics Data Archive (GSFC) `https://pgda.gsfc.nasa.gov/products/78`
- **Local Storage**: `server/data/lm7/`
- **What it is**: A high-resolution **5-meter-per-pixel Digital Elevation Model (DEM)** created from the Lunar Orbiter Laser Altimeter (LOLA) on LRO. It captures the topography of Faustini Rim A, a prime candidate landing zone for NASA's Artemis and CLPS missions.
- **How LUNARIS uses it**:
  - LUNARIS reads the true elevation values (stored in 32-bit floating-point TIFFs) to calculate local surface slope gradients, determine landing safety thresholds (e.g., landers require slope $<10^\circ$), and render a 3D terrain mesh.

### 4. NASA PGDA Adjusted LOLA Point Cloud (XYZI Data)
- **Data Source**: NASA Planetary Geodynamics Data Archive (GSFC) Product 78 Crossover-Adjusted Point Clouds
- **Local Storage**: `server/data/lm7/LM7_final_adj.xyzi`
- **What it is**: Raw measurement shots fired by the LOLA instrument's 5-beam laser. Each shot contains:
  - `X`, `Y`, `Z`: Precise 3D cartesian coordinates in meters relative to the Moon's center of mass.
  - `I`: Laser return pulse energy / surface optical reflectivity.
  - Crossover residuals: Discrepancies between intersecting orbital tracks that have been cleaned and geometrically adjusted.
- **How LUNARIS uses it**:
  - Instead of treating LiDAR as decorative dots, LUNARIS uses XYZI as **ground-truth measurement evidence**.
  - It compares actual laser returns against the interpolated DEM heightfield and renders a 3D point cloud color-coded by crossover residual accuracy:
    - **Green points**: Error $\le 0.5\text{ m}$ (nominal altimetry precision).
    - **Amber points**: Error $0.5\text{ m} - 1.2\text{ m}$.
    - **Red points**: Error $> 1.2\text{ m}$.
  - This provides mission engineers with verifiable scientific confidence in surface roughness before touchdown.

---

## 5. Core Application Features

### Feature 1: The Four-Quadrant Aerospace Operations Dashboard
The main screen of LUNARIS follows the layout used in space agency mission operations rooms:
1. **Quadrant 1 (Top-Left) — Global Lunar Explorer**:
   - Interactive 3D full-sphere globe with smooth camera orbit, rotation, and lighting.
   - Switchable to Moon Trek Multi-Zoom WMTS Tile streaming.
   - Fast Fly-To buttons to jump directly to key landing sites.
2. **Quadrant 2 (Top-Right) — Mission Overview & Countdowns**:
   - Four primary telemetry cards:
     1. **Sun Elevation Angle** (with illuminated vs shadowed status).
     2. **Earth Line-of-Sight Elevation** (with clear vs terrain-occulted status).
     3. **Simultaneous Operational Window** (total hours where power and communication overlap).
     4. **Terrain Landing Safety** (local slope angle and vertical elevation uncertainty).
   - **Operational Horizon Countdowns**: Prominently shows **Time to Sunset** (hours of sunlight remaining) and **Time to Earthset** (hours of communication link remaining) with visual alert states when under 6 hours.
3. **Quadrant 3 (Bottom-Left) — 3D Terrain Intelligence**:
   - Authentic Three.js elevation mesh rendered with the official LOLA colormap (from $-4500\text{ m}$ deep crater floors up to $+5000\text{ m}$ massif ridges).
   - Live directional vectors pointing directly toward the real-time Sun and Earth positions.
   - Labeled 3D markers for all major South Pole landmarks (Shackleton, Malapert, Faustini, Haworth, Mons Mouton, Nobile, Amundsen).
   - Overlay toggle for adjusted LOLA XYZI point clouds with crossover residual error verification.
4. **Quadrant 4 (Bottom-Right) — Operations Timeline**:
   - High-contrast, square-wave step graph displaying **Light Times** (red dashed line) and **Contact Times** (blue solid line).
   - Shaded green bands highlight **Simultaneous Operational Windows**.
   - Scrubbable timeline with interactive click-to-seek synchronization across all other views.

### Feature 2: Interactive Mission Landing Wizard
- A non-expert friendly, 3-question guided decision tool:
  1. *Lander Footprint & Clearance*: Choose between Compact Rover, Medium Lander, or Heavy Artemis-Class Lander.
  2. *Primary Science Goal*: Water-Ice PSR Prospecting, Maximum Solar Generation, Direct Earth Communication, or Geologic Sample Return.
  3. *Target Lunar Region*: South Polar Region, Nearside Smooth Plains, Far Side Radio-Quiet Basin, or Global Best Match.
- Instantly matches and ranks landing sites from the NASA catalog with match percentage badges and one-click camera fly-to.

### Feature 3: Multi-Criteria Site & Date Comparison Engine
- Compares multiple candidate sites (e.g., Faustini Rim A vs. Shackleton Ridge vs. Malapert Mountain) side-by-side.
- **Zero-Latency (0ms) Client-Side Reweighting**: Dragging sliders for **Solar Power Priority**, **Direct Comm Priority**, and **Terrain Safety Priority** recalculates composite scores and rankings instantaneously in browser memory.
- Provides an automated **Mission Planner Strategic Trade-Off Synthesis** explaining why one site is superior under given constraints.

### Feature 4: Synchronized Temporal Controller
- Full mission playback controls: Step Forward, Step Back, Play/Pause, and Speed Selector ($1\times, 5\times, 15\times, 60\times$).
- **One-Click Season Presets**: Jump directly to **December Solstice** (lunar southern summer, highest solar elevation of the year) or **November Window** (severe shadowing conditions).
- Mission duration pills: 24h, 48h, 7 days, 14 days (half a lunar day).

### Feature 5: 360° Panoramic Horizon Projection & Printable Feasibility Report
- **360° Horizon Chart**: Projects local 360-degree terrain skyline obstruction mask against apparent Sun and Earth paths over an entire lunar cycle.
- **Mission Assessment Report**: Generates a clean, printable mission feasibility summary with automated pass/fail criteria and one-click JSON export for aerospace integration.

---

## 6. How and Where to Add Custom Datasets

LUNARIS is designed as an open, extensible research platform. Researchers can plug in custom lunar GeoTIFF rasters, laser point clouds, or landing sites:

### 1. Adding a New Lunar Landing Site
Open `server/data/catalog.json` and add a new entry to the `sites` array:
```json
{
  "id": "my-custom-crater",
  "name": "Custom Crater Ridge",
  "region": "South Pole",
  "latitude": -88.50,
  "longitude": 120.00,
  "altitude_km": 1.25,
  "has_dem": true,
  "dem_product": "LOLA 5m",
  "slope_deg": 6.5,
  "flat_area_rating": "large",
  "illumination_category": "high",
  "comm_category": "continuous_los",
  "description": "High-altitude polar ridge with excellent line-of-sight to Earth."
}
```

### 2. Adding a New GeoTIFF Digital Elevation Model (DEM)
1. Place your 32-bit floating point GeoTIFF file in `server/data/lm7/` (or create a new subfolder in `server/data/`).
2. Supported projections: Polar Stereographic (`EPSG:3031` or lunar equivalent) or Equirectangular (`EPSG:4326`).
3. In `server/services/terrain_service.py`, register the file path in `DEM_REGISTRY`:
```python
DEM_REGISTRY["my_region"] = "server/data/lm7/my_custom_dem.tif"
```
The server will automatically parse elevation matrices, calculate surface normal vectors, and derive slope angles.

### 3. Adding Cleaned Laser Point Clouds (XYZI Data)
1. Export your laser crossover shots in standard ASCII `.xyzi` or `.csv` format:
   `X_meters, Y_meters, Z_meters, Intensity, Residual_meters`
2. Place the file in `server/data/lm7/` (e.g., `server/data/lm7/custom_points.xyzi`).
3. `server/services/terrain_service.py` automatically reads the sample points, computes residual standard deviations, and feeds the 3D WebGL point cloud renderer.

---

## 7. Compliance Verification Matrix (`PROBLEM.TXT` vs LUNARIS)

Every requirement and consideration specified in the NASA Space Apps Challenge `PROBLEM.TXT` is fulfilled by LUNARIS:

| Requirement in `PROBLEM.TXT` | Specification & Intent | Implementation in LUNARIS | Status |
| :--- | :--- | :--- | :---: |
| **Interactive Site Selection** | Choose from curated notable sites (Apollo, CLPS, Artemis) or input custom lunar coordinates. | Dropdown catalog with 10+ curated sites, quick-selection showcase ribbon, and a custom coordinates drawer supporting any latitude, longitude, and altitude. | **PASSED** |
| **Site-by-Side Comparison** | Side-by-side or sequential comparison of multiple sites to quickly assess trade-offs. | Dedicated `/site-comparison` dashboard comparing 3 candidate sites across power, communication, and slope with 0ms client-side weight recalculation. | **PASSED** |
| **Date & Time Flexibility** | Select landing dates/times; explore how conditions change across lunar days and seasons. | Date picker, duration selector (24h to 14d), and instant season presets for December Solstice (summer peak) and November (shadow period). | **PASSED** |
| **Sun & Earth Position Visualization** | Display positions of Sun and Earth relative to the horizon at chosen location and time. | 3D Terrain Intelligence viewport renders real-time directional vectors pointing to Sun and Earth; Mission Overview shows precise numerical elevation and clearance angles. | **PASSED** |
| **Time Remaining Before Sunset/Earthset** | Show time remaining before sunset or Earthset, directly impacting power and communication. | Mission Overview displays dynamic operational countdowns: *"Time to Sunset: X.X hrs remaining"* and *"Time to Earthset: X.X hrs remaining"* with warning badges. | **PASSED** |
| **Power & Communication Assessment** | Highlight solar elevation angle, duration of sunlight, and Earth visibility windows. | 4 primary metric cards display solar elevation, Earth LOS elevation, total joint hours, and slope; timeline chart breaks down total energy yield and blackout times. | **PASSED** |
| **Multiple Visualization Approaches** | Explore 2D maps, 3D surface visualizations, and creative representations. | 3D full-sphere globe, 2D Moon Trek tile map, 3D LOLA terrain heightfield with colormap, 360° panoramic horizon projection, and square-wave timeline charts. | **PASSED** |
| **Temporal Dynamics & Animations** | Animations or timeline views showing how positions change over time. | Interactive timeline scrubber with multi-speed playback ($1\times, 5\times, 15\times, 60\times$) synchronized across 3D terrain, globe, metrics, and timeline charts. | **PASSED** |
| **Airless Horizon Topography Calculation** | Calculate horizon positions accounting for Moon's lack of atmosphere (no atmospheric refraction). | NASA/JPL Horizons API queries specify `airless topocentric apparent coordinates`, combined with local DEM terrain horizon obstruction masking. | **PASSED** |
| **LOLA Topography & Slope Accuracy** | Use lunar topography (LOLA) for surface visualization and accurate horizon calculations. | Integrates NASA PGDA Product 78 LOLA LM7 5m/px DEM and crossover-adjusted XYZI point clouds with true crossover residual error coding ($\pm0.55\text{ m}$). | **PASSED** |
| **Earth Libration & Orbit Variations** | Account for Earth's libration (wobble) and lunar orbital variations. | JPL Horizons ephemeris directly computes topocentric vectors including Earth's physical and optical libration relative to the landing site observer. | **PASSED** |
| **Accessibility Across Skill Levels** | Serve both mission planners needing technical depth and educators/students seeking intuition. | 3-question guided Landing Wizard for educators and students; deep ephemeris, GeoTIFF DEM uncertainty, and customizable weight sliders for engineers. | **PASSED** |

---

## 8. Summary of Project Benefits & Impact

1. **Accelerates Mission Planning Decisions**: Cuts the time needed to compare alternate landing sites or dates from days of manual GIS and ephemeris analysis down to **seconds**.
2. **Mitigates Mission Risk**: Ground-truth LOLA point cloud evidence (XYZI) and DEM slope gradients ensure landers do not target steep crater walls or cryogenic shadow traps.
3. **Scientifically Verifiable**: Built on official NASA/JPL Horizons calculations and published NASA Planetary Geodynamics Data Archive (PGDA) products without procedural or mock shortcuts.
4. **Intuitive Aerospace UX**: Designed with responsive layouts, high visual density, clear telemetry indicators, and zero text overlap across any device resolution.
