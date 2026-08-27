# AquaDB: Marine Data Management & Spatial Potential Fishing Zone (PFZ) Predictor — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Satellite Remote Sensing, Marine GIS & Geospatial Machine Learning
- **Problem Statement ID & Title**: PS SIH 2024 / INCOIS — High-Throughput Marine Remote Sensing Data Ingestion, Multi-Parameter Oceanographic Analysis, and Automated Potential Fishing Zone (PFZ) Advisory Generation
- **Sponsoring Ministry / Organization**: Indian National Centre for Ocean Information Services (INCOIS), Ministry of Earth Sciences (MoES), Government of India
- **Winning Team Name & Institution**: Team AquaDB / Department of Computer Engineering & Remote Sensing, Maharashtra
- **Team Members & Mentor**: Sneha Deshmukh (Lead & Spatial Data Architect, GitHub: `@SnehaDeshmukh28`), Vaibhav Ghale (Backend & Pipeline Engineer), alongside domain mentors in oceanographic telemetry.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Commendation from INCOIS scientists for high-throughput NetCDF4 spatial processing pipelines.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/SnehaDeshmukh28`
- **Secondary / Sub-module Repositories**: `https://github.com/SnehaDeshmukh28/AquaDB-Marine-GIS` (Spatial Ingestion & Tile Server)
- **Live Demo / Web Deployment**: `https://aquadb-incois.web.app` (Staging deployment for coastal maritime zones)
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: INCOIS SIH2024 Technical Deck — *High-Resolution Oceanic Front Detection & PFZ Mapping*
- **Video Demonstration / YouTube**: AquaDB 3D Deck.gl Time-Series GIS & Navigational Advisory Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Marine Spatial Analytics & Thermal Front Detection for Artisanal Fishermen (SIH Retrospective)

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Coastal marine fishermen in India lose an estimated ₹1,200+ crore annually in wasted diesel fuel and excessive voyage hours searching for pelagic fish shoals across the Exclusive Economic Zone (EEZ).
  - INCOIS generates daily Potential Fishing Zone (PFZ) advisories using satellite datasets (Oceansat, MODIS, NOAA-AVHRR), but existing processing workflows suffered from massive raster ingestion bottlenecks: multi-gigabyte NetCDF4/HDF5 scientific datasets required 45–90 minutes to decode, extract gradients, and render into static PDF charts.
  - Traditional text and coordinate-based bulletins fail to communicate real-time spatial dynamics (eddy propagation, sea surface thermal fronts, chlorophyll blooms) to non-English literate artisanal fishermen operating standard mobile handsets at sea.
- **Target Beneficiaries / Government End-Users**:
  - Over 4 million traditional and motorized coastal fishermen across 9 maritime states and 2 union territories.
  - INCOIS Marine Oceanography Division and Coastal Zone Management Authorities.
  - Department of Fisheries for monitoring sustainable maritime biomass harvest quotas.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    AQUADB SYSTEM ARCHITECTURE                                      |
+----------------------------------------------------------------------------------------------------+
  [ Satellite Feeds: Oceansat-3 / MODIS / Sentinel-3 / NOAA ]
                           |
                           v  (Hourly FTP/S3 Automated Poll)
  +-----------------------------------------------------------------+
  |              High-Throughput Ingestion Microservice             |
  |  - NetCDF4 / HDF5 Parsing via Xarray & Dask parallel arrays     |
  |  - Spatial Cropping to Indian EEZ (Lat 0°-25°N, Lon 65°-95°E)  |
  +-----------------------------------------------------------------+
                           |
            +--------------+--------------+
            |                             |
            v                             v
  [ Sea Surface Temp (SST) ]   [ Chlorophyll-a Gradients ]
            |                             |
            +--------------+--------------+
                           |
                           v
  +-----------------------------------------------------------------+
  |           Hydrodynamic Feature Extraction & ML Engine           |
  |  - Sobel/Canny Edge Detection for SST Thermal Fronts            |
  |  - Chlorophyll-a Bloom Boundary Segmentation                    |
  |  - Thermal Front & Nutrient Upwelling Intersection Optimizer    |
  |  - XGBoost + U-Net Spatial Fish Aggregation Probability Model   |
  +-----------------------------------------------------------------+
                           |
                           v
  +-----------------------------------------------------------------+
  |              Vector Tile & Advisory Generation Layer            |
  |  - GeoJSON / Mapbox Vector Tile (MVT) Dynamic Tiling Engine     |
  |  - Optimal Fuel-Efficient Navigational Compass Bearing Bearing  |
  |  - Multilingual Vernacular Voice/SMS Dispatcher (Bhashini API)  |
  +-----------------------------------------------------------------+
            |                             |
            v                             v
  [ Interactive WebGIS Portal ]   [ Offline Mobile PWA / SMS Gateway ]
  (Deck.gl + Mapbox + Time-Slider)  (Low-bandwidth Bearing & GPS Grid)
