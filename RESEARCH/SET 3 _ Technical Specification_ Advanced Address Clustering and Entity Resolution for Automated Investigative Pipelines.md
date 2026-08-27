### Technical Specification: Advanced Address Clustering and Entity Resolution for Automated Investigative Pipelines

**DOCUMENT OBJECTIVE:**  This specification defines the architectural logic for a multi-chain address clustering engine designed for seamless integration into Indian Law Enforcement systems, specifically the National Cyber Crime Reporting Portal (NCRP) and the SAHYOG platform. By converting fragmented node-level data into entity-level intelligence, this pipeline automates the generation of court-ready evidence and mitigates investigative alert fatigue. All heuristics and methodologies are current as of the 2026 forensic baseline.

##### 1\. The Strategic Role of Entity Resolution in Cybercrime Automation

In the high-stakes environment of state-level cybercrime response, raw ledger transparency is insufficient. The fundamental analytical mandate of this pipeline is to resolve thousands of pseudonymous, fragmented addresses into coherent clusters. Entity-level resolution is the non-negotiable prerequisite for "real-time" tracing in legal contexts; it transforms a chaotic graph of transactions into an actionable map of criminal infrastructure. By automating the identification of Virtual Asset Service Providers (VASPs) and illicit consolidation hubs, the engine reduces "alert fatigue" for human analysts and allows the NCRP/SAHYOG systems to prioritize high-impact targets. This transformation of raw transparency into structured intelligence provides the baseline for the structural rules applied in UTXO environments.

##### 2\. UTXO Logic: Multi-Input and Change Detection Heuristics

Unspent Transaction Output (UTXO) chains, such as Bitcoin, provide high-conviction forensic signals due to the immutable nature of "coin consumption." However, the engine must balance high-recall clustering with the inherent risk of "over-clustering," which creates significant liability in a courtroom.**Rule Definition for Multi-Input Heuristics (MIH/CIOH):**  The foundational rule for address grouping is the common-input-ownership heuristic.

* **The Rule:**  If Transaction  $T$  consumes Input UTXOs  $\\{i\_1, i\_2, \\dots, i\_m\\}$ , then all addresses in  $\\{i\_1, i\_2, \\dots, i\_m\\}$  belong to Entity  $E$ .  
* **Performance Metric:**  While highly effective at scale, forensic studies from full service-level recovery experiments show a precision of 0.36 and a recall of 0.44. These figures underscore the necessity for supplementary verification.**The Zhao Heuristic Models for Change Detection:**  The pipeline identifies "shadow" change addresses (funds returned to the sender) using two scenarios:  
1. **Scenario 1 (New Address):**  An output is identified as change if it is the only newly generated address in the output set with zero prior ledger history.  
2. **Scenario 2 (Relational Criteria):**  If all output addresses have history, output  $a$  is identified as change if:  $$\\text{Value}(a) \< \\min\_{k} \\text{Value}(i\_k) \\quad \\text{and} \\quad a \= \\arg\\min\_{o \\in O} \\text{Value}(o)$$  
* **Logic Gate Requirement:**  To prevent false positives, the engine must abstain from One-Time Change Detection if more than exactly one output survives the structural filters.**Change vs. Forwarding Identification:**  The following table differentiates self-directed loops from transient "forwarding" conduits.| Dimension | Change Addresses | Intermediary Forwarding Addresses || \------ | \------ | \------ || **On-Chain History** | Initially zero; subsequently co-spent in MIH clusters. | Transient; typically exactly 1 incoming and 1 outgoing transaction. || **Output Split Ratio** | Frequently contains the majority value in automated peel chains. | Sweeps \~100% of value forward (minus fee). || **Script Type Alignment** | Strictly matches input script type (e.g., P2WPKH). | Often changes script types across swap protocols. || **Decimal Precision** | High precision (\>7 places) due to exact fee subtraction. | Matches incoming precision or rounds post-fee. || **Topological Integration** | Loops back and integrates into parent wallet cluster. | Acts as a linear, transient link in an open chain. |

##### 3\. Account-Model Resolution: EVM and TRON Behavioral Fingerprinting

The Ethereum Virtual Machine (EVM) model necessitates a shift from co-spending logic to gas-funding trails. Forensic investigations on account-based networks rely on the fact that no state-changing action is possible without a native token gas payment.**Gas-Funding Heuristic Specification:**  The engine traces the initial native token transfer to any newly generated non-custodial address backward to the parent funding wallet.

* **Efficacy:**  This heuristic achieves a 40% success rate in identifying coordinated fraud specifically where direct co-spending evidence is unavailable. Accuracy increases to 75% when paired with transaction nonce correlation.**Mapping Adversarial EVM Vectors:**  The following "Structural Detection Rules" identify automated malicious activity:  
* **Proxy Trap:**   $\\text{Revert}(T) \\land \\text{Call}(T, \\text{onERC1155Received}) \\land \\text{Status} \= \\text{Failed}$ .  
* **Balance Drain:**   $\\text{GasPrice}(\\text{Drain}) \> \\text{GasPrice}(\\text{Settlement}) \\land \\text{Block}\_{\\text{diff}} \\le 5$ .  
* **Allowance Revoke:**  Pairs transferFrom failures with approval-to-zero transactions in the same block.  
* **Nonce Bump Vector:**  Detects incrementNonce() calls within 5 blocks of a failed settlement to front-run and invalidate signed orders.**Impact of ERC-4337 and Account Abstraction:**  Adversaries use "Paymaster" contracts to sponsor gas, deliberately masking the parent-child funding trail. The forensic countermeasure requires trace-level parsing of EntryPoint logs to reconstruct the bundler's aggregated UserOperations, unmasking the underlying sponsor.

