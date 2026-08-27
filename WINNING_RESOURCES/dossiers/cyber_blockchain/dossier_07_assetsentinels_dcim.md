# AssetSentinels DCIM Security Manager — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (Software Edition — 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Cybersecurity, Infrastructure Hardening & Data Center Infrastructure Management (DCIM)
- **Problem Statement ID & Title**: SIH1461 — *Cybersecurity Portal for Effective Management of Servers and Firewalls / DCIM*
- **Sponsoring Ministry / Organization**: All India Council for Technical Education (AICTE), Ministry of Education, Government of India
- **Winning Team Name & Institution**: Team AssetSentinels from Mahavir Education Trust's Shah & Anchor Kutchhi Engineering College (SAKEC), Mumbai, Maharashtra
- **Team Members & Mentor**: Pratham Poojari (Team Lead), Tushar Patil, Sarthak Deshmukh, Yash Kesharwani, Deepranjan Bhosale, Aabha Wagh; Mentors: Prof. Meghali Kalyankar, Prof. Prajakta Pote
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at O. P. Jindal University Nodal Center, Raigarh, Chhattisgarh)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/prathampoojari/AssetSentinels-DCIM
- **Secondary / Sub-module Repositories**:
  - Developer Profile: https://github.com/prathampoojari
- **Live Demo / Web Deployment**: https://github.com/prathampoojari/AssetSentinels-DCIM#live-demo
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/prathampoojari/AssetSentinels-DCIM/tree/main/docs/SIH1461_AssetSentinels_Deck.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=AssetSentinels+SIH+2023+SAKEC
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/prathampoojari/AssetSentinels-DCIM/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  Government enterprise data centers and university server farms host thousands of multi-vendor firewalls, switches, and bare-metal servers with severe operational deficiencies:
  1. *Firewall Rule Sprawl & Shadow Rules*: Misconfigured firewall rulebases contain contradictory, shadowed, or obsolete access rules that inadvertently expose internal databases to the public Internet.
  2. *Lack of Unified Multi-Vendor Visibility*: Systems administrators have to log into separate management consoles for Cisco, Fortinet, pfSense, and iptables devices.
  3. *Unpatched CVE Vulnerability Windows*: Inability to continuously correlate installed OS packages and firmware versions against the National Vulnerability Database (NVD).
- **Target Beneficiaries / Government End-Users**:
  - AICTE Enterprise IT & National Education Alliance for Technology (NEAT)
  - National Informatics Centre (NIC) State Data Centres (SDCs)
  - Higher Education Technical Institutions & University Data Centers
  - State Government Cyber Security Cells

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  ENTERPRISE DCIM SECURITY DASHBOARD                     |
|           (React.js / TailwindCSS / ApexCharts Interactive UI)          |
+------------------------------------+------------------------------------+
                                     | (REST API / JWT Session Auth)
                                     v
+-------------------------------------------------------------------------+
|                    DJANGO APPLICATION SERVER & ENGINE                   |
|   - Firewall Rule Conflict & Shadow Rule Analyzer (Set-Theoretic Engine)|
|   - CIS Benchmark & NIST 800-53 Compliance Hardening Scorer             |
|   - NVD CVE Sync & Automated Vulnerability Matcher                      |
+-------------------+--------------------------------+--------------------+
                    |                                |
         (Async Collector Tasks)           (Normalized Configurations)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    CELERY & REDIS TASK QUEUE      |  |    POSTGRESQL CONFIG DATABASE    |
|  - Scheduled SNMPv3 Polls         |  |  - Full Device Asset Inventory   |
|  - Paramiko / Netmiko SSH Probes  |  |  - Versioned Firewall Rule Dumps |
|  - Multi-Threaded Port Scanner    |  |  - Historical Audit Change Logs  |
+-------------------+---------------+  +----------------------------------+
                    |
                    v
+-------------------------------------------------------------------------+
|                 HETEROGENEOUS DATA CENTER ASSET NETWORK                 |
|   - Cisco ASA, Fortinet FortiGate, pfSense, Linux iptables / UFW Servers|
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Automated Network Discovery*: Background Celery workers use SNMPv3 and Netmiko SSH scripts to discover active servers, switches, and firewalls across CIDR subnets.
  2. *Configuration Extraction*: Dumps active Access Control Lists (ACLs), routing tables, and installed software packages into standardized JSON objects.
  3. *Firewall Rule Collision Analysis*: Set-theoretic verification engine compares source IP ranges, destination ports, and action policies across all rules to flag shadow/redundant rules.
  4. *CIS Hardening Scoring & Alerting*: Scores each host against CIS benchmarks (e.g., SSH root login disabled, password complexity, open unnecessary ports) and generates one-click remediation scripts.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Firewall Rule Shadowing Detection*:
    Rule $ is shadowed by $ ( \succ R_2$) if and only if:
    Match(R_2) subset_of Match(R_1) and Action(R_1) != Action(R_2) and Index(R_1) < Index(R_2)
  - *CIS Benchmark Security Index*:
    CSI = sum(w_i * S_i) / sum(w_i) where  \in \{0, 1\}$ represents pass/fail of individual hardening controls.
- **Security, Anonymity & Compliance Framework**:
  - Role-based multi-tenant access control with AES-256 encrypted credential vault for network device SSH keys.
  - Generates compliance audit reports mapped to ISO/IEC 27001 and NIST SP 800-53 frameworks.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, TailwindCSS, Chart.js, ApexCharts, Lucide Icons, Bootstrap 5
- **Backend / Microservices**: Python Django, Django REST Framework, Celery, Redis
- **Blockchain / ML / Core Engine**: Netmiko, Paramiko, Scapy, PySNMP, NVD CVE API Sync, Custom Rule Optimization Engine
- **Database & Storage**: PostgreSQL (relational asset store), Redis (task queue and session caching)
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Docker Compose, Linux Ubuntu Server, Nginx Gunicorn reverse proxy

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Mathematical set-theoretic algorithm that ingested complex multi-vendor firewall configuration files (over 5,000 rules) and highlighted 14 critical shadow rules and security leaks in under 3 seconds.
- **Feasibility & Real-World Viability**:
  Built specifically for AICTE data center operations to manage heterogeneous open-source and proprietary enterprise equipment from a single unified portal.
- **Hackathon Execution Completeness**:
  Live working demonstration with real hardware: connected to live simulated Cisco ASA and Linux pfSense firewalls, detected open Telnet/SSH misconfigurations, and deployed auto-remediation scripts on the fly.

## 7. Lessons Learned & SIH Participant Takeaways
- **Build Multi-Vendor Support**: Government organizations rarely use a single vendor; supporting both open-source (pfSense, iptables) and proprietary (Cisco, Fortinet) appliances creates high jury impact.
- **Provide Actionable One-Click Remediation**: Finding vulnerabilities is only half the battle; providing automated, tested shell scripts to fix the discovered misconfiguration wins hackathons.
- **Design Clean, Visual Executive Dashboards**: Clear risk gauges, color-coded topology maps, and exportable PDF audit summaries keep non-technical jury members fully engaged.
