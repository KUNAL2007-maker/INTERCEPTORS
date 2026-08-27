# High-Speed Big Data Forensic Search Engine (AT980) — SIH 2022 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2022 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Big Data Analytics, Digital Forensics, Distributed Search Indexing & Multimodal OCR
- **Problem Statement ID & Title**: PS AT980 — High-Speed Big Data Searching Across Heterogeneous Media Files (Images, Audio, PDF, DOCX, SQL Dumps) and Massive Police Databases
- **Sponsoring Ministry / Organization**: Madhya Pradesh Police / State Cyber Police Directorate, Home Department, Government of Madhya Pradesh
- **Winning Team Name & Institution**: Team Sons of Pitches / Indian Institute of Information Technology (IIIT) Kottayam (Jointly with Team Hezagon24 / PSG College of Technology)
- **Team Members & Mentor**: Harini T (Team Lead & Big Data Architect), along with distributed database and computer vision specialists from IIIT Kottayam; mentored by state cyber crime forensic investigators.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Delivered sub-200ms query search latency across millions of heterogeneous seized forensic case files.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/IIITKottayam` (Institutional SIH Archive & Big Data Forensic Search Engine)
- **Secondary / Sub-module Repositories**: `https://github.com/sons-of-pitches-sih/at980-forensic-search` (Distributed Elasticsearch Ingestion & ViT OCR Pipeline)
- **Live Demo / Web Deployment**: `https://iiitkottayam.ac.in` (Official IIIT Kottayam SIH Research Portal)
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Sons of Pitches SIH 2022 Grand Finale Defense Deck — *Sub-Second Forensic Discovery Across Multi-Terabyte Police Evidence Dumps*
- **Video Demonstration / YouTube**: AT980 Heterogeneous Forensic Media Search & Criminal Link Graph Visualization Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Big Data Searching for Cyber Investigation: Inside the IIIT Kottayam SIH 2022 Winner

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - In modern criminal and cyber investigations, state police seize terabytes of heterogeneous digital evidence from suspect hard drives, mobile phones, and seized servers.
  - Seized data contains millions of unindexed, unstructured files across disparate formats: scanned FIR PDFs, smartphone screenshot dumps (JPEG/PNG), call data records (CDR in CSV/XLSX), WhatsApp chat exports, audio wiretaps, and database dumps.
  - Investigating Officers (IOs) took weeks to manually search for a single telephone number, vehicle license plate, or alias across thousands of unorganized folders.
  - Commercial forensic suites (like EnCase, Cellebrite) were either prohibitively expensive, required proprietary dongles, or suffered severe slowdowns when querying across distributed multi-gigabyte corpus stores.
- **Target Beneficiaries / Government End-Users**:
  - State Police Cyber Crime Directorates, Special Task Forces (STF), and Anti-Terrorism Squads (ATS).
  - Central Bureau of Investigation (CBI), National Investigation Agency (NIA), and Narcotics Control Bureau (NCB).
  - District Forensic Science Laboratories (FSL).

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      AT980 SYSTEM ARCHITECTURE                                      |
+----------------------------------------------------------------------------------------------------+
  [ Seized Digital Evidence Dumps: Scanned PDFs, Screenshots, CDR CSVs, Audio, Chat Exports ]
                                                |
                                                v  (High-Throughput Distributed Ingestion)
  +---------------------------------------------------------------------------------+
  |                  Multi-Modal Evidence Extraction & Normalization Stage          |
  |  - Apache Tika Unified Metadata & Text Extractor (PDF, DOCX, XLSX, TXT)         |
  |  - Distributed OCR Pipeline: Tesseract 5 + Vision Transformer (ViT) for images  |
  |  - Whisper ASR Speech-to-Text transcriber for seized audio wiretaps             |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Distributed Vector & Inverted Indexing Cluster                 |
  |  - Elasticsearch / OpenSearch Multi-Node Cluster with Custom Tokenizers         |
  |  - Fine-Tuned Domain BERT Semantic Vector Embeddings for Fuzzy Alias Matching   |
  |  - Regex Pattern Tokenizers (Indian Phone Numbers, Aadhaar, PAN, Vehicle Reg No)|
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Sub-200ms Hybrid Query Engine & Entity Link Graph              |
  |  - Boolean Exact Match + BM25 Lexical + Cosine Semantic Vector Retrieval        |
  |  - Automated Knowledge Graph Builder (Connecting Suspects, Phone Nodes & CDRs)  |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Investigating Officer (IO) Forensic Intelligence Console       |
  |  - Next.js / React Web Dashboard with Instant Highlighted Search Results        |
  |  - Interactive Vis.js / Cytoscape Criminal Syndicate Network Link Graph         |
  |  - Court-Admissible Forensic Search Audit Report Export (PDF/XLSX)              |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Heterogeneous Evidence Ingestion**: Investigating officers drag-and-drop an entire seized directory or disk image into the ingestion portal.
  2. **Multi-Modal Content Extraction**: Apache Tika extracts text from office documents; distributed OCR extracts text embedded inside images/screenshots; Whisper transcribes audio files into searchable transcripts.
  3. **Entity Extraction & Indexing**: Specialized NER pipelines tag Indian telephone numbers, bank account numbers, IFSC codes, vehicle plates (e.g. "MP-04-AB-1234"), and criminal aliases into Elasticsearch inverted indexes.
  4. **Sub-200ms Hybrid Search**: The search engine supports exact string matching, wildcards, regex patterns, and fuzzy phonetic search across millions of documents simultaneously.
  5. **Criminal Syndicate Link Analysis**: Discovered entities are automatically linked into an interactive knowledge graph showing shared phone contacts, common bank accounts, and geographic travel intersections.

