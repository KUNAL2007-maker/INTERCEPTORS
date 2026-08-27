# Fourier: Acoustic Multimedia Modem for Analog Police Radio Sets — SIH 2022 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2022 (Top 2% National Winner / 1st Prize, Cash Award: ₹1,00,000)
- **Category / Domain**: Signal Processing (DSP), Acoustic Modem Engineering, Cyber Communications & Disaster Tactical Infrastructure
- **Problem Statement ID & Title**: PS AT985 — Transfer of Multimedia Data (Images, Criminal Records, GPS Coordinates) through Legacy Analog Police Radio Sets
- **Sponsoring Ministry / Organization**: Madhya Pradesh Police / State Police Wireless Wing, Home Department, Government of Madhya Pradesh
- **Winning Team Name & Institution**: Team Fourier / Department of Computer Science & Telecommunications Engineering
- **Team Members & Mentor**: Shubh Rai (Lead Signal Processing & DSP Architect, GitHub: `@shubhrai2811`), alongside acoustic communications and cryptography developers; mentored by senior police wireless communications officers.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Praised by police leadership for zero-cost infrastructure retrofit enabling image transmission through standard handheld VHF/UHF walkie-talkies.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/shubhrai2811/SIH-2022-Fourier-Encoder-Decoder`
- **Secondary / Sub-module Repositories**: `https://github.com/shubhrai2811/SIH-2022-Fourier-Encoder-Decoder/tree/main/dsp_engine` (FFT Modulation, OFDM, Reed-Solomon FEC & Audio I/O)
- **Live Demo / Web Deployment**: Fourier Police Radio Acoustic Terminal Console
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Fourier SIH 2022 Grand Finale Defense Deck — *Transforming 100,000+ Analog Police Transceivers into Secure Multimedia Modems*
- **Video Demonstration / YouTube**: Real-Time Image Audio Encoding, Radio Transmission & Perfect Visual Reconstruction Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Sending Images Over Police Walkie-Talkies: Inside the SIH 2022 Fourier Project

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Law enforcement agencies across India operate over 250,000 handheld VHF/UHF analog walkie-talkie transceivers (e.g. Motorola GP328, Kenwood TK-2000).
  - These legacy analog radios only transmit voice audio over a narrow $300\text{--}3400\text{ Hz}$ acoustic bandwidth, with zero native digital data capability.
  - During critical operations (counter-terror operations, manhunts, remote VIP security) or total cellular network collapse during cyclones/earthquakes, field constables cannot receive suspect mugshots, missing child photos, or tactical map coordinates on their handheld radios.
  - Replacing the entire national analog radio inventory with modern digital TETRA or APCO P25 systems would cost state police departments upwards of ₹2,500 Crore ($300M+).
- **Target Beneficiaries / Government End-Users**:
  - State Police Wireless Wings and Central Armed Police Forces (CRPF, BSF, CISF, ITBP).
  - Disaster response battalions (NDRF/SDRF) operating in zero-cellular disaster zones.
  - Field patrol officers requiring instant suspect mugshot verification in remote jurisdictions.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      FOURIER SYSTEM ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
  [ TRANSMITTER TERMINAL (Laptop / Field Mobile Phone) ]
  
  [ Suspect Photo (100KB JPEG) + FIR Text + GPS Coordinates ]
                     |
                     v
  +---------------------------------------------------------------------------------+
  |                  Wavelet & DCT Extreme Image Compression Stage                  |
  |  - Discrete Cosine Transform (DCT) & 4-bit Quantization: Compresses 100KB to 3.2KB|
  |  - Base64 Payload Serialization & CRC32 Checksum Generation                     |
  +---------------------------------------------------------------------------------+
                     |
                     v
  +---------------------------------------------------------------------------------+
  |                  Forward Error Correction (FEC) & Channel Coding                |
  |  - Reed-Solomon RS(255, 223) Error Correction + Convolutional Interleaving     |
  |  - Protection against squelch bursts, static noise, and RF fading dropouts      |
  +---------------------------------------------------------------------------------+
                     |
                     v
  +---------------------------------------------------------------------------------+
  |                  Audio Frequency Shift Keying (AFSK) & OFDM Modulator           |
  |  - Fast Fourier Transform (FFT) Audio Synthesis constrained to 300-3400 Hz       |
  |  - 1200 / 2400 Baud Bell 202 Modulation & Multi-Carrier OFDM Waveform Generation|
  +---------------------------------------------------------------------------------+
                     |
                     v  (Standard 3.5mm Audio Jack / Mic Acoustic Coupling)
  [ Standard Analog Police Radio Transmitter (VHF 136-174 MHz / UHF 400-470 MHz) ]
                     |
                     | ~ ~ ~ ~ ~ (Over-the-Air RF Voice Channel Broadcast) ~ ~ ~ ~ ~
                     v
  [ Standard Analog Police Radio Receiver (Speaker Audio Out) ]
                     |
                     v  (Acoustic Mic / 3.5mm Aux Audio Line-In)
  +---------------------------------------------------------------------------------+
  |             Demodulator & Signal Reconstruction Pipeline (Receiver)             |
  |  - Bandpass Filtering (300-3400 Hz) & Automatic Gain Control (AGC)              |
  |  - Goertzel Algorithm & FFT Peak Phase Tracking for Bit Extraction              |
  |  - Reed-Solomon Syndrome Decoding & Packet De-Interleaving                      |
  |  - Inverse DCT Image Decompression & Perfect Bitstream Rendering                |
  +---------------------------------------------------------------------------------+
                     |
                     v
  [ Field Receiving Terminal: Displays Suspect Photo & Crime Details in <12 Seconds ]
