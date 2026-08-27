# Big Data Forensic Search Engine (AT980) / Sons of Pitches — SIH 2022 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2022 (Software Edition — 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: FinTech/Cyber Forensics & Big Data Analytics / Law Enforcement Intelligence
- **Problem Statement ID & Title**: AT980 — *Big Data Searching Engine across Multi-Format Investigation Documents & Financial Records*
- **Sponsoring Ministry / Organization**: Madhya Pradesh Police / Ministry of Home Affairs, Government of India
- **Winning Team Name & Institution**: Team Sons of Pitches (Team Lead: Harini T; Members: Shashank Kumar Srivastava, Ishaan Mahesh, Akarsh Pandey, Divyansh Panwar, Bhavya Goyal; Mentor: Dr. P. Victer Paul) from Indian Institute of Information Technology (IIIT), Kottayam, Kerala
- **Team Members & Mentor**: Harini T (Lead/Search Architect), Shashank Kumar Srivastava, Ishaan Mahesh, Akarsh Pandey, Divyansh Panwar, Bhavya Goyal; Faculty Mentor: Dr. P. Victer Paul
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at SIRT Bhopal Nodal Center)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/iiitkottayam/SonsOfPitches-AT980
- **Secondary / Sub-module Repositories**:
  - https://github.com/iiitkottayam
- **Live Demo / Web Deployment**: https://github.com/iiitkottayam/SonsOfPitches-AT980#overview
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/iiitkottayam/SonsOfPitches-AT980/tree/main/docs/AT980_MP_Police_Presentation.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=Sons+of+Pitches+SIH+2022+IIIT+Kottayam+AT980
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/iiitkottayam/SonsOfPitches-AT980/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  State police cyber crime and economic offences wings seize massive drives containing millions of disorganized multi-format evidence files during financial fraud raids:
  1. *Heterogeneous File Formats*: Evidence spans scanned invoices (TIFF/PNG), call detail records (XLSX), forensic image dumps (E01/DD), handwritten FIRs (PDF), audio intercepts (WAV), and nested ZIP archives.
  2. *Slow & Incomplete Manual Discovery*: Police officers waste weeks manually opening individual folders to locate a suspect's PAN card, bank account number, IMEI, or vehicle registration.
  3. *Typo Inconsistencies & OCR Noise*: Misspellings in handwritten documents and scanned receipts prevent exact keyword search tools (grep/Windows search) from finding matching evidence.
- **Target Beneficiaries / Government End-Users**:
  - Madhya Pradesh Police & State Cyber Police Headquarters
  - Economic Offences Wings (EOW) & Anti-Corruption Bureaus (ACB)
  - Indian Cyber Crime Coordination Centre (I4C), MHA
  - Serious Fraud Investigation Office (SFIO) & Central Bureau of Investigation (CBI)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  POLICE INVESTIGATOR SEARCH CONSOLE (React)             |
|       - Unified Google-Like Search Bar with Fuzzy & Regex Modifiers     |
|       - Entity Relationship Graph Explorer & Faceted Filter Matrix      |
+------------------------------------+------------------------------------+
                                     | (REST API / Async Task Polls)
                                     v
+-------------------------------------------------------------------------+
|                   DISTRIBUTED INGESTION & OCR PIPELINE                  |
|   - Apache Tika (Multilingual Text & Metadata Extraction from 100+ Types)|
|   - Tesseract OCR (Preprocessed via OpenCV Deskewing & Binarization)    |
|   - Celery Worker Pool (Distributed Processing of Seized Terabyte Drives)|
+-------------------+--------------------------------+--------------------+
                    |                                |
         (Normalized Clean Text)             (Structured Metadata)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    ELASTICSEARCH 8 CLUSTER        |  |    REGEX ENTITY EXTRACTOR CORE   |
|  - Inverted Index & N-Gram Token  |  |  - Auto-Detects PAN, Aadhaar,    |
|  - Fuzzy Levenshtein Query Engine |  |    GSTIN, IMEI, Bank Account,    |
|  - Sub-Second Search on 10M Files |  |    Crypto Wallets, Phone Numbers |
+-------------------+---------------+  +-----------------+----------------+
                    |                                    |
                    +------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  COURT EVIDENCE EXPORT & CHAIN-OF-CUSTODY               |
|       - 1-Click Forensic Search Export with Section 65B Certificate     |
|       - Exact File Hash (SHA-256) & Storage Path Location Verification   |
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Bulk Ingestion*: Ingests seized storage drives via Celery worker queues; Apache Tika unpacks nested archives and extracts raw text/metadata from 100+ file extensions.
  2. *OCR Preprocessing*: Runs OpenCV image thresholding, deskewing, and Tesseract OCR on scanned images and low-quality PDFs.
  3. *Entity Tagging & Indexing*: Automated regex filters extract PANs, GSTINs, bank accounts, and IMEIs, indexing them into Elasticsearch with 3-gram fuzzy analyzers.
  4. *Sub-Second Multi-Parametric Search*: Police search terms return ranked evidence hits in under 200 milliseconds, highlighting exact snippet contexts and metadata.
- **Core Algorithms & Mathematical / Logic Models**:
  - *BM25 Relevance Scoring with Fuzzy Damerau-Levenshtein Metric*:
    Score(D, Q) = sum(IDF(q_i) * (f(q_i, D) * (k_1 + 1)) / (f(q_i, D) + k_1 * (1 - b + b * (|D| / avgdl))))
  - *Regular Expression Financial Token Extraction*:
    High-confidence regex rules extracting Indian financial tokens (e.g., [A-Z]{5}[0-9]{4}[A-Z]{1} for PAN).
- **Security, Anonymity & Compliance Framework**:
  - Complete local on-premise execution with zero external cloud dependencies.
  - Read-only forensic mounting preventing accidental evidence metadata modification.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, TailwindCSS, Lucide Icons, PDF Viewer Modal
- **Backend / Microservices**: Python FastAPI, Celery, Redis message queue, Uvicorn
- **Blockchain / ML / Core Engine**: Elasticsearch (v8.x), Apache Tika, Tesseract OCR, OpenCV, Python Regex Engine
- **Database & Storage**: Elasticsearch (search index), PostgreSQL (case notes & audit log)
- **DevOps, Hardware & Cloud Infrastructure**: Docker Compose, Linux Ubuntu Server, Multi-Core CPU Worker Parallelization

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Ingested a massive test dataset of 25,000 multi-format seized police files (scanned receipts, corrupted PDFs, CDR Excel sheets, audio notes) and located every suspect PAN, bank account, and IMEI in under 200 milliseconds during the live jury interrogation.
- **Feasibility & Real-World Viability**:
  Directly solved MP Police Problem Statement AT980 with a production-ready, air-gapped forensic search engine.
- **Hackathon Execution Completeness**:
  Live demo: police judges challenged the team with noisy, rotated, low-resolution handwritten test images; the system deskewed, OCR-scanned, and returned matching results instantly.

## 7. Lessons Learned & SIH Participant Takeaways
- **Performance Under Stress is Everything**: When building search systems, demonstrate real-time queries across tens of thousands of documents; instant search speeds amaze evaluators.
- **Master Apache Tika + Tesseract**: Handling 100+ arbitrary file formats without crashing is a massive engineering feat that sets winning teams apart.
- **Build Clean, Filterable UIs**: Enable investigators to filter by date range, file type, entity type (PAN/Bank/IMEI), and case number with responsive faceted search sidebars.
