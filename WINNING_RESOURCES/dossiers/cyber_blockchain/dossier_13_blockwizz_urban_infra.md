# BlockWizz Property Tax & Land Registry Ledger — SIH 2022 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2022 (Software Edition — Joint 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Blockchain & Smart Contracts / Municipal FinTech & e-Governance
- **Problem Statement ID & Title**: SIH 2022 / MoHUA — *Blockchain-Based Property Tax Management & Land Registry System for Urban Local Bodies (ULBs)*
- **Sponsoring Ministry / Organization**: Ministry of Housing and Urban Affairs (MoHUA) / Municipal Corporations
- **Winning Team Name & Institution**: Team BlockWizz (Team Lead: D. Vinay Nesta) from Anil Neerukonda Institute of Technology & Sciences (ANITS), Visakhapatnam, Andhra Pradesh
- **Team Members & Mentor**: D. Vinay Nesta (Lead Developer), Core Software Engineering Team from ANITS Department of Computer Science & Engineering
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at SIH 2022 Grand Finale)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/vinaynesta/BlockWizz
- **Secondary / Sub-module Repositories**:
  - Developer Profile: https://github.com/vinaynesta
- **Live Demo / Web Deployment**: https://github.com/vinaynesta/BlockWizz#demo-preview
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/vinaynesta/BlockWizz/tree/main/docs/BlockWizz_MoHUA_Deck.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=BlockWizz+SIH+2022+Vinay+Nesta
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/vinaynesta/BlockWizz/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  Municipal corporations and Urban Local Bodies (ULBs) across Indian cities lose thousands of crores annually in property tax leakages and fraudulent title deeds:
  1. *Corrupt Manual Tax Assessments*: Revenue inspectors manually assess property carpet areas, leading to bribery, under-reporting of commercial usage, and massive revenue loss.
  2. *Duplicate Title Deeds & Land Disputes*: Over 60% of civil litigation in India stems from forged land title deeds and fraudulent multi-selling of the same plot to different buyers.
  3. *Opaque Revenue Accounting*: Lack of real-time visibility for state finance departments into municipal tax collections and escrow disbursements.
- **Target Beneficiaries / Government End-Users**:
  - Ministry of Housing and Urban Affairs (MoHUA) & Smart Cities Mission
  - Municipal Corporations, Municipalities, and Town Planning Authorities
  - Citizen Property Owners & Commercial Real Estate Developers
  - State Land Revenue Registrars & Sub-Registrar Offices (SRO)

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  CITIZEN & MUNICIPAL TAX PORTAL (React.js)              |
|       - GIS Mapbox Interactive Property Boundary & Carpet Area Selector |
|       - MetaMask Web3 Payment Gateway & Tax Assessment Dashboard        |
+------------------------------------+------------------------------------+
                                     | (Ethers.js / REST API)
                                     v
+-------------------------------------------------------------------------+
|                   NODE.JS / EXPRESS MUNICIPAL API GATEWAY               |
|   - GIS Spatial Verification & GeoJSON Parcel Boundary Validator        |
|   - Dynamic Property Tax Calculation Engine (Formula-Based, No Discretion)|
+-------------------+--------------------------------+--------------------+
                    |                                |
       (Encrypted Deed Documents)         (Property State & Tax Escrow)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    DECENTRALIZED STORAGE (IPFS)   |  |     SMART CONTRACT LAYER         |
|  - Pinata IPFS Deed Archive       |  |  - PropertyRegistry.sol (NFT)    |
|  - Encrypted Title Certificates   |  |  - TaxEscrow.sol (Auto-Splits)   |
|  - Returns CID: Qm...             |  |  - PenaltyRebateEngine.sol       |
+-------------------+---------------+  |  - Deployed on Polygon PoS / ETH |
                    |                  +-----------------+----------------+
                    | (Content Hash)                     |
                    +----------------------------------->|
                                                         | (Emits Event Log)
                                                         v
                                       +----------------------------------+
                                       |    STATE FINANCE AUDIT DASHBOARD |
                                       |   Real-Time 100% Immutable Ledger|
                                       +----------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *GIS Geolocation & Assessment*: Property coordinates and satellite carpet area boundaries are ingested via Mapbox GIS APIs; tax is calculated automatically using non-discretionary municipal bylaws.
  2. *NFT Land Title Minting*: Property title deeds are tokenized as unique ERC-721 tokens on Polygon PoS, binding GIS polygons and owner Aadhaar/PAN hashes.
  3. *Automated Tax Payment & Escrow*: Citizens pay municipal taxes via Web3 or UPI gateway; smart contracts immediately route 70% to municipal infrastructure funds and 30% to state treasury accounts without intermediary delay.
  4. *Dynamic On-Chain Rebates & Penalties*: Smart contracts automatically apply early-bird rebates or compounding daily late penalties directly on-chain.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Automated Property Tax Formula*:
    Tax = CarpetArea * UnitRateZone * BuildingTypeMultiplier * AgeFactor * UsageFactor
  - *GIS Polygon Non-Overlapping Invariant*:
    Intersection(Polygon(P_new), Polygon(P_existing)) == emptyset
    preventing duplicate property registrations.
- **Security, Anonymity & Compliance Framework**:
  - Strict multi-sig governance for municipal boundary revisions.
  - Role-gated smart contracts enforcing jurisdictional boundaries between municipal ward officers.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Redux, Material UI, Mapbox GL JS, Web3.js / Ethers.js
- **Backend / Microservices**: Node.js, Express.js, RESTful microservices, Turf.js (geospatial analysis)
- **Blockchain / ML / Core Engine**: Solidity (v0.8.17), Hardhat, Polygon PoS / Ethereum Testnet, OpenZeppelin ERC-721
- **Database & Storage**: MongoDB (property metadata & GIS layers), IPFS (title deed certificates)
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, Alchemy RPC Gateway, GitHub Actions

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Integration of GIS satellite polygon mapping with ERC-721 blockchain property deeds, mathematically preventing overlapping duplicate land sales.
- **Feasibility & Real-World Viability**:
  Eliminates human discretion in municipal tax assessments, guaranteeing 100% tax collection transparency for urban local bodies.
- **Hackathon Execution Completeness**:
  Live working demonstration: registered a parcel of land in Visakhapatnam on Mapbox, minted its NFT deed on Polygon, calculated property tax automatically, and settled payment on-chain in 15 seconds.

## 7. Lessons Learned & SIH Participant Takeaways
- **Spatial Data + Blockchain is a Powerful Duo**: Combining GIS mapping with smart contracts creates an unassailable value proposition for urban and land management problems.
- **Automate the Financial Math**: Removing human discretion through immutable smart contract formulas directly appeals to government anti-corruption priorities.
- **Focus on Usability for Common Citizens**: Provide seamless fiat payment fallbacks alongside Web3 wallets to ensure non-crypto users can pay municipal dues easily.
