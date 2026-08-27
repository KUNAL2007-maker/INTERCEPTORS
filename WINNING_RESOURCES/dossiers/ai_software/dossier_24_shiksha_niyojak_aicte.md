# Shiksha Niyojak: AICTE Model Curriculum Design, Evaluation & Governance Portal — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: AI/ML, Natural Language Processing, EdTech & Enterprise Governance Workflow
- **Problem Statement ID & Title**: PS SIH1465 — Unified Portal for AICTE Model Curriculum Design, Revision, Multi-Expert Evaluation, and National Gazette Approval
- **Sponsoring Ministry / Organization**: All India Council for Technical Education (AICTE), Ministry of Education, Government of India
- **Winning Team Name & Institution**: Team HexxCode / College of Engineering, Pune (COEP Technological University)
- **Team Members & Mentor**: Prerna Tulsiani (Lead Full-Stack & System Architect, GitHub: `@pt3002`), along with COEP engineering team members; mentored by senior university curriculum chairs.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Highly commended by AICTE leadership for complete role-based curriculum lifecycle management.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/pt3002/HexxCode-SIH-2023`
- **Secondary / Sub-module Repositories**: `https://github.com/pt3002/HexxCode-SIH-2023/tree/main/client` (React Portal) & `/server` (Node/Express & Python NLP Engine)
- **Live Demo / Web Deployment**: Shiksha Niyojak AICTE Staging Portal Deployment
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: HexxCode SIH2023 Grand Finale Presentation — *Intelligent Curriculum Authoring, Bloom's Semantic Alignment & Multi-Expert Consensus*
- **Video Demonstration / YouTube**: HexxCode Shiksha Niyojak End-to-End Walkthrough & AI Assessment Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Modernizing India's Technical Education Governance: The HexxCode SIH 2023 Journey

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - The AICTE updates model curricula across 50+ engineering and technology disciplines to match rapidly evolving global industrial standards (AI, Semiconductor, Quantum, Green Energy).
  - The existing curriculum drafting process relied on fragmented email exchanges, static Word documents, and disorganized committee meetings, taking 12–18 months per revision cycle.
  - Reviewers lacked automated semantic tools to measure Course Learning Outcomes (CLO) against Program Outcomes (PO), verify adherence to Bloom's Taxonomy cognitive levels, or detect duplicated course contents across overlapping engineering branches.
  - There was no version control or unified audit trail to reconcile conflicting suggestions from multiple academic and industrial experts.
- **Target Beneficiaries / Government End-Users**:
  - AICTE Executive Committee, Bureau Heads, and Board of Studies.
  - 10,000+ technical institutions, universities, and polytechnics across India.
  - Academic Subject Matter Experts (SMEs) and Industry Curriculum Advisory Boards.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                  SHIKSHA NIYOJAK ARCHITECTURE                                      |
+----------------------------------------------------------------------------------------------------+
  [ Academic SMEs / Industry Experts ]      [ AICTE Bureau Heads ]      [ Board of Studies Reviewers ]
                 \                                |                                /
                  v                               v                               v
  +---------------------------------------------------------------------------------+
  |                       Role-Based Access Control (RBAC) Gateway                  |
  |  - JWT Authentication, Multi-Factor Auth, Granular Permission Matrices         |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                 Collaborative Curriculum Authoring Engine (Git-Like)            |
  |  - Branching, Revision History, Line-by-Line Comment Threads & Conflict Resolve |
  |  - Structured Course Schema (Units, Laboratory Experiments, Reference Books)    |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     AI/NLP Semantic Alignment & Quality Engine                  |
  |  - Sentence-BERT Embedding Ingestion of Course Learning Outcomes (CLOs)         |
  |  - Vector Cosine Similarity against AICTE Graduate Attributes / POs (1 to 12)  |
  |  - Bloom's Revised Taxonomy Cognitive Depth Classifier (Remember -> Create)    |
  |  - Redundancy & Cross-Discipline Overlap Scanner (Jaccard + Cosine Index)       |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                 25-Parameter Expert Scoring & Consensus Matrix                  |
  |  - Weighted Multi-Criteria Decision Making (MCDM) for Expert Panels             |
  |  - Real-time Consensus Index Calculation & Automated Gazette Publishing         |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Course Creation & Branching**: Curriculum developers initiate course drafts within structured hierarchical templates (Course Code, Credits, Lecture/Tutorial/Practical split, Units).
  2. **Automated NLP Evaluation**: As text is typed, the backend NLP microservice tokenizes course outcomes and generates Sentence-BERT vector representations.
  3. **Cognitive & Outcome Alignment**: The model maps each verb in the outcome to Bloom's cognitive domain and computes cosine alignment scores against NBA/AICTE Program Outcomes (PO1–PO12).
  4. **Multi-Expert Review Round**: Subject reviewers evaluate the draft across 25 standardized qualitative parameters, entering numeric grades and contextual inline annotations.
  5. **Approval & Gazette Generation**: Once consensus threshold ($>85\%$) is achieved, AICTE administrators sign off, triggering automated PDF gazette compilation with cryptographic watermarks.

