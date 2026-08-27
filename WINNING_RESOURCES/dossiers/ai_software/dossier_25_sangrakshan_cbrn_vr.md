# Sangrakshan: CBRN Disaster Response Tactical AI-VR Simulator — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (1st Prize Winner, Cash Award: ₹1,00,000 + Awarded ₹2.7 Million GoI Grant for National Defense Deployment)
- **Category / Domain**: Disaster Management, Physics-Based AI/VR Simulation & Defense Tactical Training
- **Problem Statement ID & Title**: PS SIH 2023 / NDRF — Immersive Simulation and Tactical Training Environment for First Responders in Chemical, Biological, Radiological, and Nuclear (CBRN) Emergencies
- **Sponsoring Ministry / Organization**: National Disaster Response Force (NDRF), Ministry of Home Affairs (MHA), Government of India
- **Winning Team Name & Institution**: Team Sangrakshan / ABES Engineering College, Ghaziabad, Dr. A.P.J. Abdul Kalam Technical University (AKTU)
- **Team Members & Mentor**: Sagar Teotia (Lead Simulation & Full-Stack Architect, GitHub: `@SagarTeotia1`, Portfolio: `sagarteotia.in`), along with 3D game engine developers and backend engineers; mentored by NDRF CBRN specialists.
- **Prize & Recognition**: 1st Prize Winner (₹1,00,000); Subsequently sanctioned a **₹2.7 Million grant from the Government of India** for scaling and deployment across NDRF training academies nationwide.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/SagarTeotia1/NDRF-DEMO-SANGRAKSHAN`
- **Secondary / Sub-module Repositories**: `https://github.com/SagarTeotia1` (Full-Stack Tactical Web Dashboard & WebXR Modules)
- **Live Demo / Official Project Portal**: `https://sagarteotia.in`
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: NDRF SIH Grand Finale Defense Deck — *High-Fidelity CBRN Hazard Dispersion & Cognitive Triage Simulation*
- **Video Demonstration / YouTube**: Sangrakshan CBRN Tactical VR Simulation & Multi-Agent Commander Portal Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: From Hackathon Winning Prototype to ₹2.7M Defense Deployment: The Story of Sangrakshan

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Training NDRF and paramilitary personnel for CBRN disasters (e.g. industrial chlorine leaks, anthrax releases, dirty bomb detonations) via live physical drills is dangerously hazardous, logistically prohibitive, and costs millions of rupees per session in single-use HazMat suit destruction.
  - Existing classroom instruction fails to simulate the psychological terror, sensory deprivation, and time-critical triage pressure experienced during real-world toxic hazard containment.
  - Command centers lacked quantitative analytics to evaluate whether responders followed proper decontamination protocols, maintained safe stand-off distances, or correctly triaged mass casualties based on radiation exposure limits.
- **Target Beneficiaries / Government End-Users**:
  - 16+ National Disaster Response Force (NDRF) Battalions and State Disaster Response Forces (SDRF).
  - National Disaster Management Authority (NDMA) and Defense Research and Development Organisation (DRDO).
  - Industrial Safety Officers and Municipal Fire & Rescue Services.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    SANGRAKSHAN SYSTEM ARCHITECTURE                                  |
