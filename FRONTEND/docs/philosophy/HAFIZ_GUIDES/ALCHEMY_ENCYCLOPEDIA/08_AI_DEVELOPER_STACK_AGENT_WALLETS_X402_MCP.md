# VOLUME 8: THE AI DEVELOPER STACK: AGENT WALLETS, X402 & MCP SERVER
*Autonomous AI Agents, Programmatic Micropayments & Developer Tooling (2026 Live Audit)*

---

## 1. The Autonomous AI Paradigm in Web3

In 2026, autonomous AI coding agents (Claude Code, Cursor, Windsurf, Devin, Codex) regularly write code, deploy smart contracts, test onchain interactions, and consume third-party API services.

However, empowering AI agents with direct blockchain access introduces major security vulnerabilities:
1. **Private Key Theft**: If an AI agent has access to raw private keys or seed phrases in `.env` files, any prompt injection, memory leak, or compromised subagent can permanently drain all funds.
2. **Unbounded Financial Risk**: Agents can loop into infinite execution cycles, exhausting gas or trading balances.
3. **API Payment Bottlenecks**: Traditional APIs require pre-paid credit cards or manual subscription billing, preventing autonomous agents from purchasing data or compute services on-the-fly.

Alchemy’s **Build with AI** stack resolves these hurdles through three integrated technologies: **Agent Wallets**, **x402 Micropayments**, and the **Alchemy MCP Server**.

---

## 2. Alchemy Agent Wallets: Threat Model & Architecture

Alchemy Agent Wallets provide onchain EVM and Solana wallets for AI agents with strict security boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│                 DEVELOPER CONTROL PLANE                     │
│   (https://dashboard.alchemy.com/products/agent-wallet)     │
│   • Sets Session Lifetime (e.g. 1 hour, 24 hours)           │
│   • Sets Daily & Total Spend Limits (e.g. max $50 USDC)     │
│   • Configures Whitelisted Contracts & Methods              │
│   • One-Click Instant Revocation Kill-Switch                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Issues Ephemeral Session Signer
┌─────────────────────────────────────────────────────────────┐
│                   AI AGENT RUNTIME ENVIRONMENT              │
│   (Claude Code / Cursor / CLI / Headless Docker)            │
│                                                             │
│   • AI Agent ONLY possesses an ephemeral Session Signer     │
│   • AI Agent NEVER reads or stores raw Private Keys         │
│   • Invocations pass through @alchemy/cli or SDK            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Submits Transactions via Session Key
┌─────────────────────────────────────────────────────────────┐
│                 ONCHAIN MODULAR SMART ACCOUNT               │
│   • Validates Session Signer signature                      │
│   • Enforces Spend Limits & Whitelist Permissions           │
│   • Rejects any transaction exceeding configured scope      │
└─────────────────────────────────────────────────────────────┘
```

### Key Security Guarantees:
- **Zero Raw Key Exposure**: Even if an attacker completely dumps the AI agent's memory or shell environment, no master private key exists to steal.
- **Strict Financial Caps**: The agent cannot exceed the spend limit configured by the human developer in the Alchemy Dashboard.
- **Instant Kill-Switch**: The human developer can revoke the agent's active session at any time with one click.

---

## 3. Alchemy CLI (`@alchemy/cli`) Reference

The `@alchemy/cli` terminal tool is designed for seamless automation by both humans and AI coding agents.

### Core Command Tree

#### 1. Authentication
- `alchemy auth`: Launches interactive browser OAuth login.
- `alchemy auth login --device-code`: Headless authentication flow returning a verification code, designed specifically for remote servers and containerized AI environments.
- `alchemy auth logout`: Clears stored authentication credentials.

#### 2. App & Environment Management
- `alchemy app list`: Lists all apps under the authenticated account.
- `alchemy app select <appId>`: Switches the active project context.
- `alchemy app create --name <name> --network <network>`: Provisions a new app and API key.

#### 3. EVM Onchain Operations
- `alchemy evm data balance <address|ens>`: Fetches native balance.
- `alchemy evm data tokens balances <address>`: Queries all ERC-20 holdings.
- `alchemy evm data nfts <address>`: Lists owned NFTs.
- `alchemy evm data price symbol <SYM>`: Checks real-time USD spot prices.
- `alchemy evm send --to <address> --value <eth> --signer session`: Sends native currency using the active agent session.
- `alchemy evm contract read --address <addr> --abi <abi> --method <name>`: Read-only contract call.
- `alchemy evm contract call --address <addr> --abi <abi> --method <name> --signer session`: State-modifying contract call.
- `alchemy evm swap quote --from <USDC> --to <ETH> --amount <val>`: Generates DEX aggregator swap quote.
- `alchemy evm swap execute --quote <quoteId>`: Executes swap.

#### 4. Machine-Readable Agent Prompt Mode
Running:
```bash
alchemy --json --no-interactive agent-prompt
```
Outputs the complete machine-readable CLI tool manifest in structured JSON, allowing AI orchestrators to dynamically inject Alchemy tools into agent system prompts.

---

## 4. The x402 Micropayment Protocol Specification

The **x402 Protocol** is the production implementation of the HTTP 402 "Payment Required" specification for autonomous web3 micro-transactions:

```
[ AI Agent ]                                            [ Third-Party API Server ]
     │                                                               │
     │ (1) HTTP GET /resource                                        │
     ├──────────────────────────────────────────────────────────────►│
     │                                                               │
     │ (2) HTTP 402 Payment Required                                 │
     │     Headers:                                                  │
     │     x-402-price: 0.01                                         │
     │     x-402-currency: USDC                                      │
     │     x-402-network: base-mainnet                               │
     │     x-402-pay-to: 0xMerchant...                               │
     │◄──────────────────────────────────────────────────────────────┤
     │                                                               │
     │ (3) Agent CLI decodes quote, verifies price <= max-payment    │
     │     Signs EIP-3009 transfer authorization with Session Wallet │
     │                                                               │
     │ (4) HTTP GET /resource                                        │
     │     Header: Authorization: x402 <signature_payload>           │
     ├──────────────────────────────────────────────────────────────►│
     │                                                               │
     │ (5) Server verifies signature, settles payment onchain        │
     │     Returns requested HTTP 200 payload + payment receipt      │
     │◄──────────────────────────────────────────────────────────────┤
```

### Command Usage:
```bash
alchemy x402 request https://api.forensics.com/query --max-payment 0.05 --scheme gateway
```
- `--max-payment`: Required safety ceiling. If the API requests more than this value, the CLI aborts without signing.
- `--scheme <gateway|exact|any>`: Uses Circle Gateway batched nanopayments or direct onchain settlement.

---

## 5. Alchemy Model Context Protocol (MCP) Server

Alchemy operates an official **MCP Server** accessible at `https://mcp.alchemy.com/mcp` that exposes **168 Native Tools** directly to AI agents via OAuth:

### Tool Categories Breakdown:
1. **Admin Tools (8 tools)**: Programmatically create apps, rotate compromised API keys, update CORS/IP allowlists, and check billing quotas.
2. **Onchain RPC Tools (132 tools)**: Direct execution across 81 blockchains covering EVM methods, Solana RPC, Bitcoin JSON-RPC, Sui, Aptos, and Tron.
3. **Enhanced Data APIs (28 tools)**: Token portfolio balances, historical transfers, floor prices, contract metadata, and transaction simulations.
