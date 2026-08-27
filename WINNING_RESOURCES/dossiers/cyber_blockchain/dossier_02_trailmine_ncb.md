# TrailMine / TRA1LF1NDERS — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 (Software Edition — 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Crypto-Forensics, Fraud Tracking & VASP Attribution / Homeland Security
- **Problem Statement ID & Title**: SIH 2024 / NCB — *Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges and Identifying the End Receiver of Cryptocurrency Transactions*
- **Sponsoring Ministry / Organization**: Narcotics Control Bureau (NCB), Ministry of Home Affairs, Government of India
- **Winning Team Name & Institution**: Team TRA1LF1NDERS (Team Lead: Aritra Dhabal) from Jalpaiguri Government Engineering College (JGEC), Jalpaiguri, West Bengal
- **Team Members & Mentor**: Aritra Dhabal (Lead/Graph Forensics), Core Team Members from JGEC Department of Computer Science & Engineering
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at IIT Bhubaneswar Nodal Center)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/aritradhabal/TrailMine
- **Secondary / Sub-module Repositories**:
  - https://github.com/aritradhabal
- **Live Demo / Web Deployment**: https://github.com/aritradhabal/TrailMine#readme
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/aritradhabal/TrailMine/tree/main/docs/TrailMine_NCB_Defense_Deck.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=TrailMine+NCB+SIH+2024+cryptocurrency+tracker
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/aritradhabal/TrailMine/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Peel Chains & Intermediate Hopping: Splitting large transactions into hundreds of small intermediate addresses, peeling off tiny amounts at each hop to confuse manual tracing.
  - Mixers, Tumblers & Cross-Chain Bridges: Routing funds through decentralized mixers (Tornado Cash equivalents) and cross-chain DEX swaps (e.g., BTC to Monero to USDT).
  - Unlabeled Hot-Wallets on Centralized Exchanges (VASPs): Inability of field officers to immediately identify whether a terminal deposit address belongs to Binance, WazirX, CoinDCX, or an unhosted hardware wallet.
- **Target Beneficiaries / Government End-Users**:
  - Narcotics Control Bureau (NCB) Cyber Intelligence Unit
  - Indian Cyber Crime Coordination Centre (I4C), MHA
  - Enforcement Directorate (ED) AML Investigation Wings
  - State Police Cyber Crime Investigation Cells

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  INVESTIGATOR WORKSPACE (React / D3.js)                 |
|       - Interactive Multi-Hop Graph Explorer & Transaction Visualizer    |
|       - Suspect Wallet Address Query & Live Fund Stream Monitoring       |
+------------------------------------+------------------------------------+
                                     | (REST API / WebSocket Streams)
                                     v
+-------------------------------------------------------------------------+
|                      FASTAPI GRAPH ANALYTICS BACKEND                    |
|   - Peel Chain Decomposition Engine & Change Address Heuristics         |
|   - VASP Clustering Algorithm (15,000+ Exchange Hot-Wallet Signatures)  |
|   - Illicit Flow Risk Scorer (Taint Analysis & Anomaly Scoring)         |
+-------------------+--------------------------------+--------------------+
                    |                                |
        (Cypher Graph Queries)          (RPC On-Chain Ingestion)
                    v                                v
+-----------------------------------+  +----------------------------------+
|      NEO4J GRAPH DATABASE         |  |   BLOCKCHAIN RPC INGESTION       |
|  - Nodes: Wallets, VASPs, Mixers  |  |  - Bitcoin Core RPC Node Daemon  |
|  - Edges: Transactions, Timestamps|  |  - Geth / Web3.py (Ethereum)     |
|  - Sub-second Multi-Hop Traversals|  |  - TronGrid / Solana Web3 RPC    |
+-------------------+---------------+  +-----------------+----------------+
                    |                                    |
                    +------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  FORENSIC REPORT & SECTION 65B GENERATOR                |
|       - Automated PDF Case Dossier Generation with Chain-of-Custody     |
|       - Formal LEA Notice Template for VASP KYC Record Requisition      |
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Ingestion & UTXO Parsing*: Investigator inputs a suspect Bitcoin/Ethereum/Tron address. The engine calls full-node RPC APIs to retrieve raw transaction inputs/outputs and historical mempool logs.
  2. *Heuristic Clustering & Change Address Detection*: Applies Common-Input-Ownership Heuristic (CIOH) and Optimal Change Heuristic to group multiple addresses under a single real-world entity cluster.
  3. *Graph Projection & Taint Calculation*: Projects the transaction graph into Neo4j; propagates taint score downstream across edges using FIFO and Poison-fraction models.
  4. *VASP Identification & Export*: Matches terminal hop addresses against a database of 15,000+ labeled exchange clusters; outputs a Section 65B compliant forensic PDF with complete transaction hashes and VASP contact info.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Haircut / Poison Taint Metric*:
    T(w_out) = sum(T(w_in, i) * (v_i / sum(v_j)))
  - *Change Address Identification Metric*: An output address A_out is classified as a change address if:
    A_out not in Inputs and |A_out| == 1 and v(A_out) != RoundValue(BTC)
- **Security, Anonymity & Compliance Framework**:
  - Generates Indian Evidence Act Section 65B compliant audit records containing cryptographic hash chains for every queried transaction.
  - Role-gated LEA access ensuring suspect searches remain strictly confidential within classified police networks.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, TailwindCSS, D3.js, Cytoscape.js force-directed graph rendering, Lucide Icons
- **Backend / Microservices**: Python FastAPI, Celery asynchronous task worker, Redis queue, WebSockets for live stream updates
- **Blockchain / ML / Core Engine**: Web3.py, Bitcoin Core RPC connector, TronPy, NetworkX, Scikit-learn (heuristic clustering)
- **Database & Storage**: Neo4j Graph Database (v5.x), PostgreSQL (case notes & investigator metadata)
- **DevOps, Hardware & Cloud Infrastructure**: Docker Compose containerization, Nginx reverse proxy, Linux bare-metal node hosting

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Real-time peeling of CoinJoin and mixer hops down to the exact Indian centralized exchange (WazirX, CoinDCX) deposit wallet with sub-second graph expansion in front of the jury.
- **Feasibility & Real-World Viability**:
  Directly solved an active operational challenge for the Narcotics Control Bureau (NCB) by exporting ready-to-serve Section 91 CrPC notice requests to exchanges.
- **Hackathon Execution Completeness**:
  Live demo successfully tracked a live testnet transaction through a simulated 5-hop peel chain and correctly identified the terminal VASP within 3 seconds.

## 7. Lessons Learned & SIH Participant Takeaways
- **Interactive Graph UI is Essential for Forensics**: Static tables fail to impress; law enforcement juries demand interactive force-directed graph visualizers where suspect clusters can be clicked and expanded.
- **Prioritize Evidence Admissibility**: Incorporate Section 65B certificate generation into forensic tools; judges look for court admissibility as much as technical capability.
- **Handle Multi-Chain Realities**: Modern cybercriminals do not stick to Bitcoin alone; support for EVM chains (Ethereum, Polygon) and Tron (USDT-TRC20) is mandatory.
