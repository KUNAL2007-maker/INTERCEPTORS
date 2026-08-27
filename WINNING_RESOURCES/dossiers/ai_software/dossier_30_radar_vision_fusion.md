# Radar Vision: Multi-Modal Millimeter-Wave Radar & Optical Camera Sensor Fusion — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Computer Vision, Deep Learning, Sensor Fusion & Defense Edge Robotics
- **Problem Statement ID & Title**: PS 1606 / Mumbai Nodal Center — Robust Multi-Sensor Target Perception and Spatial Tracking in Degraded Visual Environments (DVE)
- **Sponsoring Ministry / Organization**: Ministry of Defence / Defense Research and Development Organisation (DRDO) / Autonomous Systems Directorate
- **Winning Team Name & Institution**: Radar Vision Team / Department of Electronics & Computer Engineering
- **Team Members & Mentor**: Chethan A.C. (Lead Sensor Fusion & Robotics Engineer), along with computer vision and ROS2 developers; mentored by defense radar systems consultants.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Commended by defense evaluators for maintaining 100% target lock under 90% artificial optical occlusion (heavy smoke and zero-lux fog).

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/radar-vision` (Sensor Fusion & ROS2 Nodes)
- **Secondary / Sub-module Repositories**: `https://github.com/radar-vision/radar-camera-fusion` (Homogeneous Extrinsic Calibration & TensorRT YOLO Pipeline)
- **Live Demo / Web Deployment**: Radar Vision Edge Stream & Tactical Overlay Dashboard
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Radar Vision SIH 2024 Defense Deck — *FMCW Radar Point Cloud Projection and TensorRT Vision Fusion*
- **Video Demonstration / YouTube**: Real-Time Smoke Penetration & Target Bounding Box Tracking Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Multi-Modal Sensor Fusion for Degraded Visual Environments: The SIH 2024 Champion Blueprint

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Autonomous ground vehicles (UGVs) and surveillance drones operating in tactical combat or disaster scenarios frequently encounter Degraded Visual Environments (DVE)—such as dense battlefield smoke screens, dust storms, nighttime fog, and blinding solar glare.
  - Standard RGB optical cameras fail completely in zero-visibility conditions, resulting in loss of target tracking and catastrophic navigational collisions.
  - While 77 GHz Frequency-Modulated Continuous-Wave (FMCW) radar penetrates smoke, fog, and dust effortlessly, raw radar returns produce sparse, noisy point clouds lacking semantic object classification (e.g. inability to distinguish a human soldier from a metallic barricade).
- **Target Beneficiaries / Government End-Users**:
  - DRDO and Indian Armed Forces mechanized infantry reconnaissance units.
  - Paramilitary border surveillance teams operating in high-fog northern frontiers.
  - Autonomous industrial mining and fire-rescue unmanned vehicles.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    RADAR VISION ARCHITECTURE                                        |
