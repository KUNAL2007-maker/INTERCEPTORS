# SIH 2026 — Crypto Fraud Attribution System
## Collaborative Multi-Agent & Multi-User Operating Protocol

> **CRITICAL RULE FOR ALL AI AGENTS (GEMINI, CLAUDE, ANTIGRAVITY, ETC.):**
> `GEMINI.md`, `CLAUDE.md`, and `AGENT.md` **MUST ALWAYS BE KEPT 100% IDENTICAL AND SYNCHRONIZED**.
> Whenever you make any update to tasks, architecture, or rules in one file, you **MUST immediately replicate the exact changes to all three files**.

---

### 1. Project Overview & Mission

This repository contains the codebase and research for the **Smart India Hackathon (SIH)** problem statement defined in [PS.txt](file:///a:/SIH/PS.txt):

> **Problem Statement:** "Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics"

#### Core Objective:
Build an automated, real-time crypto-forensics and intelligence platform for Indian Law Enforcement Agencies (LEAs), integrating with platforms like **NCRP** (National Cybercrime Reporting Portal) and **SAHYOG**. 
The system ingests victim-reported suspect wallet addresses, automatically traces multi-hop fund flows across chains and intermediary/burner wallets, pierces laundering mechanisms (mixers, peeling chains, bridges), attributes the receiving **Exchange / VASP** (Virtual Asset Service Provider), and generates court-admissible forensic dossiers (compliant with Section 65B of the Indian Evidence Act / BSA) to facilitate prompt asset freezing.

---

### 2. Research Knowledge Base (MANDATORY REFERENCE)

Before designing or implementing any new module, algorithm, or pipeline stage, **ALL AGENTS MUST FIRST CONSULT THE RELEVANT RESEARCH BLUEPRINTS**. Do not guess algorithms or architectures when comprehensive specifications already exist.

#### Primary Research Blueprints (`a:/SIH/RESEARCH/`):
* [SET 1_ Technical Blueprint_ Automated Detection & Attribution of Programmatic Laundering Circuits.md](file:///a:/SIH/RESEARCH/SET%201_%20Technical%20Blueprint_%20Automated%20Detection%20%26%20Attribution%20of%20Programmatic%20Laundering%20Circuits.md) — Heuristics for peel chains, rapid dispersal, and programmatic laundering.
* [SET 2_ Algorithmic Optimization and Taint Modeling for Automated On-Chain Forensics.md](file:///a:/SIH/RESEARCH/SET%202_%20Algorithmic%20Optimization%20and%20Taint%20Modeling%20for%20Automated%20On-Chain%20Forensics.md) — Taint models (Poison, Haircut, FIFO) and algorithmic optimizations.
* [SET 3 _ Technical Specification_ Advanced Address Clustering and Entity Resolution for Automated Investigative Pipelines.md](file:///a:/SIH/RESEARCH/SET%203%20_%20Technical%20Specification_%20Advanced%20Address%20Clustering%20and%20Entity%20Resolution%20for%20Automated%20Investigative%20Pipelines.md) — Address clustering heuristics, multi-input clustering, and entity resolution.
* [SET 4 _Technical Specification_ Cross-Chain Traceability & Correlation Architectures for Law Enforcement.md](file:///a:/SIH/RESEARCH/SET%204%20_Technical%20Specification_%20Cross-Chain%20Traceability%20%26%20Correlation%20Architectures%20for%20Law%20Enforcement.md) — Cross-chain bridge detection, DEX aggregator swaps, and HTLC atomic swaps.
* [SET 5 _Technical Specification_ Automated De-anonymization Logic for Privacy Protocols.md](file:///a:/SIH/RESEARCH/SET%205%20_Technical%20Specification_%20Automated%20De-anonymization%20Logic%20for%20Privacy%20Protocols.md) — Privacy pools, mixers (Tornado Cash, CoinJoin), and de-anonymization heuristics.
* [SET 6 _Technical Specification_ Real-Time Forensic Ingestion and Multi-Chain Tracing Architecture.md](file:///a:/SIH/RESEARCH/SET%206%20_Technical%20Specification_%20Real-Time%20Forensic%20Ingestion%20and%20Multi-Chain%20Tracing%20Architecture.md) — Streaming ingestion pipeline (Kafka, RPC/WebSocket workers, Graph DBs).
* [SET 7_ Technical Architecture for VASP Infrastructure Identification and Attribution.md](file:///a:/SIH/RESEARCH/SET%207_%20Technical%20Architecture%20for%20VASP%20Infrastructure%20Identification%20and%20Attribution.md) — Exchange hot/cold wallet architectures, deposit sweep identification, and attribution tables.
* [SET 8 _Technical Specification and Risk Architecture_ ML-Driven On-Chain Fraud Detection and Regulatory Reporting.md](file:///a:/SIH/RESEARCH/SET%208%20_Technical%20Specification%20and%20Risk%20Architecture_%20ML-Driven%20On-Chain%20Fraud%20Detection%20and%20Regulatory%20Reporting.md) — Graph Neural Networks (GNNs), anomaly detection, and automated SAR/STR generation.
* [SET 9_ Technical & Legal Architecture Framework_ Automated Crypto-Crime Recovery Pipeline (India).md](file:///a:/SIH/RESEARCH/SET%209_%20Technical%20%26%20Legal%20Architecture%20Framework_%20Automated%20Crypto-Crime%20Recovery%20Pipeline%20(India).md) — Legal workflows, NCRP/SAHYOG integration, Indian CrPC/BNSS evidence rules, and court affidavits.
* [SET 10_ Technical Architecture Strategy_ Automated Crypto-Tracing and LEA Integration Pipeline.md](file:///a:/SIH/RESEARCH/SET%2010_%20Technical%20Architecture%20Strategy_%20Automated%20Crypto-Tracing%20and%20LEA%20Integration%20Pipeline.md) — End-to-end technical strategy and LEA integration lifecycle.

#### SIH Winning Resources & Competitive Edge (`a:/SIH/WINNING_RESOURCES/`):
* [CATALOG.md](file:///a:/SIH/WINNING_RESOURCES/CATALOG.md) — 42+ verified winning SIH projects with live repos and architectures.
* [SIH_WINNING_PPT_BLUEPRINT.md](file:///a:/SIH/WINNING_RESOURCES/SIH_WINNING_PPT_BLUEPRINT.md) — 8-slide champion presentation layout and jury scoring criteria.
* [JURY_QA_DEFENSE_PLAYBOOK.md](file:///a:/SIH/WINNING_RESOURCES/JURY_QA_DEFENSE_PLAYBOOK.md) — Jury defense scripts, counter-arguments, and live demo strategies.

---

### 3. Repository Structure & Multi-User Access Rules

This repository serves a team of **6 engineers**. The structure separates personal working spaces from shared architectural components:

```
a:/SIH/
├── <MEMBER_NAME>/             # Personal user workspace for drafts, tests & isolated prototypes
│   ├── HAFIZ/                 # Member 1 personal workspace (e.g., D1_alchemy_monitor/)
│   ├── MEMBER_2/              # Member 2 personal workspace
│   ├── MEMBER_3/              # Member 3 personal workspace
│   ├── MEMBER_4/              # Member 4 personal workspace
│   ├── MEMBER_5/              # Member 5 personal workspace
│   └── MEMBER_6/              # Member 6 personal workspace
├── <STAGE_MODULES>/           # Shared production stages & architecture components
│   ├── DB/                    # Database schemas, migrations, Graph DB models (e.g., Neo4j, PostgreSQL)
│   │   ├── migrations/
│   │   └── models/
│   ├── INGESTION/             # Blockchain nodes, RPC/WebSocket workers, stream consumers
│   ├── ENGINE/                # Core forensic graph traversal, taint algorithms & clustering
│   ├── API/                   # Backend API services, LEA auth, NCRP/SAHYOG endpoints
│   ├── FRONTEND/              # Web dashboard, interactive graph visualizer (Cytoscape/D3)
│   └── COMMON/                # Shared utilities, schemas, and configurations
├── RESEARCH/                  # Master technical specifications & legal blueprints (Read-Only reference)
├── WINNING_RESOURCES/         # SIH competition dossiers, PPT blueprints & jury playbooks
├── PS.txt                     # Problem Statement specification
├── GEMINI.md                  # Master Agent Context & Task Tracker (Synchronized)
├── CLAUDE.md                  # Master Agent Context & Task Tracker (Synchronized)
└── AGENT.md                   # Master Agent Context & Task Tracker (Synchronized)
```

#### Workspace Access Protocol for AI Agents:
1. **Active User's Folder (`<ACTIVE_USER>/`)**:
   * The AI has full read and write access.
   * Prototypes, experiments, scratch scripts, and exploratory code should be authored here first.
2. **Other Users' Folders (`<OTHER_USERS>/`)**:
   * **READ-ONLY by default**. The AI may inspect other members' folders to understand progress, reuse utility functions, or integrate components.
   * **DO NOT** modify, overwrite, or delete code in another member's folder unless explicitly directed by the user.
3. **Shared Stage Folders (`DB/`, `ENGINE/`, `API/`, `FRONTEND/`, etc.)**:
   * Open for collaborative implementation as features graduate from personal drafts to the core pipeline.
   * Ensure modularity, clean documentation, and non-breaking changes.

---

### 4. Automated Git Synchronization & Zero Conflict Protocol

> **MANDATORY AUTOMATED GIT BEHAVIOR FOR ALL AGENTS:**
> 1. **At the Start of Every Conversation / Session:**
>    * The AI **MUST immediately run `git pull`** (e.g. `git pull --rebase` or `git pull`) before taking any action or writing code. This guarantees the workspace has the freshest commits, branches, and task updates from all 6 team members.
> 2. **At Milestone Completion / End of Conversation:**
>    * Whenever a unit of work is completed, task trackers are updated, or a milestone is reached, the AI **MUST automatically stage changes, commit with a descriptive message, and run `git push`** so teammates and subsequent AI sessions stay immediately in sync without manual user intervention.
> 3. **Proactive Zero Merge Conflict Strategy:**
>    * Strive for zero merge conflicts by keeping isolated prototypes strictly inside `<MEMBER_NAME>/` and pulling frequently before making modifications to shared stage modules (`DB/`, `ENGINE/`, `API/`, etc.).
> 4. **User Escalation on Merge Conflicts:**
>    * If any merge conflict occurs (e.g. during `git pull` or rebase), the AI **MUST NEVER force-push, drop remote commits, or guess resolutions blindly**.
>    * The AI **MUST immediately halt, display the conflicting files and diffs to the user, and ask the user explicitly how they want to resolve the conflict** before continuing.

---

### 5. Autonomous Task Tracking Protocol

> **MANDATORY AI BEHAVIOR:**
> Whenever the AI achieves a small milestone, starts a new task, or completes an assigned task, **the AI must directly update the Task Tracker below in ALL THREE FILES (`GEMINI.md`, `CLAUDE.md`, `AGENT.md`)**.
> Keep the status updated automatically without waiting for explicit prompt instructions.

---

### 6. Team Task Board & Milestones

---

#### Member 1: Hafiz (`HAFIZ/`)
* **Role / Focus**: Core Architecture, Ingestion & Blockchain Monitoring
* **✅ Tasks Done (Completed)**:
  * [x] Draft 1: Built `D1_alchemy_monitor` (Flask + Alchemy JSON-RPC & Notify API).
  * [x] Integrated real-time wallet tracking (balances, token balances, transaction history).
  * [x] Added webhook configuration and event receiver for address activity across 6 EVM networks.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Evaluating database schemas for caching transaction subgraphs and wallet profiles.
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Implement automated VASP deposit address sweep detection heuristic (refer to `RESEARCH/SET 7`).
  * [ ] Connect Alchemy webhook events to backend message queue for asynchronous analysis.

---

#### Member 2: [Assign Name] (`MEMBER_2/`)
* **Role / Focus**: Graph Data Modeling & Database Pipeline (`DB/`)
* **✅ Tasks Done (Completed)**:
  * [x] Initial repository structure and research review.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Designing Graph Database schema (Neo4j / Memgraph) for entities, addresses, transactions, and VASP nodes.
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Write database initialization scripts and migration handlers under `DB/`.
  * [ ] Implement high-speed bulk ingestion schema for multi-hop graph querying.

---

#### Member 3: [Assign Name] (`MEMBER_3/`)
* **Role / Focus**: Forensics Engine, Taint Analysis & Clustering (`ENGINE/`)
* **✅ Tasks Done (Completed)**:
  * [x] Reviewed algorithmic specifications in `RESEARCH/SET 2` and `RESEARCH/SET 3`.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Designing traversal algorithm (BFS/DFS with pruning) for multi-hop transaction trails.
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Implement Taint Propagation models (FIFO, Poison, Haircut).
  * [ ] Build address clustering heuristics (co-spend, deposit reuse, change detection).

---

#### Member 4: [Assign Name] (`MEMBER_4/`)
* **Role / Focus**: Cross-Chain & De-Anonymization Logic (`ENGINE/`)
* **✅ Tasks Done (Completed)**:
  * [x] Studied bridge and privacy protocol specs in `RESEARCH/SET 4` and `RESEARCH/SET 5`.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Mapping popular cross-chain bridge contracts (Polygon PoS, Arbitrum Bridge, Hop, Stargate).
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Implement bridge deposit/mint event correlation logic.
  * [ ] Build heuristic detection for privacy protocols (Tornado Cash pool interaction patterns).

---

#### Member 5: [Assign Name] (`MEMBER_5/`)
* **Role / Focus**: Backend API & LEA Integration (`API/`)
* **✅ Tasks Done (Completed)**:
  * [x] Analyzed Indian LEA integration requirements in `RESEARCH/SET 9` and `RESEARCH/SET 10`.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Scaffolding FastAPI / Express backend service for case management and investigator queries.
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Implement Section 65B compliant automated PDF/JSON investigation report generator.
  * [ ] Build mock ingestion endpoints for NCRP / SAHYOG complaint payloads.

---

#### Member 6: [Assign Name] (`MEMBER_6/`)
* **Role / Focus**: Frontend Dashboard & Forensic Visualization (`FRONTEND/`)
* **✅ Tasks Done (Completed)**:
  * [x] Reviewed UI requirements and winning presentation guidelines in `WINNING_RESOURCES/`.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Selecting and prototyping interactive graph visualization library (Cytoscape.js / D3-force).
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Build victim report intake interface with real-time fund-flow graph animation.
  * [ ] Create VASP attribution badge and LEA action panel (Freeze Request / FIR Dossier export).

---

### 7. Golden Guidelines for Any AI Agent Working Here
1. **Sync All Three Instruction Files**: Every modification to `GEMINI.md` must be identically copied to `CLAUDE.md` and `AGENT.md`.
2. **Automated Git Sync**: Always pull at the start of a conversation to ingest teammates' work; always commit & push after completing milestones.
3. **Zero Conflict & Escalation**: Proactively prevent merge conflicts by isolating draft code. If a conflict ever arises, never resolve blindly—stop and ask the user.
4. **Consult Research First**: Always ground your logic on the 10 Technical Blueprint sets in `RESEARCH/`.
5. **Respect User Boundaries**: Write into the active member's directory freely. Treat other members' folders as read-only references unless granted explicit permission.
6. **Autonomous Milestones**: Keep the Task Board up-to-date after completing meaningful units of work.
