# Signal-X: Edge Vision Adaptive Traffic Optimization & Emergency Green Corridor — SIH 2024/2025 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 / SIH 2025 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Computer Vision, Edge AI, IoT & Smart City Transportation Infrastructure
- **Problem Statement ID & Title**: PS SIH 2024 / MoRTH — Real-Time Adaptive Traffic Signal Optimization Using Edge Computer Vision and Automated Emergency Green Corridor Preemption
- **Sponsoring Ministry / Organization**: Ministry of Road Transport and Highways (MoRTH) / Smart Cities Mission, Ministry of Housing and Urban Affairs (MoHUA)
- **Winning Team Name & Institution**: Team Signal-X / Department of Computer Science & Automation Engineering
- **Team Members & Mentor**: Priyanshi Bothra (Lead AI & Embedded Systems Architect), Arsh Tiwari (Core Backend & Vision Engineer, GitHub: `@ArshTiwari2004`); mentored by urban transportation traffic commissioners.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Demonstrated a **35% reduction in intersection queue delay** in multi-junction traffic simulations.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/ArshTiwari2004/Signal-X`
- **Secondary / Sub-module Repositories**: `https://github.com/ArshTiwari2004/Signal-X/tree/main/edge_cv` (YOLOv8 Lane Density & Emergency Siren Audio Classifier)
- **Live Demo / Web Deployment**: Signal-X Smart City Central Traffic Operations Command Console
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Signal-X SIH 2024 Grand Finale Defense Deck — *Dynamic Webster-Split Optimization & Siren-Triggered Emergency Corridors*
- **Video Demonstration / YouTube**: Signal-X Real-Time Video Vehicle Counting & Automated Green Light Clearance Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Re-Engineering Urban Traffic Signals with Edge Vision: The Signal-X SIH Blueprint

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Over 90% of urban traffic signals in India operate on static, fixed-time timers (e.g. 60 seconds per arm), regardless of real-time vehicular density. This causes massive idling at empty intersections, costing the Indian economy an estimated $22 Billion annually in wasted fuel and productivity loss.
  - Emergency vehicles (ambulances, fire engines) are frequently stranded in dense bottleneck queues, leading to preventable mortalities: an estimated 30% of emergency patient fatalities in urban centers are attributed to delayed hospital transit times.
  - Traditional induction loops or subterranean magnetic sensors are expensive to install, easily damaged by road digging, and provide no vehicle classification capabilities.
- **Target Beneficiaries / Government End-Users**:
  - Traffic Police Directorates and Municipal Corporations across Tier-1 and Tier-2 cities.
  - Emergency medical services, trauma centers, and fire departments.
  - Urban commuters and public transit bus operators.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      SIGNAL-X SYSTEM ARCHITECTURE                                    |
