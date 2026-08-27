# AyurVaidya: AI Ayurvedic Diagnostic Engine & Classical Pharmacopoeia Knowledge Graph — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (1st Prize Winner, Cash Award: ₹1,00,000)
- **Category / Domain**: Healthcare AI, MedTech, Ayurvedic Knowledge Graphs & Clinical Decision Support
- **Problem Statement ID & Title**: PS SIH1347 — Smart Ayurvedic Disease & Medicine Suggestion System Grounded in Classical Ayurvedic Pharmacopoeia
- **Sponsoring Ministry / Organization**: Ministry of Ayush, Government of India
- **Winning Team Name & Institution**: Team AyurVaidya / Department of Computer Science & Health Informatics
- **Team Members & Mentor**: Aditya Sharma (Lead AI & Graph Architect, GitHub: `@Aditya5510`), alongside full-stack and Ayurvedic data engineering specialists; mentored by certified Ayurvedic practitioners (Vaidyas).
- **Prize & Recognition**: 1st Prize Winner at Nodal Center (Cash Award ₹1,00,000); Praised by Ministry of Ayush evaluators for rigorous ontological grounding in classical Sanskrit compendia (*Charaka Samhita*, *Sushruta Samhita*).

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: `https://github.com/Aditya5510/AyurVaidya`
- **Secondary / Sub-module Repositories**: `https://github.com/Aditya5510/AyurVaidya/tree/main/backend` (Prakriti Assessment & Herbal Graph Matcher)
- **Live Demo / Web Deployment**: AyurVaidya Clinical Decision Support & Telemedicine Portal
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: AyurVaidya SIH 2023 Grand Finale Defense Deck — *Digitizing Classical Ayurvedic Formulations with Graph Neural Networks*
- **Video Demonstration / YouTube**: AyurVaidya Prakriti Diagnosis & Personalized Herbal Prescription Generator Demo
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: Bringing 3,000 Years of Ayurvedic Medicine into the AI Era: The AyurVaidya SIH Retrospective

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  - Ayurveda provides holistic treatment protocols across thousands of validated herbal and mineral formulations documented in classical Sanskrit compendia (*Charaka Samhita*, *Sushruta Samhita*, *Ashtanga Hridaya*).
  - Modern practitioners and primary health center (PHC) doctors face significant challenges in navigating dense, cross-referenced classical compendia to determine the exact herbal compound formulation, contraindications, and dietary restrictions (*Pathya/Apathya*) tailored to a patient's individual metabolic constitution (*Prakriti*: Vata, Pitta, Kapha).
  - Unregulated online herbal aggregators frequently provide unscientific, one-size-fits-all remedy suggestions without assessing individual Dosha imbalances (*Vikriti*), leading to adverse drug interactions or ineffective treatments.
- **Target Beneficiaries / Government End-Users**:
  - Ministry of Ayush, Ayush Wellness Centers, and National Ayush Mission clinics.
  - Ayurvedic doctors, clinicians, and medical researchers.
  - Citizens seeking authenticated, scientifically structured traditional healthcare guidance.

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
```
+----------------------------------------------------------------------------------------------------+
|                                    AYURVAIDYA ARCHITECTURE                                         |
+----------------------------------------------------------------------------------------------------+
  [ Classical Sanskrit Texts: Charaka / Sushruta / Ayurvedic Pharmacopoeia of India (API) ]
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Ayurvedic Ontological Knowledge Graph Construction             |
  |  - Neo4j Graph DB: Nodes (Herbs, Disease, Dosha, Formulations, Rasa, Guna, Veerya)|
  |  - Edges (Treats, Aggravates, Pacifies, Contraindicated_With, Potentiates)     |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Patient Tridosha Assessment & Diagnostic Engine                |
  |  - Interactive 30-Parameter Prakriti Questionnaire (Physical, Metabolic, Mental)|
  |  - Fuzzy Logic Dosha Ratio Estimator ($V_{\%}, P_{\%}, K_{\%}$)                 |
  |  - Symptom Input via Natural Language (Voice/Text in Hindi & English)          |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                  Graph Neural Network & Semantic Matching Engine                |
  |  - Node2Vec & Graph Convolutional Network (GCN) embedding formulation nodes     |
  |  - BioBERT / ClinicalBERT Semantic Similarity for Symptom-to-Disease Mapping   |
  |  - Contraindication Filter (Eliminating toxic herb-herb & herb-drug collisions) |
  +---------------------------------------------------------------------------------+
                                           |
                                           v
  +---------------------------------------------------------------------------------+
  |                   Prescription Generation & Telemedicine Portal                 |
  |  - Structured Ayurvedic Prescription (Formulation, Dosage, Anupana, Timing)     |
  |  - Tailored Dietary (Pathya/Apathya) and Lifestyle (Dinacharya) Recommendations |
  |  - Tele-consultation scheduling module with registered Vaidyas                  |
  +---------------------------------------------------------------------------------+
```

