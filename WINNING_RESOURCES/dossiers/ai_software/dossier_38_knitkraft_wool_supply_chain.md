# KnitKraft: Farm-to-Fabric Wool Supply Chain & Computer Vision Grading Platform — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Smart Agriculture, Supply Chain Traceability, Computer Vision & Rural Direct-to-Industry Marketplace
- **Problem Statement ID & Title**: PS SIH1309 — Application for Monitoring and Traceability of Wool from Farm to Fabric with Automated Quality Assessment
- **Sponsoring Ministry / Organization**: Ministry of Textiles / Central Wool Development Board (CWDB), Government of India
- **Winning Team Name & Institution**: Team Vision / Department of Computer Science & Information Technology
- **Team Members & Mentor**: Rajnish Puri (Lead Mobile & Full-Stack Architect, GitHub: `@RajnishPuri`), Uzair (Core Mobile Engineer, GitHub: `@uzibytes`), alongside backend and computer vision specialists; mentored by textile industry and wool research consultants.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Praised by Ministry of Textiles leadership for a comprehensive mobile ecosystem connecting nomadic pastoralists with industrial spinning mills.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/RajnishPuri/KnitKraft`
- **Secondary / Sub-module Repositories**: `https://github.com/RajnishPuri/KnitKraft/tree/main/KnitKraft_App` (Flutter Multi-Role Mobile Application)
- **Live Demo / Web Deployment**: KnitKraft National Wool Traceability & Direct Bidding Exchange
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Team Vision SIH 2023 Grand Finale Defense Deck — *Digitizing Indian Wool Supply Chains from Shearing to Spindle*
- **Video Demonstration / YouTube**: KnitKraft End-to-End Wool Shearing Lot QR Generation & Image Quality Grading Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Empowering Nomadic Shepherds: How Team Vision Built KnitKraft for SIH 2023

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - India possesses the 3rd largest sheep population in the world (74+ million sheep), producing over 40 million kg of raw wool annually.
  - However, domestic woolen garment manufacturers import over 85% of their apparel-grade wool from Australia and New Zealand because domestic Indian wool suffers from lack of quality grading, poor sorting, and adulteration with vegetable matter.
  - Nomadic pastoralist shepherds (e.g. Changpa in Ladakh, Gaddi in Himachal, Bakarwal in J&K, Raika in Rajasthan) are exploited by 4–6 tiers of local middlemen, receiving barely ₹20–₹40 per kg while middlemen sell to mills at 5x markups.
  - The Central Wool Development Board lacked traceability systems to verify sheep breed origins, fleece micron diameters, shearing dates, or fair minimum support price (MSP) disbursements.