+----------------------------------------------------------------------------------------------------+
  [ 77 GHz FMCW Radar Transceiver (TI IWR1843) ]     [ Low-Light High-FPS Optical Camera (IMX477) ]
                         |                                                 |
                         v  (UART/CAN Point Cloud Stream)                 v  (MIPI-CSI / USB3 Video)
  +---------------------------------------------+   +---------------------------------------------+
  |        Radar Signal Processing Unit         |   |         Edge Vision Inference Engine        |
  |  - 2D-FFT Range-Doppler Heatmap Extraction  |   |  - YOLOv8 / YOLOv11 TensorRT (FP16/INT8)    |
  |  - CFAR (Constant False Alarm Rate) Filter  |   |  - Real-time 45+ FPS Object Classification  |
  |  - 3D Point Cloud Clustering (DBSCAN)       |   |  - Optical Confidence Score Estimation      |
  +---------------------------------------------+   +---------------------------------------------+
                         \                                                 /
                          \                                               /
                           v                                             v
  +---------------------------------------------------------------------------------+
  |                  Spatial Calibration & Homogeneous Extrinsic Projection         |
  |  - Real-time 3D Radar-to-2D Camera Coordinate Transformation ($[u, v]^T = \mathbf{K} [\mathbf{R}|\mathbf{t}] [X, Y, Z]^T$) |
  |  - Radar Cluster Bounding-Box Anchor Generation on Camera Image Plane           |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Adaptive Multi-Modal Sensor Fusion (Extended Kalman Filter)    |
  |  - Dynamic Sensor Reliability Weighting ($\alpha_{vis} \cdot \text{Cam} + (1-\alpha_{vis}) \cdot \text{Radar}$) |
  |  - Seamless handover: Autonomous transition to Radar-Only tracking when smoke occludes optics |
  |  - Persistent 3D Velocity & Distance Vector Tracking per Object Target          |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     Tactical Situational Awareness Display                      |
  |  - ROS2 RViz 3D Spatial Visualization & Next.js Tactical Battlefield Console    |
  |  - Sub-30ms End-to-End Edge Pipeline on NVIDIA Jetson Orin Nano Platform        |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Sensor Ingestion**: Captures high-frequency FMCW radar point clouds (Range, Azimuth, Elevation, Doppler Velocity) synchronized with 60 FPS RGB video.
  2. **CFAR Detection & Clustering**: Applies Constant False Alarm Rate (CFAR) algorithms to eliminate radar ghost reflections and groups target returns via DBSCAN.
  3. **Vision Processing**: Runs YOLOv8 with TensorRT acceleration, extracting semantic labels (Person, Vehicle, Drone, Obstacle).
  4. **Extrinsic Projection**: Projects 3D radar spatial clusters onto the 2D image plane using precise extrinsic calibration matrices ($\mathbf{T}_{\text{radar}\to\text{cam}}$).
  5. **Dynamic EKF Fusion**: An Extended Kalman Filter fuses optical bounding boxes with radar range/velocity vectors. If optical confidence drops due to smoke or darkness, the filter automatically transitions to radar Doppler tracking without losing target identity.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Radar-to-Camera Coordinate Projection**:
    $$s \begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \mathbf{K} \begin{bmatrix} \mathbf{R} & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_R \\ Y_R \\ Z_R \\ 1 \end{bmatrix}$$
    where $\mathbf{K}$ is the camera intrinsic matrix, and $[\mathbf{R}|\mathbf{t}]$ is the extrinsic rotation-translation matrix.
  - **Cell-Averaging CFAR (CA-CFAR) Detection Threshold**:
    $$T = \alpha \cdot P_n = \alpha \cdot \frac{1}{N} \sum_{i=1}^N x_i$$
  - **Adaptive Sensor Weighting**:
    $$\mathbf{x}_{k} = \mathbf{x}_{k|k-1} + \mathbf{K}_k \left( \mathbf{z}_k - \mathbf{H} \mathbf{x}_{k|k-1} \right)$$

- **Security, Anonymity & Compliance Framework**:
  - Embedded ROS2 DDS secure communication protocol with encrypted telemetry bus.
  - 100% on-device embedded edge processing with zero RF broadcast leakage.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Next.js 14, WebSockets, RViz2 3D visualization, Tailwind CSS.
- **Backend / Microservices**: C++20, Python 3.10, ROS2 Humble, FastAPI.
- **Blockchain / ML / Core Engine**: PyTorch, NVIDIA TensorRT, OpenCV, Open3D, Point Cloud Library (PCL), YOLOv8 / YOLOv11.
- **Database & Storage**: SQLite (local incident logging), Redis (high-speed frame buffer).
- **DevOps, Hardware & Cloud Infrastructure**: NVIDIA Jetson Orin Nano / Xavier NX, Texas Instruments IWR1843 mmWave Radar, Sony IMX477 Camera Module, Docker for ROS2.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Proven smoke-penetration performance: the team set up a live glass enclosure filled with dense chemical smoke; while the camera feed was completely blinded, the radar-fusion overlay accurately tracked humans moving inside in real-time.
- **Feasibility & Real-World Viability**:
  - High frame rate (45+ FPS) and low power consumption ($<15\text{W}$) running directly on embedded NVIDIA Jetson hardware.
- **Hackathon Execution Completeness**:
  - Complete integration of low-level CAN/UART radar drivers, C++ TensorRT acceleration, spatial matrix calibration, and an intuitive tactical HUD.

## 7. Lessons Learned & SIH Participant Takeaways
- **Physical Demonstrations Settle Evaluator Doubts**: Simulating real adverse conditions (fog/smoke/darkness) on stage proves the necessity of multi-sensor fusion better than any static slide deck.
- **Hardware Acceleration is Mandatory**: Running deep neural networks alongside heavy 3D point cloud math requires TensorRT and C++ optimization to prevent dropped frames on edge devices.
- **Calibrate Rigorously**: Demonstrating a systematic mathematical calibration routine ($\mathbf{K}[\mathbf{R}|\mathbf{t}]$) establishes deep engineering credibility with defense and robotics judges.
