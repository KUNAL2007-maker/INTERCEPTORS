# Automated Link & Artifact Verification Audit Report (R4)

**Audit Execution Timestamp**: `2026-08-27T17:06:13.035346+00:00`  
**Engine**: `Smart India Hackathon Resource Verification Engine v2.4.0-production`  
**Verification Status**: **🟡 ATTENTION (54.44% Resource Availability)**  

---

## 1. Executive Summary & Audit KPIs

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 RESOURCE VERIFICATION DASHBOARD                                  │
├──────────────────────────┬──────────────────────────┬─────────────────────────┬──────────────────┤
│ Total URL Scans: 194     │ Unique URLs: 180         │ Valid / Live: 98        │ Health: 54.44%        │
├──────────────────────────┼──────────────────────────┼─────────────────────────┼──────────────────┤
│ Redirects Resolved: 3    │ Protected Active: 0      │ Broken / 404: 80        │ Latency: 645.95ms      │
└──────────────────────────┴──────────────────────────┴─────────────────────────┴──────────────────┘
```

### Key Audit Insights
- **100% Core Repository Coverage**: All GitHub repositories, YouTube walkthroughs, technical architecture blueprints, and government reference endpoints cataloged across all 42 dossiers were programmatically audited.
- **Zero Critical Deadlocks**: 98 endpoints returned direct HTTP 200/206/304 OK; 3 endpoints successfully resolved canonical redirects; 0 endpoints verified active under browser scraping challenges (WAF/Cloudflare/Google Drive).
- **Mean System Latency**: Fast average round-trip probe latency of **645.95 ms** across concurrent asynchronous threads.

---

## 2. Resource Domain & Platform Breakdown

| Domain Category | Total URLs | Valid / Live | Bot-Protected Active | Broken / 404 | Availability Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **GitHub Repository / Asset** | 148 | 69 | 0 | 79 | **46.6%** |
| **Live Web Deployment / Staging** | 1 | 0 | 0 | 1 | **0.0%** |
| **General Web Resource** | 9 | 7 | 0 | 0 | **77.8%** |
| **Technical Blog / Post-Mortem** | 1 | 1 | 0 | 0 | **100.0%** |
| **Video Demonstration** | 20 | 20 | 0 | 0 | **100.0%** |
| **Official Government / Ministry Portal** | 1 | 1 | 0 | 0 | **100.0%** |

---

## 3. Detailed URL Verification Matrix

| Status | Target URL | HTTP Code | Latency | Category | Primary Source Location |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 🔴 BROKEN | [https://aquadb-incois.web.app](https://aquadb-incois.web.app) | `404` | 84.13ms | Live Web Deployment / Staging | `dossiers/ai_software/dossier_21_aquadb_marine_pfz.md:15` |
| 🔴 BROKEN | [https://github.com/Aditya5510/AyurVaidya/tree/main/backend](https://github.com/Aditya5510/AyurVaidya/tree/main/backend) | `404` | 515.97ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_34_ayurvaidya_diagnostic.md:14` |
| 🔴 BROKEN | [https://github.com/Arjun-254/SIH1348_LichtDenCode/tree/ma...](https://github.com/Arjun-254/SIH1348_LichtDenCode/tree/main/backend) | `404` | 608.03ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_26_railwaybuddy_translator.md:14` |
| 🔴 BROKEN | [https://github.com/Arohi-jd/Nivesh-Nidhi](https://github.com/Arohi-jd/Nivesh-Nidhi) | `404` | 309.46ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_15_nivesh_nidhi_chitchain.md:13` |
| 🔴 BROKEN | [https://github.com/Arohi-jd/Nivesh-Nidhi#demo](https://github.com/Arohi-jd/Nivesh-Nidhi#demo) | `404` | 240.56ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_15_nivesh_nidhi_chitchain.md:16` |
| 🔴 BROKEN | [https://github.com/Arohi-jd/Nivesh-Nidhi/blob/main/README.md](https://github.com/Arohi-jd/Nivesh-Nidhi/blob/main/README.md) | `404` | 367.36ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_15_nivesh_nidhi_chitchain.md:19` |
| 🔴 BROKEN | [https://github.com/Arohi-jd/Nivesh-Nidhi/tree/main/docs/N...](https://github.com/Arohi-jd/Nivesh-Nidhi/tree/main/docs/NiveshNidhi_SIH_Pitch.pdf) | `404` | 299.84ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_15_nivesh_nidhi_chitchain.md:17` |
| 🔴 BROKEN | [https://github.com/ArshTiwari2004/Signal-X/tree/main/edge_cv](https://github.com/ArshTiwari2004/Signal-X/tree/main/edge_cv) | `404` | 452.25ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_31_signal_x_adaptive_traffic.md:14` |
| 🔴 BROKEN | [https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner](https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner) | `404` | 324.73ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:13` |
| 🔴 BROKEN | [https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanne...](https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner#demo) | `404` | 251.03ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:17` |
| 🔴 BROKEN | [https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanne...](https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner/blob/main/README.md) | `404` | 347.68ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:20` |
| 🔴 BROKEN | [https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanne...](https://github.com/AtharvaKarekar/BitHeads-OpenVPN-Scanner/tree/main/docs/NTRO_SIH1453_BitHeads.pdf) | `404` | 371.65ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:18` |
| 🔴 BROKEN | [https://github.com/DakshDadhania/Cryptonite-AntiPhishing](https://github.com/DakshDadhania/Cryptonite-AntiPhishing) | `404` | 329.7ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_11_cryptonite_phishing_guard.md:13` |
| 🔴 BROKEN | [https://github.com/DakshDadhania/Cryptonite-AntiPhishing#...](https://github.com/DakshDadhania/Cryptonite-AntiPhishing#live-demo) | `404` | 279.93ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_11_cryptonite_phishing_guard.md:16` |
| 🔴 BROKEN | [https://github.com/DakshDadhania/Cryptonite-AntiPhishing/...](https://github.com/DakshDadhania/Cryptonite-AntiPhishing/blob/main/README.md) | `404` | 300.32ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_11_cryptonite_phishing_guard.md:19` |
| 🔴 BROKEN | [https://github.com/DakshDadhania/Cryptonite-AntiPhishing/...](https://github.com/DakshDadhania/Cryptonite-AntiPhishing/tree/main/docs/NTRO_SIH1454_Cryptonite.pdf) | `404` | 345.16ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_11_cryptonite_phishing_guard.md:17` |
| 🔴 BROKEN | [https://github.com/Legit-Coder/Voco_World](https://github.com/Legit-Coder/Voco_World) | `404` | 329.93ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_35_voco_accessibility.md:14` |
| 🔴 BROKEN | [https://github.com/NFSU-Cyber/GridGladiators-PowerSOC](https://github.com/NFSU-Cyber/GridGladiators-PowerSOC) | `404` | 345.89ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:13` |
| 🔴 BROKEN | [https://github.com/NFSU-Cyber/GridGladiators-PowerSOC#arc...](https://github.com/NFSU-Cyber/GridGladiators-PowerSOC#architecture) | `404` | 238.53ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:17` |
| 🔴 BROKEN | [https://github.com/NFSU-Cyber/GridGladiators-PowerSOC/blo...](https://github.com/NFSU-Cyber/GridGladiators-PowerSOC/blob/main/README.md) | `404` | 357.18ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:20` |
| 🔴 BROKEN | [https://github.com/NFSU-Cyber/GridGladiators-PowerSOC/tre...](https://github.com/NFSU-Cyber/GridGladiators-PowerSOC/tree/main/docs/SIH1389_PowerSOC_Defense.pdf) | `404` | 410.44ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:18` |
| 🔴 BROKEN | [https://github.com/NP-compete/Alternate-Authentication/bl...](https://github.com/NP-compete/Alternate-Authentication/blob/main/README.md) | `404` | 424.94ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_18_passchain_auth.md:19` |
| 🔴 BROKEN | [https://github.com/NP-compete/Alternate-Authentication/tr...](https://github.com/NP-compete/Alternate-Authentication/tree/main/docs/PassChain_SIH2020.pdf) | `404` | 490.8ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_18_passchain_auth.md:17` |
| 🔴 BROKEN | [https://github.com/Nihar-Ranjan-Sahu](https://github.com/Nihar-Ranjan-Sahu) | `404` | 343.36ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_19_fir_vault_ledger.md:13` *(+1 more)* |
| 🔴 BROKEN | [https://github.com/Nihar-Ranjan-Sahu#overview](https://github.com/Nihar-Ranjan-Sahu#overview) | `404` | 281.43ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_19_fir_vault_ledger.md:16` |
| 🔴 BROKEN | [https://github.com/Nihar-Ranjan-Sahu/README.md](https://github.com/Nihar-Ranjan-Sahu/README.md) | `404` | 340.88ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_19_fir_vault_ledger.md:19` |
| 🔴 BROKEN | [https://github.com/Nihar-Ranjan-Sahu/docs/FIR_Vault_SIH20...](https://github.com/Nihar-Ranjan-Sahu/docs/FIR_Vault_SIH2022_Presentation.pdf) | `404` | 230.86ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_19_fir_vault_ledger.md:17` |
| 🔴 BROKEN | [https://github.com/PushkarJaiswal06/SatyaSetu](https://github.com/PushkarJaiswal06/SatyaSetu) | `404` | 351.9ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_14_satyasetu_fake_news_ledger.md:13` |
| 🔴 BROKEN | [https://github.com/PushkarJaiswal06/SatyaSetu#demo-portal](https://github.com/PushkarJaiswal06/SatyaSetu#demo-portal) | `404` | 230.57ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_14_satyasetu_fake_news_ledger.md:16` |
| 🔴 BROKEN | [https://github.com/PushkarJaiswal06/SatyaSetu/blob/main/R...](https://github.com/PushkarJaiswal06/SatyaSetu/blob/main/README.md) | `404` | 367.86ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_14_satyasetu_fake_news_ledger.md:19` |
| 🔴 BROKEN | [https://github.com/PushkarJaiswal06/SatyaSetu/tree/main/d...](https://github.com/PushkarJaiswal06/SatyaSetu/tree/main/docs/SatyaSetu_SIH_Presentation.pdf) | `404` | 348.28ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_14_satyasetu_fake_news_ledger.md:17` |
| 🔴 BROKEN | [https://github.com/RajnishPuri/KnitKraft/tree/main/KnitKr...](https://github.com/RajnishPuri/KnitKraft/tree/main/KnitKraft_App) | `404` | 579.29ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_38_knitkraft_wool_supply_chain.md:14` |
| 🔴 BROKEN | [https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footpr...](https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter) | `404` | 363.99ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_09_skcet_darknet_crypto_engine.md:13` |
| 🔴 BROKEN | [https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footpr...](https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter#overview) | `404` | 298.11ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_09_skcet_darknet_crypto_engine.md:16` |
| 🔴 BROKEN | [https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footpr...](https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter/blob/main/README.md) | `404` | 309.86ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_09_skcet_darknet_crypto_engine.md:19` |
| 🔴 BROKEN | [https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footpr...](https://github.com/SKCET-CyberSquad/DarkNet-Crypto-Footprinter/tree/main/docs/NCB_GrandFinale_Dossier.pdf) | `404` | 310.85ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_09_skcet_darknet_crypto_engine.md:17` |
| 🔴 BROKEN | [https://github.com/SankalpChordia/Defendify-CryptoTracker](https://github.com/SankalpChordia/Defendify-CryptoTracker) | `404` | 337.41ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_03_defendify_cryptotracker.md:13` |
| 🔴 BROKEN | [https://github.com/SankalpChordia/Defendify-CryptoTracker...](https://github.com/SankalpChordia/Defendify-CryptoTracker#demo) | `404` | 178.82ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_03_defendify_cryptotracker.md:16` |
| 🔴 BROKEN | [https://github.com/SankalpChordia/Defendify-CryptoTracker...](https://github.com/SankalpChordia/Defendify-CryptoTracker/blob/main/README.md) | `404` | 342.33ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_03_defendify_cryptotracker.md:19` |
| 🔴 BROKEN | [https://github.com/SankalpChordia/Defendify-CryptoTracker...](https://github.com/SankalpChordia/Defendify-CryptoTracker/tree/main/docs/NTRO_SIH1445_Presentation.pdf) | `404` | 340.67ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_03_defendify_cryptotracker.md:17` |
| 🔴 BROKEN | [https://github.com/SiddharthKumar268/Anveshak/tree/main/d...](https://github.com/SiddharthKumar268/Anveshak/tree/main/docs/Anveshak_Defense_Deck.pdf) | `404` | 492.96ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_17_anveshak_threatshield.md:17` |
| 🔴 BROKEN | [https://github.com/SnehaDeshmukh28/AquaDB-Marine-GIS](https://github.com/SnehaDeshmukh28/AquaDB-Marine-GIS) | `404` | 304.07ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_21_aquadb_marine_pfz.md:14` |
| 🔴 BROKEN | [https://github.com/Team-Obviously/Fund-Trail-Analysis-Tool](https://github.com/Team-Obviously/Fund-Trail-Analysis-Tool) | `404` | 342.21ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_05_team_obviously_fund_trail.md:13` |
| 🔴 BROKEN | [https://github.com/Team-Obviously/Fund-Trail-Analysis-Too...](https://github.com/Team-Obviously/Fund-Trail-Analysis-Tool#live-demo) | `404` | 256.27ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_05_team_obviously_fund_trail.md:16` |
| 🔴 BROKEN | [https://github.com/Team-Obviously/Fund-Trail-Analysis-Too...](https://github.com/Team-Obviously/Fund-Trail-Analysis-Tool/blob/main/README.md) | `404` | 346.78ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_05_team_obviously_fund_trail.md:19` |
| 🔴 BROKEN | [https://github.com/Team-Obviously/Fund-Trail-Analysis-Too...](https://github.com/Team-Obviously/Fund-Trail-Analysis-Tool/tree/main/docs/KAVACH_KVH12_FundTrail.pdf) | `404` | 332.03ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_05_team_obviously_fund_trail.md:17` |
| 🔴 BROKEN | [https://github.com/Yashcoder2802/VoiceYourID/tree/master/...](https://github.com/Yashcoder2802/VoiceYourID/tree/master/backend) | `404` | 440.61ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_41_voiceyourid_biometrics.md:14` |
| 🔴 BROKEN | [https://github.com/amanetize/SIH_23/tree/main/rag_engine](https://github.com/amanetize/SIH_23/tree/main/rag_engine) | `404` | 448.06ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_33_aicte_rag_portal.md:14` |
| 🔴 BROKEN | [https://github.com/aritradhabal/TrailMine/blob/main/READM...](https://github.com/aritradhabal/TrailMine/blob/main/README.md) | `404` | 407.95ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_02_trailmine_ncb.md:19` |
| 🔴 BROKEN | [https://github.com/aritradhabal/TrailMine/tree/main/docs/...](https://github.com/aritradhabal/TrailMine/tree/main/docs/TrailMine_NCB_Defense_Deck.pdf) | `404` | 468.82ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_02_trailmine_ncb.md:17` |
| 🔴 BROKEN | [https://github.com/ashutosh7i/VoteChain/tree/main/docs/Vo...](https://github.com/ashutosh7i/VoteChain/tree/main/docs/VoteChain_SIH2024_Pitch.pdf) | `404` | 504.43ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_08_votechain_decentralized_ballot.md:17` |
| 🔴 BROKEN | [https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler](https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler) | `404` | 333.66ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_04_cyph3r_darkweb.md:13` |
| 🔴 BROKEN | [https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler#readme](https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler#readme) | `404` | 306.9ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_04_cyph3r_darkweb.md:16` |
| 🔴 BROKEN | [https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler/blob...](https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler/blob/main/README.md) | `404` | 315.9ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_04_cyph3r_darkweb.md:19` |
| 🔴 BROKEN | [https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler/tree...](https://github.com/guneetsura/Cyph3r-DarkWeb-Crawler/tree/main/docs/KAVACH_KVH06_Cyph3r.pdf) | `404` | 368.48ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_04_cyph3r_darkweb.md:17` |
| 🔴 BROKEN | [https://github.com/iamakashrout/SIH-2023/tree/main/ml_models](https://github.com/iamakashrout/SIH-2023/tree/main/ml_models) | `404` | 489.16ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_32_automated_news_categorizer.md:14` |
| 🔴 BROKEN | [https://github.com/iiitkottayam/SonsOfPitches-AT980](https://github.com/iiitkottayam/SonsOfPitches-AT980) | `404` | 306.28ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_16_sons_of_pitches_at980.md:13` |
| 🔴 BROKEN | [https://github.com/iiitkottayam/SonsOfPitches-AT980#overview](https://github.com/iiitkottayam/SonsOfPitches-AT980#overview) | `404` | 263.61ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_16_sons_of_pitches_at980.md:16` |
| 🔴 BROKEN | [https://github.com/iiitkottayam/SonsOfPitches-AT980/blob/...](https://github.com/iiitkottayam/SonsOfPitches-AT980/blob/main/README.md) | `404` | 309.87ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_16_sons_of_pitches_at980.md:19` |
| 🔴 BROKEN | [https://github.com/iiitkottayam/SonsOfPitches-AT980/tree/...](https://github.com/iiitkottayam/SonsOfPitches-AT980/tree/main/docs/AT980_MP_Police_Presentation.pdf) | `404` | 344.74ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_16_sons_of_pitches_at980.md:17` |
| 🔴 BROKEN | [https://github.com/kunalkeshan/eVault-SIH-2023/tree/main/...](https://github.com/kunalkeshan/eVault-SIH-2023/tree/main/docs/presentation_deck.pdf) | `404` | 494.13ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_01_legal_ledger_evault.md:18` |
| 🔴 BROKEN | [https://github.com/madastra/aluminum-casting-ai](https://github.com/madastra/aluminum-casting-ai) | `404` | 314.67ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_28_mad_astra_metallurgy.md:14` |
| 🔴 BROKEN | [https://github.com/mahajanhrishikesh/Levels/tree/master/f...](https://github.com/mahajanhrishikesh/Levels/tree/master/frontend) | `404` | 479.5ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_23_levels_ground_water.md:14` |
| 🔴 BROKEN | [https://github.com/muskangoyal0606/SIH_2024/tree/main/ml_...](https://github.com/muskangoyal0606/SIH_2024/tree/main/ml_pipeline) | `404` | 428.18ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_29_asterominer_ai.md:14` |
| 🔴 BROKEN | [https://github.com/prathampoojari/AssetSentinels-DCIM](https://github.com/prathampoojari/AssetSentinels-DCIM) | `404` | 315.39ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_07_assetsentinels_dcim.md:13` |
| 🔴 BROKEN | [https://github.com/prathampoojari/AssetSentinels-DCIM#liv...](https://github.com/prathampoojari/AssetSentinels-DCIM#live-demo) | `404` | 256.65ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_07_assetsentinels_dcim.md:16` |
| 🔴 BROKEN | [https://github.com/prathampoojari/AssetSentinels-DCIM/blo...](https://github.com/prathampoojari/AssetSentinels-DCIM/blob/main/README.md) | `404` | 369.33ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_07_assetsentinels_dcim.md:19` |
| 🔴 BROKEN | [https://github.com/prathampoojari/AssetSentinels-DCIM/tre...](https://github.com/prathampoojari/AssetSentinels-DCIM/tree/main/docs/SIH1461_AssetSentinels_Deck.pdf) | `404` | 318.02ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_07_assetsentinels_dcim.md:17` |
| 🔴 BROKEN | [https://github.com/radar-vision/radar-camera-fusion](https://github.com/radar-vision/radar-camera-fusion) | `404` | 352.77ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_30_radar_vision_fusion.md:14` |
| 🔴 BROKEN | [https://github.com/shubhrai2811/SIH-2022-Fourier-Encoder-...](https://github.com/shubhrai2811/SIH-2022-Fourier-Encoder-Decoder/tree/main/dsp_engine) | `404` | 454.76ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_39_fourier_acoustic_police_radio.md:14` |
| 🔴 BROKEN | [https://github.com/skcet-official](https://github.com/skcet-official) | `404` | 303.7ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_09_skcet_darknet_crypto_engine.md:15` |
| 🔴 BROKEN | [https://github.com/somaiya-cyber/Fund-Trail-Engine](https://github.com/somaiya-cyber/Fund-Trail-Engine) | `404` | 349.5ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_05_team_obviously_fund_trail.md:15` |
| 🔴 BROKEN | [https://github.com/sons-of-pitches-sih/at980-forensic-search](https://github.com/sons-of-pitches-sih/at980-forensic-search) | `404` | 367.06ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_42_big_data_search_at980.md:14` |
| 🔴 BROKEN | [https://github.com/tanisha1707/MaitriAI](https://github.com/tanisha1707/MaitriAI) | `404` | 331.04ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_22_maitri_ai_isro.md:14` |
| 🔴 BROKEN | [https://github.com/vertexaisearch](https://github.com/vertexaisearch) | `404` | 321.3ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_10_forensicflow_ufdr.md:15` |
| 🔴 BROKEN | [https://github.com/vertexaisearch/ForensicFlow](https://github.com/vertexaisearch/ForensicFlow) | `404` | 307.87ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_10_forensicflow_ufdr.md:13` |
| 🔴 BROKEN | [https://github.com/vertexaisearch/ForensicFlow#readme](https://github.com/vertexaisearch/ForensicFlow#readme) | `404` | 186.81ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_10_forensicflow_ufdr.md:16` |
| 🔴 BROKEN | [https://github.com/vertexaisearch/ForensicFlow/blob/main/...](https://github.com/vertexaisearch/ForensicFlow/blob/main/README.md) | `404` | 320.72ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_10_forensicflow_ufdr.md:19` |
| 🔴 BROKEN | [https://github.com/vertexaisearch/ForensicFlow/tree/main/...](https://github.com/vertexaisearch/ForensicFlow/tree/main/docs/ForensicFlow_SIH_Defense.pdf) | `404` | 335.64ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_10_forensicflow_ufdr.md:17` |
| 🔴 BROKEN | [https://github.com/vinaynesta/BlockWizz/tree/main/docs/Bl...](https://github.com/vinaynesta/BlockWizz/tree/main/docs/BlockWizz_MoHUA_Deck.pdf) | `404` | 511.36ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_13_blockwizz_urban_infra.md:17` |
| ⚠️ WARNING | [http://localhost:8000](http://localhost:8000) | `N/A` | 19344.01ms | General Web Resource | `SIH_WINNING_PPT_BLUEPRINT.md:500` |
| ⚠️ WARNING | [http://localhost:3000](http://localhost:3000) | `500` | 499.73ms | General Web Resource | `JURY_QA_DEFENSE_PLAYBOOK.md:349` |
| 🔵 REDIRECT | [https://github.com/droidbaker/KisanSeva2](https://github.com/droidbaker/KisanSeva2) | `200` | 283.42ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_40_kisanseva2_smart_agri.md:13` |
| 🔵 REDIRECT | [https://github.com/droidbaker/KisanSeva2/tree/master/app](https://github.com/droidbaker/KisanSeva2/tree/master/app) | `200` | 697.76ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_40_kisanseva2_smart_agri.md:14` |
| 🔵 REDIRECT | [https://sagarteotia.in](https://sagarteotia.in) | `200` | 157.66ms | General Web Resource | `dossiers/ai_software/dossier_25_sangrakshan_cbrn_vr.md:15` |
| 🟢 VALID | [https://github.com/Aditya5510/AyurVaidya](https://github.com/Aditya5510/AyurVaidya) | `200` | 666.51ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_34_ayurvaidya_diagnostic.md:13` |
| 🟢 VALID | [https://github.com/Aniket-Kumar-Paul/Blockchain-powered-i...](https://github.com/Aniket-Kumar-Paul/Blockchain-powered-immutable-legal-records-ledger) | `200` | 608.91ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_01_legal_ledger_evault.md:16` |
| 🟢 VALID | [https://github.com/Arjun-254/SIH1348_LichtDenCode](https://github.com/Arjun-254/SIH1348_LichtDenCode) | `200` | 629.46ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_26_railwaybuddy_translator.md:13` |
| 🟢 VALID | [https://github.com/Arohi-jd](https://github.com/Arohi-jd) | `200` | 625.25ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_15_nivesh_nidhi_chitchain.md:15` |
| 🟢 VALID | [https://github.com/ArshTiwari2004/Signal-X](https://github.com/ArshTiwari2004/Signal-X) | `200` | 1757.72ms | GitHub Repository / Asset | `CATALOG.md:177` *(+1 more)* |
| 🟢 VALID | [https://github.com/AtharvaKarekar](https://github.com/AtharvaKarekar) | `200` | 439.58ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:15` |
| 🟢 VALID | [https://github.com/DakshDadhania](https://github.com/DakshDadhania) | `200` | 482.91ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_11_cryptonite_phishing_guard.md:15` |
| 🟢 VALID | [https://github.com/IIITKottayam](https://github.com/IIITKottayam) | `200` | 587.32ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_42_big_data_search_at980.md:13` |
| 🟢 VALID | [https://github.com/NP-compete/Alternate-Authentication](https://github.com/NP-compete/Alternate-Authentication) | `200` | 823.18ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_18_passchain_auth.md:13` |
| 🟢 VALID | [https://github.com/NP-compete/Alternate-Authentication#demo](https://github.com/NP-compete/Alternate-Authentication#demo) | `200` | 725.47ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_18_passchain_auth.md:16` |
| 🟢 VALID | [https://github.com/OpenVPN/openvpn](https://github.com/OpenVPN/openvpn) | `200` | 582.96ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:16` |
| 🟢 VALID | [https://github.com/PushkarJaiswal06](https://github.com/PushkarJaiswal06) | `200` | 537.02ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_14_satyasetu_fake_news_ledger.md:15` |
| 🟢 VALID | [https://github.com/RajnishPuri/KnitKraft](https://github.com/RajnishPuri/KnitKraft) | `200` | 663.18ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_38_knitkraft_wool_supply_chain.md:13` |
| 🟢 VALID | [https://github.com/SagarTeotia1](https://github.com/SagarTeotia1) | `200` | 523.33ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_25_sangrakshan_cbrn_vr.md:14` |
| 🟢 VALID | [https://github.com/SagarTeotia1/NDRF-DEMO-SANGRAKSHAN](https://github.com/SagarTeotia1/NDRF-DEMO-SANGRAKSHAN) | `200` | 695.66ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_25_sangrakshan_cbrn_vr.md:13` |
| 🟢 VALID | [https://github.com/SankalpChordia](https://github.com/SankalpChordia) | `200` | 391.29ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_03_defendify_cryptotracker.md:15` |
| 🟢 VALID | [https://github.com/SiddharthKumar268](https://github.com/SiddharthKumar268) | `200` | 497.56ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_17_anveshak_threatshield.md:15` |
| 🟢 VALID | [https://github.com/SiddharthKumar268/Anveshak](https://github.com/SiddharthKumar268/Anveshak) | `200` | 1772.24ms | GitHub Repository / Asset | `CATALOG.md:172` *(+1 more)* |
| 🟢 VALID | [https://github.com/SiddharthKumar268/Anveshak#demo](https://github.com/SiddharthKumar268/Anveshak#demo) | `200` | 23.53ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_17_anveshak_threatshield.md:16` |
| 🟢 VALID | [https://github.com/SiddharthKumar268/Anveshak/blob/main/R...](https://github.com/SiddharthKumar268/Anveshak/blob/main/README.md) | `200` | 628.27ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_17_anveshak_threatshield.md:19` |
| 🟢 VALID | [https://github.com/SnehaDeshmukh28](https://github.com/SnehaDeshmukh28) | `200` | 479.85ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_21_aquadb_marine_pfz.md:13` |
| 🟢 VALID | [https://github.com/Yashcoder2802/VoiceYourID](https://github.com/Yashcoder2802/VoiceYourID) | `200` | 580.52ms | GitHub Repository / Asset | `CATALOG.md:181` *(+1 more)* |
| 🟢 VALID | [https://github.com/amanetize/SIH_23](https://github.com/amanetize/SIH_23) | `200` | 1780.77ms | GitHub Repository / Asset | `CATALOG.md:178` *(+1 more)* |
| 🟢 VALID | [https://github.com/amansharma1916/Green-Atlas](https://github.com/amansharma1916/Green-Atlas) | `200` | 1699.78ms | GitHub Repository / Asset | `CATALOG.md:176` *(+1 more)* |
| 🟢 VALID | [https://github.com/amansharma1916/Green-Atlas/tree/main/b...](https://github.com/amansharma1916/Green-Atlas/tree/main/backend) | `200` | 579.6ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_27_green_atlas_fra_webgis.md:14` |
| 🟢 VALID | [https://github.com/aritradhabal](https://github.com/aritradhabal) | `200` | 390.28ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_02_trailmine_ncb.md:15` |
| 🟢 VALID | [https://github.com/aritradhabal/TrailMine](https://github.com/aritradhabal/TrailMine) | `200` | 1723.29ms | GitHub Repository / Asset | `CATALOG.md:169` *(+1 more)* |
| 🟢 VALID | [https://github.com/aritradhabal/TrailMine#readme](https://github.com/aritradhabal/TrailMine#readme) | `200` | 24.7ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_02_trailmine_ncb.md:16` |
| 🟢 VALID | [https://github.com/ashutosh7i](https://github.com/ashutosh7i) | `200` | 620.86ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_08_votechain_decentralized_ballot.md:15` |
| 🟢 VALID | [https://github.com/ashutosh7i/VoteChain](https://github.com/ashutosh7i/VoteChain) | `200` | 1837.1ms | GitHub Repository / Asset | `CATALOG.md:170` *(+1 more)* |
| 🟢 VALID | [https://github.com/ashutosh7i/VoteChain#demo](https://github.com/ashutosh7i/VoteChain#demo) | `200` | 26.79ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_08_votechain_decentralized_ballot.md:16` |
| 🟢 VALID | [https://github.com/ashutosh7i/VoteChain/blob/main/README.md](https://github.com/ashutosh7i/VoteChain/blob/main/README.md) | `200` | 651.69ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_08_votechain_decentralized_ballot.md:19` |
| 🟢 VALID | [https://github.com/gauravmasand/Indian-Sign-Language-SIH](https://github.com/gauravmasand/Indian-Sign-Language-SIH) | `200` | 1709.27ms | GitHub Repository / Asset | `CATALOG.md:179` *(+1 more)* |
| 🟢 VALID | [https://github.com/gauravmasand/SIH-ISL-Mobile-App-Flutter](https://github.com/gauravmasand/SIH-ISL-Mobile-App-Flutter) | `200` | 543.51ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_36_mudra_isl_two_way.md:15` |
| 🟢 VALID | [https://github.com/gauravmasand/isl-server-sih](https://github.com/gauravmasand/isl-server-sih) | `200` | 545.02ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_36_mudra_isl_two_way.md:13` |
| 🟢 VALID | [https://github.com/guneetsura](https://github.com/guneetsura) | `200` | 488.18ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_04_cyph3r_darkweb.md:15` |
| 🟢 VALID | [https://github.com/iamakashrout/SIH-2023](https://github.com/iamakashrout/SIH-2023) | `200` | 547.49ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_32_automated_news_categorizer.md:13` |
| 🟢 VALID | [https://github.com/iiitkottayam](https://github.com/iiitkottayam) | `200` | 678.42ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_16_sons_of_pitches_at980.md:15` |
| 🟢 VALID | [https://github.com/kunalkeshan/eVault-SIH-2023](https://github.com/kunalkeshan/eVault-SIH-2023) | `200` | 1819.83ms | GitHub Repository / Asset | `CATALOG.md:168` *(+1 more)* |
| 🟢 VALID | [https://github.com/kunalkeshan/eVault-SIH-2023#live-preview](https://github.com/kunalkeshan/eVault-SIH-2023#live-preview) | `200` | 45.28ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_01_legal_ledger_evault.md:17` |
| 🟢 VALID | [https://github.com/kunalkeshan/eVault-SIH-2023/blob/main/...](https://github.com/kunalkeshan/eVault-SIH-2023/blob/main/README.md) | `200` | 584.71ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_01_legal_ledger_evault.md:20` |
| 🟢 VALID | [https://github.com/madastra](https://github.com/madastra) | `200` | 376.01ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_28_mad_astra_metallurgy.md:13` |
| 🟢 VALID | [https://github.com/mahajanhrishikesh/Levels](https://github.com/mahajanhrishikesh/Levels) | `200` | 1789.4ms | GitHub Repository / Asset | `CATALOG.md:174` *(+1 more)* |
| 🟢 VALID | [https://github.com/muskangoyal0606/SIH_2024](https://github.com/muskangoyal0606/SIH_2024) | `200` | 622.27ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_29_asterominer_ai.md:13` |
| 🟢 VALID | [https://github.com/prajwalchapke055](https://github.com/prajwalchapke055) | `200` | 418.86ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_37_alha_industrial_drone.md:14` |
| 🟢 VALID | [https://github.com/prajwalchapke055/SIH-1505---Smart-Indi...](https://github.com/prajwalchapke055/SIH-1505---Smart-India-Hackathon-2023) | `200` | 656.87ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_37_alha_industrial_drone.md:13` |
| 🟢 VALID | [https://github.com/prathampoojari](https://github.com/prathampoojari) | `200` | 413.92ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_07_assetsentinels_dcim.md:15` |
| 🟢 VALID | [https://github.com/pt3002/HexxCode-SIH-2023](https://github.com/pt3002/HexxCode-SIH-2023) | `200` | 1755.37ms | GitHub Repository / Asset | `CATALOG.md:175` *(+1 more)* |
| 🟢 VALID | [https://github.com/pt3002/HexxCode-SIH-2023/tree/main/client](https://github.com/pt3002/HexxCode-SIH-2023/tree/main/client) | `200` | 510.39ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_24_shiksha_niyojak_aicte.md:14` |
| 🟢 VALID | [https://github.com/radar-vision](https://github.com/radar-vision) | `200` | 382.36ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_30_radar_vision_fusion.md:13` |
| 🟢 VALID | [https://github.com/shivamintheloop/KisanSeva2](https://github.com/shivamintheloop/KisanSeva2) | `200` | 732.51ms | GitHub Repository / Asset | `CATALOG.md:180` |
| 🟢 VALID | [https://github.com/shubhrai2811/SIH-2022-Fourier-Encoder-...](https://github.com/shubhrai2811/SIH-2022-Fourier-Encoder-Decoder) | `200` | 573.02ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_39_fourier_acoustic_police_radio.md:13` |
| 🟢 VALID | [https://github.com/sohamdutta](https://github.com/sohamdutta) | `200` | 405.75ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_18_passchain_auth.md:15` |
| 🟢 VALID | [https://github.com/tani321](https://github.com/tani321) | `200` | 493.49ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_20_bluecarbonnexus_mrv.md:15` |
| 🟢 VALID | [https://github.com/tani321/-finalbluecarbonnexus-blockchain](https://github.com/tani321/-finalbluecarbonnexus-blockchain) | `200` | 1690.99ms | GitHub Repository / Asset | `CATALOG.md:173` *(+1 more)* |
| 🟢 VALID | [https://github.com/tani321/-finalbluecarbonnexus-blockcha...](https://github.com/tani321/-finalbluecarbonnexus-blockchain#live-demo) | `200` | 23.67ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_20_bluecarbonnexus_mrv.md:16` |
| 🟢 VALID | [https://github.com/tani321/-finalbluecarbonnexus-blockcha...](https://github.com/tani321/-finalbluecarbonnexus-blockchain/blob/main/README.md) | `200` | 377.44ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_20_bluecarbonnexus_mrv.md:19` |
| 🟢 VALID | [https://github.com/tani321/-finalbluecarbonnexus-blockcha...](https://github.com/tani321/-finalbluecarbonnexus-blockchain/tree/main/docs/BlueCarbonNexus_Defense_Deck.pdf) | `200` | 422.08ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_20_bluecarbonnexus_mrv.md:17` |
| 🟢 VALID | [https://github.com/tanisha1707](https://github.com/tanisha1707) | `200` | 562.73ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_22_maitri_ai_isro.md:13` |
| 🟢 VALID | [https://github.com/uzibytes/Voco_App](https://github.com/uzibytes/Voco_App) | `200` | 541.41ms | GitHub Repository / Asset | `dossiers/ai_software/dossier_35_voco_accessibility.md:13` |
| 🟢 VALID | [https://github.com/vinaynesta](https://github.com/vinaynesta) | `200` | 472.4ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_13_blockwizz_urban_infra.md:15` |
| 🟢 VALID | [https://github.com/vinaynesta/BlockWizz](https://github.com/vinaynesta/BlockWizz) | `200` | 1805.33ms | GitHub Repository / Asset | `CATALOG.md:171` *(+1 more)* |
| 🟢 VALID | [https://github.com/vinaynesta/BlockWizz#demo-preview](https://github.com/vinaynesta/BlockWizz#demo-preview) | `200` | 21.41ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_13_blockwizz_urban_infra.md:16` |
| 🟢 VALID | [https://github.com/vinaynesta/BlockWizz/blob/main/README.md](https://github.com/vinaynesta/BlockWizz/blob/main/README.md) | `200` | 523.24ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_13_blockwizz_urban_infra.md:19` |
| 🟢 VALID | [https://github.com/viperadnan-git/blockdoc](https://github.com/viperadnan-git/blockdoc) | `200` | 971.69ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_01_legal_ledger_evault.md:15` |
| 🟢 VALID | [https://github.com/wazuh/wazuh](https://github.com/wazuh/wazuh) | `200` | 654.47ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:15` |
| 🟢 VALID | [https://github.com/zeek/zeek](https://github.com/zeek/zeek) | `200` | 676.47ms | GitHub Repository / Asset | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:16` |
| 🟢 VALID | [https://iiitkottayam.ac.in](https://iiitkottayam.ac.in) | `200` | 389.78ms | General Web Resource | `dossiers/ai_software/dossier_42_big_data_search_at980.md:15` |
| 🟢 VALID | [https://img.shields.io/badge/Jury%20Defense-12%20Objectio...](https://img.shields.io/badge/Jury%20Defense-12%20Objection%20Models-orange.svg) | `200` | 3218.12ms | General Web Resource | `README.md:6` |
| 🟢 VALID | [https://img.shields.io/badge/Link%20Verifier-Async%20Engi...](https://img.shields.io/badge/Link%20Verifier-Async%20Engine%20v2.4-green.svg) | `200` | 879.48ms | General Web Resource | `README.md:7` |
| 🟢 VALID | [https://img.shields.io/badge/Pitch%20Deck-8--Slide%20Arch...](https://img.shields.io/badge/Pitch%20Deck-8--Slide%20Architecture-purple.svg) | `200` | 310.59ms | General Web Resource | `README.md:5` |
| 🟢 VALID | [https://img.shields.io/badge/SIH-2020--2025-blue.svg](https://img.shields.io/badge/SIH-2020--2025-blue.svg) | `200` | 300.04ms | General Web Resource | `README.md:3` |
| 🟢 VALID | [https://img.shields.io/badge/Verified%20Dossiers-42%20Cha...](https://img.shields.io/badge/Verified%20Dossiers-42%20Champions-emerald.svg) | `200` | 255.89ms | General Web Resource | `README.md:4` |
| 🟢 VALID | [https://medium.com/@madastra](https://medium.com/@madastra) | `200` | 590.35ms | Technical Blog / Post-Mortem | `dossiers/ai_software/dossier_28_mad_astra_metallurgy.md:18` |
| 🟢 VALID | [https://sih.gov.in](https://sih.gov.in) | `200` | 110.22ms | Official Government / Ministry Portal | `README.md:3` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Alternate+Au...](https://www.youtube.com/results?search_query=Alternate+Authentication+PassChain+SIH+2020) | `200` | 614.51ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_18_passchain_auth.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Anveshak+Thr...](https://www.youtube.com/results?search_query=Anveshak+ThreatShield+SIH+Siddharth+Kumar) | `200` | 508.3ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_17_anveshak_threatshield.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=AssetSentine...](https://www.youtube.com/results?search_query=AssetSentinels+SIH+2023+SAKEC) | `200` | 717.54ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_07_assetsentinels_dcim.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=BitHeads+Ope...](https://www.youtube.com/results?search_query=BitHeads+OpenVPN+Scanner+SIH+2023+NTRO) | `200` | 600.09ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_12_bitheads_openvpn_scanner.md:19` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=BlockWizz+SI...](https://www.youtube.com/results?search_query=BlockWizz+SIH+2022+Vinay+Nesta) | `200` | 489.79ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_13_blockwizz_urban_infra.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=BlueCarbonNe...](https://www.youtube.com/results?search_query=BlueCarbonNexus+Blockchain+MRV+SIH) | `200` | 595.48ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_20_bluecarbonnexus_mrv.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Cryptonite+A...](https://www.youtube.com/results?search_query=Cryptonite+Anti+Phishing+SIH+2023+NTRO) | `200` | 524.37ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_11_cryptonite_phishing_guard.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Cyph3r+KAVAC...](https://www.youtube.com/results?search_query=Cyph3r+KAVACH+2023+dark+web+crawler) | `200` | 618.07ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_04_cyph3r_darkweb.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Defendify+Cr...](https://www.youtube.com/results?search_query=Defendify+CryptoTracker+SIH+2023+NTRO) | `200` | 795.9ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_03_defendify_cryptotracker.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=FIR+Vault+SI...](https://www.youtube.com/results?search_query=FIR+Vault+SIH+2022+Nihar+Ranjan+Sahu) | `200` | 473.16ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_19_fir_vault_ledger.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=ForensicFlow...](https://www.youtube.com/results?search_query=ForensicFlow+UFDR+Analyzer+SIH) | `200` | 667.67ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_10_forensicflow_ufdr.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Fund+Trail+A...](https://www.youtube.com/results?search_query=Fund+Trail+Analysis+Tool+KAVACH+2023) | `200` | 649.34ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_05_team_obviously_fund_trail.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Grid+Gladiat...](https://www.youtube.com/results?search_query=Grid+Gladiators+SIH+2023+Power+SOC) | `200` | 659.19ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_06_grid_gladiators_power_soc.md:19` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Nivesh+Nidhi...](https://www.youtube.com/results?search_query=Nivesh+Nidhi+ChitChain+SIH+Arohi+Jadhav) | `200` | 576.43ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_15_nivesh_nidhi_chitchain.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=SKCET+Darkne...](https://www.youtube.com/results?search_query=SKCET+Darknet+Hackathon+Amit+Shah+NCB) | `200` | 516.88ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_09_skcet_darknet_crypto_engine.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=SatyaSetu+Pu...](https://www.youtube.com/results?search_query=SatyaSetu+Pushkar+Jaiswal+SIH) | `200` | 599.36ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_14_satyasetu_fake_news_ledger.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=Sons+of+Pitc...](https://www.youtube.com/results?search_query=Sons+of+Pitches+SIH+2022+IIIT+Kottayam+AT980) | `200` | 495.72ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_16_sons_of_pitches_at980.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=TrailMine+NC...](https://www.youtube.com/results?search_query=TrailMine+NCB+SIH+2024+cryptocurrency+tracker) | `200` | 807.91ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_02_trailmine_ncb.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=VoteChain+SI...](https://www.youtube.com/results?search_query=VoteChain+SIH+2024+Aashutosh+Soni) | `200` | 515.19ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_08_votechain_decentralized_ballot.md:18` |
| 🟢 VALID | [https://www.youtube.com/results?search_query=eVault+SIH+2...](https://www.youtube.com/results?search_query=eVault+SIH+2023+blockchain+legal+records) | `200` | 834.11ms | Video Demonstration | `dossiers/cyber_blockchain/dossier_01_legal_ledger_evault.md:19` |

---

## 4. Verification Engine Architecture & Methodology

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ASYNC VERIFICATION WORKFLOW                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Markdown Parser       ──> Recursively scans all 42 dossiers, blueprints & playbooks.         │
│ 2. URL Normalizer        ──> Strips markdown delimiters, brackets, trailing punctuation.        │
│ 3. Category Classifier   ──> Classifies URL (GitHub, Video, Presentation, Blog, Govt Portal).   │
│ 4. Fast-Path HEAD Probe  ──> Sends lightweight HEAD request with Chrome User-Agent.              │
│ 5. GET Fallback Stream   ──> In case of 405/403/500, performs byte-range GET to confirm alive.  │
│ 6. WAF & Bot Gate Check  ──> Detects Cloudflare/Medium/Drive bot defenses vs actual 404 errors.  │
│ 7. Dual Output Sync      ──> Emits verification_log.json & VERIFICATION_REPORT.md in real-time.  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Continuous Verification & Local Reproduction
To re-run the verification engine locally at any time:
```bash
# From the root repository directory
python WINNING_RESOURCES/scripts/verify_links.py
```

---
*Automated report generated by SIH Web Intelligence & Research Engine.*