### Technical Specification: Automated De-anonymization Logic for Privacy Protocols

#### 1\. Strategic Context: The Shift from Cryptographic to Behavioral Analysis

Forensic focus in cryptocurrency intelligence has shifted from attempting to defeat zero-knowledge (ZK) primitives to the systematic exploitation of behavioral leakage and metadata residual artifacts. While protocols like Railgun and Umbra provide cryptographic unlinkability at the protocol transcript level, user behavior frequently compromises the  **Effective Anonymity Set** —the actual pool of plausible candidates—reducing it from the  **Nominal Anonymity Set**  (total pool size) to a handful of high-probability targets. The core investigative strategy assumes a  **Passive Adversary**  model (Huseynov et al., Section 2.4), relying exclusively on publicly observable Ethereum blockchain data.

##### Adversarial Model Summary

The following matrix defines the visibility and forensic utility of data layers across Railgun (Shielded Pool) and Umbra (Stealth Addresses):| Data Layer | Visibility Status (Railgun) | Visibility Status (Umbra) | Analytic Utility || \------ | \------ | \------ | \------ || **Protocol Transcript** | Hidden (ZK-Shielded) | Hidden (Stealth Address) | Low (Cryptographically obscured) || **On-Chain Metadata** | Publicly Observable | Publicly Observable | High (Reveals timing/gas prices) || **Behavioral Patterns** | Publicly Observable | Publicly Observable | High (Salient amounts/reuse) || **Address Relationships** | Obscured (Shielded Pool) | Obscured (One-time use) | Moderate (Linkable via gas/sweeps) |  
This behavioral shift necessitates a formal library of implementable heuristics to automate the narrowing of the search space.

#### 2\. Core De-anonymization Heuristics for Automated Pipelines

The forensic engine utilizes "Heuristic Chaining," synthesized independent signals that elevate investigator confidence. While individual heuristics vary in coverage, their combination yields a 17.65% unique linkage rate in Railgun—a baseline "floor" for automated confidence scores.

##### 2.1. H1: Address Reuse & PPOI Forced Linking

* **Technical Definition:**   $(i, j) \\in \\mathbb{N}^2$  such that  $d\_i \= w\_j \\land t(d\_i) \\leq t(w\_j)$ .  
* **Implementation Logic:**   **IF**  the public  $0x$  address of depositor  $d\_i$  is identical to the recipient  $0x$  address of withdrawal  $w\_j$ ,  **THEN**  flag as an absolute link.  
* **Special Condition (PPOI):**   **IF**  address  $d\_i$  is on the Private Proofs of Innocence (PPOI) blocklist,  **THEN**  the system shall enforce a 1:1 link to the original  $d\_i$ , as protocol rules only permit withdrawals to the source address (impact: 1.49% of unshields).  
* **Confidence Rating:**  Well-established (Zero false-positive rate by construction).

##### 2.2. H2 & H3: Transactional Proximity & Gas-Payer Fingerprinting

* **Technical Definition:**   $tx(d\_i, w\_j) \= 1 \\lor tx(w\_j, d\_i) \= 1$  (H2);  $sender(w\_j) \\in \\text{supp}(D) \\land sender(w\_j) \\notin \\text{Relayers}$  (H3).  
* **Implementation Logic:**  
* **H2:**   **IF**  any direct on-chain transaction exists between  $d\_i$  and  $w\_j$ ,  **THEN**  establish a link.  
* **H3:**   **IF**  a withdrawal is "self-broadcast" (gas payer is not in the identified 124 relayer set)  **AND**  the gas payer is an identified depositor address,  **THEN**  flag as high-confidence link.  
* **Confidence Rating:**  Well-established (Exploits the gas-payer privacy-usability dilemma).

##### 2.3. H4: Fee-Aware Knapsack Solving

