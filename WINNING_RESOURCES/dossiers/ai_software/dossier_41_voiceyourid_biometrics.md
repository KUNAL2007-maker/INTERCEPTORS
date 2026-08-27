# VoiceYourID: Contactless Voice Biometric Authentication & Anti-Spoofing Engine — SIH 2020 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2020 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Speech AI, Acoustic Signal Processing, Voice Biometrics & Cybersecurity Anti-Spoofing
- **Problem Statement ID & Title**: PS SIH 2020 / Digital India & Security — Contactless Voice Biometric Identity Authentication and Anti-Replay Liveness Verification for Citizen Public Services
- **Sponsoring Ministry / Organization**: Unique Identification Authority of India (UIDAI) / Ministry of Electronics and Information Technology (MeitY), Government of India
- **Winning Team Name & Institution**: Team VoiceYourID / Jaypee Institute of Information Technology (JIIT), Noida, Uttar Pradesh
- **Team Members & Mentor**: Yash Agarwal (Lead Audio DSP & Biometrics Architect, GitHub: `@Yashcoder2802`), alongside machine learning and web security engineers; mentored by biometric identity consultants.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Commended by cybersecurity judges for defeating live acoustic replay attacks during stage defense.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/Yashcoder2802/VoiceYourID`
- **Secondary / Sub-module Repositories**: `https://github.com/Yashcoder2802/VoiceYourID/tree/master/backend` (GMM-UBM, ResNet Voiceprint Embeddings & Anti-Spoof DSP)
- **Live Demo / Web Deployment**: VoiceYourID Contactless Biometric Authentication Portal
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: VoiceYourID SIH 2020 Grand Finale Defense Deck — *Acoustic Liveness Verification & Sub-120ms Voiceprint Matching*
- **Video Demonstration / YouTube**: VoiceYourID Live Enrollment, Cosine Distance Verification & Anti-Spoof Attack Rejection Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Engineering Anti-Spoof Voice Biometrics: How Team VoiceYourID Won SIH 2020

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Traditional biometric authentication (optical fingerprint scanners, iris cameras) requires physical contact with shared hardware or expensive dedicated optical peripherals.
  - In rural banking (Aadhaar Enabled Payment System - AEPS) and public distribution shops (PDS ration counters), manual laborers and elderly citizens frequently fail fingerprint verification due to worn epidermal ridges or dirty hands (failure rates exceed 15–20%).
  - While voice authentication offers a 100% contactless, hardware-free alternative using standard mobile/telephone microphones, simple voice matching is vulnerable to acoustic replay attacks (malicious actors playing a secret recording of the victim's voice through a loudspeaker) and synthetic deepfake voice clones.
- **Target Beneficiaries / Government End-Users**:
  - UIDAI, National Payments Corporation of India (NPCI), and AEPS micro-ATMs.
  - Public Distribution System (PDS) fair price shops verifying rural ration beneficiaries.
  - Remote pension verification (*Jeevan Pramaan*) for elderly citizens from their homes.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    VOICEYOURID ARCHITECTURE                                         |
+----------------------------------------------------------------------------------------------------+
  [ Citizen Spoken Audio Input via Web Audio API / Telephone IVRS ]
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Acoustic Pre-Processing & Voice Activity Detection (VAD)       |
  |  - WebRTC VAD: Strips non-speech background silence and room acoustic noise     |
  |  - Normalization & Framing (25ms Hamming Window with 10ms Frame Shift)          |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |             Anti-Spoofing & Acoustic Liveness Verification Stage                |
  |  +---------------------------------------------------------------------------+  |
  |  | 1. Dynamic Challenge-Response (Randomized 4-digit phrase prompt)           |  |
  |  | 2. High-Frequency Spectral Decay Analysis (Detecting loudspeaker pop &    |  |
  |  |    digital DAC playback distortion vs genuine human vocal tract harmonics)|  |
  |  | 3. Phase Continuity & Linear Frequency Cepstral Coefficients (LFCC)       |  |
  |  +---------------------------------------------------------------------------+  |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Deep Speaker Embedding Extraction (ResNet / GMM-UBM)           |
  |  - 64 Mel-Filterbank Energies -> 512-Dimensional Deep Speaker Embedding Vector  |
  |  - Probabilistic Linear Discriminant Analysis (PLDA) / Cosine Distance Matcher   |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Authentication Decision & Citizen Service Dispatcher           |
  |  - Sub-120ms Vector Cosine Similarity against Encrypted Aadhaar Voice Vault    |
  |  - Instant OTP-free KYC Verification & Government Benefit Transaction Release   |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Dynamic Challenge Ingestion**: The system presents a randomized, single-use 4-word or 4-digit phrase on screen (e.g. *"Bharat 7 9 2"*).
  2. **Acoustic Preprocessing**: WebRTC VAD isolates active speech chunks and computes Mel-Frequency Cepstral Coefficients (MFCCs) and Linear Frequency Cepstral Coefficients (LFCCs).
  3. **Liveness & Anti-Spoof Filter**: Analyzes high-frequency phase spectrum and sub-band energy ratios to detect loudspeaker playback harmonics or deepfake vocoder artifacts.
  4. **Speaker Embedding Inference**: Passes clean speech through a deep ResNet speaker recognition model, generating a normalized 512-D identity vector.
  5. **Fast Cosine Distance Decision**: Compares the embedding against the user's enrolled voice template in $<120\text{ms}$; if similarity $>0.82$ and liveness passes, authentication is approved.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Speaker Embedding Cosine Distance**:
    $$\text{Cosine Similarity}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} \ge \tau_{\text{auth}} = 0.82$$
  - **Acoustic Replay Detection Spectral Ratio**:
    $$\mathcal{R}_{\text{playback}} = \frac{\int_{f_{\text{high}}}^{F_s/2} |S(f)|^2 df}{\int_{0}^{f_{\text{high}}} |S(f)|^2 df} < \theta_{\text{cutoff}}$$
    since physical miniature smartphone speakers exhibit steep high-frequency roll-offs compared to direct vocal tract radiation.

