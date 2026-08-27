# Levels: Country-Wide Ground Water Level Analysis & Prediction Engine — SIH 2020 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2020 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Smart Agriculture, Water Resource Management & Time-Series Machine Learning
- **Problem Statement ID & Title**: PS DM 84 — Data analytics to provide complete solution for groundwater management for the country
- **Sponsoring Ministry / Organization**: Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India
- **Winning Team Name & Institution**: Team Levels / Pune Institute of Computer Technology (PICT), Savitribai Phule Pune University
- **Team Members & Mentor**: Hrishikesh Mahajan (Lead ML Architect & Full-Stack Developer, GitHub: `@mahajanhrishikesh`), along with data engineering and GIS teammates; mentored by PICT faculty.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Selected for CGWB national technical review for ground water monitoring automation.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/mahajanhrishikesh/Levels`
- **Secondary / Sub-module Repositories**: `https://github.com/mahajanhrishikesh/Levels/tree/master/frontend` (React & Leaflet UI) & `/backend` (Flask & Time-Series Analytics)
- **Live Demo / Web Deployment**: CGWB National Hydrology Visualization Dashboard Archive
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Levels SIH 2020 Grand Finale Presentation — *Predictive Analytics & Categorization of Aquifers Across 6000+ Blocks*
- **Video Demonstration / YouTube**: Team Levels SIH 2020 Live Demo & Hydrological Forecasting Screencast
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Big Data Hydrological Modeling for Central Ground Water Board: Architecture & Takeaways

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - India is the world's largest consumer of groundwater, extracting over 250 cubic kilometers annually—more than the US and China combined.
  - The Central Ground Water Board (CGWB) collects time-series telemetry from tens of thousands of observation wells nationwide across four seasonal periods (Pre-Monsoon, Monsoon, Post-Monsoon, Rabi/Post-Kharif).
  - Prior to this solution, historical groundwater data spanning 25+ years sat in fragmented, disparate spreadsheets across 28 states and 500+ districts. Hydro-geologists lacked an automated computational system to predict aquifer recharge rates, model multi-year depletion trends, or dynamically classify regional administrative blocks into regulatory stages (*Safe*, *Semi-Critical*, *Critical*, *Over-Exploited*).
- **Target Beneficiaries / Government End-Users**:
  - Central Ground Water Board (CGWB) hydro-geologists and zonal directors.
  - District Collectors and State Water Resource Departments enforcing borewell drilling moratoriums and artificial recharge projects.
  - Agricultural extension officers advising farmers on crop water requirements.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      LEVELS SYSTEM ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
  [ 25+ Years Historical CGWB Well Datasets + IMD Precipitation Data + Soil Permeability Grid ]
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                    Data Cleaning & ETL Ingestion Pipeline                       |
  |  - Automated outlier removal (sensor anomaly & dry-well imputation)             |
  |  - Spatial aggregation by Administrative Boundary (National > State > District) |
  |  - Temporal interpolation across 4 seasonal cycles per annum                    |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                   Multi-Model Time-Series Forecasting Engine                    |
  |  +---------------------------------------------------------------------------+  |
  |  | 1. ARIMA / SARIMAX Engine (Seasonal autoregression on cyclical monsoons)   |  |
  |  | 2. VARMAX (Vector Autoregressive Moving Average with rainfall exog)       |  |
  |  | 3. Holt-Winters Exponential Smoothing (HWES for rapid baseline projection)|  |
  |  | 4. Random Forest Regressor (Non-linear multi-variable regression)          |  |
  |  +---------------------------------------------------------------------------+  |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Aquifer Stage-of-Development Classification Engine             |
  |  - Dynamic computation of Stage of Ground Water Extraction (SOD %):             |
  |      SOD = (Annual Gross Groundwater Draft / Annual Extractable Resource) * 100 |
  |  - Color-Coded Categorization: Safe (<70%), Semi-Critical (70-90%),             |
  |    Critical (90-100%), Over-Exploited (>100%)                                   |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                     Interactive Geospatial & Analytics Portal                   |
  |  - Leaflet.js / PostGIS Chloropleth Boundary Maps (Drill-down to block level)   |
  |  - Chart.js Comparative Model Projection Visualizers (Confidence intervals)     |
  |  - Automated PDF/Excel Executive Policy Brief Generator for District Collectors |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Data Normalization**: Cleans millions of historical depth-to-water-level (DTW) records, handling missing seasonal readings through cubic spline interpolation.
  2. **Feature Fusion**: Merges India Meteorological Department (IMD) rainfall rasters and Geological Survey of India (GSI) lithological aquifer maps with well observation coordinates.
  3. **Parallel Forecasting**: Trains and benchmarks 4 statistical and machine learning models per administrative block, dynamically selecting the model with the lowest Root Mean Squared Error (RMSE).
  4. **Regulatory Index Calculation**: Computes the Stage of Ground Water Extraction (SOD) and evaluates recharge trends over 5-year rolling horizons.
  5. **Drill-Down Visualization**: Serves high-performance GeoJSON polygons allowing instant multi-tiered filtering from nationwide macro views down to local village tehsils.

