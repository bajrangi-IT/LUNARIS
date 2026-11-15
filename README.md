# LUNARIS — Lunar Mission Intelligence & Landing Site Navigator

**NASA Space Apps Challenge 2026**  
**Category**: Human Exploration / Space Exploration / Software  
**Official Focus**: South Polar Lighting & Direct-to-Earth Communication Optimization

---

## 🛰️ Executive Overview

Missions to the Moon’s south pole face extreme illumination and communication constraints. The low solar elevation angle (frequently under 2° above the local horizon) creates elongated, shifting shadows across deep impact craters, while lunar tidal locking and optical/physical libration generate delicate direct-to-Earth (DTE) visibility windows.

**LUNARIS** is an aerospace-grade mission planning and decision-support workstation designed for mission planners, systems engineers, educators, and the public. It bridges raw celestial ephemerides, high-resolution topography, and photogrammetric terrain masks into actionable, real-time mission intelligence.

---

## 🔭 Key Technical Features & Capabilities

1. **JPL Horizons Ephemeris Engine**:
   - Queries NASA/JPL Solar System Dynamics Horizons API for apparent celestial coordinates from a lunar surface observer (`coord@301`).
   - Targets: Sun (Target 10) and Earth (Target 399).
   - Quantity 4: Apparent Azimuth (0–360° clockwise from North through East) and Apparent Airless Elevation (-90° to +90°).
   - Automatic local file caching and offline IAU analytical lunar astrometry fallback.

2. **Lunar Terrain Horizon & Obscuration Engine**:
   - Integrated with NASA Planetary Geodynamics Data Archive (PGDA) Product 78 (LOLA LM7 Faustini Rim A digital elevation model at 5 m/pixel).
   - Lunar curvature correction:
     $$\theta(d) = \arctan\left(\frac{h_{terrain} - h_{obs} - \frac{d^2}{2 R_{moon}}}{d}\right)$$
     where $R_{moon} = 1737.4\text{ km}$.
   - Evaluates 360-degree radial terrain horizon profiles to detect local relief obscuration of the Sun and Earth.
   - Rigorous compliance with Rule 5: Displays explicit "Data Unavailable" notice outside high-resolution DEM footprint rather than fabricating elevation data.

3. **Sun & Earth Celestial Observatory**:
   - Interactive 3D celestial sphere (Three.js) modeling the lunar observer coordinate frame, solar disk with atmospheric/glare shaders, Earth disk with real libration trajectory, and local horizon compass ring.
   - 2D Panoramic Cylindrical Horizon chart (360° azimuth vs elevation).
   - Time-series scrubber with Play/Pause animation, speed multipliers (1x–60x), and preset duration toggles (24h, 48h, 7-day, 14-day).
   - Real-time countdowns to next geometric sunrise, sunset, Earthrise, and Earthset.

4. **Photovoltaic Power Intelligence**:
   - Instantaneous power modeling:
     $$P(t) = A \cdot \eta \cdot S(t) \cdot \max(0, \cos \theta_{inc})$$
     where $S(t) = 1361\text{ W/m}^2$ (standard AM0 Total Solar Irradiance).
   - Configurable panel parameters: Area ($m^2$), Cell Efficiency ($\eta$, e.g. 28% triple-junction GaAs), and Tracking Architecture (Azimuthal Vertical Tracking, Horizontal Lay-Flat, Fixed Tilt).
   - Numerical energy integration over time ($\text{Wh}$ and $\text{kWh}$) using the trapezoidal rule.
   - Continuous illumination windows and maximum shadow duration analysis for battery sizing.

5. **Direct-to-Earth Communication Link Engine**:
   - Evaluates geometric and terrain-masked line-of-sight elevation for Earth.
   - Earth angular disk subtension modeling ($\approx 1.90^\circ$ subtended diameter / $0.95^\circ$ radius).
   - Categorizes link conditions into Full Disc, Partial Limb Grazing, and Occulted Blackout.
   - Explicit radio link disclaimer separating geometric line-of-sight from RF transceiver link-budget closure.

6. **Mission Scenario Comparison & Decision Support**:
   - Side-by-side trade-off matrix comparing candidate landing sites (e.g. Faustini Rim A vs Connecting Ridge vs Malapert Mountain vs Custom).
   - Multi-attribute utility scoring model with configurable priority weights for Power, Communication, and Landing Safety.
   - Mission replanning tool: simulates launch delays and date shifts with automatic recomputation.
   - Exportable scientific reports in Markdown (.md) and raw JSON formats.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Three.js, Zustand.
