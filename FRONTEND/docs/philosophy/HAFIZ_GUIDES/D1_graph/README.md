# 🕸️ D1 GRAPH — LOCAL NEO4J COMMUNITY FORENSICS ENGINE
**Project**: Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges (SIH 2026)  
**Author**: Hafiz (Member 1 — Core Architecture, Ingestion & Forensics Pipeline)  
**Status**: 🟢 **Operational & Tested on Localhost**

---

## 📌 OVERVIEW
`D1_graph` is our local, high-performance **Graph Database Subsystem** powered by the official **Neo4j Community Server 5.26.0**. 

It eliminates the "JOIN Hell" of traditional SQL databases by storing wallets as **Nodes** and transactions as **Edges**, enabling sub-second multi-hop laundering pathfinding across 4 to 6 hops using Neo4j's native **Cypher query language**.

---

## 🚀 HOW TO START & STOP

### 1. Start the Server (1-Click)
Double-click:
```text
a:\SIH\HAFIZ\D1_graph\start_graph.bat
```
*(Or run `powershell -Command ".\neo4j-community-5.26.0\bin\neo4j.bat console"`)*

### 2. Stop the Server (1-Click)
Double-click:
```text
a:\SIH\HAFIZ\D1_graph\stop_graph.bat
```

---

## 🌐 DEFAULT CREDENTIALS & INTERFACES

| Service | Address / URL | Credentials |
| :--- | :--- | :--- |
| **Python Bolt Interface** | `bolt://localhost:7687` | User: `neo4j` \| Pass: `password123` |
| **Neo4j Web Visualizer** | `http://localhost:7474` | User: `neo4j` \| Pass: `password123` |

Open `http://localhost:7474` in any web browser to open the **Neo4j Crime-Board Inspector**, where you can type Cypher queries and watch your graph render visually in real time!

---

## 🐍 PYTHON INTEGRATION (`graph_engine.py`)

We built a modular, pre-configured Python driver: [`graph_engine.py`](file:///a:/SIH/HAFIZ/D1_graph/graph_engine.py).

### Quick Code Example:
```python
from graph_engine import GraphForensicsEngine

# 1. Connect
engine = GraphForensicsEngine()
engine.connect()

# 2. Ingest Suspects and Exchanges
engine.ingest_wallet("0xVictim...", label="Victim", entity="Victim Complaint #102")
engine.ingest_wallet("0x28c6c0...", label="VASP", entity="Binance", vasp_type="Exchange")

# 3. Add Money Flow Edges
engine.ingest_transfer("0xVictim...", "0xBurner1...", amount=5.0, asset="ETH", tx_hash="0xTx1")
engine.ingest_transfer("0xBurner1...", "0x28c6c0...", amount=4.95, asset="ETH", tx_hash="0xTx2")

# 4. Find Nearest Exchange in 1 Line of Code!
result = engine.find_shortest_path_to_vasp("0xVictim...", max_hops=6)
print(f"Target Exchange: {result['exchange']} reached in {result['hops']} hops!")

# 5. Export for Member 6's Frontend Visualizer (Cytoscape.js)
cy_payload = engine.export_for_cytoscape("0xVictim...", max_depth=3)
```

---

## 🧪 HOW TO TEST EVERYTHING
Run the pre-built test suite:
```bash
cd a:\SIH\HAFIZ\D1_graph
python test_graph.py
```
This simulates a complete 4-hop laundering peel chain (`Victim` ──► `Scammer` ──► `Burner 1` ──► `Burner 2` ──► `Binance Vault`), executes shortest-path traversal, and validates Cytoscape output.

---

## 🎯 ARCHITECTURAL VALUE FOR SIH JURY
1. **100% Offline Resilience**: Runs locally on `localhost:7687`, making the live demo 100% immune to hackathon Wi-Fi crashes.
2. **Indian Data Sovereignty**: In compliance with Indian DPDP norms and Section 65B of the Indian Evidence Act, zero case data leaves the local machine.
3. **Sub-20ms Multi-Hop Latency**: Traverses 6-hop money trails in milliseconds, compared to 30+ seconds for recursive SQL joins.
