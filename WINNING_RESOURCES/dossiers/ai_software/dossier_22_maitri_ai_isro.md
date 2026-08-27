# Maitri AI: Offline Multimodal Well-Being Assistant for Space Missions — SIH 2024/2025 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 / SIH 2025 (1st Prize National Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Healthcare AI, Affective Computing, Edge AI & Space Human Factors
- **Problem Statement ID & Title**: PS SIH 2024 / ISRO — Multimodal Offline AI Assistant for Psychological Monitoring and Cognitive Well-Being Support for Astronauts in Long-Duration Spaceflight
- **Sponsoring Ministry / Organization**: Indian Space Research Organisation (ISRO) / Human Space Flight Centre (HSFC), Department of Space, Government of India
- **Winning Team Name & Institution**: Team Maitri / Medi-Caps University, Indore, Madhya Pradesh
- **Team Members & Mentor**: Tanisha Dhakad (Lead AI & Edge Systems Architect, GitHub: `@tanisha1707`), along with biomedical engineering and signal processing team members; mentored by ISRO aerospace life-support domain consultants.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center; Commended by ISRO scientists for 100% air-gapped zero-cloud execution and dual-modality stress inference.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/tanisha1707`
- **Secondary / Sub-module Repositories**: `https://github.com/tanisha1707/MaitriAI` (Edge Model Weights, Quantized GGUF Pipeline, Voice Biomarker DSP)
- **Live Demo / Web Deployment**: Local Air-Gapped Workstation / Flutter Desktop Spacecraft Build
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: ISRO SIH Evaluation Deck — *Edge-Native Affective Computing for Crew Resilience in Low-Earth Orbit*
- **Video Demonstration / YouTube**: Maitri AI Real-Time Micro-Expression & Vocal Prosody Diagnostic Showcase
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Building Offline Affective AI for Gaganyaan: Lessons from SIH Champion Pitch

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Long-duration crewed space missions (such as ISRO's Gaganyaan and the future Bharatiya Antariksh Station) expose astronauts to extreme isolation, microgravity disorientation, sleep deprivation, and high-consequence operational stressors.
  - Deep space exploration or Low Earth Orbit (LEO) comms blackout zones preclude reliance on ground-based tele-counseling or cloud-based LLM APIs (OpenAI, Gemini, Claude) due to speed-of-light transmission latency (seconds to minutes) and strict operational air-gapping.
  - Existing onboard psychological monitoring tools rely on tedious, manual subjective surveys which astronauts often neglect or bias due to reporting apprehension.
- **Target Beneficiaries / Government End-Users**:
  - ISRO Astronaut Crew (Vyomanauts) aboard orbital modules and space habitats.
  - Flight Surgeons and Mission Control Bio-Medical Engineers at ISRO HSFC.
  - Submarine crews and polar research expeditions (Maitri & Bharati Antarctic stations) operating under identical psychological isolation constraints.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    MAITRI AI EDGE ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
  [ High-FPS Video Stream ]                     [ Studio/Headset Audio Stream ]
            |                                                 |
            v                                                 v
  +-----------------------------------+             +-----------------------------------+
  | Facial Micro-Expression & Fatigue |             |  Acoustic Stress Biomarker (DSP)  |
  | - OpenCV Frame Grabber (60 FPS)   |             | - Voice Activity Detection (VAD)  |
  | - MediaPipe 468-pt Face Mesh      |             | - Librosa MFCC / Spectral Skew    |
  | - PERCLOS Eye-Blink Duration      |             | - Vocal Jitter, Shimmer & Formants|
  | - Action Unit (AU) Activation     |             | - Prosodic Pitch Perturbation     |
  +-----------------------------------+             +-----------------------------------+
                    \                                 /
                     \                               /
                      v                             v
  +---------------------------------------------------------------------------------+
  |                  Multimodal Affective Fusion Transformer Engine                 |
  |  - Late-Fusion Cross-Attention Layer combining Facial AU + Acoustic Stress      |
  |  - Continuous Valence-Arousal Metric Estimator                                  |
  |  - Discrete Cognitive Fatigue & Acute Anxiety Classifier                        |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Air-Gapped Quantized Small Language Model (SLM)                |
  |  - GGUF-Quantized Llama-3.2-3B / Phi-3 Mini running on llama.cpp / Ollama       |
  |  - Retrieval-Augmented CBT (Cognitive Behavioral Therapy) Protocol Vector DB    |
  |  - Zero-Cloud Local Inference (<80ms token latency on local CPU/NPU)            |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     Crew Interface & Interactive Interventions                  |
  |  - Empathetic Conversational Agent with Voice Response (Piper Offline TTS)      |
  |  - Guided Autogenic Relaxation & Guided Breath-Pacing Visualizer                |
  |  - Encrypted On-Premise Health Vault for Post-Mission Flight Surgeon Review     |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Non-Intrusive Sensory Ingestion**: Captures high-frequency video frames and audio streams during daily scheduled check-ins or natural conversational interactions.
  2. **Micro-Expression & Fatigue Extraction**: Computes PERCLOS (Percentage of Eye Closure over time) and monitors Facial Action Coding System (FACS) units (AU4 brow furrow, AU12 lip corner pull, AU15 lip corner depressor).
  3. **Vocal Biomarker Decomposition**: Decomposes voice signals into Mel-Frequency Cepstral Coefficients (MFCCs), fundamental frequency ($F_0$), jitter (pitch instability), and shimmer (amplitude instability) using Librosa and PyWorld.
  4. **Multi-Modal Cross-Attention Fusion**: Combines visual and acoustic embeddings into a synchronized affective vector to output continuous Valence (emotional pleasantness) and Arousal (physiological activation) states.
  5. **Local SLM Response Generation**: The quantized SLM ingests the affective vector as system context and conducts empathetic, CBT-grounded dialogue, providing structured stress mitigation protocols.

- **Core Algorithms & Mathematical / Logic Models**:
  - **PERCLOS Eye Closure Fatigue Formula**:
    $$\text{PERCLOS} = \frac{\sum_{t=1}^N \mathbb{I}(\text{EAR}_t < 0.20)}{N} \times 100$$
    where $\text{EAR}_t$ is the Eye Aspect Ratio $\frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2\|p_1 - p_4\|}$.
  - **Acoustic Jitter (Cycle-to-Cycle Pitch Perturbation)**:
    $$\text{Jitter}(\%) = \frac{\frac{1}{N-1}\sum_{i=1}^{N-1} |T_i - T_{i+1}|}{\frac{1}{N}\sum_{i=1}^N T_i} \times 100$$
  - **Multimodal Valence-Arousal Estimation**:
    $$\mathbf{z}_{affect} = \text{Softmax}\left(\frac{\mathbf{Q}_{face}\mathbf{K}_{audio}^T}{\sqrt{d}}\right)\mathbf{V}_{audio}$$

