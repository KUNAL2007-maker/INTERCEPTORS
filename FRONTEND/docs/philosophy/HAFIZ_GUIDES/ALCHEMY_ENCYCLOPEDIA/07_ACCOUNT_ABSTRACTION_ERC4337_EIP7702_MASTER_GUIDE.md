# VOLUME 7: ACCOUNT ABSTRACTION, ERC-4337 & EIP-7702 MASTER GUIDE
*Complete Smart Account Architecture, Gas Sponsorship & Protocol Specifications (2026 Live Audit)*

---

## 1. The Account Abstraction Paradigm

Traditional Ethereum Externally Owned Accounts (EOAs) tightly couple the **signer** (the ECDSA private key) with the **account** (the address storing funds). This coupling causes severe operational friction:
- If the private key is lost or compromised, the account is irrecoverably lost.
- Users must always maintain a balance of the chain's native currency (ETH/POL/AVAX) just to pay gas.
- Every single action requires an individual signature; multi-step actions (e.g. approve + swap) cannot be batched into a single transaction.

Account Abstraction decouples the account from the signer by turning user accounts into smart contracts, governed by the **ERC-4337** standard and the new **EIP-7702** dynamic delegation standard.

---

## 2. Complete ERC-4337 Protocol Architecture

ERC-4337 achieves smart contract account execution without requiring consensus-layer hard forks:

```
[ User / AI Agent Client ]
            │
            ▼ (1) Constructs UserOperation
┌─────────────────────────────────────────────────────────────┐
│                      USER OPERATION (UserOp)                │
│   • sender: 0x... (Smart Account Address)                   │
│   • nonce: 0x1                                              │
│   • callData: 0x... (Target Contract & Encoded Actions)     │
│   • callGasLimit / verificationGasLimit / preVerificationGas │
│   • maxFeePerGas / maxPriorityFeePerGas                     │
│   • paymasterAndData: 0x... (Signed Paymaster Sponsorship)  │
│   • signature: 0x... (User / Session Key / WebAuthn)        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼ (2) Submits via eth_sendUserOperation
┌─────────────────────────────────────────────────────────────┐
│                   ALCHEMY BUNDLER (RUNDLER)                 │
│   • ERC-7562 Simulation & Storage Access Rule Validation    │
│   • Paymaster Deposit Verification                          │
│   • Bundles Multiple UserOps into Canonical Transaction     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼ (3) Dispatches EntryPoint.handleOps()
┌─────────────────────────────────────────────────────────────┐
│                    CANONICAL ENTRYPOINT                     │
│   (v0.6: 0x5FF137...  |  v0.7: 0x000000... )                │
│                                                             │
│   Phase 1: Verification Loop                                │
│   ├── account.validateUserOp()                              │
│   └── paymaster.validatePaymasterUserOp()                   │
│                                                             │
│   Phase 2: Execution Loop                                   │
│   ├── account.execute(target, value, data)                  │
│   └── paymaster.postOp(actualGasCost)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. EntryPoint v0.6 vs. EntryPoint v0.7 / v0.8 Specifications

Alchemy's Bundler dynamically routes and validates UserOperations against both active EntryPoint standards:

### Schema Comparison Table

| Field Name | EntryPoint v0.6 (`0x5FF137...`) | EntryPoint v0.7 / v0.8 (`0x000000...`) | Rationale / Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Account Creation** | `initCode` (concatenated factory address + calldata) | `factory` (address) and `factoryData` (hex) | Prevents parsing bugs; cleaner ABI encoding |
| **Paymaster Parameters** | `paymasterAndData` (packed hex) | `paymaster` (address), `paymasterVerificationGasLimit` (hex), `paymasterPostOpGasLimit` (hex), `paymasterData` (hex) | Isolates verification gas from post-op gas limits |
| **Gas Fields** | Standard integer fields | Standard names with strict 128-bit packing | Prevents gas limit spoofing; optimizes EVM stack |
| **EIP-7702 Tuples** | Custom extension fields | Native `eip7702Auth` tuple (`chainId`, `nonce`, `address`, `yParity`, `r`, `s`) | Native protocol support for temporary EOA delegation |

---

## 4. Bundler JSON-RPC Methods

1. **`eth_sendUserOperation` (1,000 CU)**:
   Submits a signed UserOperation to the Bundler mempool for onchain inclusion.
2. **`eth_estimateUserOperationGas` (500 CU)**:
   Simulates UserOp execution to determine required `preVerificationGas`, `verificationGasLimit`, and `callGasLimit`.
3. **`eth_getUserOperationByHash` (20 CU)**:
   Returns UserOperation details and entry point block confirmation.
4. **`eth_getUserOperationReceipt` (20 CU)**:
   Returns complete receipt including actual gas used, gas price paid, status, and emitted logs.
5. **`eth_supportedEntryPoints` (10 CU)**:
   Returns array of supported EntryPoint addresses.

---

## 5. Gas Manager & Sponsorship Policies

Alchemy’s **Gas Manager** enables applications to sponsor transaction fees on behalf of users via Paymasters:

### Sponsorship API Workflow:
1. Client calls **`alchemy_requestGasAndPaymasterAndData`** (1,250 CU).
2. The Gas Manager verifies the UserOp against active policy rules:
   - Monthly budget cap in USD.
   - Daily spend limit.
   - Max spend per individual UserOperation.
   - Sender rate limits (e.g. max 5 sponsored operations per wallet per day).
   - Target contract allowlists.
3. If approved, the Gas Manager signs the paymaster fields with Alchemy's Paymaster private key and returns the completed paymaster parameters.

### ERC-20 Gas Payments (`alchemy_requestPaymasterTokenQuote`)
Allows users to pay gas using ERC-20 tokens (e.g. USDC) instead of native ETH:
1. Gas Manager locks in an exchange rate quote.
2. The UserOperation authorizes a transfer of USDC to the Paymaster contract.
3. In `postOp`, the Paymaster collects the exact USDC amount equivalent to the actual gas consumed, while Alchemy sponsors the native gas onchain.

---

## 6. Smart Account Implementations

### Modular Account V2 (ERC-6900)
- **Ultra-Lean Gas Footprint**: 97,764 deployment gas (84.6% cheaper than ZeroDev Kernel v3, 195.8% cheaper than Safe). Audited by ChainLight and Quantstamp.
- **ERC-6900 Architecture**:
  - **Validation Plugins**: Custom validation logic (ECDSA, WebAuthn Passkeys, Multi-sig).
  - **Execution Plugins**: Adds new smart contract logic to the account.
  - **Hooks**: Pre-execution and post-execution checks (e.g. daily spending limits).

### Session Keys & Scoped Delegation
Session keys allow users to delegate limited, ephemeral transaction permissions to automated agents or gaming sessions:
- `native-token-transfer`: Max wei transfer limit.
- `erc20-token-transfer`: Scoped to token contract and max cumulative allowance.
- `gas-limit`: Maximum gas spend authorized.
- `contract-access`: Whitelists all functions on a specific target contract.
- `functions-on-contract`: Scoped strictly to 4-byte function selectors.

---

## 7. Native EIP-7702 Delegation Runtime

**EIP-7702** allows traditional EOAs to temporarily adopt smart account capabilities without deploying a separate contract:
1. The EOA signs an authorization tuple: `[chainId, address, nonce, yParity, r, s]`, designating a smart account implementation (e.g. Modular Account V2).
2. The Bundler includes the tuple in `eth_sendUserOperation`.
3. During transaction execution, the EOA executes the bytecode of the designated smart account, enabling transaction batching, paymaster sponsorship, and session keys while preserving the user's original EOA address.
