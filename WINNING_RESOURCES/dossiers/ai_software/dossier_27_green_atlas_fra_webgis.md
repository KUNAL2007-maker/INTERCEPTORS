# Green Atlas: Forest Rights Act (FRA) WebGIS & OCR Cadastral Intelligence — SIH 2024 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2024 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Computer Vision (OCR), Satellite Remote Sensing, WebGIS & Tribal Welfare Administration
- **Problem Statement ID & Title**: PS SIH 2024 / MoTA — Automated Digitization of Legacy Forest Land Titles (Pattas), Cadastral Boundary Superimposition, and Spatial Scheme Recommendation for Tribal Beneficiaries
- **Sponsoring Ministry / Organization**: Ministry of Tribal Affairs (MoTA), Government of India
- **Winning Team Name & Institution**: Team Green Atlas / Department of Information Technology & Remote Sensing
- **Team Members & Mentor**: Aman Sharma (Lead Geospatial & Full-Stack Architect, GitHub: `@amansharma1916`), alongside computer vision engineers and GIS developers; mentored by state forest department advisors.
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Praised by Ministry of Tribal Affairs evaluators for solving the historical patta verification backlog.

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/amansharma1916/Green-Atlas`
- **Secondary / Sub-module Repositories**: `https://github.com/amansharma1916/Green-Atlas/tree/main/backend` (PaddleOCR, GeoDjango & Satellite Verification API)
- **Live Demo / Web Deployment**: Green Atlas FRA National Spatial Cadastral Portal
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: Green Atlas SIH 2024 Defense Deck — *Unlocking Tribal Land Rights Through AI OCR & Satellite Verification*
- **Video Demonstration / YouTube**: Green Atlas OCR Patta Ingestion to Satellite Cadastral Map Superimposition Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Bridging Forest Rights and Satellite AI: How Team Green Atlas Won SIH 2024

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Under the Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006 (FRA), over 4.5 million land title claims have been filed, but millions remain unmapped or trapped in physical paper records.
  - Legacy physical title deeds (*pattas*) are hand-written in regional vernacular scripts (Hindi, Odia, Telugu, Marathi), often faded, torn, or stamped with low-contrast official seals, making standard commercial OCR tools useless.
  - Verification officers struggle to match paper land descriptions (e.g. "North of Banyan tree, East of stream") with actual cadastral boundary parcels and satellite canopy boundaries, leading to fraudulent claim rejections, land disputes, and delayed welfare disbursements (PM-KISAN, Jal Jeevan Mission).
- **Target Beneficiaries / Government End-Users**:
  - Millions of tribal forest-dwelling families and Gram Sabhas across India.
  - Ministry of Tribal Affairs (MoTA) and State Tribal Welfare Directorates.
  - District Level Committees (DLC), Sub-Divisional Level Committees (SDLC), and Forest Range Officers.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                      GREEN ATLAS ARCHITECTURE                                       |
