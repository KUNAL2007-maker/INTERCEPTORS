# ALHA: Aerial Hazardous Atmosphere Detection & Gaussian Plume Dispersion Drone — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Disaster Management, Autonomous Drone Robotics, IoT Sensor Telemetry & Atmospheric Dispersion Modeling
- **Problem Statement ID & Title**: PS SIH1505 — Aerial Location of Hazardous Atmosphere in Industries, Thermal Plume Tracking, and First Responder Evacuation Perimeter Generation
- **Sponsoring Ministry / Organization**: National Fire Service College (NFSC Nagpur), Ministry of Home Affairs (MHA) / Ministry of Coal, Government of India
- **Winning Team Name & Institution**: Team EcoWarriors / Department of Mechanical & Computer Science Engineering
- **Team Members & Mentor**: Prajwal Chapke (Lead UAV & IoT Systems Architect, GitHub: `@prajwalchapke055`), alongside robotics engineers and backend developers; mentored by industrial fire safety officers.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Commended by NFSC chief instructors for autonomous grid flight path execution and dynamic 3D toxic plume mapping.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/prajwalchapke055/SIH-1505---Smart-India-Hackathon-2023`
- **Secondary / Sub-module Repositories**: `https://github.com/prajwalchapke055` (MAVLink DroneKit Autopilot & Gas Sensor Telemetry Daemon)
- **Live Demo / Web Deployment**: ALHA Ground Control Station (GCS) Real-Time Hazardous Atmospheric Console
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: EcoWarriors SIH 2023 Grand Finale Defense Deck — *Autonomous UAV Sensor Arrays for Industrial Gas Leaks & Fire Boundary Geofencing*
- **Video Demonstration / YouTube**: ALHA Autonomous Hexacopter Gas Sniffer Flight & Live Dispersion Map Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Sniffing Danger from the Skies: Building the ALHA Disaster Drone for SIH 2023

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Chemical manufacturing plants, oil refineries, and underground coal mines frequently experience accidental toxic gas leakages (Carbon Monoxide, Sulfur Dioxide, Ammonia, Combustible Hydrocarbons) and subterranean fires.
  - Sending human firefighters into unmapped industrial disaster zones without knowing gas toxicity levels, plume spread vectors, or explosive lower explosive limits (LEL) leads to severe casualties and fatal toxic asphyxiation.
  - Ground-based fixed sensors are often damaged by blast shockwaves or fail to capture 3D atmospheric gas lofting and wind-driven drift across surrounding residential perimeters.