- **Core Algorithms & Mathematical / Logic Models**:
  - **SARIMAX Seasonal Formulation**:
    $$\Phi_P(B^s)\phi_p(B)(1-B)^d(1-B^s)^D (Y_t - \beta X_t) = \Theta_Q(B^s)\theta_q(B)\epsilon_t$$
    where $X_t$ represents the exogenous monthly monsoon precipitation regressor.
  - **Stage of Groundwater Development (SOD)**:
    $$\text{SOD} = \left(\frac{\text{Existing Gross Draft for All Uses}}{\text{Net Annual Groundwater Availability}}\right) \times 100\%$$
  - **Holt-Winters Multiplicative Seasonality**:
    $$\hat{y}_{t+h|t} = (\ell_t + h b_t) s_{t+h-m(k+1)}$$

- **Security, Anonymity & Compliance Framework**:
  - Role-based access control (Admin, Ministry Official, Public Citizen).
  - Open data compliance adhering to National Data Sharing and Accessibility Policy (NDSAP).

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Leaflet.js, React-Leaflet, Chart.js, Bootstrap 4, HTML5/CSS3.
- **Backend / Microservices**: Python (Flask REST API), Gunicorn.
- **Blockchain / ML / Core Engine**: Statsmodels, Scikit-learn, Pandas, NumPy, SciPy, GeoPandas, Shapely.
- **Database & Storage**: PostgreSQL with PostGIS extension for spatial vector geometries.
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Heroku/AWS EC2 deployment, GitHub Actions.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Macro-to-Micro Scalability: Handled multi-decade nationwide datasets across thousands of administrative blocks with sub-second drill-down rendering on interactive maps.
- **Feasibility & Real-World Viability**:
  - Directly implemented the official CGWB GEC-2015 (Ground Water Estimation Committee) mathematical methodology, ensuring that predicted results matched the regulatory standards used by government water inspectors.
- **Hackathon Execution Completeness**:
  - Provided a complete end-to-end working platform: automated data ingestion, multi-model algorithm benchmarking, interactive chloropleth map visualization, and one-click PDF policy report generation.

## 7. Lessons Learned & SIH Participant Takeaways
- **Align with Official Government Methodologies**: Winning projects do not invent arbitrary formulas; they adopt official committee guidelines (like CGWB GEC standards) and automate them cleanly.
- **Comparative Model Evaluation**: Presenting multiple ML models (ARIMA vs HWES vs VARMAX) with automated RMSE benchmarking builds immense credibility with technical jury members.
- **Actionable Administrative Outputs**: Adding automated PDF summary briefs tailored for district collectors turns raw data science into a deployable governance tool.
