# Defendify CryptoTracker — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (Software Edition — 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Crypto-Forensics & De-Anonymization / Intelligence Analytics
- **Problem Statement ID & Title**: SIH1445 — *De-anonymisation for monitoring and tracking of illegal activities performed using cryptocurrency transaction technology*
- **Sponsoring Ministry / Organization**: National Technical Research Organisation (NTRO), Government of India
- **Winning Team Name & Institution**: Team Defendify (Team Lead: Sankalp Chordia) from Bansilal Ramnath Agarwal Charitable Trust's Vishwakarma Institute of Technology (VIT), Pune, Maharashtra
- **Team Members & Mentor**: Sankalp Chordia (Lead Developer / ML Engineer), Core Team Members from VIT Pune Department of Computer Engineering
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at Sri Venkateswara College of Engineering Nodal Center, Tirupati)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/SankalpChordia/Defendify-CryptoTracker
- **Secondary / Sub-module Repositories**:
  - https://github.com/SankalpChordia
- **Live Demo / Web Deployment**: https://github.com/SankalpChordia/Defendify-CryptoTracker#demo
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/SankalpChordia/Defendify-CryptoTracker/tree/main/docs/NTRO_SIH1445_Presentation.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=Defendify+CryptoTracker+SIH+2023+NTRO
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/SankalpChordia/Defendify-CryptoTracker/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Pseudo-Anonymous Network Topology: Raw blockchain addresses do not carry identity tags, requiring deep topological graph mining to discover behavioral patterns.
  - High-Volume Noise & Latency: Manual inspection cannot scale to millions of daily on-chain transactions across Bitcoin and Ethereum networks.
  - Absence of Machine Learning Graph Classifiers: Inability to categorize unknown wallets as "Licit" vs "Illicit" (ransomware, darknet, phishing) based on transaction subgraph motifs.
- **Target Beneficiaries / Government End-Users**:
  - National Technical Research Organisation (NTRO)
  - Defense Intelligence Agency (DIA) Cyber Forensics Directorate
  - Indian Computer Emergency Response Team (CERT-In)
  - National Critical Information Infrastructure Protection Centre (NCIIPC)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  INTELLIGENCE OPERATOR DASHBOARD (Next.js)              |
|        - Real-Time Wallet Anomaly Scoreboard & Risk Heatmaps            |
|        - Graph Convolutional Network (GCN) Subgraph Visualizer          |
+------------------------------------+------------------------------------+
                                     | (REST API / Async Task Polls)
                                     v
+-------------------------------------------------------------------------+
|                      FASTAPI & CELERY INFERENCE BACKEND                 |
|   - PyTorch Geometric (PyG) Graph Neural Network Engine                 |
|   - Feature Extractor: In/Out Degree, Velocity, Burstiness, Gini Coeff  |
|   - Darknet Escrow & Clearnet Alias Matcher Engine                      |
+-------------------+--------------------------------+--------------------+
                    |                                |
        (Vector Embeddings & Scores)    (Raw Block Ingestion)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    NEO4J & REDIS GRAPH CACHE      |  |    BLOCKCHAIN FULL NODE / APIS   |
|  - Scalable Graph Clustering      |  |  - Bitcoin RPC & Geth Node RPC   |
|  - Temporal Graph Embeddings      |  |  - Elliptic Transaction Datasets |
+-------------------+---------------+  +-----------------+----------------+
                    |                                    |
                    +------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                   DE-ANONYMIZATION ATTRIBUTION ENGINE                   |
|       - Correlation with Leaked Breaches, Telegram Scams, PGP Keys      |
|       - High-Confidence Entity Resolution & Report Generator            |
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Graph Ingestion*: Transactions are extracted from full nodes and transformed into heterogeneous graph snapshots (nodes = addresses, directed edges = transactions with amounts and timestamps).
  2. *Feature Engineering*: Calculates topological metrics per node: transaction frequency, incoming/outgoing volume skewness, neighbor degree distribution, and Gini coefficient of transaction distribution.
  3. *GCN Inference*: PyTorch Geometric 2-layer Graph Convolutional Network computes node embeddings and outputs classification probability: P(Illicit | G_subgraph).
  4. *Attribution & Intelligence Scoring*: High-risk wallets are matched against indexed darknet market escrow dumps and OSINT databases to establish real-world identity pointers.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Graph Convolution Layer Formulation*:
    H^(l+1) = sigma( D_tilde^(-1/2) * A_tilde * D_tilde^(-1/2) * H^(l) * W^(l) )
    where A_tilde = A + I_N represents the adjacency matrix with added self-loops, and D_tilde is the diagonal degree matrix.
  - *Transaction Burstiness Metric*:
    B = (sigma_tau - mu_tau) / (sigma_tau + mu_tau)
    measuring the inter-transaction arrival variance to distinguish automated bot scripts from human users.
- **Security, Anonymity & Compliance Framework**:
  - Designed for classified intelligence operation within air-gapped NTRO environments.
  - Cryptographic validation of raw block headers to ensure ingested transaction data is genuine and unmanipulated.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Next.js 13, React, TailwindCSS, Vis.js, React Flow, Chart.js
- **Backend / Microservices**: Python FastAPI, Celery distributed task queue, Redis message broker, PostgreSQL
- **Blockchain / ML / Core Engine**: PyTorch Geometric (PyG), NetworkX, Scikit-learn, Web3.py, Elliptic Bitcoin dataset pipeline
- **Database & Storage**: Neo4j Graph DB, Redis In-Memory Cache, PostgreSQL
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Kubernetes deployment configs, NVIDIA CUDA GPU acceleration for GNN training

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Application of Graph Convolutional Networks (GNNs) directly on raw blockchain subgraphs to classify unlabelled malicious addresses with over 92% precision.
- **Feasibility & Real-World Viability**:
  Directly fulfilled NTRO problem statement SIH1445 requirements with demonstrable de-anonymization workflows linking crypto wallets to known cyber threat actors.
- **Hackathon Execution Completeness**:
  Trained GNN model ran inference in real time during the 36-hour hackathon, classifying live input wallet addresses within 1.5 seconds.

## 7. Lessons Learned & SIH Participant Takeaways
- **Leverage Domain-Specific ML**: Applying Graph Neural Networks (GNNs) on network graphs provides a massive competitive edge over standard tabular machine learning.
- **Handle Imbalanced Datasets**: In crypto forensics, illicit transactions represent <2% of total volume; utilize SMOTE or focal loss to handle class imbalance effectively.
- **Build Modular Microservices**: Separate the heavy ML inference pipeline from the API gateway using asynchronous task queues (Celery/Redis) to prevent UI freezing during jury evaluations.
