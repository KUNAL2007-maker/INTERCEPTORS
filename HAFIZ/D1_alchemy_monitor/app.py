"""
D1 Draft — Alchemy Blockchain Monitor
SIH Project: Real-Time Fraud-Linked Crypto Exchange Identification
100% Real Blockchain Data via Alchemy API
"""

import hashlib
import hmac
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

import requests as http_requests
import urllib3
from flask import Flask, jsonify, render_template, request, session

# Suppress insecure HTTPS warnings for Windows SSL environments
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
app.secret_key = os.urandom(32)

# ── User's Verified Working API Key ───────────────────────────────────────────
DEFAULT_API_KEY = "alch_kIo4QuIe1KN7vkoZVZuDc"

# ── Network base URLs ──────────────────────────────────────────────────────────
NETWORKS = {
    "eth-mainnet":     {"name": "Ethereum Mainnet",  "url": "https://eth-mainnet.g.alchemy.com/v2"},
    "polygon-mainnet": {"name": "Polygon Mainnet",   "url": "https://polygon-mainnet.g.alchemy.com/v2"},
    "arb-mainnet":     {"name": "Arbitrum Mainnet",  "url": "https://arb-mainnet.g.alchemy.com/v2"},
    "opt-mainnet":     {"name": "Optimism Mainnet",  "url": "https://opt-mainnet.g.alchemy.com/v2"},
    "base-mainnet":    {"name": "Base Mainnet",      "url": "https://base-mainnet.g.alchemy.com/v2"},
    "eth-sepolia":     {"name": "Sepolia Testnet",   "url": "https://eth-sepolia.g.alchemy.com/v2"},
}

# ── Known Entities Directory (For SIH Exchange / VASP Attribution) ─────────────
KNOWN_ENTITIES = {
    "0x28c6c06298d514db089934071355e5743bf21d60": {"name": "Binance 14 (Hot Wallet)", "type": "exchange"},
    "0x21a31ee1afc51d94c2efccaa2092ad1028285549": {"name": "Binance 15", "type": "exchange"},
    "0xdfd5293d8e347dfee59e53b21095066f10c1d088": {"name": "Binance 16", "type": "exchange"},
    "0xa090e60c5100939cfd845104d95e8546f4ff4c60": {"name": "Coinbase Hot Wallet", "type": "exchange"},
    "0x503828976d22510aad0201ac7ec88293211d23dc": {"name": "Coinbase 2", "type": "exchange"},
    "0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0": {"name": "Kraken 4", "type": "exchange"},
    "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": {"name": "OKX Hot Wallet", "type": "exchange"},
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045": {"name": "vitalik.eth (Vitalik Buterin)", "type": "individual"},
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96": {"name": "Ronin Bridge Exploiter (Suspect Hacker)", "type": "scam"},
    "0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a": {"name": "Fake Phishing Scammer (Reported)", "type": "scam"},
    "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc": {"name": "Tornado Cash Router (Mixer)", "type": "mixer"},
    "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": {"name": "Tornado Cash 0.1 ETH", "type": "mixer"},
    "0xe592427a0aece92de3edee1f18e0157c05861564": {"name": "Uniswap V3 Swap Router", "type": "defi"},
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": {"name": "Uniswap V2 Router", "type": "defi"},
    "0x5754284f345afc66a98fbb0a0afe71e0f007b949": {"name": "Tether USD (USDT Treasury)", "type": "defi"},
}

# Live in-memory webhook event logs
live_webhook_logs: list[dict] = []


# ── Helpers ────────────────────────────────────────────────────────────────────

def _identify_entity(address: str | None) -> dict | None:
    if not address:
        return None
    return KNOWN_ENTITIES.get(address.lower())


def _alchemy_url(override_key: str | None = None, override_network: str | None = None) -> tuple[str, str]:
    api_key = override_key or session.get("api_key") or DEFAULT_API_KEY
    network = override_network or session.get("network", "eth-mainnet")
    base = NETWORKS.get(network, NETWORKS["eth-mainnet"])["url"]
    return f"{base}/{api_key}", network


