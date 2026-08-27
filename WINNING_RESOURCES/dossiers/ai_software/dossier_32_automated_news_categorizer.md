# Automated Digital News Crawling, Categorization & Sentiment Engine — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Natural Language Processing, Distributed Web Crawling, Media Analytics & Public Grievance Tracking
- **Problem Statement ID & Title**: PS SIH1329 — Automated Crawling, Categorization, and Sentiment Analysis of Digital News with Incorporated Feedback System
- **Sponsoring Ministry / Organization**: Ministry of Information and Broadcasting (MIB) / Press Information Bureau (PIB), Government of India
- **Winning Team Name & Institution**: Team Avengers / Department of Computer Science & Engineering
- **Team Members & Mentor**: Akash Rout (Lead Full-Stack & ML Architect, GitHub: `@iamakashrout`), alongside distributed systems and NLP team members; mentored by media intelligence consultants.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Commended by PIB officials for high-throughput multilingual digital news aggregation and automated ministerial alert dispatching.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/iamakashrout/SIH-2023`
- **Secondary / Sub-module Repositories**: `https://github.com/iamakashrout/SIH-2023/tree/main/ml_models` (DistilBERT Classifier, RoBERTa Sentiment & Alert Pipeline)
- **Live Demo / Web Deployment**: Digital News Grievance Monitoring & Analytics Portal
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Team Avengers SIH 2023 Grand Finale Defense Deck — *Real-Time Ministerial News Categorization & Sentiment Triage*
- **Video Demonstration / YouTube**: Automated News Crawling, Multilingual Tokenization & PRO Escalation Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Building a Media Intelligence Platform for the Ministry of I&B: SIH 2023 Retrospective

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Thousands of digital news portals, blogs, YouTube channels, and regional vernacular publications publish stories regarding Government of India policies, infrastructure projects, and welfare schemes every hour.
  - The Ministry of I&B and Press Information Bureau (PIB) relied on manual media monitoring officers to read digital articles, tag the relevant ministry (e.g. Railways, Health, Road Transport), assess public sentiment, and draft daily summary clipping reports.
  - Manual monitoring resulted in a 6-to-12 hour lag, making it impossible to counter viral misinformation or respond swiftly to genuine breaking civic grievances (e.g. major train disruptions, hospital oxygen shortages, bridge collapses).
- **Target Beneficiaries / Government End-Users**:
  - Ministry of Information and Broadcasting (MIB) and Press Information Bureau (PIB).
  - Public Relations Officers (PROs) and Media Officers across all 50+ Central Government Ministries.
  - State Information and Public Relations Departments (IPRD).

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                  NEWS INTELLIGENCE ARCHITECTURE                                     |
+----------------------------------------------------------------------------------------------------+
  [ 500+ Digital News Portals / RSS Feeds / Vernacular Sites / YouTube News Audio Transcripts ]
                                                |
                                                v  (Distributed Celery Async Crawlers)
  +---------------------------------------------------------------------------------+
  |                  High-Throughput Web Ingestion & Text Extraction                |
  |  - Headless Chromium (Playwright/Selenium) + Beautiful Soup 4 Ingestion         |
  |  - Boilerplate Removal & Readability Extraction (Trafilatura / Goose3)          |
  |  - Multilingual Translation & Normalization to English/Hindi (IndicBERT)       |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  AI Ministerial Classification & Entity Tagging                 |
  |  - Fine-Tuned DistilBERT Transformer (50+ Target Ministries & Schemes)          |
  |  - Named Entity Recognition (NER): Locations, Schemes, Public Figures, Dates    |
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Fine-Grained Sentiment & Grievance Severity Engine             |
  |  - Domain Fine-Tuned RoBERTa Sentiment Model (Positive, Neutral, Negative)      |
  |  - Grievance Severity Index ($GSI$) calculating urgency and public unrest factor|
  +---------------------------------------------------------------------------------+
                                                |
                                                v
  +---------------------------------------------------------------------------------+
  |                  Automated Ministerial Dispatcher & Feedback Loop               |
  |  - Real-time Webhook / Email / SMS alert to assigned Ministerial PRO            |
  |  - Official Response & Rebuttal Publishing Module (Fact-Check Dispatch)         |
  |  - Interactive Next.js Sentiment Heatmap & Word Cloud Analytics Dashboard       |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Distributed Headless Scraping**: Celery workers scrape hundreds of digital news URLs every 15 minutes, bypassing dynamic JavaScript rendering via Playwright.
  2. **Text Normalization**: Strips ads, navigation sidebars, and comments, extracting clean news body text and metadata (author, timestamp, headline).
  3. **Multi-Label Ministry Categorization**: The DistilBERT model classifies articles across 50+ government ministries with $>92\%$ top-1 accuracy.
  4. **Sentiment & Urgency Scoring**: RoBERTa computes sentiment polarity, while an urgency heuristic scores whether the story represents an active crisis.
  5. **PRO Dashboard & Escalation**: High-severity negative stories trigger automated alerts to the specific ministry's communications desk with pre-filled rebuttal templates.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Multi-Label Cross-Entropy Loss for Ministry Tagging**:
    $$\mathcal{L}_{\text{BCE}} = -\sum_{i=1}^M \left[ y_i \log(\sigma(z_i)) + (1 - y_i) \log(1 - \sigma(z_i)) \right]$$
  - **Grievance Severity Index ($GSI$)**:
    $$GSI = \alpha \cdot (1 - \text{Sentiment}) \times \log(1 + \text{Virality/ViewCount}) \times \beta_{\text{domain}}$$
    where $\beta_{\text{domain}}$ is higher for life-critical sectors (Disaster, Health, Law & Order).

- **Security, Anonymity & Compliance Framework**:
  - Compliant with web scraping `robots.txt` guidelines and fair-use media indexing policies.
  - Role-based authentication ensuring ministerial PROs only view and act on alerts relevant to their department.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Next.js 14, React.js, Tailwind CSS, Chart.js, Recharts, Lucide Icons.
- **Backend / Microservices**: Python (Django / FastAPI), Celery distributed task queue, Redis message broker.
- **Blockchain / ML / Core Engine**: PyTorch, HuggingFace Transformers (DistilBERT, RoBERTa), NLTK, spaCy, Trafilatura, Playwright.
- **Database & Storage**: PostgreSQL (articles & grievance logs), Elasticsearch (high-speed full-text search).
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, Linux cron jobs, Redis queue clustering.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Complete end-to-end automation: proved that a live news article published online was scraped, classified to the Ministry of Railways, scored as negative sentiment, and generated an alert email to the simulated PRO in under 90 seconds.
- **Feasibility & Real-World Viability**:
  - Replaced manual newspaper clipping with an interactive real-time dashboard featuring automated rebuttal and fact-check publishing tools.
- **Hackathon Execution Completeness**:
  - High model accuracy and robust error handling across multilingual vernacular regional news sources.

## 7. Lessons Learned & SIH Participant Takeaways
- **Show the Full Feedback Loop**: Many NLP teams stop at classifying text; adding the downstream workflow (email alerts, PRO fact-check responses, feedback analytics) wins hackathons.
- **Tackle Dynamic Modern Web Scraping**: Static HTML scrapers fail on modern React/Vue news portals; demonstrating headless browser ingestion handles real-world web complexity.
- **Quantitative Grievance Indices**: Developing a custom mathematical score (like $GSI$) gives evaluators a concrete metric to measure operational impact.
