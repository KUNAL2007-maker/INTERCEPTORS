### Technical Architecture Strategy: Automated Crypto-Tracing and LEA Integration Pipeline

#### 1\. Executive Statement of Source Coverage and Document Integrity

In the design of high-stakes systems for Law Enforcement Agencies (LEAs), the architectural foundation must rest upon "honest coverage." When constructing systems for criminal investigations and digital forensics, reliance on "hallucinated APIs" or unverified technical specifications is a catastrophic risk to legal admissibility and operational security. This document prioritizes architectural integrity by strictly distinguishing between grounded technical frameworks and necessary design assumptions.A rigorous gap analysis reveals that while the provided 'Source Context' provides a deep technical foundation for  **asynchronous processing (RabbitMQ, SQS)**  and  **sequential hybrid consensus frameworks (CTIB)** , the sources are  **entirely silent**  on the specific public data models or programmatic API specifications for the National Cyber Crime Reporting Portal (NCRP) and SAHYOG. Consequently, this architecture mandates a "Clean Adapter Layer" to bridge these documented frameworks with undocumented government interfaces.

##### Source Grounding vs. Design Gaps

Documented Fact (Source Grounded),Documentation Gap (Architectural Assumption)  
STIX 2.1 Canonicalization:  Deterministic representation of threat intelligence.,SAHYOG Statutory Basis:  Specific legal mandates and data retention requirements.  
Hybrid PoS-PoW Anchoring:  Sequential workflow for content validation and temporal proof.,NCRP Onboarding Specifications:  Explicit API documentation for portal integration.  
Message Queue Buffering:  Methods for handling spiky traffic and ensuring resilience.,"Indian Government API Conventions:  Specific authentication (OAuth, JWT) or gateway requirements."  
The absence of public specifications necessitates a "Clean Adapter Layer" design, ensuring the core forensic pipeline remains decoupled from the volatile requirements of external government gateways.

#### 2\. Queueing and Scale: Architectural Patterns for Spiky Complaint Arrival

Strategic decoupling of the complaint-ingestion layer from the intensive on-chain tracing layer is a non-negotiable requirement to ensure system resilience during high-volume fraud events, such as large-scale "rug pulls." This architecture utilizes a message queue as the  **"boundary of isolation"**  between a victim’s report and the execution of the trace-job.

##### Asynchronous Processing and Resilience

By evaluating the advantages of asynchronous processing, we leverage the message queue to absorb unpredictable demand spikes. This decoupling ensures that the ingestion service remains available to victims even if the downstream tracing engine is at maximum capacity. The queue acts as a buffer, preventing the "freezing" of the ingestion layer during long-running forensic computations.

##### Architectural Mandate: Work Queues and Priority Patterns

The architecture mandates a  **Point-to-Point (Work Queue)**  model to distribute trace loads across a pool of forensic workers. To ensure time-critical complaints—specifically those within the "Golden Hour" for asset recovery—bypass bulk processing, the system  **must**  implement  **Priority Queues** .

##### Message Broker Comparison for LEA Environments

Feature,RabbitMQ,Amazon SQS,ActiveMQ  
Type,Open-source broker,Fully managed service,Open-source broker  
Throughput,10k–50k msg/s,"High (Standard), Ltd (FIFO)",Moderate  
Best Use Case,Heterogeneous LEA environments,AWS-native deployments,Enterprise multi-protocol

##### Backpressure Strategy

To prevent system failure during extreme overload, this architecture enforces  **Consumer-level backpressure** . In this pipeline, the "Consumers" are the  **Blockchain Tracing Workers** . These workers shall pull messages from the queue at their own pace. If workers are pegged at 100% CPU utilization, the queue must hold the "Victim Report" messages until resources are freed, preventing a cascading system crash.

#### 3\. Interchange Standards: Representing Intelligence via STIX 2.1

Standardized data formats are required to ensure automated reports are machine-consumable by both investigators and Virtual Asset Service Providers (VASPs).

##### Implementation of STIX 2.1

The architecture utilizes  **STIX 2.1**  for intelligence representation. Integration requires a process of  **Canonicalization** —ensuring the JSON representation is consistent across all nodes—followed by  **SHA-256 Hashing**  to create deterministic identifiers (feed\_hash).

##### Scalability vs. Integrity: The CTIB Model

To balance storage efficiency with judicial integrity, the system adopts a hybrid approach:

* **Off-chain:**  The full STIX bundle (transaction graphs, victim statements) is stored in a scalable off-chain environment.  
* **On-chain:**  Only the feed\_hash and integrity-critical evidence are stored on the blockchain to prevent ledger bloat while providing a tamper-proof anchor.

##### Mandated On-Chain Evidence Fields

The Smart Contract ABI  **must**  support the following fields exactly as identified in the CTIB prototype:

* cti\_id: Unique identifier for the submission.  
* feed\_hash: Cryptographic fingerprint of the report.  
* approvals: Count of validator endorsements from the PoS layer.  
* published status: Confirmation of successful transition through both consensus gates.  
* pow\_nonce: The nonce satisfying the difficulty target.  
* pow\_hash: The final anchored hash.  
* pow\_attempts: Count of computational attempts (audit metric).

#### 4\. Integrity and Auditability: The Sequential Hybrid Consensus Model

"Temporal Anchoring" is a strategic necessity for court-ready reports, providing verifiable proof that evidence was not tampered with post-collection.

##### The Sequential PoS → PoW Workflow

The architecture mandates a two-gate consensus model:

1. **Proof of Stake (PoS) Layer (Content Validation):**  A committee of expert investigators reviews the report. This layer addresses  **Content Validation**  (quality and relevance).  
2. **Proof of Work (PoW) Layer (Temporal Anchoring):**  Once approved, the report is "anchored" to the blockchain via PoW. This layer provides a  **Temporal Proof** , binding the decision to a verifiable time-point.

##### Resistance to Majority (51%) Attacks

Security is defined by the probability  $P\_{CTIB} \= r\_{PoS} \\times r\_{PoW}$ . Because an adversary must bypass "two gates," they require  **$\\approx 71.4\\%**$  **control**  in both the PoS validator pool and the PoW hash-power pool to compromise the system. To further mitigate hash-power dominance, the architecture implements the  **$\\alpha**$  **\-constrained effective hash-power model** , limiting computational influence unless backed by an equivalent economic stake.

#### 5\. Operational Security (OPSEC): Mitigating Query Leakage

Searching for a victim’s address on public blockchain explorers constitutes "Query Leakage," potentially alerting suspects to an active investigation.

##### Mitigation Mandates

The source context identifies this as a  **Critical Design Gap** . To mitigate this, the architecture mandates:

* **On-Premise Stack with Full Nodes:**  The architecture  **must**  include a self-hosted  **Full Node**  (Ethereum/Bitcoin) within the internal LEA network. All queries shall be directed to local data, ensuring no lookup traffic ever leaves the protected LEA infrastructure.  
* **Anonymized Audit Logs:**  Utilizing CTIB patterns, the system shall record hashes and signatures for admissibility while maintaining  **Validator Anonymity**  within the committee, preventing the exposure of specific investigator identities.

#### 6\. Access Control and Multi-Tenancy: The RBAC/ABAC Framework

The architecture mandates a strictly partitioned RBAC/ABAC model to enforce "Need-to-Know" partitioning across multi-agency investigations.

##### Role Taxonomy

1. **Contributor:**  (Victim/Reporting Officer) Authorized for raw data submission.  
2. **Validator:**  (Expert Investigator) Authorized for PoS Committee review.  
3. **Consumer:**  (Court/VASP) Authorized to view final, anchored reports.

##### System Constraint: Four-Eyes Approval

Sensitive actions, such as finalizing a court-ready export, are subject to a  **"Four-Eyes" System Constraint** . This is enforced by the smart contract’s  **3-of-5 committee threshold state machine** , ensuring no single investigator can unilaterally validate or suppress a report.

#### 7\. Investigator-Facing Output: Graph Layouts and Court-Ready Exports

The strategic value of "Narrative-Visual Synthesis" lies in transforming complex on-chain data into a format interpretable by judicial authorities.

##### Mandatory Components for Court-Ready Records

* cti\_id: Unique tracking ID.  
* feed\_hash: Integrity check.  
* published status: Verification of consensus completion.  
* pow\_hash: The final temporal anchor.

##### Visualization Constraints and Component Selection

**Critical Design Gap:**  The sources are silent on specific open-source graph library licenses (e.g., D3, Cytoscape). While "Graph layouts for fund flow" are a requirement, the implementation team must select a library that supports the STIX 2.1 JSON schemas while adhering to LEA procurement and security audit standards.

#### 8\. Indian Government Integration Constraints (NCRP/SAHYOG Adapter Layer)

Integration with restricted government portals requires a "Clean Adapter Layer" designed around  **Assumed Contracts** .

##### The Adapter Interface Mandate

The Adapter Layer shall act as a  **Schema Mapping Engine** , converting STIX 2.1 "Indicator" and "Sighting" objects into the (assumed) JSON/XML formats required by NCRP.**Mandatory Security Features:**

* **Idempotency:**  The interface must use REST hooks with  **Idempotency Keys**  (derived from the feed\_hash). This is a system-critical requirement to prevent the double-reporting of complaints to NCRP during network retries.  
* **Authentication Proxy:**  Use a Web3 JSON-RPC model as a proxy for a secure API gateway, ensuring all communications with government portals are signed and verifiable.This architecture transforms a raw wallet address into a court-ready, anchored, and validated forensic report, ensuring the "Golden Hour" of recovery is met with resilient, automated precision.

