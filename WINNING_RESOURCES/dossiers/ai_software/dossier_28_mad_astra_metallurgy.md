# Mad Astra: Industrial Metallurgy & Continuous Casting Optimization AI — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 (Joint 1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: AI/ML, Industrial Deep Learning, Process Optimization & Smart Metallurgy
- **Problem Statement ID & Title**: PS SIH 2024 / NALCO — Real-Time Property Prediction and Operational Setpoint Optimization for Continuous Cast Aluminum Alloy Wire Rods
- **Sponsoring Ministry / Organization**: National Aluminium Company Limited (NALCO) / Smelter Plant Angul, Ministry of Mines, Government of India
- **Winning Team Name & Institution**: Team Mad Astra / Indian Institute of Information Technology (IIIT) Bhopal, Madhya Pradesh
- **Team Members & Mentor**: Metallurgy AI and Deep Learning engineers from IIIT Bhopal; mentored by industrial automation faculty and NALCO process plant engineers.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Praised by NALCO chief metallurgists for sub-50ms inference time and accurate prediction of non-linear mechanical-electrical property trade-offs.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/madastra` (Team Organization & Algorithm Repositories)
- **Secondary / Sub-module Repositories**: `https://github.com/madastra/aluminum-casting-ai` (ML Property Model & Genetic Optimization Loop)
- **Live Demo / Web Deployment**: Mad Astra Industrial SCADA Telemetry & Optimization Web Dashboard
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: NALCO SIH 2024 Grand Finale Defense Deck — *Neural Property Prediction & Real-Time Setpoint Guidance for Properzi Casting Lines*
- **Video Demonstration / YouTube**: Mad Astra Real-Time SCADA Stream Ingestion & Setpoint Optimization Screencast
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: `https://medium.com/@madastra` — *Deep Learning in Heavy Metallurgy: How Mad Astra Won SIH 2024*

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Continuous casting and rolling mills (such as Continuous Properzi lines) produce electrical grade (EC) aluminum wire rods for high-voltage power transmission.
  - Operators must simultaneously satisfy two conflicting physical property requirements: High Tensile Strength ($\ge 115 \text{ MPa}$) and High Electrical Conductivity ($\ge 61.5\% \text{ IACS}$).
  - Variations in raw molten aluminum chemical composition (iron/silicon ratios, trace titanium/boron additives), casting wheel cooling water pressure, tundish temperature ($680\text{--}710^\circ\text{C}$), and rolling mill motor speeds frequently produce off-spec rod batches, resulting in thousands of tons of scrapped metal and massive thermal energy waste.
  - Traditional quality testing requires physical sample excision, cooling, and destructive tensile testing in a lab, introducing a 2-hour feedback delay during which hundreds of meters of defective rods are continuously cast.
- **Target Beneficiaries / Government End-Users**:
  - NALCO, Hindalco, and Vedanta aluminum smelters and wire rod manufacturing facilities.
  - Ministry of Mines and Ministry of Heavy Industries.
  - Power Grid Corporation of India (PGCIL) and state transmission utilities requiring certified EC grade conductors.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      MAD ASTRA ARCHITECTURE                                         |