- **Security, Anonymity & Compliance Framework**:
  - 100% air-gapped architecture with zero outbound socket connections.
  - AES-256 local database encryption for all astronaut conversational logs and biometric vectors.
  - Strict compliance with NASA/ISRO Astronaut Bioethics & Privacy Directives.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Flutter Desktop (Cross-platform Linux/Windows mission terminal), Three.js / WebGL bio-feedback interactive visualizers.
- **Backend / Microservices**: Python 3.11, FastAPI local daemon, llama.cpp C++ bindings, Piper Neural Offline TTS, Whisper.cpp (offline STT).
- **Blockchain / ML / Core Engine**: PyTorch, OpenCV, MediaPipe Holistic, Librosa, PyWorld Vocoder, Ollama (GGUF Quantization: Llama-3.2-3B-Instruct Q4_K_M).
- **Database & Storage**: SQLite (encrypted with SQLCipher), ChromaDB (local vector store for spaceflight psychology manual).
- **DevOps, Hardware & Cloud Infrastructure**: Runs natively on low-power Intel Core i7 / ARM64 embedded SBCs without requiring discrete datacenter GPUs.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Complete elimination of cloud dependencies: executed full multimodal conversational AI, voice stress analysis, and facial fatigue detection on a single air-gapped laptop with zero latency and zero internet access.
- **Feasibility & Real-World Viability**:
  - Directly answered ISRO’s immediate requirements for the Gaganyaan orbital module life support telemetry ecosystem.
- **Hackathon Execution Completeness**:
  - Live jury demo: team members simulated acute cognitive stress through rapid arithmetic and controlled vocal strain, while Maitri AI instantly detected pitch shimmer and eye-blink degradation, initiating guided decompression dialogue.

## 7. Lessons Learned & SIH Participant Takeaways
- **The Power of Edge & Offline Constraints**: When designing solutions for defense, space, or disaster management, proving your system runs 100% air-gapped with zero cloud APIs wins immediate praise over generic OpenAI wrapper apps.
- **Biomarker Fusion Depth**: Single-modality emotion detection (e.g. basic text sentiment) is easily spoofed; fusing physical audio jitter with facial action units demonstrates deep domain engineering.
- **Hardware Agnostic Design**: Packaging quantized SLMs via `llama.cpp` ensures high responsiveness on standard laptops, eliminating hackathon demo crashes caused by internet outages.