+----------------------------------------------------------------------------------------------------+
  [ Scanned / Mobile Photo of Handwritten Forest Patta (Hindi / Odia / English) ]
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Multi-Stage Image Preprocessing & OCR Pipeline                 |
  |  - Adaptive Sauvola Binarization & Deskewing (OpenCV)                           |
  |  - Morphological Contrast Enhancement (Eliminating physical paper smudges)      |
  |  - Dual OCR Engine: PaddleOCR (Multilingual) + Fine-Tuned Tesseract 5           |
  |  - LayoutLMv3 Document Key-Value Extraction (Claimant, Village, Acreage, Survey)|
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                    Cadastral Georeferencing & Satellite Verification            |
  |  - GeoDjango / PostGIS Coordinate Resolver                                      |
  |  - ISRO Bhuvan / Sentinel-2 Canopy Cover Superimposition                        |
  |  - Historical NDVI (Normalized Difference Veg Index) Change Detection (2005-now)|
  |  - Cadastral Parcel Polygon Geofencing & Overlap Dispute Detection              |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  AI Welfare Scheme Recommendation & Convergence Engine          |
  |  - Demographic & Agrarian Need Scoring Matrix                                   |
  |  - Automatic entitlement mapping: PM-KISAN, MGNREGA Wells, PMGSY Road Access    |
  |  - Automated generation of Multilingual Gram Sabha Approval Certificates        |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                     Interactive WebGIS Administrative Portal                    |
  |  - Mapbox GL / Leaflet.js Dynamic Cadastral Layers & Orthophoto Overlays        |
  |  - Offline-capable Mobile App for Field Forest Officers with GPS polygon survey |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Document Ingestion & Preprocessing**: Faded paper title deeds uploaded via mobile camera undergo Sauvola binarization, perspective correction, and background noise removal.
  2. **Key-Value Extraction**: LayoutLMv3 extracts structured entities (Beneficiary Name, Father's Name, Tribe Category, Survey No, Land Area in Hectares, Boundaries).
  3. **Spatial Cadastral Overlay**: Resolves the survey parcel to exact geographic coordinates on the WebGIS portal and superimposes high-resolution satellite imagery from ISRO Bhuvan.
  4. **Satellite Temporal Verification**: Evaluates multi-year historical Sentinel-2 NDVI to confirm that the forest plot was cultivated by the tribal claimant prior to the statutory cut-off date (13 Dec 2005).
  5. **Scheme Convergence**: Generates an actionable welfare convergence plan, linking the verified patta holder with subsidies for borewells, solar pumps, and agricultural credits.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Sauvola Adaptive Thresholding for Degraded Pattas**:
    $$T(x, y) = m(x, y) \cdot \left[1 + k \cdot \left(\frac{s(x, y)}{R} - 1\right)\right]$$
    where $m(x,y)$ is local mean, $s(x,y)$ is standard deviation, $R=128$, and $k=0.2$.
  - **Normalized Difference Vegetation Index (NDVI)**:
    $$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$$
  - **Spatial Parcel Intersection & Fraud Check**:
    $$\text{Overlap}(\mathcal{P}_{\text{claim}}, \mathcal{P}_{\text{existing}}) = \frac{\text{Area}(\mathcal{P}_{\text{claim}} \cap \mathcal{P}_{\text{existing}})}{\text{Area}(\mathcal{P}_{\text{claim}})} > \theta_{\text{dispute}}$$

- **Security, Anonymity & Compliance Framework**:
  - Strict compliance with Ministry of Tribal Affairs data sovereignty standards.
  - AES-256 encrypted digital storage for tribal identity documents and land deeds.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, Mapbox GL JS, Leaflet.js, Tailwind CSS, Vite.
- **Backend / Microservices**: Python, GeoDjango, Django REST Framework, Celery.
- **Blockchain / ML / Core Engine**: PaddleOCR, LayoutLMv3, Tesseract OCR, OpenCV, Rasterio, Shapely, GeoPandas.
- **Database & Storage**: PostgreSQL with PostGIS spatial database extension, AWS S3 / Cloudinary.
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, Linux VM on MeitY-empaneled cloud.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Fused multilingual OCR with historical satellite NDVI change detection, enabling government judges to see how a torn, 30-year-old paper title deed instantly mapped onto a satellite canopy view with historical proof of cultivation.
- **Feasibility & Real-World Viability**:
  - Solved the primary operational hurdle in FRA implementation: accelerating bureaucratic title verification from months to under 60 seconds per claim.
- **Hackathon Execution Completeness**:
  - End-to-end working system: live paper upload, instantaneous OCR field extraction, cadastral boundary overlay, and automated scheme eligibility report generation.

## 7. Lessons Learned & SIH Participant Takeaways
- **OCR Alone Isn't Enough**: In land administration hackathons, just reading text doesn't win. You must anchor the extracted text onto a verified GIS map layer with spatial proof.
- **Tackle Degraded Document Realities**: Testing on clean synthetic PDFs loses points. Proving your OCR handles torn, creased, low-contrast physical paper with ink smudges impresses domain evaluators.
- **Socio-Economic Impact Sells**: Demonstrating how technical verification unlocks government welfare schemes (PM-KISAN, Jal Jeevan) connects engineering directly to national policy goals.
