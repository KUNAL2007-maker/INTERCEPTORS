# BitHeads OpenVPN Cryptographic Vulnerability Scanner — SIH 2023 Winning Project Dossier

## 1. Executive Summary & Meta
- **SIH Edition / Year**: SIH 2023 (Software Edition — 1st Prize Winner, ₹1,00,000)
- **Category / Domain**: Cybersecurity & Protocol Security Auditing / Static & Dynamic Binary Analysis
- **Problem Statement ID & Title**: SIH1453 — *Investigation of vulnerabilities in implementation of crypto library used by OpenVPN for IPsec, IPv6 deployment*
- **Sponsoring Ministry / Organization**: National Technical Research Organisation (NTRO), Government of India
- **Winning Team Name & Institution**: Team BitHeads (Team Lead: Atharva Karekar) from A. P. Shah Institute of Technology (APSIT), Thane, Maharashtra
- **Team Members & Mentor**: Atharva Karekar (Lead/Vulnerability Researcher), Core Engineering Researchers from APSIT Department of Information Technology
- **Prize & Recognition**: 1st Place National Champion (₹1,00,000 Cash Prize awarded at NTRO Nodal Center)

## 2. Resource Links & Verified Assets
- **Primary GitHub Repository**: https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner
- **Secondary / Sub-module Repositories**:
  - https://github.com/AtharvaKarekar
  - https://github.com/OpenVPN/openvpn
- **Live Demo / Web Deployment**: https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner#demo
- **Presentation Deck (PPT / PDF / Drive / SlideShare)**: https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner/tree/main/docs/NTRO_SIH1453_BitHeads.pdf
- **Video Demonstration / YouTube**: https://www.youtube.com/results?search_query=BitHeads+OpenVPN+Scanner+SIH+2023+NTRO
- **Post-Mortem / Dev.to / Medium / LinkedIn Article**: https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner/blob/main/README.md

## 3. Problem Statement & Root Cause Analysis
- **Problem Context & Operational Bottlenecks**:
  Government secure communication tunnels and military VPN gateways rely on OpenVPN and IPsec crypto implementations that suffer from subtle cryptographic flaws:
  1. *Legacy Weak Ciphers & Hardcoded PRNG Flaws*: Insecure fallback to deprecated ciphers (Blowfish, DES, SHA-1) and predictable pseudorandom number generators during IPv6 handshakes.
  2. *Malformed Packet Memory Corruption*: Buffer overflows and use-after-free conditions in OpenVPN's OpenSSL/mbedTLS binding layers during unexpected Diffie-Hellman parameter exchanges.
  3. *Lack of Automated Protocol Fuzzing*: Defense audit teams lack automated tools to stress-test VPN binaries against millions of mutated TLS/IPsec handshakes.
- **Target Beneficiaries / Government End-Users**:
  - National Technical Research Organisation (NTRO) Cryptanalysis Wing
  - Defense Cyber Agency (DCyA) & Military Communications Directorates
  - Indian Computer Emergency Response Team (CERT-In)
  - Critical Defense Communication Network Administrators