```

- **Data Pipeline & Workflow**:
  1. **Image Compression**: A suspect photo is compressed via custom DCT wavelet algorithms, reducing the payload size from 100KB to $<3.5\text{KB}$ without losing recognizable facial features.
  2. **Channel Coding**: Wraps the compressed binary payload with Reed-Solomon forward error correction codes and interleaving matrices to withstand RF static.
  3. **Acoustic Modulation**: Converts the digital bits into audible acoustic audio chirps (AFSK/OFDM tones within the human vocal range of $300\text{--}3400\text{ Hz}$).
  4. **Over-the-Air Transmission**: The audio waveform is played into the walkie-talkie's microphone jack and broadcast across standard analog radio frequencies.
  5. **Demodulation & Reconstruction**: The receiving walkie-talkie speaker outputs the audio into a receiving phone/laptop microphone, where the Goertzel/FFT demodulator recovers the data and renders the clear photo in $<12\text{ seconds}$.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Goertzel Algorithm for Fast Tone Frequency Detection**:
    $$s[n] = x[n] + 2\cos(\omega_0) s[n-1] - s[n-2]$$
    $$|y[N]|^2 = s^2[N-1] + s^2[N-2] - 2\cos(\omega_0) s[N-1] s[N-2]$$
    where $\omega_0 = 2\pi k / N$ is the target tone frequency.
  - **Reed-Solomon Error Correction Capacity**:
    $$t = \frac{n - k}{2} = \frac{255 - 223}{2} = 16\text{ corrupted bytes corrected per block}$$

- **Security, Anonymity & Compliance Framework**:
  - AES-128 payload encryption before acoustic modulation, ensuring eavesdroppers with commercial scanners hear only unintelligible audio static.
  - Zero violation of WPC (Wireless Planning & Coordination) radio frequency bandwidth licenses.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Python Tkinter / PyQt5 Desktop GUI, HTML5 Web Audio Visualizer.
- **Backend / Microservices**: Python 3.9, C++ (High-speed DSP demodulation routines).
- **Blockchain / ML / Core Engine**: NumPy, SciPy (Signal Processing Toolbox), SoundDevice, PyAudio, OpenCV (DCT compression), Reed-Solomon C-bindings.
- **Database & Storage**: SQLite (local incident & dispatch registry).
- **DevOps, Hardware & Cloud Infrastructure**: Standard Analog VHF/UHF Walkie-Talkies (Motorola/Baofeng), 3.5mm TRRS Audio Interface Cables, Linux / Windows OS.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Zero-Cost Hardware Retrofit: Turned existing 20-year-old analog police walkie-talkies into high-speed digital multimedia data transmitters purely through software signal processing.
- **Feasibility & Real-World Viability**:
  - Saved hundreds of crores in unnecessary digital radio upgrades for cash-strapped state police departments.
- **Hackathon Execution Completeness**:
  - Live on-stage hardware demo: the team placed two physical walkie-talkies 20 meters apart, transmitted an audio screech over the air, and within 10 seconds, the receiving laptop perfectly rendered the suspect photo on screen.

## 7. Lessons Learned & SIH Participant Takeaways
- **Software Solving Hardware Limitations is Gold**: If you can solve a massive hardware problem using clever software math (DSP/Fourier analysis), judges will view it as revolutionary.
- **Live Over-the-Air Demos Captivate Juries**: Real radio transmissions with audible chirps and instantaneous visual reconstruction on screen create unmatched drama and excitement.
- **Error Correction is Non-Negotiable in Analog Comms**: RF channels are full of squelch bursts and static; demonstrating that Reed-Solomon FEC fixes dropped bytes proves deep engineering rigor.
