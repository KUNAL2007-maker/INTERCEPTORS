# Anveshak ThreatShield — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024/2025 (Software Edition — National Winner, ₹1,00,000)
- **Category / Domain**: Cybersecurity, Kernel Observability & Blockchain Audit Trail / Defense Security
- **Problem Statement ID & Title**: SIH 2024 / DEF — *Real-Time Threat Detection & Tamper-Proof Incident Response in Critical Infrastructure*
- **Sponsoring Ministry / Organization**: AICTE Cyber Security Cell / Ministry of Defence, Government of India
- **Winning Team Name & Institution**: Team Anveshak (Team Lead: Siddharth Kumar) from Indian Institute of Information Technology (IIIT), Lucknow, Uttar Pradesh
- **Team Members & Mentor**: Siddharth Kumar (Lead/Kernel Systems Engineer), Core Engineering Developers from IIIT Lucknow Department of Computer Science
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize at SIH Grand Finale)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/SiddharthKumar268/Anveshak
- **Secondary / Sub-module Repositories**:
  - Developer Profile: https://github.com/SiddharthKumar268
- **Live Demo / Web Deployment**: https://github.com/SiddharthKumar268/Anveshak#demo
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/SiddharthKumar268/Anveshak/tree/main/docs/Anveshak_Defense_Deck.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=Anveshak+ThreatShield+SIH+Siddharth+Kumar
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/SiddharthKumar268/Anveshak/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  Defense servers, military command centers, and critical public sector infrastructure face destructive zero-day ransomware and stealth rootkit attacks:
  1. *Sub-Second Mass Encryption Latency*: Modern ransomware strains encrypt 10,000 files per second; traditional user-space antivirus scanners detect the attack only after catastrophic data loss has occurred.
  2. *Attacker Log Tampering & Audit Deletion*: Advanced Persistent Threats (APTs) wipe Linux syslog, auditd, and event logs immediately upon gaining root privileges, erasing forensic footprints.
  3. *High Performance Overhead of Traditional EDRs*: Heavy user-space security agents consume 20-30% CPU, causing unacceptable performance degradation on real-time mission-critical servers.
- **Target Beneficiaries / Government End-Users**:
  - Ministry of Defence & Defense Cyber Agency (DCyA)
  - National Critical Information Infrastructure Protection Centre (NCIIPC)
  - Indian Army, Navy, and Air Force Command Systems
  - Public Sector Undertakings (HAL, BEL, DRDO)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                 LINUX OS KERNEL SPACE (Ring 0 Low-Level Engine)         |
|   - Extended Berkeley Packet Filter (eBPF) Probes (kprobes / tracepoints)|
|   - Real-Time File I/O Entropy Monitor & Syscall Interceptor (sys_enter)|
+------------------------------------+------------------------------------+
                                     | (Zero-Copy BPF Ring Buffer < 1ms)
                                     v
+-------------------------------------------------------------------------+
|                  ANVESHAK USER-SPACE AGENT (Go / Python)                |
|   - Anomaly Classifier (Isolation Forest on I/O Velocity & Shannon Ent) |
|   - Immediate Process Kill Signal (SIGKILL) to Malicious PID          |
|   - Auto-Snapshots File Descriptors to Read-Only Shadow Storage         |
+-------------------+--------------------------------+--------------------+
                    |                                |
         (Cryptographic Incident Proof)      (Live Threat Telemetry)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    HYPERLEDGER FABRIC LEDGER      |  |    CENTRAL SOC DASHBOARD         |
|  - Tamper-Proof Audit Trail       |  |  - React.js & WebSockets Realtime|
|  - Immutable Incident Hashes      |  |  - Kernel Syscall Visualizer     |
|  - Root-Immune Forensic Storage   |  |  - 1-Click Forensic Timeline     |
+-----------------------------------+  +----------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Kernel-Level Telemetry*: eBPF probes attached to fs_write, fs_read, and sys_enter_execve monitor file I/O operations directly in Linux kernel space with near-zero overhead (<1% CPU).
  2. *Ransomware Entropy Spike Detection*: If a process exhibits sudden bursts of high Shannon entropy writes (>7.5/8.0) across multiple directories, eBPF instantly intercepts the syscall.
  3. *Sub-5ms Process Neutralization*: The Go daemon sends SIGKILL to the attacking PID within 4 milliseconds, terminating ransomware before mass encryption can occur.
  4. *Immutable Blockchain Incident Sealing*: Incident metadata, memory hashes, and attacker binaries are committed to a Hyperledger Fabric private ledger, mathematically preventing root attackers from clearing audit trails.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Shannon Entropy Formulation*:
    H(B) = - sum(P(b_i) * log_2(P(b_i)))
    measuring data randomness in 4KB write buffers (encrypted ciphertext approaches  \approx 8.0$).
  - *eBPF Syscall Burstiness Threshold*:
    Alert = (H(B) > 7.5) and (WriteRate > 500 ops/sec) and (UniqueExtensions > 10)
- **Security, Anonymity & Compliance Framework**:
  - Root-immune security: audit logs reside on an isolated distributed ledger cluster, impossible to erase even with full root/sudo compromise.
  - Compliance with NIST SP 800-86 Guide to Integrating Forensic Techniques into Incident Response.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, TailwindCSS, WebSockets, Lucide React, Vis.js
- **Backend / Microservices**: Go (eBPF loader and agent daemon), Python FastAPI, Uvicorn
- **Blockchain / ML / Core Engine**: eBPF (C / Cilium ebpf-go), Linux Kernel 5.x+, Hyperledger Fabric, Scikit-learn (Isolation Forest)
- **Database & Storage**: PostgreSQL (telemetry cache), LevelDB / Hyperledger StateDB
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Linux Bare-Metal Kernel, Vagrant test VM clusters

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Kernel-space ransomware interception via eBPF that detected and killed a live running WannaCry/LockBit simulator in 3.8 milliseconds, losing only 2 test files out of 10,000.
- **Feasibility & Real-World Viability**:
  Ultra-low resource footprint (<1% CPU, 25MB RAM) compared to heavy commercial EDR solutions, making it ideal for military embedded systems.
- **Hackathon Execution Completeness**:
  Live exploit demonstration: executed a malicious ransomware binary live during the presentation; the system intercepted the process, alerted the SOC dashboard, and anchored the cryptographic forensic evidence to Hyperledger Fabric.

## 7. Lessons Learned & SIH Participant Takeaways
- **Kernel-Level Programming Wins Security Tracks**: Writing eBPF kernel probes demonstrates deep systems programming expertise that separates elite teams from standard web developers.
- **Integrate Blockchain Where It Adds Real Value**: Using blockchain specifically for tamper-proof audit trails (preventing root attackers from deleting logs) makes total architectural sense to judges.
- **Conduct Live Exploit Demonstrations**: Showing live simulated ransomware or malware being stopped in real time is the most compelling demonstration possible.