```

- **Data Pipeline & Workflow**:
  1. **Satellite Raster Ingestion**: Microservice automatically downloads raw SST (Sea Surface Temperature) and Ocean Color Monitor (OCM) rasters in NetCDF4 format from INCOIS/ISRO Bhuvan endpoints.
  2. **Parallel Gridded Processing**: Xarray and Dask split spatial grids into parallel chunks, eliminating memory saturation and reducing raster ingestion time from 60 minutes to under 80 seconds.
  3. **Spatial Feature Engineering**: Computes SST spatial gradients ($\nabla SST = \sqrt{(\partial SST/\partial x)^2 + (\partial SST/\partial y)^2}$) and identifies thermal boundaries where temperature shifts exceed $0.5^\circ\text{C}$ per nautical mile.
  4. **Multi-Parameter Intersection**: Intersects thermal fronts with elevated Chlorophyll-a concentrations ($>0.2 \text{ mg/m}^3$) to delineate active marine upwelling zones.
  5. **PFZ Advisory Vectorization**: Converts probability polygons into lightweight Mapbox Vector Tiles (MVT) and generates bearing vectors from major fishing landing centers.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Thermal Front Gradient Filter**:
    $$G(x, y) = \sqrt{S_x^2 + S_y^2}, \quad \text{where } S_x = K_x * I_{SST}, \; S_y = K_y * I_{SST}$$
  - **Fish Aggregation Probability Score ($P_{PFZ}$)**:
    $$P_{PFZ} = w_1 \cdot \sigma(\|\nabla SST\|) + w_2 \cdot \log(1 + [Chl\text{-}a]) + w_3 \cdot \mathcal{F}_{eddy}(v_g)$$
    where $\mathcal{F}_{eddy}(v_g)$ is the geostrophic current vorticity derived from altimetry data.
  - **Optimal Heading Calculation**: Computes Great Circle navigational waypoints minimizing vessel hydrodynamic drag and diesel burn against tidal current vectors.

- **Security, Anonymity & Compliance Framework**:
  - Compliance with National Geospatial Policy (NGP 2022) regarding spatial resolution boundaries.
  - End-to-end encrypted telemetry and secure role-based access for maritime enforcement agencies.
  - Offline local SQLite tile storage for disconnected offshore navigation beyond 12 nautical miles.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js 18, Deck.gl (high-performance WebGL GPU-accelerated spatial layers), Mapbox GL JS, Tailwind CSS, Progressive Web App (PWA) offline service workers.
- **Backend / Microservices**: Python (FastAPI), Celery distributed task queue, Redis for geospatial layer caching.
- **Blockchain / ML / Core Engine**: Xarray, NetCDF4, GDAL/OGR, Rasterio, Scikit-learn, XGBoost, PyTorch (U-Net for thermal boundary segmentation).
- **Database & Storage**: MongoDB (metadata & vessel logs), PostGIS / PostgreSQL (spatial indexing & harbor geometries), AWS S3 / MinIO (raster asset bucket).
- **DevOps, Hardware & Cloud Infrastructure**: Docker containerization, Nginx reverse proxy, Linux automated cron daemon polling INCOIS feeds.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Solved the massive NetCDF4 big-data rendering bottleneck: replaced slow static server-side map generation with instantaneous dynamic client-side WebGL GPU rendering via Deck.gl, allowing judges to slide temporal timelines over 30 days of oceanic changes seamlessly.
- **Feasibility & Real-World Viability**:
  - Direct quantifiable economic impact: saves up to 30% in operational diesel costs per fishing trip while increasing pelagic catch yield by 2–3x.
- **Hackathon Execution Completeness**:
  - Full end-to-end working loop: from live ingestion of scientific satellite NetCDF rasters to a responsive mobile PWA delivering compass bearings and audio advisories in Marathi, Tamil, and Bengali.

## 7. Lessons Learned & SIH Participant Takeaways
- **Handling Scientific Big-Data in Hackathons**: Standard Python image libraries fail on multi-dimensional NetCDF/HDF5 satellite files. Utilizing `xarray` + `dask` gives an immediate competitive advantage over teams struggling with raster memory limits.
- **Bridging High-Tech ML with Low-Tech Users**: Complex mathematical oceanography must be distilled into actionable, simple visual icons (e.g., compass bearing, travel time, fuel estimate) for field beneficiaries.
- **Jury Demonstration Impact**: Demonstrating live time-lapse GPU rendering of ocean currents and chlorophyll blooms directly inside the browser immediately proves technical mastery to domain scientists.