* **Technical Definition:**   $\\sum\_{d \\in S} amt(d) \= amt(w\_j) \\pm \\epsilon$ .  
* **Implementation Logic:**  Execute a dynamic programming approach with  $O(nC)$  complexity to find subsets of deposits  $S$  that sum to  $amt(w\_j)$ .  
* **Variable**  **$n**$  **:**  Total number of deposits within time window  $t$ .  
* **Variable**  **$C**$  **:**  Capacity, defined as the withdrawal amount  $amt(w\_j)$ .  
* **Variable**  **$b**$  **:**  Bucket size (precision), typically  $10^{-5}$  ETH.  
* **Variable**  **$t**$  **:**  Time window, default 30-day lookback.  
* **Confidence Rating:**  Well-established (Median entropy loss of 3.42 bits).

##### 2.4. H5: Amount Fingerprinting

* **Technical Definition:**   $frac3(amt(d\_i)) \= frac3(amt(w\_j))$ .  
* **Implementation Logic:**   **IF**  the first three non-zero fractional digits of  $amt(d\_i)$  match  $amt(w\_j)$   **AND**  this fingerprint is globally unique within the dataset,  **THEN**  establish a link.  
* **Confidence Rating:**  Contested/Single-Source (Susceptible to global rounding/denomination effects).

##### 2.5. Stealth Address Patterns (Umbra Logic)

The following heuristics shall be applied specifically to Umbra stealth address sweeps:

* **U1: Registrant Reuse:**  
* **Logic:**   **IF**  multiple stealth addresses are generated for the same ENS/Registrant name,  **THEN**  group these addresses into a single entity cluster.  
* **Confidence:**  Well-established.  
* **U2: Collector Pattern:**  
* **Logic:**   **IF**  multiple stealth payment recipients  $w\_{j1}, w\_{j2} \\dots w\_{jn}$  all sweep funds to a single common  $0x$  address,  **THEN**  identify the common address as the master controller.  
* **Confidence:**  Well-established.  
* **U3: Unique Max Priority Fee:**  
* **Logic:**   **IF**  a sweep transaction uses a psychologically salient maxPriorityFeePerGas (e.g., 1.234 gwei),  **THEN**  search for other sweeps using the identical parameter within a 24-hour window.  
* **Confidence:**  Contested/Single-Source.

#### 3\. Quantitative Anonymity & Residence Time Mathematics

The system utilizes Shannon Entropy to quantify investigative uncertainty, determining when a trace has reached a mathematical "dead-end."

##### Entropic Anonymity Measure (Definition 2\)

The anonymity measure  $A(w\_j)$  of a withdrawal  $w\_j$  is defined as the Shannon entropy of the probability distribution  $X\_{j,A}$  over the set of deposits  $D(w\_j)$ :  $$A(w\_j) := H(X\_{j,A}) \= \-\\sum\_{d\_i \\in D(w\_j)} p\_i \\log\_2(p\_i)$$

##### Residence Time and Little’s Law

Applying Little’s Law ( $T \\approx R / \\lambda\_{out}$ ), where  $R$  is the average retained balance and  $\\lambda\_{out}$  is the average outflow rate, the characteristic pool residence time is approximately  **183 days** . However, the automated pipeline shall prioritize  **Fast-Cycling Indicators** :

* **Median Withdrawal Delay:**  0.84 days.  
* **Forensic Rule:**   **IF**  withdrawal occurs within  $\< 24$  hours of deposit, the Effective Anonymity Set is reduced to the bimodal outlier group, bypassing nominal pool size logic.

##### Entropy Loss Benchmarks

* **Knapsack Median Loss:**  3.42 bits (at  $b=10^{-5}$  ETH).  
* **Address Reuse Success:**  6.10% (reduction to 0 bits).  
* **Unique Linkage Total:**  17.65% (reduction to 0 bits).

#### 4\. DEX/AMM Trace Propagation & Value Flow Reconstruction

The pipeline must propagate traces through "Unshield-and-Swap" events, as Uniswap serves as the primary venue for Railgun unshields (1,726 transactions identified).

##### Trace Continuity Checklist

