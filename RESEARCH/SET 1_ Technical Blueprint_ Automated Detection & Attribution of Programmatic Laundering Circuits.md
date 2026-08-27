### Technical Blueprint: Automated Detection & Attribution of Programmatic Laundering Circuits

#### 1\. Executive Typology: On-Chain Signatures of Mass-Scale Fraud

The strategic imperative for modern law enforcement has shifted from the tactical pursuit of isolated scams to the systematic de-anonymization of the "industrialized" infrastructure that facilitates them. Programmatic laundering circuits represent a paradigm shift in criminal logistics, utilizing automated scripts to move millions in illicit capital across thousands of addresses with near-zero latency. By standardizing these on-chain "signatures" into machine-readable JSON schemas, we enable the automated pipeline required for the National Cyber Crime Reporting Portal (NCRP) and SAHYOG. This standardization allows the system to reconstruct the value-flow hierarchy instantly, flagging suspicious nodes before a human analyst ever opens a block explorer.

##### The Typology Catalogue

Forensic telemetry from high-velocity TRON-based USDT circuits identifies three primary functional archetypes:

1. **Mule Aggregators (L1):**  These nodes generate a high "Aggregation Signal." They function as a bottleneck for thousands of victim inflows, exhibiting a characteristic  **445x amplification ratio** . Data confirms average inflows of $2,013 are consolidated into outbound sweeps averaging $897,000.  
2. **Relay Nodes (L2-L4):**  These are the conduits of the layering phase, defined by a "Relay Profile" with a net retention rate as low as  **0.006%** . To secure high-value throughput, these nodes utilize institutional-grade key management, typically a  **2-of-3 multisig architecture** .  
3. **The Five-Layer Graph Model:**  Automated detection must index the "Machine" according to its structural hierarchy:  
4. **Feeders (L0):**  Victim pools and dedicated funder wallets.  
5. **Aggregator (L1):**  The primary consolidation point for mule networks.  
6. **Target Relay (L2):**  Centralized multisig nodes (e.g., TEkddeyN) managing high-volume flow.  
7. **Disburser (L3-L4):**  Mass-splitters routing funds to end-recipients or exit relays.  
8. **Exit (L5):**  Direct hand-offs to VASP deposit addresses.

##### Baseline Parameters: The "TEkddeyN" Circuit

The following metrics serve as the definitive parameters for detection algorithms, representing 15 months of industrialized operation:| Parameter | Metric Value | Evidentiary Significance || \------ | \------ | \------ || **Lifetime Volume** | $812,300,000 | Confirms industrialized, programmatic scaling. || **Net Retention Rate** | 0.006% | Definitive signal of relay (non-holding) behavior. || **Victim Inflow Count** | 69,591 wallets | Indicates the scale of the underlying mule network. || **Operational Lifetime** | 15 months | Demonstrates long-term infrastructure resilience. || **Control Signature** | 2-of-3 Multisig | Signals professional, non-retail key management. |  
These structural signatures are not elective; they are dictated by the underlying constraints of the blockchain protocol.

#### 2\. Structural Determinism: Protocol Mechanics vs. Criminal Fashion

Reliable automation depends on distinguishing between "structural" signals—behaviors forced by blockchain economics—and "fashionable" signals—transitory choices that criminals change to evade detection. To maintain long-term reliability, the detection pipeline must prioritize protocol-enforced mechanics.

##### Mechanical and Forced Behaviors (High Weight)

These behaviors are necessitated by TRON’s resource model and are virtually impossible to mask without increasing operational costs:

* **Just-in-Time (JIT) Energy Delegation:**  To avoid a visible staking footprint, automated circuits use JIT rentals. They borrow exactly  **64,285 energy units**  per USDT transfer, fire the transaction, and reclaim the energy in the same block cluster.  
* **Sterile "Tamper Wallet" Networks:**  High-frequency automation requires constant bandwidth. Circuits utilize "sterile" infrastructure—networks of operational bots (e.g., a  **33-wallet network** ) that maintain zero USDT balances but send sub-cent TRX "pings" to preserve account activity.

##### Economic and Fee-Driven Signals

Criminal actors utilize the TRON/USDT ecosystem due to its structural advantages: near-zero transaction fees and  **3-second settlement times** . These mechanics allow for "hop inflation," where capital is layered through 30+ hops in minutes, a feat cost-prohibitive on Ethereum (EVM) or Bitcoin.

##### Transitory Fashion (Low Weight)

These traits represent current operational choices rather than structural requirements:

* **Vanity Addresses:**  The use of suffixes like '666666' is for organizational branding.  
* **Social Proof Lag:**  The five-day delay between on-chain confirmation and Telegram channel "proof" reflects human manual social media management, not technical execution.Detection algorithms must weight JIT energy patterns and mule aggregation ratios as primary indicators, treating vanity addresses and social media activity as secondary contextual markers.

#### 3\. Counter-Forensic Deconstruction & Signal Recovery

Obfuscation techniques create an "Intelligence Gap" that can result in erroneous subpoenas if not properly deconstructed. Reconstructing the value-flow hierarchy requires distinguishing between natural wallet behavior and deliberate forensic evasion.

##### Automated Evasion and Recovery Tactics