+----------------------------------------------------------------------------------------------------+
  [ 4-Arm Intersection CCTV Video Streams ]          [ Acoustic Siren Mic Array + Ambulance GPS ]
                      |                                                   |
                      v                                                   v
  +---------------------------------------------+   +---------------------------------------------+
  |       Edge Vision Ingestion & Counting      |   |    Emergency Siren & Preemption Gateway     |
  |  - YOLOv8 Edge Inference (30+ FPS per arm)  |   |  - Audio FFT Siren Harmonic Classifier      |
  |  - Vehicle Classification (Car, Bus, 2-W)   |   |  - GPS Geofence & Approaching Route Matcher |
  |  - Passenger Car Unit (PCU) Density Vector  |   |  - Priority Preemption State Trigger        |
  +---------------------------------------------+   +---------------------------------------------+
                      \                                                   /
                       \                                                 /
                        v                                               v
  +---------------------------------------------------------------------------------+
  |                 Dynamic Green-Split Timing Optimization Engine                  |
  |  - Modified Webster's Delay Minimization Algorithm                              |
  |  - Dynamic Cycle Length ($C_0$) & Effective Green Time ($g_i$) Calculation      |
  |  - Real-time Phase Balancing preventing starvation on minor approach arms       |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Hardware Signal Controller Interface (MQTT / GPIO)             |
  |  - Direct Relay / PLC Actuation switching physical traffic lights               |
  |  - Automated Fail-Safe Fallback: Reverts to static timers if camera drops offline|
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                   Centralized Traffic Police Command Dashboard                  |
  |  - Live intersection congestion heatmaps, queue lengths & CO2 reduction metrics |
  |  - Driver Mobile App (Flutter) displaying green corridor countdown for medics   |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Video Feed Ingestion**: Connects to 4 RTSP camera feeds covering all intersection arms.
  2. **Vehicle Detection & PCU Conversion**: YOLOv8 detects and counts vehicles per lane, multiplying counts by standard Passenger Car Unit (PCU) factors (Two-Wheeler = 0.5, Car = 1.0, Bus/Truck = 3.0).
  3. **Webster Green Time Allocation**: Computes optimal cycle length and allocates green light durations proportional to current PCU demand.
  4. **Emergency Vehicle Interruption**: When an approaching ambulance is detected via computer vision, siren audio FFT, or GPS geofence ($<300\text{m}$), the system smoothly truncates conflicting red phases and forces a green corridor along the ambulance's route.
  5. **Hardware Actuation**: Dispatches MQTT command payloads to Raspberry Pi / industrial relay boards controlling the physical traffic light heads.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Modified Webster Optimal Cycle Time ($C_0$)**:
    $$C_0 = \frac{1.5 L + 5}{1 - Y}, \quad \text{where } Y = \sum_{i=1}^n y_i = \sum_{i=1}^n \frac{q_i}{s_i}$$
    $L$ is total lost time per cycle, $q_i$ is actual PCU arrival flow, and $s_i$ is saturation flow rate.
  - **Effective Green Time for Approach $i$ ($g_i$)**:
    $$g_i = \frac{y_i}{Y} (C_0 - L)$$
  - **Acoustic Siren Harmonic Detection**:
    $$\mathcal{H}_{siren} = \frac{\int_{f_1}^{f_2} |X(f)|^2 df}{\int_{0}^{F_s/2} |X(f)|^2 df} > \theta_{siren}$$
    targeting characteristic $700\text{--}1500\text{ Hz}$ wail/yelp frequencies.

- **Security, Anonymity & Compliance Framework**:
  - Encrypted MQTT with TLS mutual authentication for all edge controller hardware.
  - Built-in watchdog timer providing instant fail-safe fallback to standard fixed timers during network or hardware faults.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js 18, Next.js, Tailwind CSS, Leaflet.js, Flutter (Emergency Driver Mobile App).
- **Backend / Microservices**: Python (FastAPI), AsyncIO, Mosquitto MQTT Broker, Node.js.
- **Blockchain / ML / Core Engine**: YOLOv8, OpenCV, NVIDIA DeepStream SDK, PyTorch, Librosa (Audio DSP).
- **Database & Storage**: MongoDB (Traffic analytics logs), Redis (real-time lane state cache).
- **DevOps, Hardware & Cloud Infrastructure**: Raspberry Pi 4 / NVIDIA Jetson Nano, 8-Channel Relay Module, Docker, Nginx.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Proven traffic delay reduction: demonstrated a live 35% reduction in simulated intersection queue times using real-time Webster adaptive math rather than arbitrary heuristic timing.
- **Feasibility & Real-World Viability**:
  - Retrofit-friendly: uses existing overhead CCTV cameras and low-cost edge microcontrollers without tearing up roads.
- **Hackathon Execution Completeness**:
  - End-to-end hardware demonstration: built a 4-way physical model intersection with miniature LED traffic lights and toy cars; when an ambulance model entered the camera view, the system immediately transitioned lights to clear a green path.

## 7. Lessons Learned & SIH Participant Takeaways
- **Physical Model Demos Captivate Evaluators**: Building a miniature physical intersection with working LEDs and cameras makes your software tangibly real to non-coding evaluators.
- **Fail-Safe Design is Essential for Civil Infrastructure**: Smart city judges always ask: *"What happens if the camera fails?"* Demonstrating an automatic hardware watchdog fallback to fixed timers answers the objection instantly.
- **Standardize with Engineering Units (PCU)**: Counting raw cars is amateur; converting vehicles into civil-engineering-standard Passenger Car Units (PCUs) proves true domain mastery.