+----------------------------------------------------------------------------------------------------+
  [ VR Headset / Trainee Stand ]                  [ Tactical Incident Commander Dashboard ]
  (Oculus Quest 2 / HTC Vive / WebXR)              (React.js + Leaflet Tactical Map)
                 |                                                 |
                 v                                                 v
  +---------------------------------------------------------------------------------+
  |                  Unity 3D / C# Real-Time Physics & Simulation Engine            |
  |  +---------------------------------------------------------------------------+  |
  |  | 1. Gaussian Plume & Eulerian Chemical Gas Dispersion Dynamics              |  |
  |  | 2. Inverse-Square Radioactive Dose & Attenuation Model                    |  |
  |  | 3. Biological Aerosol Droplet Propagation & Quarantine Boundary Logic    |  |
  |  +---------------------------------------------------------------------------+  |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     AI Cognitive Stress & Performance Evaluator                 |
  |  - Gaze-tracking & Hand-Controller Jitter Assessment (Trainee Panic Level)      |
  |  - START (Simple Triage and Rapid Treatment) Protocol Adherence Scorer          |
  |  - HazMat PPE Donning/Doffing Sequential Step Verifier                           |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     Multiplayer WebSocket State Synchronization                 |
  |  - Sub-30ms low-latency multi-agent state replication across trainees           |
  |  - Spatial audio and radio static simulation based on distance and obstructions |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                   Centralized After-Action Review (AAR) Analytics               |
  |  - Automated generation of 3D heatmaps showing radiation exposure overdoses     |
  |  - Individual and battalion performance scorecards with corrective guidance     |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Scenario Generation**: Incident Commander selects disaster parameters (e.g. Ammonia gas tanker puncture in a high-density urban sector with 15 km/h NW wind).
  2. **Atmospheric Dispersion Physics**: The simulation calculates plume concentration gradients ($C(x,y,z)$) across 3D building meshes in real-time.
  3. **Trainee Immersion**: Responders don VR headsets, navigating the contaminated zone using virtual Geiger counters and photoionization detectors (PID).
  4. **Behavioral AI Logging**: Evaluator engine tracks trainee movement trajectories, suit integrity checks, victim triage tags (Red, Yellow, Green, Black), and exposure time in hot zones.
  5. **Post-Mission Decompression & AAR**: Command staff review synchronized 3D mission replays with visual radiation dosage heatmaps, identifying fatal procedural errors.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Gaussian Plume Dispersion Equation**:
    $$C(x, y, z) = \frac{Q}{2\pi u \sigma_y \sigma_z} \exp\left(-\frac{y^2}{2\sigma_y^2}\right) \left[ \exp\left(-\frac{(z-H)^2}{2\sigma_z^2}\right) + \exp\left(-\frac{(z+H)^2}{2\sigma_z^2}\right) \right]$$
    where $Q$ is release rate, $u$ is wind speed, and $\sigma_y, \sigma_z$ are Pasquill-Gifford dispersion coefficients.
  - **Radiation Dose Accumulation (Inverse-Square Law)**:
    $$D_{total} = \int_{0}^{T} \frac{\Gamma \cdot A}{r(t)^2} e^{-\mu d} \, dt$$
    where $A$ is source activity, $r(t)$ is instantaneous distance, and $e^{-\mu d}$ models shielding attenuation.

- **Security, Anonymity & Compliance Framework**:
  - Strict role-based tactical clearances; on-premise local network deployment for air-gapped defense servers.
  - Full compliance with NDMA Standard Operating Procedures (SOPs) for CBRN Disaster Management.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Unity 3D (C#), WebXR, React.js (Command Dashboard), Tailwind CSS, Three.js.
- **Backend / Microservices**: Python (Django / FastAPI), Node.js (Multiplayer WebSocket sync server), Celery.
- **Blockchain / ML / Core Engine**: Unity Physics Engine, C# Compute Shaders for fluid simulation, Scikit-learn (Trainee performance clustering).
- **Database & Storage**: MariaDB, PostgreSQL, Redis (real-time spatial pub/sub).
- **DevOps, Hardware & Cloud Infrastructure**: SteamVR / Oculus OpenXR SDK, Docker, Local Tactical Edge Server.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Real-time physics-grounded toxic gas and radiation propagation inside VR: rather than pre-scripted animations, trainees interacted with a dynamic mathematical dispersion model responding live to wind and terrain.
- **Feasibility & Real-World Viability**:
  - Directly solved a multi-million-dollar defense training constraint; validated by immediate ₹2.7M government funding and official NDRF deployment.
- **Hackathon Execution Completeness**:
  - High-fidelity live demonstration: one teammate wore a VR headset on stage while the command dashboard displayed his synchronized biometric strain and real-time toxic gas exposure on a tactical projection map.

## 7. Lessons Learned & SIH Participant Takeaways
- **Hardware + VR Live Stage Demos Win Big**: Bringing physical VR hardware and demonstrating synchronized multiplayer interaction between the headset user and web dashboard is unforgettable for jury panels.
- **Scientific Rigor Over Visual Effects**: Implementing genuine atmospheric physics (Gaussian plume equations) rather than basic smoke particle effects earned maximum points from defense scientists.
- **Post-Hackathon Momentum**: Pursuing government grant proposals immediately after winning converts prototype success into a funded defense technology venture.