- **Core Algorithms & Mathematical / Logic Models**:
  - **CLO-to-PO Cosine Semantic Alignment Vector**:
    $$\text{Sim}(\mathbf{u}_{CLO}, \mathbf{v}_{PO}) = \frac{\mathbf{u}_{CLO} \cdot \mathbf{v}_{PO}}{\|\mathbf{u}_{CLO}\| \|\mathbf{v}_{PO}\|}$$
  - **Bloom's Cognitive Depth Distribution Score ($S_B$)**:
    $$S_B = \sum_{k=1}^6 w_k \cdot \frac{N_k}{N_{total}}, \quad \text{where } w = [0.1, 0.2, 0.4, 0.6, 0.8, 1.0]$$
    for categories: Remember, Understand, Apply, Analyze, Evaluate, Create.
  - **Multi-Expert Consensus Index**:
    $$\text{CI} = 1 - \frac{2 \sum_{i<j} |\text{Score}_i - \text{Score}_j|}{M \cdot (M-1) \cdot \text{Score}_{max}}$$

- **Security, Anonymity & Compliance Framework**:
  - Strict hierarchical RBAC ensuring blind peer evaluation where expert identities remain masked.
  - Comprehensive immutable audit trail logging every syllabus edit, rejection, and approval timestamp.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js 18, Tailwind CSS, Monaco Editor (for structured syllabus text editing), Chart.js (for Bloom's radar graphs).
- **Backend / Microservices**: Node.js, Express.js (REST API), Python (FastAPI for ML/NLP microservices).
- **Blockchain / ML / Core Engine**: PyTorch, HuggingFace Transformers, Sentence-BERT (`all-MiniLM-L6-v2`), NLTK, Spacy.
- **Database & Storage**: MongoDB (document store for dynamic syllabus schemas), Redis (session caching), AWS S3 (for gazette storage).
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, GitHub Actions CI/CD pipeline.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Built an automated Bloom's Taxonomy and Outcome-Based Education (OBE) evaluator that analyzed syllabus text in real-time, highlighting weak action verbs and generating radar charts of cognitive rigor.
- **Feasibility & Real-World Viability**:
  - Designed specifically around AICTE's exact operational bureaucracy: eliminated 12+ months of manual paperwork without disrupting statutory committee workflows.
- **Hackathon Execution Completeness**:
  - Complete multi-role portal: successfully demonstrated four distinct live accounts (Curriculum Author, Subject Expert, Bureau Head, AICTE Chairman) interacting concurrently.

## 7. Lessons Learned & SIH Participant Takeaways
- **Role-Based Workflows Impress Bureaucrats**: Hackathon solutions for ministries must handle the full administrative hierarchy (draft -> review -> revise -> approve -> publish).
- **Embedded Real-Time AI**: Integrating AI as live typing feedback (e.g. suggesting better Bloom's verbs while typing) is vastly more impressive than a standalone batch script.
- **Visual Compliance Metrics**: Presenting syllabus quality through clear visual charts (e.g. CLO-PO coverage matrix) makes complex educational theory instantly clear to evaluators.
