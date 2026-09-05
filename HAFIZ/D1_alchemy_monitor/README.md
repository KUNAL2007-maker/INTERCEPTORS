# Blockchain Monitor — Alchemy (D1 Draft)

**SIH Project:** Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain Analytics

## What is this?

This is **Draft 1 (D1)** — a basic Python/Flask web app that lets you monitor any blockchain wallet address using the [Alchemy API](https://www.alchemy.com/). It provides:

- **Balance & transaction count** for any wallet
- **ERC-20 token balances** with name/symbol resolution
- **Transfer history** (incoming & outgoing) with color-coded direction
- **Webhook configuration** for real-time notifications
- **Multi-network support** (Ethereum, Polygon, Arbitrum, Optimism, Base, Sepolia)

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the app
python app.py

# 3. Open in browser
# → http://127.0.0.1:5000
```

## How to Use

1. **Open the app** → Click **⚙️ Config** to expand the configuration panel
2. **Enter your Alchemy API key** (get one free at [alchemy.com](https://www.alchemy.com/))
3. **Select a network** (Ethereum Mainnet, Polygon, etc.)
4. **Adjust filters** — categories, max results, block range
5. **Click Save Config**
6. **Enter a wallet address** in the search bar and click **🔍 Track**

## Webhook Setup

To receive real-time notifications when a tracked address sends/receives funds:

1. Set up a publicly accessible URL (use [ngrok](https://ngrok.com/) for local testing)
2. Enter the URL in the **Webhook URL** field under Config
3. Select webhook type (Address Activity, Mined Transaction, Dropped Transaction)
4. Click **Create Webhook**

The app also has a built-in `/webhook` endpoint that logs incoming events.

## Configuration Options

| Option | Description |
|--------|-------------|
| API Key | Your Alchemy API key (stored in session only) |
| Network | Blockchain network to query |
| Categories | Transfer types to fetch (external, internal, ERC-20, ERC-721, ERC-1155) |
| Max Results | Number of transfers to fetch (10–100) |
| From/To Block | Block range filter (hex or "latest") |
| Webhook Signing Key | HMAC key for verifying incoming webhook signatures |

## Tech Stack

- **Backend:** Python / Flask
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **API:** Alchemy JSON-RPC + Notify REST API
- **Theme:** Light

---

*SIH 2025 — D1 Draft*