- **Backend**: Python 3.13, FastAPI, Uvicorn, NumPy, SciPy, Rasterio, HTTPX.
- **External Data Providers**:
  - NASA/JPL Horizons Ephemeris API: `https://ssd.jpl.nasa.gov/api/horizons.api`
  - NASA Moon Trek WMTS: `https://trek.nasa.gov/tiles/`
  - NASA PGDA LOLA LM7 Faustini Rim A: `https://pgda.gsfc.nasa.gov/products/78`
  - ASU / NASA LROC QuickMap: `https://quickmap.lroc.asu.edu/`

---

## 🚀 Quickstart & Instant Deployment

### Option A: Drag-and-Drop Deployment (Zero Setup / Instant Web Hosting)
The pre-compiled, self-contained production web app is ready in `client/dist`.
1. Go to **[Netlify Drop](https://app.netlify.com/drop)** or **Cloudflare Pages**.
2. Drag and drop the `client/dist` folder directly onto the page.
3. Your application is live instantly! Single Page Application (SPA) routing rules (`_redirects`) and scientific fallback models are pre-packaged so all 4 quadrants, 3D views, telemetry, and site comparisons function immediately with zero configuration.

### Option B: 1-Click Cloud Git Deployment (Vercel / Netlify / Render)
- Connect this repository (`https://github.com/bajrangi-IT/LUNARIS.git`) to **Vercel** or **Netlify**.
- Pre-configured `vercel.json` and `netlify.toml` automatically build the project with standard SPA routing.

### Option C: Containerized Full-Stack Deployment (Docker)
Run the complete Python FastAPI backend + Vite frontend with one command:
```bash
docker build -t lunaris .
docker run -p 8000:8000 lunaris
```
Open `http://localhost:8000`.

### Option D: Local Full-Stack Development
1. **Start FastAPI Backend**:
   ```bash
   pip install -r requirements.txt
   python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Start Frontend Dev Server**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`. Proxied `/api/*` endpoints connect automatically to the Horizons & LOLA engine on port 8000.

---

## 📋 Judge-Facing Demonstration Script

1. **Mission Control Overview** (`/mission-control`):
   - Review live UTC mission clock, active Faustini Rim A target telemetry, Sun and Earth elevation readouts, and data pipeline status.
   - Use the timeline scrubber at the bottom to scrub across the 48-hour mission window and observe the synchronized telemetry changes.

2. **Lunar Site Explorer** (`/lunar-explorer`):
   - Browse the searchable catalogue of candidate landing sites.
   - Observe the distinction between the approximate Faustini Crater Center (permanently shadowed basin floor) and Faustini Rim A (elevated ridge candidate with high illumination).
   - Toggle NASA Moon Trek WMTS layers (LOLA Color Shaded Relief, LRO WAC Global, LOLA Hillshade).
   - Click anywhere on the map or enter custom coordinates to lock a new landing site.

3. **Sun & Earth Celestial Observatory** (`/sun-earth-observatory`):
   - Inspect the interactive 3D celestial sphere. Drag with mouse to orbit around the lunar landing site and view the Sun disk, Earth disk, and libration trajectory.
   - Press **PLAY** on the timeline to animate celestial motion. Observe the Sun moving slowly along the low polar horizon.
   - Review the Next Sunrise, Next Sunset, and Next Earthset countdown timers.

4. **Solar Power Analysis** (`/power-analysis`):
   - View the instantaneous power curve $P(t)$ integrated over the analysis duration.
   - Adjust the solar panel area slider ($m^2$) or toggle the tracking architecture (Vertical Tracking vs Horizontal Lay-Flat) and note the dramatic impact on energy generation.

5. **Direct-to-Earth Communication Link** (`/communication-analysis`):
   - Examine the Direct-to-Earth line-of-sight elevation and terrain clearance curve.
   - Review the link window duration and blackout interval breakdown.

6. **Site Comparison & Decision Engine** (`/site-comparison`):
   - Compare Faustini Rim A, Connecting Ridge, and Malapert Mountain side-by-side.
   - Adjust the priority sliders for Power, Communication, and Landing Safety to see the dynamic composite score recalculation and trade-off synthesis narrative.

7. **Mission Replanning & Export** (`/mission-scenarios`):
   - Change the mission landing date to simulate a schedule shift and click **Recompute Schedule**.
   - Export the comprehensive mission assessment report as a Markdown (.md) or raw JSON file.

8. **Methodology & Provenance** (`/methodology`):
   - Inspect the live data source registry, mathematical derivations, physical constants, and official NASA non-endorsement disclaimers.

---

## ⚖️ Non-Endorsement & Legal Notice
This software is an independent submission developed for the 2026 NASA Space Apps Challenge. NASA does not endorse any non-U.S. Government entity or certify mission operational feasibility.