- **Data Pipeline & Workflow**:
  1. **Knowledge Ingestion**: Digitized, translated, and structured over 5,000 classical herbal formulations into a Neo4j property graph.
  2. **Prakriti Assessment**: Patient undergoes a standardized constitutional evaluation calculating base Vata-Pitta-Kapha equilibrium.
  3. **Clinical Symptom Ingestion**: Clinician enters chief complaints, pulse characteristics (*Nadi*), tongue examination findings (*Jihva*), and duration.
  4. **Graph Traversals & Formulation Inference**: The GCN traverses the graph to find high-affinity formulations that pacify the aggravated Dosha while treating the specific disease pathology (*Samprapti*).
  5. **Prescription & Diet Output**: Generates an authenticated digital prescription specifying exact formulation dosage, vehicle medium (*Anupana*, e.g. honey, warm milk, warm water), and lifestyle guidelines.

- **Core Algorithms & Mathematical / Logic Models**:
  - **Fuzzy Tridosha Balance Vector**:
    $$\mathbf{D}_{\text{patient}} = [V, P, K]^T, \quad \text{where } V + P + K = 1.0$$
  - **Formulation Efficacy Score**:
    $$\mathcal{E}(F) = \sum_{h \in F} \left( \mathbf{w}_{\text{action}} \cdot \mathbf{x}_{h,\text{disease}} \right) - \gamma \cdot \|\mathbf{D}_{\text{herb}} \odot \mathbf{D}_{\text{patient}}\|$$
    penalizing herbs that aggravate the patient's dominant Dosha.

- **Security, Anonymity & Compliance Framework**:
  - Strict compliance with National Digital Health Mission (ABDM - Ayushman Bharat Digital Mission) standards.
  - End-to-end encryption for electronic health records (EHR).

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js 18, Next.js, Tailwind CSS, Lucide React.
- **Backend / Microservices**: Python (FastAPI), Node.js, Express.js.
- **Blockchain / ML / Core Engine**: Neo4j Graph Database, PyTorch Geometric, NetworkX, BioBERT, spaCy, Scikit-learn.
- **Database & Storage**: Neo4j (Ontological Graph), MongoDB (Patient records & EHR).
- **DevOps, Hardware & Cloud Infrastructure**: Docker, Nginx, AWS EC2.

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  - Genuine classical authenticity: constructed a multi-relational Neo4j Knowledge Graph representing ancient Sanskrit medical compendia, avoiding shallow keyword matching.
- **Feasibility & Real-World Viability**:
  - Personalization by constitution: proved that two patients with identical cough symptoms received different formulations based on their Vata vs Pitta constitution.
- **Hackathon Execution Completeness**:
  - Complete end-to-end clinical workflow: from patient Prakriti assessment to doctor prescription approval and telemedicine video consultation.

## 7. Lessons Learned & SIH Participant Takeaways
- **Ground AI in Domain-Specific Compendia**: In specialized domains like traditional medicine, models must follow authenticated classical pharmacopoeia rather than generic web text.
- **Knowledge Graphs Excel in Relational Medicine**: Graph databases (Neo4j) naturally capture herb-disease-contraindication networks far better than flat SQL tables.
- **Incorporate Domain Practitioners**: Involving certified Ayurvedic doctors in validating ontology relationships gives massive credibility during jury defense.