- **Core Algorithms & Mathematical / Logic Models**:
  - **BM25 + Dense Semantic Fusion Scoring**:
    $$\text{Score}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)} + \lambda \cdot \text{Cosine}(\mathbf{e}_Q, \mathbf{e}_D)$$
  - **Graph Co-Occurrence Association Strength**:
    $$\mathcal{A}(u, v) = \frac{|\mathcal{D}_u \cap \mathcal{D}_v|}{\sqrt{|\mathcal{D}_u| \cdot |\mathcal{D}_v|}}$$
    measuring criminal relationship strength based on shared document occurrences.

- **Security, Anonymity & Compliance Framework**:
  - Strict role-based forensic access controls conforming to Indian Evidence Act Section 65B electronic record admissibility requirements.
  - Complete cryptographic SHA-256 evidence hashing ensuring zero file tampering during indexing.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js 18, Next.js, Cytoscape.js / Vis.js (Interactive Criminal Knowledge Graph), Tailwind CSS.
- **Backend / Microservices**: Python (FastAPI), Apache Tika Server, Celery, Redis.
- **Blockchain / ML / Core Engine**: Elasticsearch 8.x / OpenSearch, PyTorch, HuggingFace BERT, Tesseract OCR 5, OpenAI Whisper.
- **Database & Storage**: Elasticsearch (Inverted Indexes & Vector Store), PostgreSQL (Case metadata), MinIO (Raw evidence blob storage).
- **DevOps, Hardware & Cloud Infrastructure**: Docker Swarm / Kubernetes, Linux Enterprise Server.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Lightning-fast sub-200ms search performance across millions of heterogeneous seized records with automated visual entity link-graph generation.
- **Feasibility & Real-World Viability**:
  - Addressed the exact day-to-day bottleneck of police cyber cells: eliminated weeks of manual evidence parsing.
- **Hackathon Execution Completeness**:
  - Live stress-test during jury defense: judges queried obscure phone numbers and vehicle plates across a massive multi-gigabyte synthetic evidence dump; results and the associated suspect link graph rendered instantly in $<180\text{ms}$.

## 7. Lessons Learned & SIH Participant Takeaways
- **Handling Heterogeneous Formats Wins Big**: Real-world police data is messy; systems that seamlessly ingest PDF, JPG, MP3, and CSV files in a unified pipeline dominate cyber track evaluations.
- **Sub-Second Performance Builds Trust**: Proving your search engine maintains $<200\text{ms}$ latency under heavy load proves production-grade distributed architecture.
- **Visual Entity Graphs Convert Data into Intelligence**: Don't just show a list of search hits; visualizing how suspects, phone numbers, and bank accounts interconnect transforms a basic search tool into a high-value investigative suite.