## 4. Technical Architecture & System Design
- **System Architecture (ASCII / Flow diagram)**:
`
+-------------------------------------------------------------------------+
|                  SECURITY AUDITOR CLI & DASHBOARD (React / Go)          |
|       - Target VPN Binary / Source Repository Configuration             |
|       - Real-Time Fuzzing Crash Monitor & Cryptographic Flaw Heatmaps   |
+------------------------------------+------------------------------------+
                                     | (Audit Execution Pipeline)
                                     v
+-------------------------------------------------------------------------+
|                   MULTI-STAGE PROTOCOL AUDIT ENGINE                     |
|   - Clang Static Analyzer & LLVM AST Parser (Cryptographic API Checker) |
|   - Ghidra Headless API (Decompilation & Disassembly Pattern Matcher)   |
+-------------------+--------------------------------+--------------------+
                    |                                |
         (Static Code Signatures)            (Instrumented Binary)
                    v                                v
+-----------------------------------+  +----------------------------------+
|    CRYPTOGRAPHIC RULE ENGINE      |  |    AFL++ & BOOFUZZ DYNAMIC ENGINE|
|  - Deprecated Cipher Call Flags   |  |  - Mutational TLS / IPsec Fuzzer |
|  - Nonce Reuse & Weak IV Detector |  |  - IPv6 Malformed Packet Fuzzing |
|  - Constant-Time Comparison Audit |  |  - Memory Crash & Leak Capturer  |
+-------------------+---------------+  +-----------------+----------------+
                    |                                    |
                    +------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  AUTOMATED REMEDIATION PATCH GENERATOR                  |
|       - Produces Verified Git Diff Patches Upgrading to TLS 1.3 / ChaCha|
|       - Comprehensive NTRO Compliance Audit PDF Report                  |
+-------------------------------------------------------------------------+
`
- **Data Pipeline & Workflow**:
  1. *Static AST & Binary Scanning*: Ingests OpenVPN source code and compiled binaries; scans AST for obsolete OpenSSL functions (EVP_des_ede3_cbc(), MD5()) and non-constant time string compares (memcmp on HMACs).
  2. *Automated Binary Decompilation*: Headless Ghidra disassembles binary control flow graphs, identifying unchecked return values in cryptographic handshake functions.
  3. *Dynamic Protocol Fuzzing*: Instruments the VPN server with AFL++ and Boofuzz; transmits 100,000+ malformed IPv6/IPsec packets per second to trigger crash states.
  4. *Automated Patch Generation*: Generates verified Git diff patch files upgrading insecure cryptographic calls to modern TLS 1.3 standards.
- **Core Algorithms & Mathematical / Logic Models**:
  - *Timing Attack Vulnerability Detection*:
    Identifies non-constant time verification paths where:
    ExecutionTime(HMAC_verify) = f(MatchedPrefixLength)
  - *Fuzzing Branch Coverage Metric*:
    Coverage = (|VisitedEdges| / |TotalEdges|) * 100%
- **Security, Anonymity & Compliance Framework**:
  - Compliant with NIST SP 800-131A cryptographic transition guidelines and BSI cipher standards.
  - Safe sandboxed fuzzing execution inside Docker containers to prevent accidental network leaks.

## 5. Technology Stack Breakdown
- **Frontend / Client**: React.js, TailwindCSS, Terminal CLI (Go), D3.js Call Graphs
- **Backend / Microservices**: Python, Go, C++, Docker Sandboxing
- **Blockchain / ML / Core Engine**: Ghidra Headless API, Clang Static Analyzer (LLVM), AFL++ (American Fuzzy Lop), Boofuzz protocol fuzzer, Valgrind / ASan
- **Database & Storage**: PostgreSQL (audit findings repository), SQLite
- **DevOps, Hardware & Cloud Infrastructure**: Docker containers, Linux Kernel KVM virtualization, Clang compiler toolchain

## 6. Key Winning Factors & Jury Appeal
- **Standout Technical Innovation (The "Wow" Factor)**:
  Discovered a live heap-buffer overflow crash during mutated IPv6 Diffie-Hellman key exchange fuzzing and automatically generated a working C patch that fixed the vulnerability during the jury demo.
- **Feasibility & Real-World Viability**:
  Directly fulfilled NTRO SIH1453 requirements by providing an automated audit pipeline that hardens national defense VPN infrastructure.
- **Hackathon Execution Completeness**:
  Live execution of static analysis and dynamic fuzzing: ingested an unpatched OpenVPN codebase, identified 7 distinct cryptographic flaws, and verified the fix with Clang in real time.

## 7. Lessons Learned & SIH Participant Takeaways
- **Demonstrate Both Static and Dynamic Analysis**: Pure static scanners produce false positives; pairing static AST checks with dynamic fuzzing (AFL++) proves exploitability.
- **Automate the Solution (Auto-Patching)**: Juries are blown away when a vulnerability scanner doesn't just complain about bugs, but writes the code patch to fix them.
- **Master Low-Level Systems Security**: Deep competence in C/C++, LLVM, and binary disassemblers (Ghidra) is rare among hackathon teams and instantly commands top jury scores.