- **Security, Anonymity & Compliance Framework**:
  - Biometric voice vectors stored as one-way non-invertible cryptographic templates (cannot reconstruct raw voice audio from 512-D embeddings).
  - AES-256 encrypted database conforming to UIDAI Aadhaar Act data protection regulations.

## 5. Technology Stack Breakdown
- **Frontend / Client**: HTML5, CSS3, JavaScript, Web Audio API, WebRTC MediaRecorder.
- **Backend / Microservices**: Python 3.8, Flask REST API, WebSockets.
- **Blockchain / ML / Core Engine**: PyTorch, Librosa, SciPy (Signal Processing), NumPy, Scikit-learn, WebRTC VAD.
- **Database & Storage**: PostgreSQL (secure encrypted biometric template storage), Redis.
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, Linux Server.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Defeated live replay attack during evaluation: a judge recorded his own voice saying the prompt on a smartphone and played it back into the microphone; VoiceYourID's anti-spoof DSP filter instantly flagged and rejected the replay attempt.
- **Feasibility & Real-World Viability**:
  - Solves the 15%+ biometric failure rate in rural India caused by worn fingerprints, requiring zero extra hardware beyond a basic mobile microphone.
- **Hackathon Execution Completeness**:
  - Ultra-fast matching latency ($<120\text{ms}$) with an elegant web enrollment and verification interface.

## 7. Lessons Learned & SIH Participant Takeaways
- **Anti-Spoofing is Mandatory in Biometrics**: Matching voiceprints is trivial with modern libraries; proving your system cannot be tricked by phone recordings or deepfakes wins cybersecurity competitions.
- **Interactive Security Stress-Tests Build Credibility**: Encouraging jury members to try hacking or spoofing your live system on stage creates massive impact when the defenses hold.
- **Non-Invertible Templates for Privacy**: Emphasizing that raw audio is discarded and only one-way mathematical embeddings are stored satisfies government privacy evaluators.
