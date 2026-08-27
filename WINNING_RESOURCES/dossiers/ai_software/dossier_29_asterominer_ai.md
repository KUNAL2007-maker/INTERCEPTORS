# AsteroMiner AI: Deep Learning Space Resource Prospector & Orbital Trajectory Optimizer — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: SpaceTech, Astro-Informatics, Deep Learning & Astrodynamics
- **Problem Statement ID & Title**: PS SIH 2024 / Space Exploration — Machine Learning Classification of Near-Earth Asteroid Mineral Compositions, Economic Valuation, and Rendezvous Trajectory Feasibility
- **Sponsoring Ministry / Organization**: ISRO Space Exploration Track / Department of Space, Government of India
- **Winning Team Name & Institution**: Team AsteroMiner / Department of Computer Science & Space Engineering
- **Team Members & Mentor**: Muskan Goyal (Lead AI Architect, GitHub: `@muskangoyal0606`), Sayeed Khan (Orbital Mechanics & Backend Engineer); mentored by astrophysics and satellite telemetry researchers.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Commended by space science evaluators for ingesting and classifying over 1,000,000 celestial records from the NASA JPL database.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/muskangoyal0606/SIH_2024`
- **Secondary / Sub-module Repositories**: `https://github.com/muskangoyal0606/SIH_2024/tree/main/ml_pipeline` (PyTorch Classifier & Orbital Trajectory Engine)
- **Live Demo / Web Deployment**: AsteroMiner AI Interactive Celestial Prospector Dashboard
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: AsteroMiner SIH 2024 Grand Finale Presentation — *Machine Learning Mineral Prospecting on 1M+ Small Celestial Bodies*
- **Video Demonstration / YouTube**: AsteroMiner Deep Learning Classifier & 3D Orbital Trajectory Rendezvous Simulation Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Deep Learning for Asteroid Mining: Inside the SIH 2024 Winning Architecture

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Near-Earth Asteroids (NEAs) hold trillions of dollars in critical minerals (Platinum group metals, Nickel, Cobalt, Water Ice for rocket propellant).
  - NASA Jet Propulsion Laboratory (JPL) and astronomical surveys have cataloged over 1,000,000 small solar system bodies, but spectroscopic and observational data is sparse, noisy, and high-dimensional.
  - Space agencies and commercial prospectors lacked an automated computational system to predict spectral taxonomic classes (C-type carbonaceous, S-type stony, M-type metallic, V-type basaltic) for unclassified asteroids, estimate their in-situ economic valuation, and calculate the rocket propulsion Delta-V ($\Delta v$) budget required for spacecraft rendezvous.
- **Target Beneficiaries / Government End-Users**:
  - ISRO Space Science Programme Office and Deep Space Exploration Divisions.
  - Planetary Defense and Space Resource Utilization (SRU) research consortiums.
  - Academic astrophysics and celestial mechanics institutions.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    ASTEROMINER AI ARCHITECTURE                                      |