##### 4\. Adversarial Attacks on Clustering: Detection and Mitigation

The "Adversarial Layer" uses protocols designed to induce "cluster collapse," forcing engines to merge unrelated users. A "confidently wrong" cluster is a liability under international legal standards.**CoinJoin and PayJoin Detection:**

* **Wasabi (WCDH):**  Detects via machine learning and threshold heuristics with \>99% accuracy.  
* **Samourai Whirlpool:**  Employs a deterministic  **breadth-first search (BFS) from genesis mixes**  to traverse remix chains with 100% accuracy.  
* **PayJoin (BIP-78):**  A steganographic tactic that contributes inputs from both sender and receiver to deliberately falsify the MIH.**Residual Forensic Weaknesses:**  Investigative success often relies on the "most common user error":  **Post-Mix Consolidation** . When a user co-spends multiple mixed outputs in a single downstream transaction, they trigger the MIH and relink all isolated paths. Other errors include Unequal Change Tracking (subset-sum analysis) and Taint Elimination failures where inputs are linked to KYC-verified accounts.

##### 5\. Confidence Scoring and Evidentiary Frameworks

To meet the  *Daubert*  standard for scientific evidence, clustering inferences must report a verified error rate. This is quantified using the  **Boltzmann Thermodynamic Model** .

* **Entropy Formula:**   $E \= \\log\_2(N)$ , where  $N$  is the number of valid interpretations of a transaction's input-output mapping.  
* **Link Probability Matrix (LPM):**  In a perfect CoinJoin, the matrix establishes mathematical ambiguity where  $P(i, o) \= 1/k$ .**Consensus Scoring Implementation:**  The system assigns weights to signals to generate a final attribution score. This scoring directly dictates the evidentiary label (e.g., "Well-Established").| Signal Source | Score | Description || \------ | \------ | \------ || **Direct Change Detection** | 100 | Absolute address reuse (direct self-transfer). || **Multi-Input Change Detection** | 50 | Output matches an existing established cluster. || **One-Time Change Detection** | Variable | Isolated profiling (zero history, script match). |

**Glass Box Attribution:**  As a strict requirement for legal admissibility, the pipeline must provide full transparency of every signal that drove an inference. Every clustering decision must be auditable and defensible in a court of law.

##### 6\. Entity Categorization: Shared Custodial Pools vs. Private Clusters

The system must distinguish between a high-volume VASP hot wallet and a coordinated criminal Sybil network.**Discriminating Feature Sequence:**

1. **Topology:**  Star-shaped (VASP) vs. Linear/Tree (Private Cluster).  
2. **Degree Centrality:**  Exchange hot wallets exhibit  $k\_{in}/k\_{out} \\gg 10^5$ .  
3. **Shannon Entropy of Values:**   $H(X) \= \-\\sum P(x\_i) \\log\_2 P(x\_i)$ . High entropy indicates a VASP; low entropy indicates automated bots.  
4. **Temporal Rhythm:**  Uniform 24/7 distribution (VASP) vs. Bursty, machine-speed execution (Private).**Coin Selection Fingerprinting:**  The engine fingerprints wallet software by analyzing selection logic. Standard wallets often use the  **Knapsack Solver**  (Satoshi-era), while institutional VASPs utilize  **Branch and Bound (BnB)**  or  **Scan-Rent-Delay (SRD)**  to optimize fees and minimize change outputs.

##### 7\. Implementation Roadmap: Minimum Heuristic Set (MHS)

To fulfill NCRP/SAHYOG goals with maximum precision, the following heuristics are prioritized:

1. **Rank 1: Multi-Input (CIOH) with CoinJoin Filtering.**  (Baseline attribution; requires BFS-based Samourai and ML-based Wasabi detectors to prevent contamination).  
2. **Rank 2: Zhao Scenario 1 Change Detection.**  (Targets direct self-transfer loops).  
3. **Rank 3: Gas-Funding Trail (EVM).**  (Primary fallback link for account-based fraud).  
4. **Rank 4: Common Public Key Reuse.**  (Indisputable cross-chain anchor).**Forensic Standard Directive:**  As of the current market baseline (May/July/November 2026), all findings generated by the automated pipeline must be categorized according to the following directive:  
* **Well-Established:**  High-confidence multi-engine consensus (Score \>90).  
* **Contested:**  Heuristic conflict identified (e.g., evidence of PayJoin or potential over-clustering).  
* **Single-Source-Unverified:**  Inference driven by a single heuristic without supporting behavioral markers.