def _rpc(method: str, params: list | dict, api_key: str | None = None, network: str | None = None) -> dict:
    url, net = _alchemy_url(api_key, network)
    payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": method,
        "params": params if isinstance(params, list) else [params],
    }
    try:
        r = http_requests.post(url, json=payload, verify=False, timeout=12)
        r.raise_for_status()
        data = r.json()
        if "error" in data:
            return {"error": data["error"].get("message", str(data["error"]))}
        return data.get("result", {})
    except http_requests.exceptions.HTTPError as he:
        if r.status_code in [401, 403]:
            return {"error": f"Invalid Alchemy API Key for network {net}."}
        return {"error": f"HTTP Error {r.status_code} from Alchemy"}
    except Exception as e:
        return {"error": f"Connection Error: {str(e)}"}


def _hex_to_eth(hex_val: str) -> str:
    try:
        if not hex_val:
            return "0.000000"
        wei = int(hex_val, 16)
        eth_float = wei / 1e18
        if eth_float == 0:
            return "0.000000"
        return f"{eth_float:.6f}"
    except (ValueError, TypeError):
        return "0.000000"


def _fetch_single_token_meta(contract_addr: str, raw_balance_hex: str, api_key: str, network: str) -> dict | None:
    """Fetch ERC-20 token metadata (symbol, name, decimals) in parallel."""
    try:
        res = _rpc("alchemy_getTokenMetadata", [contract_addr], api_key=api_key, network=network)
        if not isinstance(res, dict) or "error" in res:
            return None
        
        name = res.get("name") or "Unknown Token"
        symbol = res.get("symbol") or "???"
        decimals = res.get("decimals")
        if decimals is None:
            decimals = 18
        
        raw_bal = int(raw_balance_hex, 16)
        human_bal = raw_bal / (10 ** decimals)
        
        if human_bal == 0:
            return None

        if human_bal >= 1:
            bal_str = f"{human_bal:,.4f}"
        else:
            bal_str = f"{human_bal:.6f}"

        return {
            "contract": contract_addr,
            "name": name,
            "symbol": symbol,
            "balance": bal_str,
            "raw_balance": raw_bal,
        }
    except Exception:
        return None


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    active_key = session.get("api_key") or DEFAULT_API_KEY
    return render_template("index.html", networks=NETWORKS, default_key=active_key)


@app.route("/api/config", methods=["POST"])
def save_config():
    data = request.json or {}
    if "api_key" in data and data["api_key"].strip():
        session["api_key"] = data["api_key"].strip()
    if "network" in data:
        session["network"] = data["network"]
    if "categories" in data:
        session["categories"] = data["categories"]
    if "max_results" in data:
        session["max_results"] = int(data["max_results"])
    return jsonify({
        "ok": True,
        "api_key": session.get("api_key", DEFAULT_API_KEY),
        "network": session.get("network", "eth-mainnet")
    })


@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "api_key": session.get("api_key") or DEFAULT_API_KEY,
        "network": session.get("network", "eth-mainnet"),
        "categories": session.get("categories", ["external", "erc20"]),
        "max_results": session.get("max_results", 25),
    })