+----------------------------------------------------------------------------------------------------+
  [ NASA JPL Horizons API & Small-Body Database (1,000,000+ Asteroid Records) ]
                                           |
                                           v  (Automated ETL Ingestion)
  +---------------------------------------------------------------------------------+
  |                  Astro-Informatic Feature Engineering & Cleaning                |
  |  - Orbital Parameters: Semi-Major Axis ($a$), Eccentricity ($e$), Inclination ($i$)   |
  |  - Optical Parameters: Absolute Magnitude ($H$), Geometric Albedo ($p_v$), Color B-V|
  |  - Imputation of sparse spectral features using Iterative SVD                   |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Deep Neural Spectral Classification Engine                     |
  |  - Custom PyTorch Residual Multi-Layer Network with Batch Normalization         |
  |  - 89.8% Multi-Class Accuracy across Tholen & Bus-DeMeo Spectral Classes        |
  |  - Mineral mass estimation (Platinum, Gold, Iron, Nickel, Water Ice)            |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |               Orbital Mechanics & Delta-V Trajectory Feasibility                |
  |  - Lambert's Problem Solver for Orbital Rendezvous Trajectory Calculation        |
  |  - Earth-to-Asteroid Hohmann Transfer & Continuous-Thrust Propulsion Delta-V    |
  |  - Mission Feasibility Index combining Mining Value vs Delta-V Fuel Cost        |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     LLM Mission Intelligence Agent & 3D Orbit UI                |
  |  - Three.js / WebGL 3D Solar System Interactive Keplerian Orbit Visualizer      |
  |  - Conversational RAG agent providing historical mission flyby context          |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Big Astro-Data Ingestion**: Ingests over 1,000,000 records from the NASA JPL Small-Body Database (SBDB) and Horizons ephemeris feeds.
  2. **Preprocessing & Feature Selection**: Normalizes orbital eccentricity, perihelion, aphelion, orbital period, albedo, and absolute visual magnitude.
  3. **Neural Mineral Classification**: The deep learning model predicts taxonomic spectral class (e.g. M-type metallic vs C-type volatile-rich) with 89.8% precision.
  4. **Economic Valuation Modeling**: Calculates physical diameter ($D = 1329 / \sqrt{p_v} \cdot 10^{-0.2H}$), estimated volume, density, and market commodity valuation.
  5. **Delta-V & Mission Optimization**: Solves Lambert's orbital transfer boundary value problem to identify asteroids reachable with $<5.5 \text{ km/s}$ total propulsion $\Delta v$.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Asteroid Diameter Calculation**:
    $$D = \frac{1329}{\sqrt{p_v}} \times 10^{-0.2 H} \text{ (in kilometers)}$$
  - **Total Economic Mineral Value ($V_{\text{total}}$)**:
    $$V_{\text{total}} = \frac{\pi}{6} D^3 \rho \sum_{m} c_m \cdot P_m$$
    where $\rho$ is bulk density, $c_m$ is estimated mass fraction of metal $m$, and $P_m$ is spot commodity price.
  - **Hohmann Transfer Delta-V ($\Delta v$)**:
    $$\Delta v = \sqrt{\frac{\mu}{r_1}} \left( \sqrt{\frac{2 r_2}{r_1 + r_2}} - 1 \right) + \sqrt{\frac{\mu}{r_2}} \left( 1 - \sqrt{\frac{2 r_1}{r_1 + r_2}} \right)$$

- **Security, Anonymity & Compliance Framework**:
  - Open data compliance adhering to NASA Planetary Data System (PDS) standards and COSPAR planetary protection guidelines.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Three.js (3D Keplerian Solar System Simulation), Streamlit, Tailwind CSS.
- **Backend / Microservices**: Python (FastAPI), AsyncIO, Celery.
- **Blockchain / ML / Core Engine**: PyTorch, Scikit-learn, AstroPy, Skyfield, Pandas, NumPy, NASA JPL Horizons API.
- **Database & Storage**: PostgreSQL, SQLite, Feather/Parquet format for ultra-fast local 1M+ celestial record querying.
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Streamlit Cloud / AWS EC2.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Big data scale and astrodynamic depth: trained neural networks on 1,000,000+ real celestial bodies and rendered interactive 3D orbital trajectories in WebGL.
- **Feasibility & Real-World Viability**:
  - Combined pure mineral valuation with rocket fuel physics ($\Delta v$ budget), preventing unrealistic hype by penalizing high-value asteroids with unreachable orbits.
- **Hackathon Execution Completeness**:
  - Functional end-to-end pipeline: search any asteroid identifier (e.g. 16 Psyche, Bennu, Ryugu, or newly cataloged NEAs) and receive instant mineral breakdown, valuation ($ billions), and 3D flight trajectory.

## 7. Lessons Learned & SIH Participant Takeaways
- **Scale Matters**: Training and demonstrating an ML model on 1M+ real NASA records instantly outshines projects built on toy 500-row CSVs.
- **Combine Economics with Physics**: In resource exploration projects, showing high potential revenue is meaningless without calculating the physical cost to extract it.
- **Interactive 3D Visuals Captivate Judges**: Rendering a 3D solar system with orbital paths in Three.js elevates a data science pitch into a world-class space technology showcase.
