# Cyph3r Dark Web Crawler — KAVACH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **Hackathon Edition / Year**: KAVACH 2023 National Cybersecurity Hackathon (1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Cybersecurity, Threat Intelligence & Dark Web Monitoring
- **Problem Statement ID & Title**: KVH-06 — *Dark Web Crawler & Threat Intelligence Platform for Law Enforcement*
- **Sponsoring Ministry / Organization**: Ministry of Education's Innovation Cell (MIC), AICTE, Bureau of Police Research & Development (BPR&D), and Indian Cyber Crime Coordination Centre (I4C), MHA
- **Winning Team Name & Institution**: Team Cyph3r from K. J. Somaiya College of Engineering, Somaiya Vidyavihar University, Mumbai, Maharashtra
- **Team Members & Mentor**: Siddhika Rai (Team Lead), Shubham Varma, Aditya Tayade, Amaan Shaikh, Anant Shah, Guneet Sura; Mentors: Dr. Irfan Siddavatam, Prof. Ashwini Dalvi
- **Prize & Recognition**: 1st Place Grand Winner (₹1,00,000 Cash Prize awarded at KAVACH-2023 Grand Finale)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler
- **Secondary / Sub-module Repositories**:
  - https://github.com/guneetsura
- **Live Demo / Web Deployment**: https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler#readme
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler/tree/main/docs/KAVACH_KVH06_Cyph3r.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=Cyph3r+KAVACH+2023+dark+web+crawler
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - High Ephemerality & Captcha Defenses: Onion sites frequently rotate domains and implement complex text/math captchas to block automated scraping.
  - Tor Circuit Latency & Rate Limiting: Standard scrapers experience frequent timeouts and IP bans when spidering hidden service directories.
  - Unstructured Multilingual Content: Scraped darknet dumps contain messy criminal slang, PGP public keys, cryptocurrency payment addresses, and Telegram handles requiring automated semantic extraction.
- **Target Beneficiaries / Government End-Users**:
  - Indian Cyber Crime Coordination Centre (I4C)
  - Bureau of Police Research & Development (BPR&D)
  - State Special Task Forces (STF) and Anti-Terrorism Squads (ATS)
  - National Critical Information Infrastructure Protection Centre (NCIIPC)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  LAW ENFORCEMENT CYBER INTELLIGENCE UI                  |
|       - Real-Time Darknet Threat Radar, Keyword Alerts & Live Feeds     |
|       - Entity Graph Visualizer (Suspects, PGP Keys, BTC Wallets)       |
+------------------------------------+------------------------------------+
                                     | (REST API / Webhooks)
                                     v
+-------------------------------------------------------------------------+
|                    FASTAPI THREAT INTELLIGENCE BACKEND                  |
|   - Zero-Shot Threat Classifier (HuggingFace Transformers)              |
|   - Custom Entity Extractor (Aadhaar, PAN, UPI, Crypto, PGP, Telegram)  |
|   - Autonomous Threat Scoring Engine (Critical / High / Medium / Low)   |
+-------------------+--------------------------------+--------------------+
                    |                                |
       (Structured Documents)               (Scrape Task Queue)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    ELASTICSEARCH & KIBANA CLUSTER |  |   DISTRIBUTED TOR/I2P CRAWLER    |
|  - Full-Text Threat Search Engine |  |  - Scrapy Spiders + Privoxy Pool |
|  - Real-Time Analytics Dashboards |  |  - Auto-Rotating Tor Circuits    |
|  - Multi-Index Storage (PII/Drugs)|  |  - CNN-Based Captcha Solver OCR  |
+-----------------------------------+  +----------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Distributed Spidering*: Scrapy spiders route HTTP requests through a local cluster of rotating Privoxy/Tor daemon instances with automated circuit renewal to evade IP rate limiting.
  2. *Automated Captcha Bypass*: Optical Character Recognition (OCR) pipeline using CNN filters solves dark web alphanumeric and math captchas automatically.
  3. *NLP Extraction & Classification*: Raw HTML is cleaned, tokenized, and passed to fine-tuned Transformer models to extract PGP fingerprints, Bitcoin/Monero addresses, and classified leak contents.
  4. *Elasticsearch Indexing & Alerting*: Documents are indexed in Elasticsearch with semantic threat tags; automated webhooks notify LEA investigators when critical national infrastructure keywords appear.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Zero-Shot Threat Classification Scoring*:
    Score(c) = exp(sim(E(text), E(prompt_c))) / sum_j(exp(sim(E(text), E(prompt_j))))
  - *Automated Threat Severity Index*:
    TSI = w_1 * I_PII + w_2 * I_Exploit + w_3 * I_Narcotics + w_4 * V_Crypto
- **Security, Anonymity & Compliance Framework**:
  - Strict sandboxing of all Tor crawler workers inside isolated Docker bridge networks to prevent reverse-IP leakage.
  - Compliance with digital evidence logging protocols for law enforcement cyber defense.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Next.js, TailwindCSS, Lucide React, Kibana Embeds
- **Backend / Microservices**: Python FastAPI, Scrapy crawler framework, Splash headless browser, Celery, Redis
- **Blockchain / ML / Core Engine**: HuggingFace Transformers (RoBERTa / DistilBERT), PyTorch, Tesseract OCR / CNN Captcha Solver, Stem (Tor Controller)
- **Database & Storage**: Elasticsearch (v8.x), MongoDB (raw HTML archive), Redis (task queue)
- **DevOps, Hardware & Cloud Infrastructure**: Docker Compose multi-container setup, Tor Daemon pool, Privoxy load balancer, Linux VM

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Autonomous CNN-based darknet captcha bypass combined with distributed Tor circuit rotation that crawled active live .onion hidden services during the evaluation without crashing.
- **Feasibility & Real-World Viability**:
  Directly mapped to I4C / BPR&D requirements (KVH-06) with ready-to-deploy threat notification alerts and full-text search across leaked citizen databases.
- **Hackathon Execution Completeness**:
  Live demonstration scraped an active dark web breach forum, resolved its captcha, extracted exposed Indian financial credentials, and indexed them in Elasticsearch within 45 seconds.

## 7. Lessons Learned & SIH Participant Takeaways
- **Build Resilient Scraping Infrastructure**: Dark web sites are notoriously slow and unreliable; implement aggressive timeouts, exponential backoff, and circuit rotation.
- **Combine NLP with Visual OCR**: Text scraping alone fails on captchas and image-based paste sites; multi-modal pipelines win cybersecurity tracks.
- **Focus on Operational Usability**: Law enforcement judges prefer clear action items (e.g., "Alert: 5,000 SBI credentials leaked 10 mins ago") over raw data dumps.
