### Technical Architecture for VASP Infrastructure Identification and Attribution

The strategic classification of Virtual Asset Service Providers (VASPs) by financial function—Custodian, V2F-Exchange, V2V-Exchange, Payment, or Issuance—is a prerequisite for determining the legal and technical recovery vectors available to Indian Law Enforcement Agencies (LEAs). Identifying whether an entity is a custodial broker or a non-custodial money exchange dictates the specific evidentiary weight of on-chain signals and the jurisdictional feasibility of "freeze-and-seize" orders. This architecture provides the technical intelligence framework required to transition from raw blockchain data to actionable attribution.

#### 1\. VASP Functional Taxonomy and Operational Archetypes

To optimize the SAHYOG/NCRP pipeline, LEAs must distinguish between entities that facilitate liquidity and those that safeguard private keys. The following taxonomy, synthesized from  *FMA (2021)*  and  *Saggese et al.* , defines the operational boundaries and technical footprints of these entities.| VASP Service Category | Description | Legal Mandate (FMA 2021\) | On-Chain Footprint || \------ | \------ | \------ | \------ || **Custodian** | Safekeeping of private cryptographic keys to hold, store, and transfer VAs. | High fiduciary duty; "Services to safeguard private cryptographic keys." | Multi-layered wallet structures; High-value cold storage clusters. || **V2F-Exchange** | Bridges virtual assets to fiat currency systems. | "Exchanging of virtual assets into fiat currencies and vice versa." | High-velocity interactions with commercial banking fiat rails. || **V2V-Exchange** | Facilitates swaps between different virtual asset types. | "Exchanging of one or more virtual assets between one another." | Cross-ledger flows; high interaction with internal VASP order books. || **Payment** | Executes transfers of virtual assets on behalf of customers. | "Transferring of virtual assets." | "Pass-through" logic; high-frequency, low-latency transaction bursts. || **Issuance** | Services related to the initial sale or creation of assets. | "Provision of financial services for the issuance and selling of VAs." | Genesis distribution; bulk transfers from minting addresses. |  
VASP operational archetypes are further divided into three groups based on their internal ledger visibility.  **Group 1 (Money Exchanges)**  often settle directly on-chain, providing high visibility for real-time monitoring. Conversely,  **Group 2 (Brokers)**  and  **Group 3 (Brokers with Trading Platforms)**  utilize private internal limit order books. In these custodial models, trades are "off-chain" accounting events; on-chain movement is only triggered during external withdrawals or institutional "sweeps," creating a visibility gap in the NCRP pipeline until funds exit the VASP’s private environment.This functional classification allows investigators to select specific technical signals for identifying the underlying institutional infrastructure.

#### 2\. Testable Signals for Deposit and Sweep Identification

Institutional infrastructure is distinguished from personal, self-hosted wallets by detectable behavioral patterns and high-volume clustering. Automated attribution engines utilize these "Testable Signals" to map the movement of funds from victim wallets to institutional collector hubs.

##### Clustering Heuristics and Parameters

1. **Multi-Input Address Clustering:**  This heuristic assumes all addresses providing inputs to a single transaction are controlled by a single entity. It requires a valid "ScriptSig" for each input. Excluding CoinJoin/mixing transactions, this signal achieves a 100% accuracy rate ( *Androulaki et al.* ).  
2. **Change Address Clustering (Zhao et al. Variation):**  This identifies "shadow addresses" used for returning change. Per the  *BACH (De Lucci et al.)*  framework, an address  $a$  is flagged as a change address if it meets one of two logic branches (Six-Condition Logic):  
3. **New Address Logic:**  (1)  $Coinbase \\notin Input(t)$ ; (2) Address  $a$  is in output and there is at least one other output; (3)  $a$  is the only output address never before seen on the blockchain.  
4. **Amount-Based Logic:**  If no new address exists,  $a$  is flagged if: (4) It is not a coinbase transaction; (5)  $a.value \< an.value$  for all other outputs; and (6)  $a.value \<$  all input values.  
5. **Coinbase Address Clustering:**  Identifies mining pool distribution. To prevent false positives from decentralized/P2P pools (e.g., P2Pool/Eligius), a threshold of  $\\gamma=10$  is applied. If output addresses exceed 10, the addresses are not clustered as a single entity ( *De Lucci et al.* ).  
6. **Internal Transfer Patterns:**  Institutional "Sweep-to-Hot-Wallet" behavior involves moving funds from temporary user-specific deposit addresses to central "Collector Wallets." In Ethereum, this often manifests via smart-contract event logs, whereas Bitcoin relies on systematic UTXO reuse or "peeling" ( *Saggese et al.* ).

##### Cluster Homogeneity Validation

To ensure evidentiary reliability, the pipeline calculates cluster homogeneity using the  **Gini Impurity Index**  ( $Gini(f)$ ):$$Gini(f) \= 1 \- \\sum\_{i=1}^{m} f(i)^2$$Where  $m$  is the number of distinct tags and  $f(i)$  is the fraction of addresses per tag. A  **High Gini Score**  indicates "contested labels" (mixed tags), flagging the cluster for manual forensic verification or a TR:Now/IVMS-101 query.This data provides the foundation for the standardized decision flow used in automated attribution reporting.

#### 3\. The Ordered Decision Procedure for VASP Attribution

To meet the evidentiary standards of Indian courts, investigators must follow a standardized, branch-conditioned logic flow. This ensures that the attribution of an unlabelled address is a result of reproducible forensic steps.

