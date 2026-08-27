# CRYPTONITE AI Anti-Phishing Guard — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (Software Edition — 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Cybersecurity & AI Computer Vision / Anti-Phishing Threat Detection
- **Problem Statement ID & Title**: SIH1454 — *Create an intelligent system using AI/ML to detect phishing domains which imitate look and feel of genuine domains*
- **Sponsoring Ministry / Organization**: National Technical Research Organisation (NTRO), Government of India
- **Winning Team Name & Institution**: Team CRYPTONITE (Team Lead: Daksh Dadhania) from Manipal Academy of Higher Education (MAHE), Manipal, Karnataka
- **Team Members & Mentor**: Daksh Dadhania (Lead/Vision AI), Core Cyber Security Researchers from MAHE Department of Information and Communication Technology
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at NTRO Nodal Center)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/DakshDadhania/Cryptonite-AntiPhishing
- **Secondary / Sub-module Repositories**:
  - Developer Profile: https://github.com/DakshDadhania
- **Live Demo / Web Deployment**: https://github.com/DakshDadhania/Cryptonite-AntiPhishing#live-demo
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/DakshDadhania/Cryptonite-AntiPhishing/tree/main/docs/NTRO_SIH1454_Cryptonite.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=Cryptonite+Anti+Phishing+SIH+2023+NTRO
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/DakshDadhania/Cryptonite-AntiPhishing/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  Threat actors routinely clone Indian government portals (UIDAI / Aadhaar, Income Tax e-Filing, SBI Online, CoWIN) to harvest citizen credentials and OTPs:
  1. *Zero-Day Domains & Signature Evasion*: Newly registered domains (less than 2 hours old) bypass URL reputation blocklists (Google Safe Browsing) because signature databases have not yet flagged them.
  2. *Obfuscated Client-Side Code*: Phishing authors encode HTML/JS payloads inside Base64 strings or dynamically load forms via WebSockets, evading traditional HTML keyword scrapers.
  3. *Visual Brand Impersonation*: Humans are deceived by identical CSS styles, logos, and layouts even when the domain string uses sneaky typosquatting/homoglyph characters.
- **Target Beneficiaries / Government End-Users**:
  - National Technical Research Organisation (NTRO)
  - Indian Computer Emergency Response Team (CERT-In)
  - State Bank of India & Indian Banking Fraud Management Cells
  - UIDAI (Unique Identification Authority of India) & National Informatics Centre (NIC)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  CITIZEN BROWSER / ENTERPRISE ENDPOINT                  |
|         (Chrome Extension Manifest V3 / Real-Time URL Interceptor)      |
+------------------------------------+------------------------------------+
                                     | (DOM Snapshot & Screenshot Capture)
                                     v
+-------------------------------------------------------------------------+
|                    FASTAPI HIGH-SPEED INFERENCE BACKEND                 |
|   - Headless Playwright Renderer (Full Page Render in Sandbox)          |
|   - Multi-Axis Feature Extraction (Visual + Lexical + TLS Certificate)  |
+-------------------+--------------------------------+--------------------+
                    |                                |
         (High-Res Page Screenshot)          (DOM & URL Heuristics)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    VISION TRANSFORMER (ViT) CORE  |  |    XGBOOST LEXICAL CLASSIFIER    |
|  - Patch-Level Brand Recognition  |  |  - Homoglyph / Levenshtein Dist  |
|  - SIFT Keypoint & SSIM Matcher   |  |  - WHOIS Domain Age < 48 Hours   |
|  - Detects Cloned Gov/Bank Logos  |  |  - Free SSL / Cloudflare Origin  |
+-------------------+---------------+  +-----------------+----------------+
                    |                                    |
                    +------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                   COMBINED ENSEMBLE RISK SCORER & TAKEDOWN              |
|       - Real-Time Red Banner Interception in Browser (< 150ms)          |
|       - Automated Abuse Notice Dispatcher to Domain Registrars / NIXI   |
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Real-Time Interception*: Chrome extension captures page URL and triggers headless Playwright sandbox rendering upon navigation.
  2. *Visual Transformer (ViT) Matching*: ViT model extracts visual patch embeddings from page screenshots and computes Structural Similarity (SSIM) against indexed legitimate brand landing pages (SBI, Income Tax, etc.).
  3. *Heuristic & Certificate Extraction*: Checks domain registration age via RDAP/WHOIS, SSL certificate issuer authority, and character homoglyphs (e.g., Cyrillic 'а' replacing Latin 'a').
  4. *Ensemble Classification & Alert*: If visual match is high (>85%) but domain authority is illegitimate, the extension immediately injects an intrusive warning overlay and reports the domain to CERT-In.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Perceptual Visual Similarity Metric*:
    SSIM(x, y) = ((2 * mu_x * mu_y + c_1) * (2 * sigma_xy + c_2)) / ((mu_x^2 + mu_y^2 + c_1) * (sigma_x^2 + sigma_y^2 + c_2))
  - *Ensemble Phishing Probability*:
    P_phish = w_vis * P_ViT(VisualClone) + w_lex * P_XGB(LexicalFeatures) + w_whois * I_NewDomain
- **Security, Anonymity & Compliance Framework**:
  - Privacy-preserving browser client: only transmits DOM hashes and screenshots for non-whitelisted, unknown domains.
  - Automated STIX/TAXII threat feed generation for national CERT-In intelligence sharing.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Chrome Extension (Manifest V3), React.js, TailwindCSS
- **Backend / Microservices**: Python FastAPI, Playwright Headless Browser Sandbox, Redis Cache
- **Blockchain / ML / Core Engine**: PyTorch Vision Transformer (ViT), OpenCV (SIFT/SSIM), XGBoost, LightGBM, python-whois
- **Database & Storage**: PostgreSQL (brand image embeddings & threat logs), Redis (URL lookup cache)
- **DevOps, Hardware & Cloud Infrastructure**: Docker, NVIDIA TensorRT inference optimizer, AWS EC2 GPU instance

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Zero-day visual cloning detection using Vision Transformers (ViT) that successfully caught a live obfuscated fake SBI phishing page created 10 minutes prior, which had zero hits on Google Safe Browsing and VirusTotal.
- **Feasibility & Real-World Viability**:
  Ultra-fast response time (<120ms) in the Chrome extension, ensuring normal citizen browsing speeds are completely unaffected.
- **Hackathon Execution Completeness**:
  Live interactive demo: judges deployed a brand new disguised phishing clone during the presentation; the CRYPTONITE extension blocked navigation instantly and highlighted the exact cloned logo.

## 7. Lessons Learned & SIH Participant Takeaways
- **Combine Vision with Heuristics**: Text-only anti-phishing scanners fail on obfuscated code; combining computer vision screenshots with domain heuristics provides unbeatable accuracy.
- **Speed is Critical for Browser Extensions**: Juries will test browser extensions on live websites; optimize ML inference (using TensorRT or ONNX Runtime) to keep latency under 150ms.
- **Automate the Response Loop**: Go beyond detection by building automated takedown notice generators (Section 79 IT Act notices to registrars).