* **Peel Chains vs. Mixers:**  "Peel chains" (change collection) are inherent to wallet design. However, unidentified mixers often mimic this pattern. Without proper labeling, investigators may follow "mixed" funds to innocent third parties. The pipeline must flag nodes that distribute funds to new addresses in quick succession as potential mixers rather than simple change addresses.  
* **Internal Transactions and Trace-Level Indexing:**  Traditional getTransaction calls often return null for value movements triggered by smart contracts. To capture "hidden" flows, the pipeline must utilize  **Archive Nodes**  or  **Trace-level APIs**  (e.g., Bitquery’s Coinpath) to index the EVM call stack. This reveals  **"Delegate Call"**  architectures—proxies that keep storage in the proxy while delegating execution—revealing how a single transaction can split value into protocol fees, referrals, and shadow nodes (the "1 Transaction, 4 Transfer" event).  
* **Timezone Recovery:**  Despite technical obfuscation like "dust" poisoning, human operational windows remain vulnerable. Analyzing the block timestamps of 100+ transactions reveals a human operational window (e.g.,  **UTC 04:00–15:00** ), providing a robust attribution signal that survives programmatic hops.Accurate technical labeling of the call stack is the only method to avoid the "Nested Service" blind spot during VASP attribution.

#### 4\. VASP Attribution & The "Nested Service" Blind Spot

The Virtual Asset Service Provider (VASP) exit is the critical chokepoint for Indian Law Enforcement. However, "Parasite Exchanges" (nested services) create significant attribution hazards by operating shadow infrastructures within regulated VASPs.

##### The Shadow Infrastructure

Nested services use shell companies to open accounts on major exchanges (OKX, Kraken, Binance) to provide anonymous trading.

* **The Travel Rule Conflict:**  The FATF Travel Rule fails here; the VASP only sees the data of the nested service (the shell company), not the ultimate beneficial owner.  
* **Attribution Hazards (RubRatings Case Study):**  In a documented case involving the  **Ever101 ransomware strain** , investigators mislabeled a merchant service provider as the primary suspect. The provider’s consolidated wallet was wrongly attributed to the site "RubRatings," leading to misdirected legal requests and wasted resources.

##### Mistake Prevention for LLM Pipelines:

1. **Distinguish Host vs. Guest:**  Identify if the target address is a primary VASP cold wallet or a nested service "parasite" account.  
2. **Identify Correspondent Risk:**  Flag high-volume, low-retention accounts as potential nested services.  
3. **Target the Master VASP:**  Direct legal requests to the host VASP for the beneficial ownership data behind the nested shell account.

#### 5\. Artifacts & Test Fixtures: The $812M Case Dataset

These artifacts serve as the "Ground Truth" for validating the automated tracing pipeline's accuracy.

##### Primary Targets

* **Target Relay (2-of-3 Multisig):**  TEkddeyNsrKKzAX48MMzCrHHXLCbCHW619  
* **Mule Aggregator (L1):**  TWhC1FvBoycGpu2bf5MSuGYva9oWcUD87A  
* **High-Priority Rotation Address:**  TMcroaKFGBHZXYMxRGMvGJdwvjvibAmAKx (Active May 2026).  
* **Primary TRX Funder (Vanity):**  TGGJqVx6jV12119u6JLGmGzxf166666666

##### Confirmed VASP Exits (Total Flow: $15.17B)

Specific volumes for prioritizing Section 91 CrPC notices:

* **OKX Deposit:**  TBtHBd5ZGVW3MjdsEHszrKucaJ7NzkfUc6 ($5.67B)  
* **Kraken Deposit:**  TDL5Essu6rG9TzHF3BiqnEHcgkgNsc1hEZ ($5.36B)  
* **Binance Deposit:**  TPthiuuwnMTrqYkNSghbBMUkVJGe2ChZwS ($4.14B)

##### Cryptographic Validation

* **Verification Hash (100k USDT Proof):**  402686127a620f59b91fae52d65b2743e522602d1d9dc0ce3691f284f3bf3b6e

#### 6\. Indian Investigative Context (NCRP/SAHYOG Integration)

Industrialized laundering manifests in the Indian jurisdiction through distinct timezone and logistics signatures.

##### Timezone Alignment (96% Confidence)

Analysis of the TEkddeyN circuit reveals a perfect fit for  **Indian Standard Time (IST/UTC+5:30)** :

* **Peak Activity:**  09:30–20:30 IST.  
* **Operational Signature:**  Zero transactions between 00:00 and 05:00 IST. Seven-day operation with no "weekend silence" confirms a professional, shift-based operation.

##### The "Mule Refill" Strategy

The most vulnerable chokepoint is the TRX funding layer. While USDT flows are complex, the TRX required for "Tamper Wallets" must be replenished. The  **132 inbound refills**  to the vanity funder (TGGJqVx...) represent the highest-probability path to a KYC identity. These refills are often funded via direct exchange withdrawals, providing a clear lead for issuing  **Section 91 CrPC notices**  (or equivalent) to the originating VASP.

##### Evidence Weighting & Source Reliability

To ensure court-readiness, evidence is weighted as follows:

1. **Bitquery/Blockscout (Tier 1):**  Essential for raw telemetry and internal EVM call stack recovery.  
2. **Chainalysis/Skarbiec (Tier 1):**  Necessary for mixer identification and nested service labeling.  
3. **IBKR (Negative Control):**  Legitimate institutional API behavior (IBKR RESTful Web API) follows strict rate limits ( **10 req/sec** ) and requires FATF-country registration. By comparing the criminal "Programmatic Loop" against the "IBKR Institutional Signature," the automated system mathematically demonstrates "Intent" and the "unnatural" nature of the illicit circuit for court-ready reports.

