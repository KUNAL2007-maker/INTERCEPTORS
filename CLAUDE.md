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
│   ├── KUNAL/                 # Kunal personal workspace
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
│   ├── AUTH_RBAC_ABAC/        # Shared Auth, RBAC & ABAC Access Control module
│   └── COMMON/                # Shared utilities, schemas, and configurations
├── RESEARCH/                  # Master technical specifications & legal blueprints (Read-Only reference)
├── WINNING_RESOURCES/         # SIH competition dossiers, PPT blueprints & jury playbooks
├── PS.txt                     # Problem Statement specification
├── GEMINI.md                  # Master Agent Context & Task Tracker (Synchronized)
├── CLAUDE.md                  # Master Agent Context & Task Tracker (Synchronized)
└── AGENT.md                   # Master Agent Context & Task Tracker (Synchronized)
```

#### Active User Identification Protocol (`.active_user` in `.gitignore`):
* **Local Identity File**: Each developer's machine stores their personal username in a local `.active_user` file at the repository root (`a:/SIH/.active_user`).
* **Gitignored by Design**: `.active_user` is listed in `.gitignore` so one teammate's local identity is **never** committed or pushed to remote.
* **Initial Setup Prompt**: Whenever an AI starts a session and `.active_user` is missing or empty, **the AI MUST halt and ask the user initially**:
  > *"Welcome! Which team member are you? (e.g., HAFIZ, MEMBER_2, etc.)"*
  Once the user answers, the AI creates `.active_user` with that name.
* **AI Routing & Boundaries**:
  1. The AI treats `<ACTIVE_USER>/` as the sole personal folder with full read/write permissions.
  2. The AI maps all milestone tracking to that member's section on the Team Task Board in Section 6.
  3. Folders belonging to other teammates remain strictly **READ-ONLY** by default.

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

### 4. Automated Git Synchronization & Zero Data Loss Protocol

> **MANDATORY AUTOMATED GIT BEHAVIOR & SAFETY GATES FOR ALL AGENTS:**
>
> 1. **Live Remote Check — `git fetch origin` then `git status`:**
>    * Plain `git status` is strictly local and does not contact GitHub. Therefore, at the start of every session or before making sync decisions, the AI **MUST run `git fetch origin` first, followed by `git status`**.
>    * This reveals the true live remote state (e.g., whether local is behind, diverged, or up-to-date with teammates on GitHub) without touching working files.
>    * If uncommitted or unstaged changes exist locally, the AI **MUST NOT pull blindly** (which risks overwriting work). Instead, commit the local changes first (`git add .`, `git commit -m "wip: save local progress before sync"`) or ask the user for guidance.
> 2. **Pull at the Start of Every Session:**
>    * Once local state is cleanly committed, run `git pull` (or `git pull --rebase`) to ingest fresh commits from teammates.
> 3. **Push Automatically on Milestone Completion:**
>    * Whenever a unit of work is completed, task trackers are updated, or a milestone is reached, the AI **MUST automatically stage changes, commit with a descriptive message, and run `git push origin main`** so teammates stay in sync.
> 4. **STRICT BAN ON DANGEROUS GIT COMMANDS (ZERO TOLERANCE):**
>    * 🚫 **NEVER RUN `git reset --hard`** (permanently wipes uncommitted work).
>    * 🚫 **NEVER RUN `git push --force` or `-f`** (erases remote history and teammates' commits).
>    * 🚫 **NEVER RUN `git clean -fd`** (deletes untracked drafts and files).
>    * 🚫 **NEVER RUN `git checkout -- .` or `git restore .`** (discards local changes).
>    * 🚫 **NEVER RUN `git stash drop`** without explicit user instruction.
> 5. **User Escalation on Ambiguity & Merge Conflicts:**
>    * If a merge conflict occurs, or if Git reports ambiguous state (untracked overlaps, divergent branches), the AI **MUST IMMEDIATELY HALT**.
>    * Display the exact conflicting files, state, and diff to the user.
>    * Ask the user explicitly how they wish to resolve it before executing any resolution commands.

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
  * [x] Enhanced D1 UI with beginner guide, 1-click real test addresses, plain-English case assessment, and "Follow the Money" hop buttons.
  * [x] Authored comprehensive beginner foundations & multi-chain forensics guide (`BLOCKCHAIN_FOUNDATIONS_AND_MULTI_CHAIN_GUIDE.md`).
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Evaluating database schemas for caching transaction subgraphs and wallet profiles.
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Implement automated VASP deposit address sweep detection heuristic (refer to `RESEARCH/SET 7`).
  * [ ] Connect Alchemy webhook events to backend message queue for asynchronous analysis.

---

#### Member 2: Akshay (`DATABASE/`)
* **Role / Focus**: Graph Data Modeling & Database Pipeline (`DB/`, `DATABASE/`)
* **✅ Tasks Done (Completed)**:
  * [x] Initial repository structure and research review.
  * [x] Created database backend, schema definitions, and frontend structure.
  * [x] Created PostgreSQL database initialization scripts (`db/schema.sql`, `db/seed.sql`, `db/init_db.py`).
  * [x] Connected live backend API (`app.py`) to PostgreSQL database.
* **🔄 Tasks Working On (In Progress)**:
  * [ ] Designing Graph Database schema (Neo4j / Memgraph) for entities, addresses, transactions, and VASP nodes.
* **📋 Tasks to be Started (Assigned / Backlog)**:
  * [ ] Implement high-speed bulk ingestion schema for multi-hop graph querying.

---

#### Member 3: Kunal (`KUNAL/`)
* **Role / Focus**: Forensics Engine, Access Control (RBAC/ABAC) & Clustering (`ENGINE/`, `AUTH_RBAC_ABAC/`, `FRONTEND/`)
* **✅ Tasks Done (Completed)**:
  * [x] Reviewed algorithmic specifications in `RESEARCH/SET 2` and `RESEARCH/SET 3`.
  * [x] Consolidated complete 7-role RBAC & ABAC access control engine into single self-contained `AUTH_RBAC_ABAC/` module with dedicated frontend, backend API, 35 automated tests, and documentation.
  * [x] Merged `Chain_Traicer` multi-chain forensic tracing engine into `FRONTEND/` with PostgreSQL persistence (purged Firebase), 7-role RBAC & 7-policy ABAC, 1930/NCRP ingestion gateway, and Sec 94 BNSS freeze notices.
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
2. **Active User Identity**: Check `.active_user` on startup. If missing, ask the user their member name and save it to `.active_user` (which is gitignored).
3. **Automated Git Sync with Safety Gate**: Always run `git fetch origin` then `git status` first to inspect true remote state, commit WIP before pulling, pull at session start, and push on milestone completion.
4. **Strict Ban on Dangerous Commands**: Absolutely no `git reset --hard`, `git push --force`, `git clean -fd`, or `git restore .`.
5. **Escalate Conflicts & Ambiguity**: If any merge conflict or ambiguous branch state arises, immediately stop and ask the user.
6. **Consult Research First**: Always ground your logic on the 10 Technical Blueprint sets in `RESEARCH/`.
7. **Respect User Boundaries**: Write into the active member's directory freely. Treat other members' folders as read-only references unless granted explicit permission.
8. **Autonomous Milestones**: Keep the Task Board up-to-date after completing meaningful units of work.