- **Target Beneficiaries / Government End-Users**:
  - National Fire Service College (NFSC) and municipal fire brigades nationwide.
  - Directorate General of Mines Safety (DGMS) and Coal India Limited (CIL).
  - Industrial disaster management teams in chemical corridors (e.g. Dahej, Ankleshwar, Manali, Visakhapatnam).

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                         ALHA ARCHITECTURE                                          |
+----------------------------------------------------------------------------------------------------+
  [ Autonomous Multi-Rotor UAV Hardware Payload ]
  +---------------------------------------------------------------------------------+
  | - Pixhawk 4 Autopilot running ArduPilot / PX4                                   |
  | - Electrochemical Multi-Gas Sensor Pod (MQ-135, MQ-7, MQ-4, BME680, PID TVOC)   |
  | - Dual Gimbal Camera: Optical 4K RGB + FLIR Lepton Thermal Long-Wave Infrared   |
  | - Ultrasonic Anemometer (3D Wind Speed & Direction) + Barometric Altimeter      |
  +---------------------------------------------------------------------------------+
                                           |
                                           v  (MAVLink Telemetry 433MHz / 4G LTE Stream)
  +---------------------------------------------------------------------------------+
  |                  Ground Control Station (GCS) Telemetry Ingestion               |
  |  - Python MAVLink / DroneKit Serial Gateway parsing sensor packets at 10 Hz     |
  |  - Real-time GPS georeferencing of gas ppm values ($x, y, z, \text{ppm}$)       |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |               Atmospheric Gaussian Plume Dispersion & Predictive Engine         |
  |  - Real-time calculation of Pasquill-Gifford stability class (A to F)           |
  |  - 3D Kriging Spatial Interpolation of chemical concentration gradients         |
  |  - 15-to-30 minute predictive plume drift forecast based on dynamic wind shifts|
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Aerial Computer Vision & Trapped Personnel Detector            |
  |  - YOLOv8 Object Detection on RGB/Thermal video stream                          |
  |  - Identification of flame ignition origins and thermal human heat signatures   |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Tactical Incident Commander GIS Map & Evacuation Ring          |
  |  - Dynamic Red / Yellow / Green evacuation geofence polygons on Leaflet Map    |
  |  - Automated SMS alert broadcast to surrounding neighborhood mobile towers      |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Autonomous Grid Survey**: The UAV flies pre-programmed autonomous search patterns over the industrial facility via MAVLink waypoint missions.
  2. **Sensor Pod Ingestion**: Onboard microcontrollers sample gas concentration (PPM), temperature, humidity, and barometric pressure, broadcasting telemetry to the ground station.
  3. **Spatial Kriging & Plume Dispersion**: GCS interpolates discrete sensor readings into continuous 3D gas concentration contour clouds using Gaussian plume math and ordinary Kriging.
  4. **Thermal Vision AI**: YOLOv8 scans the synchronized thermal video feed to pinpoint the exact rupture pipe source and locate unconscious victims trapped in smoke.
  5. **Dynamic Evacuation Zoning**: Generates live, wind-adjusted safety perimeters, alerting emergency commanders which roads to blockade and which residential zones to evacuate.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Atmospheric Dispersion Concentration ($C$)**:
    $$C(x, y, z) = \frac{Q}{2\pi u \sigma_y \sigma_z} \exp\left( -\frac{y^2}{2\sigma_y^2} \right) \left[ \exp\left( -\frac{(z-H)^2}{2\sigma_z^2} \right) + \exp\left( -\frac{(z+H)^2}{2\sigma_z^2} \right) \right]$$
  - **Spatial Kriging Estimator for Gas PPM**:
    $$\hat{Z}(s_0) = \sum_{i=1}^N \lambda_i Z(s_i), \quad \text{subject to } \sum_{i=1}^N \lambda_i = 1$$

- **Security, Anonymity & Compliance Framework**:
  - Compliant with DGCA (Directorate General of Civil Aviation) Digital Sky drone regulations.
  - Fail-safe Return-to-Launch (RTL) triggers on low battery, signal loss, or hazardous gas concentration exceeding flight electronic tolerances.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Leaflet.js, OpenStreetMap, Chart.js, Tailwind CSS.
- **Backend / Microservices**: Python (FastAPI / Flask), AsyncIO, DroneKit-Python, MAVLink protocol parser.
- **Blockchain / ML / Core Engine**: YOLOv8 (PyTorch / OpenCV), SciPy (Spatial Kriging & Interpolation), NumPy.
- **Database & Storage**: SQLite, InfluxDB (time-series sensor telemetry).
- **DevOps, Hardware & Cloud Infrastructure**: Hexacopter Drone Frame, Pixhawk 4 Flight Controller, Raspberry Pi 4 Companion Computer, MQ-series electrochemical gas sensors.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Fused physical aerial robotics, real-time gas telemetry, and physics-grounded Gaussian dispersion modeling into an actionable 3D tactical map.
- **Feasibility & Real-World Viability**:
  - Keeps human firefighters out of lethal chemical hot zones during initial reconnaissance.
- **Hackathon Execution Completeness**:
  - Hardware prototype demonstration: showcased the sensor-integrated drone payload transmitting live gas readings and video to the web dashboard during the final presentation.

## 7. Lessons Learned & SIH Participant Takeaways
- **Hardware Integration Sets You Apart**: In software hackathons, teams that successfully integrate custom physical hardware (drones, sensor pods) consistently score higher than pure web apps.
- **Predictive Physics Adds Real Value**: Don't just display current sensor readings; projecting where a toxic gas plume will drift in 30 minutes solves the actual command dilemma.
- **Fail-Safes are Mandatory in Robotics**: Demonstrating clear autonomous fail-safes (RTL, geofence ceilings) reassures safety and defense evaluators.
