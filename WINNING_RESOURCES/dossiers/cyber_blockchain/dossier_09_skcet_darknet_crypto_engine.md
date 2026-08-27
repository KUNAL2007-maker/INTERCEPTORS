# SKCET DarkNet Crypto Intelligence Engine — NCB National Grand Champion Dossier

## 1. Executive Summary & Meta
- **SIH / National Hackathon**: Darknet Hackathon / SIH National Grand Champion (1st Prize Winner, ₹2,50,000)
- **Category / Domain**: Darknet Forensics, Threat Intelligence & Crypto Tracking / Homeland Security
- **Problem Statement ID & Title**: NCB-DarkNet-01 — *Digital Footprinting of Active Drug Traffickers on Dark Net Based in India*
- **Sponsoring Ministry / Organization**: Narcotics Control Bureau (NCB), Ministry of Home Affairs, Government of India
- **Winning Team Name & Institution**: SKCET Cyber Squad from Sri Krishna College of Engineering and Technology (SKCET), Coimbatore, Tamil Nadu
- **Team Members & Mentor**: Student Cyber Forensics Researchers & Faculty Mentors from SKCET Department of Information Technology & Cyber Security
- **Prize & Recognition**: 1st Place National Grand Champion (₹2,50,000 Cash Prize; Felicitated personally by Union Home Minister Shri Amit Shah)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter
- **Secondary / Sub-module Repositories**:
  - https://github.com/skcet-official
- **Live Demo / Web Deployment**: https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter#overview
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter/tree/main/docs/NCB_GrandFinale_Dossier.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=SKCET+Darknet+Hackathon+Amit+Shah+NCB
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  Narcotics trafficking rings in India increasingly use the darknet (Tor/I2P hidden services) to sell synthetic narcotics, receiving payments in Monero/Bitcoin and coordinating dead-drops via encrypted messaging apps:
  1. *Unindexed Onion Marketplaces & Dead Drop Slang*: Drug listings use localized Hindi/Tamil/Punjabi slang terms for narcotics that standard English keyword filters fail to flag.
  2. *Cross-Platform Persona Fragmentation*: Traffickers use different aliases across dread forums, Telegram channels, Wickr, and darknet market feedback sections.
  3. *Unlinked Crypto Transactions to Physical Geographies*: Inability of field officers to connect suspect cryptocurrency payment addresses with physical courier delivery hubs and dead-drop GPS coordinates.
- **Target Beneficiaries / Government End-Users**:
  - Narcotics Control Bureau (NCB) Headquarters & Regional Zonal Units
  - Indian Cyber Crime Coordination Centre (I4C), MHA
  - State Police Anti-Narcotics Task Forces (ANTF)
  - Intelligence Bureau (IB) & Research and Analysis Wing (R&AW)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  NCB INVESTIGATOR TACTICAL WORKSPACE                    |
|       - Geographic Delivery Drop Map (Leaflet.js / GPS Clusters)        |
|       - Cross-Platform Digital Footprint Linkage Explorer               |
+------------------------------------+------------------------------------+
                                     | (Secure REST API / SSL)
                                     v
+-------------------------------------------------------------------------+
|                   MULTI-SOURCE DARKNET SPIDER & NLP ENGINE              |
|   - Distributed Tor Spiders (Stem + Privoxy Circuit Multiplexer)        |
|   - Multilingual RoBERTa NLP (Fine-Tuned on Indian Narcotics Slang)     |
|   - Regex Entity Harvester (BTC/XMR, PGP Keys, Wickr, Telegram, Proton) |
+-------------------+--------------------------------+--------------------+
                    |                                |
        (Extracted Threat Entities)      (Raw Onion Page HTML)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    CROSS-PLATFORM CORRELATOR      |  |    ELASTICSEARCH FULL-TEXT CORE  |
|  - Matches Darknet Handles to     |  |  - Indexed Marketplace Listings  |
|    Clearnet GitHub/Twitter/Reddit |  |  - Historical Vendor Feedback    |
|  - Generates Suspect Identity Map |  |  - Escrow Transaction Archive    |
+-------------------+---------------+  +-----------------+----------------+
                    |                                    |
                    +------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  TACTICAL LEA INTELLIGENCE DOSSIER EXPORT               |
|       - 1-Click Court-Ready Suspect Dossier with Crypto Flow Charts     |
|       - Section 65B Indian Evidence Act Cryptographic Chain-of-Custody  |
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Autonomous Onion Spidering*: Tor crawler cluster crawls unindexed onion marketplaces, dread forums, and hidden paste sites continuously.
  2. *Multilingual Slang & Entity Extraction*: NLP pipeline parses multilingual descriptions, identifying narcotic quantities, purity levels, escrow policies, PGP public keys, and payment wallet addresses.
  3. *Cross-Domain Persona Correlation*: Correlates unique PGP key IDs, email handles, and stylistic writing fingerprints (stylometry) between dark web forums and clearnet platforms (Reddit, GitHub, Twitter).
  4. *Geotagged Tactical Dossier Compilation*: Generates ready-to-act intelligence dossiers mapping suspect aliases, crypto fund flows, and courier drop coordinates directly onto police maps.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Stylometric Authorship Attribution*:
    Distance(D_dark, D_clear) = sum(w_i * |f_i(D_dark) - f_i(D_clear)|)
    measuring n-gram frequency, punctuation habits, and syntactic sentence structures to link pseudonyms.
  - *Darknet Threat Severity Index*:
    TSI_drug = alpha * Vol_Narcotics + beta * Conf_IndianOrigin + gamma * CryptoValue
- **Security, Anonymity & Compliance Framework**:
  - Strict OPSEC compliance: all scraping daemons route through air-gapped proxy networks with automatic memory shredding.
  - Section 65B Indian Evidence Act compliant digital hash timestamps for every scraped listing.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, TailwindCSS, Leaflet.js (GIS dead-drop mapping), D3.js, Lucide Icons
- **Backend / Microservices**: Python FastAPI, Scrapy, Stem (Tor control library), Privoxy, Celery
- **Blockchain / ML / Core Engine**: RoBERTa / BERT fine-tuned models, PyTorch, Spacy custom NER, NLTK Stylometry analyzer
- **Database & Storage**: Elasticsearch (v8.x), PostgreSQL, Redis
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Linux Ubuntu, Tor Circuit Switcher, Automated Proxy Pools

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Stylometric authorship analysis and PGP fingerprint correlation that unmasked a real simulated darknet vendor alias by linking their hidden service posts to an old clearnet Reddit and GitHub account.
- **Feasibility & Real-World Viability**:
  Directly solved the highest-priority operational problem for the Narcotics Control Bureau (NCB), earning national recognition and personal felicitation by the Union Home Minister.
- **Hackathon Execution Completeness**:
  Live demo scraped active onion forums, detected Indian narcotics listings, extracted crypto wallets, and generated a complete tactical intelligence dossier in under 60 seconds.

## 7. Lessons Learned & SIH Participant Takeaways
- **Solve High-Stakes National Priorities**: Choosing problems with direct homeland security impact (NCB, MHA, NTRO) attracts the highest government visibility and prize recognition.
- **Stylometry + OSINT is a Game Changer**: In de-anonymization problems, combining text stylometry with clearnet OSINT yields massive "wow" moments during jury evaluation.
- **Incorporate Native Language Context**: Real Indian cybercrime uses regional slang; building NLP models that understand Hinglish and Indian regional terms beats generic English classifiers every time.