@app.route("/api/track", methods=["POST"])
def track_address():
    """Fetch 100% Real Blockchain Data: Balance, Nonce, Tokens, and Transfer Flow."""
    data = request.json or {}
    address = data.get("address", "").strip()
    api_key = data.get("api_key", "").strip() or session.get("api_key") or DEFAULT_API_KEY
    network = data.get("network", "").strip() or session.get("network", "eth-mainnet")

    session["api_key"] = api_key
    session["network"] = network

    if not address:
        return jsonify({"error": "Please provide a valid Ethereum wallet address."}), 400

    if not address.startswith("0x"):
        address = "0x" + address

    categories = session.get("categories", ["external", "erc20"])
    max_count = hex(session.get("max_results", 25))

    # 1) Real Native Balance
    bal_res = _rpc("eth_getBalance", [address, "latest"], api_key=api_key, network=network)
    if isinstance(bal_res, dict) and "error" in bal_res:
        return jsonify(bal_res), 400
    balance_eth = _hex_to_eth(bal_res) if isinstance(bal_res, str) else "0.000000"

    # 2) Real Transaction Count (Nonce)
    tx_res = _rpc("eth_getTransactionCount", [address, "latest"], api_key=api_key, network=network)
    tx_count = int(tx_res, 16) if isinstance(tx_res, str) else 0

    # 3) Real ERC-20 Token Balances (Concurrently fetched metadata)
    token_res = _rpc("alchemy_getTokenBalances", [address], api_key=api_key, network=network)
    tokens = []
    if isinstance(token_res, dict) and "tokenBalances" in token_res:
        raw_list = token_res["tokenBalances"]
        # Filter non-zero
        non_zero = [
            t for t in raw_list 
            if t.get("tokenBalance") and t.get("tokenBalance") != "0x0" and int(t.get("tokenBalance"), 16) > 0
        ]

        # Fetch metadata in parallel for top 15 tokens
        top_candidates = non_zero[:15]
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = [
                executor.submit(
                    _fetch_single_token_meta, 
                    cand["contractAddress"], 
                    cand["tokenBalance"], 
                    api_key, 
                    network
                )
                for cand in top_candidates
            ]
            for f in futures:
                res = f.result()
                if res:
                    tokens.append(res)

    # 4) Real Asset Transfers — Outgoing
    out_params = {
        "fromAddress": address,
        "category": categories,
        "fromBlock": "0x0",
        "toBlock": "latest",
        "maxCount": max_count,
        "order": "desc",
    }
    out_res = _rpc("alchemy_getAssetTransfers", [out_params], api_key=api_key, network=network)
    outgoing = out_res.get("transfers", []) if isinstance(out_res, dict) else []

    # 5) Real Asset Transfers — Incoming
    in_params = {
        "toAddress": address,
        "category": categories,
        "fromBlock": "0x0",
        "toBlock": "latest",
        "maxCount": max_count,
        "order": "desc",
    }
    in_res = _rpc("alchemy_getAssetTransfers", [in_params], api_key=api_key, network=network)
    incoming = in_res.get("transfers", []) if isinstance(in_res, dict) else []

    # Merge, tag counterparties, and sort
    transfers = []
    exchange_count = 0
    scam_count = 0

    for t in outgoing:
        t["_direction"] = "out"
        counterparty_info = _identify_entity(t.get("to"))
        t["_counterparty_tag"] = counterparty_info
        if counterparty_info:
            if counterparty_info.get("type") == "exchange":
                exchange_count += 1
            elif counterparty_info.get("type") == "scam":
                scam_count += 1
        transfers.append(t)

    for t in incoming:
        t["_direction"] = "in"
        counterparty_info = _identify_entity(t.get("from"))
        t["_counterparty_tag"] = counterparty_info
        if counterparty_info:
            if counterparty_info.get("type") == "exchange":
                exchange_count += 1
            elif counterparty_info.get("type") == "scam":
                scam_count += 1
        transfers.append(t)

    transfers.sort(key=lambda x: int(x.get("blockNum", "0x0"), 16), reverse=True)

    # Check if target address itself is recognized
    target_entity = _identify_entity(address)

    return jsonify({
        "address": address,
        "entity_tag": target_entity,
        "balance": balance_eth,
        "tx_count": tx_count,
        "tokens": tokens,
        "transfers": transfers,
        "network": network,
        "metrics": {
            "total_transfers": len(transfers),
            "exchange_interactions": exchange_count,
            "scam_interactions": scam_count
        }
    })


# ── Live Real Webhook Receiver Endpoint ────────────────────────────────────────

@app.route("/webhook", methods=["POST"])
def receive_real_webhook():
    """Live endpoint to receive actual webhook POST payloads from Alchemy Notify."""
    raw_body = request.get_data()
    try:
        body = json.loads(raw_body)
    except Exception:
        body = {"raw": raw_body.decode(errors="replace")}

    event = {
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "type": body.get("type") or body.get("webhookType") or "ADDRESS_ACTIVITY",
        "data": body
    }
    live_webhook_logs.insert(0, event)
    if len(live_webhook_logs) > 50:
        live_webhook_logs.pop()

    return jsonify({"status": "received", "timestamp": event["timestamp"]}), 200


@app.route("/api/webhook/events", methods=["GET"])
def get_webhook_events():
    return jsonify({"events": live_webhook_logs})


@app.route("/api/webhook/clear", methods=["POST"])
def clear_webhook_events():
    global live_webhook_logs
    live_webhook_logs = []
    return jsonify({"ok": True})


if __name__ == "__main__":
    print("\n  ========================================================")
    print("  [*] Alchemy Real Blockchain Monitor (D1 Live Prototype)")
    print("  [+] API Key Active: alch_kIo4QuIe1KN7vkoZVZuDc")
    print("  [>] Dashboard: http://127.0.0.1:5000")
    print("  ========================================================\n")
    app.run(debug=True, port=5000)