+----------------------------------------------------------------------------------------------------+
  [ Industrial PLC / SCADA Stream: Furnace Temp, Casting Wheel Speed, Quench Flow, Chemical Spec ]
                                                |
                                                v  (OPC-UA / Modbus TCP Stream)
  +---------------------------------------------------------------------------------+
  |                  High-Frequency Industrial Telemetry Ingestion                  |
  |  - InfluxDB Time-Series Ingestion Gateway (100 Hz sampling rate)                |
  |  - Anomaly filter & missing telemetry imputation using Kalman Filter            |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                Physics-Informed Deep Neural & Tree Ensemble Engine              |
  |  +---------------------------------------------------------------------------+  |
  |  | 1. XGBoost & LightGBM Multi-Target Regressors (Fast Baseline)              |  |
  |  | 2. PyTorch Multi-Layer Perceptron with Domain Physics Custom Loss:        |  |
  |  |    Loss = MSE + lambda1 * Penalty(Tensile < 115) + lambda2 * Penalty(IACS) |  |
  |  | 3. Sub-50ms Real-Time Tensile Strength & Electrical Conductivity Predictor|  |
  |  +---------------------------------------------------------------------------+  |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                Prescriptive Setpoint Optimizer (Genetic Algorithm / GA)         |
  |  - Evaluates Pareto-optimal front balancing mechanical strength & conductivity  |
  |  - Recommends precise adjustments: Tundish Temp (+/- 3°C), Quench Flow (L/min)   |
  |  - Minimizes specific energy consumption (kWh per ton of cast aluminum)         |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Plant Operator Industrial Console & SCADA Overlay              |
  |  - Real-time Next.js Industrial Dashboard with live parameter gauges            |
  |  - Automated alert buzzer for impending out-of-spec microstructural deviations   |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **SCADA Telemetry Streaming**: Receives 30+ operational features (furnace temperature, casting wheel rpm, water spray nozzles, emulsion temperature, chemical impurity ppm) via industrial OPC-UA protocols.
  2. **Kalman Filtering & Normalization**: Strips high-frequency sensor noise and calculates rolling dynamic averages.
  3. **Ensemble Property Inference**: The trained PyTorch model infers continuous Tensile Strength ($\sigma_{UTS}$) and Conductivity ($\% \text{IACS}$) within 45ms.
  4. **Genetic Algorithm Optimization**: If predicted properties approach the regulatory threshold, the multi-objective GA searches the parameter space to identify the minimal setpoint adjustment required to steer the metallurgy back into optimal bounds.
  5. **Operator Display**: Displays recommended setpoint corrections to the casting pulpit operator with confidence bounds.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Physics-Informed Loss Function**:
    $$\mathcal{L}_{\text{total}} = \text{MSE}(\hat{y}, y) + \alpha \max(0, 115 - \hat{\sigma}_{\text{UTS}})^2 + \beta \max(0, 61.5 - \hat{\text{IACS}})^2$$
  - **Pareto Fitness Function for Setpoint Recommendation**:
    $$\text{Maximize } \mathcal{F}(\mathbf{x}) = w_1 \hat{\sigma}_{\text{UTS}}(\mathbf{x}) + w_2 \hat{\text{IACS}}(\mathbf{x}) - w_3 \|\mathbf{x} - \mathbf{x}_{\text{current}}\|^2 - w_4 E(\mathbf{x})$$
    where $E(\mathbf{x})$ is thermal energy consumption.

- **Security, Anonymity & Compliance Framework**:
  - Air-gapped local plant network deployment protecting proprietary smelting intellectual property.
  - Zero cloud dependency, executing locally on standard industrial IPC (Industrial PCs).

## 5. Technology Stack Breakdown
- **Frontend / Client**: Next.js 14, React.js, Tailwind CSS, Highcharts (industrial time-series telemetry charts), WebSockets.
- **Backend / Microservices**: Python (FastAPI), AsyncIO, OPC-UA Python client library, Celery.
- **Blockchain / ML / Core Engine**: PyTorch, Scikit-learn, XGBoost, LightGBM, DEAP (Distributed Evolutionary Algorithms in Python), Pandas, NumPy.
- **Database & Storage**: InfluxDB (Time-series telemetry storage), PostgreSQL (historical batch records), Redis.
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Docker Compose, Industrial Linux / IPC deployment.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Addressed genuine non-linear physical metallurgy: built a physics-informed loss function that incorporated the fundamental trade-off between mechanical strength and electrical conductivity.
- **Feasibility & Real-World Viability**:
  - Sub-50ms inference latency allowed integration into active SCADA loops without interrupting continuous mill operations.
- **Hackathon Execution Completeness**:
  - Complete operational loop: live telemetry replay, instant property prediction, and interactive genetic algorithm setpoint recommendation tested against real NALCO plant historical logs.

## 7. Lessons Learned & SIH Participant Takeaways
- **Physics-Informed AI Trumps Pure Data Science**: In heavy engineering domains (metallurgy, aerospace, power), standard black-box ML models make physically impossible predictions. Embedding domain physical laws into loss functions wins jury trust.
- **Explainable Optimization**: Recommending small, realistic setpoint changes ($+2^\circ\text{C}$ tundish temp) rather than drastic infeasible modifications proves practical industrial empathy.
- **Edge Latency Benchmarks**: Highlighting sub-50ms cycle times proves your software won't crash high-speed industrial rolling mills.