1. **Step 1: Ledger Type Identification:**  Discriminate between UTXO (Bitcoin-like) and Account-based (Ethereum-like) models to select the appropriate heuristic engine ( *Saggese et al.* ).  
2. **Step 2: Heuristic Clustering Application:**  Execute multi-input, change address (Zhao et al. variation), and coinbase clustering to define the address’s broader entity cluster ( *De Lucci et al.* ).  
3. **Step 3: Pattern Analysis:**  Analyze for "Peeling Chain" structures. Identify if the address is a "Peel" (destination) or part of the "Change Chain" by detecting spiral-shaped transactional flows.  
4. **Step 4: Infrastructure Role Mapping:**  Map the address role:  **Hot Wallet**  (active deposits/withdrawals),  **Collector Wallet**  (sweep destination), or  **Cold Wallet**  (low-frequency, high-security storage) ( *Saggese et al.* ).  
5. **Step 5: Directory Cross-Reference:**  Query the cluster against the  **Notabene VASP Directory**  and  **TR:Now**  gateway to match the infrastructure with a known corporate profile.This procedure ensures that every attribution report is backed by a technical audit trail.

#### 4\. Attribution Data Ecosystem and Maintenance

Address labeling is susceptible to "stale date" risks as VASPs frequently migrate hot-wallet infrastructure to mitigate security threats or institutional risk.

##### Data Sources and Coverage

* **Notabene VASP Directory:**  The primary source for counterparty reachability, covering  **2,000+ VASPs**  across  **100+ jurisdictions** . LEAs can access the  **"Sunrise Plan"**  for immediate, developer-free VASP profile identification.  
* **TagPack / Wallet Explorer:**  Historical repositories for manual attribution.  
* **Proof-of-Reserve Disclosures:**  Publicly disclosed wallet lists used for solvency validation.  
* **Coverage Baseline:**  Current global coverage is approximately  **24% for Bitcoin**  addresses and  **0.11% for Ethereum**  ( *Saggese et al.* ).

##### Maintenance Mechanics

Maintaining data freshness requires  **"Re-identification Attacks"**  and  **Manual Transactions** , where investigators interact with VASP services to tag new deposit addresses. A significant gap exists between  **Hot**  and  **Cold**  wallets; because cold wallets are strictly isolated from daily operational flows, manual tagging of deposit addresses rarely reveals the bulk of VASP-controlled funds ( *Saggese et al.* ).The emergence of shared-deposit models further complicates this ecosystem, requiring shift from address-based to memo-based attribution.

#### 5\. Discriminating Complex Entities and The Shared-Deposit Problem

Incorrectly tagging a payment processor or DEX aggregator as a VASP leads to high-risk misattribution and futile legal requests.

##### Identification Matrix

* **Genuine CEX User-Deposit:**  Identifiable via unique-per-user smart-contract collector patterns or systematic sweeps to a central VASP hub ( *Saggese et al.* ).  
* **Mining Pools:**  Distinguished by coinbase transactions with  $\\gamma \< 10$  output addresses to avoid P2Pool false positives ( *De Lucci et al.* ).  
* **Mixing/Laundering Services:**  Identified via  **"Peeling Chains"** —transactional flows that create a "spiral shape" when visualized in Sankey diagrams, where a large sum is iteratively reduced by "peels" (destinations) while the remainder moves to a new change address ( *De Lucci et al.* ).

##### The Shared-Deposit Failure Point

Modern VASPs increasingly utilize "shared-address" designs where multiple users deposit to a single address using a unique  **memo**  or  **destination tag** . This breaks the "one-address-per-user" assumption. In these cases, on-chain heuristics fail, and investigators must obtain  **IVMS-101 format**  data—the global technical standard for the Travel Rule—which contains the PII required to link a transaction to a specific beneficiary ( *Notabene* ).

#### 6\. Actionable Targets Beyond the Primary VASP

When a primary VASP is offshore or non-cooperative, the architecture identifies secondary recovery vectors.

* **Stablecoin Issuers:**  USDT/USDC issuers maintain "Freeze Capabilities" at the smart-contract level. These are vital for mitigating devaluation risk and securing funds even in non-compliant jurisdictions ( *Saggese et al.* ).  
* **Fiat Rails/E-Money Institutions:**  Many VASPs operate via  **E-money licenses**  (Directive 2009/110/EC). These institutions have lower supervisory and reporting requirements than full banks, often impacting the speed and "Legal Mandate" of data requests ( *Saggese et al.* ).  
* **Protocol Gateways (TR:Now):**  The TR:Now messaging protocol acts as a  **universal protocol gateway** , allowing LEAs to send Travel Rule requests to non-compliant VASPs. This forces the secure exchange of IVMS-101 data during the "sunrise period" of global regulation ( *Notabene* ).  
* **Embedded Supervision:**  Future pipeline automation should leverage "embedded supervision," where regulatory monitoring is built directly into the blockchain to ensure real-time compliance and solvency assessment ( *Saggese et al.* ).**Reliability Tier Summary:**  Forensic reports are tiered by reliability:  **Tier 1 (Well-Established Clusters)**  are validated by multiple heuristics and low Gini scores;  **Tier 2 (Manual Tags)**  are preliminary;  **Tier 3 (High Gini Clusters)**  indicate mixed-tag environments requiring IVMS-101 resolution through protocol gateways.