To maintain value-flow continuity during a DEX swap, the pipeline shall:

* **Identify Token Pairs:**  Prioritize WETH-USDC (top identified pair).  
* **Leading Digits Match:**  Check for "maximal non-zero substrings" that persist across swap transactions.  
* **Low-Hamming Distance Check:**  
* **Automated Logic:**   **IF**  LeadingDigits(In\_Amount) \== LeadingDigits(Out\_Amount)  **AND**  HammingDistance(In, Out) \<= 10,  **THEN**  flag as a continued trace.  
* **Condition:**  Note that differences in low-Hamming pairs are concentrated in later fractional positions (noisy digits).

##### Trace Limits

The continuity thread is considered lost if the value flow involves  **Multi-hop routes**  or  **DEX Aggregators**  (e.g., 1inch), as the source context is silent on machine learning performance for set intersection in these complex edge cases.

#### 5\. Operational Parameters & Termination Criteria for Automated Reports

##### Confidence Scoring Matrix

Heuristic Applied,Resulting Confidence,Cluster Impact  
H1 (Address Reuse),Absolute,1:1 Link  
H2 (Direct Link),High,1:1 Link  
H3 (Gas Payer),High,1:1 Link  
H4 (Knapsack),Probabilistic,3.42 bits loss  
Relayer Usage,Low,Broadcaster Cluster

##### Investigator-Facing Report Templates

The system shall generate the following exact wording for human analysts:**TEMPLATE A: UNIQUE LINK IDENTIFIED**"ALERT: Trace Positive. Address 0x... uniquely linked to 0x... via Heuristic H1/H2/H3. Confidence: 99.9%. Effective Anonymity Set \= 1\. Probability  $p\_i \= 1.0$ ."**TEMPLATE B: ENTROPIC DEAD-END**"ALERT: Trace Termination. Current Entropy  $H(X)$  exceeds threshold. Withdrawal 0x... uses High-Diversity Broadcaster cluster (serving 89.12% volume).  $\\Delta H$  is negligible. Effective Anonymity Set exceeds forensic capacity."**TEMPLATE C: TEMPORAL STALE-DATE**"CAUTION: Data includes March 2025 Tornado Cash sanctions list removal parameters. May 2026 Railgun statistics applied. Adjust legal risk profile for current jurisdictional status."

##### Termination Criteria

The automated trace shall terminate if:

1. **Entropy Thresholds:**   $\\Delta H$  reduction is  $\< 0.1$  bits.  
2. **Relayer Obfuscation:**  The gas payer belongs to a high-diversity broadcaster cluster (124 relayers serving 89.12% of total volume).

#### 6\. Data Grounding & Verification Appendix

Variable/Metric,Value/Formula,Source Citation,Status  
Unique Linkage Rate,17.65%,Huseynov et al. (Abstract),Well-Established  
Address Reuse Rate,6.10%,Huseynov et al. (Sec 5.2),Well-Established  
Median Anonymity Loss,3.42 bits,Huseynov et al. (Sec 5.5),Well-Established  
Avg. Residence Time,\~183 Days,Huseynov et al. (Sec 3.3),Well-Established  
Median Delay,0.84 Days,Huseynov et al. (Sec 5.1.1),Well-Established  
Relayer Volume Cluster,89.12%,Huseynov et al. (Sec 5.8),Well-Established  
Knapsack Complexity,$O(nC)$,Huseynov et al. (Sec 5.5),Well-Established  
Entropic Measure,$H(X) \= \-\\sum p\_i \\log\_2(p\_i)$,Huseynov et al. (Def 2),Well-Established  
Set Intersection Performance,No Data,Source context silent on ML set intersection performance.,N/A  
**Integration Requirement:**  The NCRP/SAHYOG pipeline shall execute a unique linkage check (H1-H3) before triggering the knapsack solver with bucket size  $b=10^{-5}$  ETH. If entropy remains above the target threshold after H4, the report shall default to the Effective Anonymity Set size.  