- **Target Beneficiaries / Government End-Users**:
  - Over 1.2 million nomadic sheep pastoralists and shearing cooperatives across Himalayan and arid western states.
  - Ministry of Textiles and Central Wool Development Board (CWDB).
  - Woolen mills, spinning houses, and artisanal handloom carpet weavers (e.g. Bhadohi, Jaipur, Srinagar).

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      KNITKRAFT ARCHITECTURE                                         |
+----------------------------------------------------------------------------------------------------+
  [ Pastoralist Shepherd App ]          [ Shearing Center & Quality Officer ]      [ Textile Mill Buyer ]
  (Multilingual Audio / Offline)       (Mobile CV Image Grading & RFID)           (Direct Bidding Portal)
                 \                                     |                                     /
                  v                                    v                                    v
  +---------------------------------------------------------------------------------+
  |                  Unified Role-Based Supply Chain Microservices                  |
  |  - Shepherd Enrollment (Aadhaar / DBT verification, Flock health records)      |
  |  - Shearing Lot Generation: Dynamic Cryptographic QR & RFID Batch Tagging       |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Mobile Computer Vision Wool Quality Grading Engine             |
  |  - OpenCV Adaptive Contrast Enhancement & Edge Extraction on raw fleece photos  |
  |  - Automated Staple Length Estimator ($L_{\text{staple}}$ in mm)                |
  |  - Vegetable Matter / Dust Contamination Percentage Detector (Color Thresholding)|
  |  - Fiber Crimp Density & Estimated Micron Grade Classifier (Fine, Medium, Coarse)|
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                   Farm-to-Fabric Immutable Traceability Ledger                  |
  |  - Complete lifecycle milestone tracking: Shearing > Sorting > Baling > Transit |
  |  - Real-time GPS Fleet Tracking of Wool Bale Freight Consignments               |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Direct e-Auction Marketplace & Fair-Price Settlement           |
  |  - Transparent reverse auction engine connecting mills directly with shepherds   |
  |  - Integrated Direct Benefit Transfer (DBT) Escrow payment settlement           |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Shearing & Batch Creation**: At shearing centers, shepherds record fleece weight and breed; a unique QR-coded digital lot identity is minted.
  2. **Computer Vision Quality Grading**: A smartphone photo of the raw wool batch is analyzed using OpenCV: the algorithm segments individual fibers, estimates staple length, and flags dirt/vegetable matter contamination percentage.
  3. **Quality Grade Categorization**: The lot is certified into standard commercial grades (Apparel Grade $<25\mu\text{m}$, Carpet Grade $25\text{--}40\mu\text{m}$, Industrial Grade $>40\mu\text{m}$).
  4. **Direct Bidding Marketplace**: Textile spinning mills view verified certified lots and submit competitive bids online.
  5. **Escrow Payment & Logistics**: Upon delivery confirmation, escrow funds are transferred directly to the shepherd's bank account via DBT, eliminating middleman commissions.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Vegetable Matter Contamination Index ($VMC_{\%}$)**:
    $$VMC_{\%} = \frac{\sum_{x, y} \mathbb{I}\left( \text{HSV}(I_{x,y}) \in [\text{Hue}_{\text{veg\_min}}, \text{Hue}_{\text{veg\_max}}] \right)}{\text{Total Fleece Pixel Area}} \times 100$$
  - **Fleece Quality Composite Price Metric ($P_{\text{lot}}$)**:
    $$P_{\text{lot}} = P_{\text{base}}(\text{Grade}) \times \left(1 + \gamma_1 \frac{L_{\text{staple}}}{L_{\text{std}}} - \gamma_2 VMC_{\%} - \gamma_3 \text{Moisture}_{\%}\right)$$

- **Security, Anonymity & Compliance Framework**:
  - Multilingual voice-guided prompts for non-literate pastoralists in Pahari, Rajasthani, and Ladakhi dialects.
  - Offline-first SQLite synchronization ensuring full app functionality in remote grazing pastures with no cellular signal.

## 5. Technology Stack Breakdown
- **Frontend / Client**: Flutter (Cross-platform Android/iOS), Dart, React.js (Mill Buyer Portal), Tailwind CSS.
- **Backend / Microservices**: Node.js, Express.js REST API, Python (FastAPI for CV grading engine).
- **Blockchain / ML / Core Engine**: OpenCV, Scikit-image, PyTorch, Google Cloud Vision API.
- **Database & Storage**: MongoDB (Bidding & Lot lifecycle documents), Firebase Firestore & Storage, SQLite.
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, Google Cloud Platform (GCP).

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Solved the complete farm-to-fabric lifecycle: combined non-literate rural mobile UX, instant camera-based wool quality grading, and a transparent industrial e-auction marketplace.
- **Feasibility & Real-World Viability**:
  - Direct economic transformation: increases shepherd income by 2.5x by bypassing exploitative middlemen while giving Indian mills verified domestic wool supply.
- **Hackathon Execution Completeness**:
  - Flawless multi-role mobile app demonstration: showed the shepherd generating a lot, the quality inspector snapping a photo for instant grading, and the mill manager placing a live bid.

## 7. Lessons Learned & SIH Participant Takeaways
- **Design for the Actual End-User**: Nomadic shepherds cannot navigate complex English forms; providing voice prompts and large icon-based buttons wins high marks for user empathy.
- **Computer Vision for Objective Grading**: Subjective quality assessment breeds corruption; automated image processing provides objective, tamper-proof quality certificates.
- **Holistic Ecosystem Solutions Win Over Isolated Tools**: Don't just build a marketplace or just a grading tool; connecting the entire chain from shearing to spinning makes the solution indispensable to the sponsoring ministry.
