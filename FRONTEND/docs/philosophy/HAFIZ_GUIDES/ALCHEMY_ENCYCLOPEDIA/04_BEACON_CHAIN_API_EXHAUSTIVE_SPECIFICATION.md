# VOLUME 4: ETHEREUM BEACON CHAIN HTTP API EXHAUSTIVE SPECIFICATION
*The Complete Consensus Layer & Validator Duty Protocol Reference (2026 Live Audit)*

---

## 1. Overview of Ethereum Consensus Architecture

Since The Merge (EIP-3675) and the Dencun upgrade (EIP-4844 Blob Transactions), Ethereum is bifurcated into two communicating layers:
1. **Execution Layer (EL)**: Processes transactions, executes EVM bytecode, maintains the world state trie, and serves standard JSON-RPC (`eth_*`).
2. **Consensus Layer (CL / Beacon Chain)**: Coordinates Proof-of-Stake consensus, manages 1M+ active validators, tracks attestations, selects block proposers, coordinates sync committees, and stores EIP-4844 data blobs.

Alchemy provides direct, authenticated HTTP access to the Consensus Layer across **Ethereum Mainnet, Sepolia, and Hoodi testnets** at:
`https://eth-mainnet.g.alchemy.com/v2/{apiKey}/eth/v1/...`

All requests consume **20 Compute Units** per invocation.

---

## 2. Exhaustive 48 Beacon Chain Endpoints Reference

### Category 1: Blocks & Blob Sidecars (EIP-4844)
1. `GET /eth/v1/beacon/blocks/{block_id}`: Retrieves full signed Beacon block object for a given slot, block root, or tag (`"head"`, `"genesis"`, `"finalized"`).
2. `GET /eth/v2/beacon/blocks/{block_id}`: V2 endpoint supporting Bellatrix, Capella, and Dencun block schemas.
3. `GET /eth/v1/beacon/blocks/{block_id}/root`: Retrieves the 32-byte block root hash.
4. `GET /eth/v1/beacon/blinded_blocks/{block_id}`: Retrieves blinded block for execution via MEV-Boost / proposer builder separation.
5. `GET /eth/v1/beacon/blinded_blocks/{slot}`: Slot-specific blinded block lookup.
6. `GET /eth/v1/beacon/blob_sidecars/{block_id}`: Retrieves all EIP-4844 data blob sidecars (KZG commitments, proofs, and raw 128KB blob data).
7. `GET /eth/v1/beacon/blobs/{block_id}`: Returns raw binary blob payloads associated with a block.
8. `GET /eth/v1/beacon/headers`: Retrieves block headers matching query filters.
9. `GET /eth/v1/beacon/headers/{block_id}`: Retrieves single block header by ID.

### Category 2: Validator State & Registries
10. `GET /eth/v1/beacon/states/{state_id}/validators`: Returns list of all validators in state, filtering by status (`pending_initialized`, `active_ongoing`, `active_exiting`, `active_slashed`, `exited_unslashed`, `withdrawal_done`).
11. `GET /eth/v1/beacon/states/{state_id}/validators/{validator_id}`: Returns validator record for a specific public key or index.
12. `GET /eth/v1/beacon/states/{state_id}/validator_balances`: Returns effective balance and actual balance (in Gwei) for all validators.
13. `GET /eth/v1/beacon/states/{state_id}/validator_identities`: Returns mapping of validator indices to public keys.
14. `GET /eth/v1/beacon/states/{state_id}/committees`: Retrieves Beacon committees assigned to attest during each slot of an epoch.
15. `GET /eth/v1/beacon/states/{state_id}/sync_committees`: Retrieves the 512 validators assigned to the current and next sync committees.
16. `GET /eth/v1/beacon/states/{state_id}/finality_checkpoints`: Retrieves `previous_justified`, `current_justified`, and `finalized` checkpoints.
17. `GET /eth/v1/beacon/states/{state_id}/fork`: Current fork versions and epoch schedule.
18. `GET /eth/v1/beacon/states/{state_id}/randao`: RANDAO mix seed for randomness.
19. `GET /eth/v1/beacon/states/{state_id}/root`: 32-byte state root hash.

### Category 3: Staking Withdrawals & Consolidated Deposits
20. `GET /eth/v1/beacon/states/{state_id}/pending_deposits`: Returns queue of validator deposits waiting to be processed.
21. `GET /eth/v1/beacon/states/{state_id}/pending_partial_withdrawals`: Partial withdrawals processed per epoch.
22. `GET /eth/v1/beacon/states/{state_id}/pending_consolidations`: Validator account consolidation requests.
23. `GET /eth/v1/beacon/states/{state_id}/proposer_lookahead`: Proposer lookahead schedule.

### Category 4: Consensus Rewards & Penalties
24. `GET /eth/v1/beacon/rewards/attestations/{epoch}`: Detailed attestation rewards, head rewards, target rewards, and inactivity penalties per validator.
25. `GET /eth/v1/beacon/rewards/blocks/{block_id}`: Proposer block rewards for transaction packaging and attestation inclusion.
26. `GET /eth/v1/beacon/rewards/sync_committee/{block_id}`: Sync committee participation rewards.

### Category 5: Mempool & Attestation Pools
27. `GET /eth/v1/beacon/pool/voluntary_exits`: Unprocessed voluntary exit requests.
28. `GET /eth/v2/beacon/pool/attestations`: Unaggregated attestations waiting in the CL pool.
29. `GET /eth/v2/beacon/blocks/{block_id}/attestations`: Attestations included inside a specific block.

### Category 6: Validator Duties & Submissions
30. `GET /eth/v1/validator/duties/attester/{epoch}`: Slot and committee duties for an attesting validator.
31. `GET /eth/v1/validator/duties/proposer/{epoch}`: Designated slots where a validator is scheduled to propose a block.
32. `GET /eth/v1/validator/duties/sync/{epoch}`: Sync committee duties.
33. `GET /eth/v1/validator/attestation_data`: Generates attestation payload for signing.
34. `GET /eth/v1/validator/aggregate_attestation`: Fetches aggregated attestation.
35. `POST /eth/v1/validator/contribution_and_proofs`: Submits sync committee contribution proofs.
36. `POST /eth/v1/validator/sync_committee_contribution`: Submits sync committee contributions.
37. `POST /eth/v2/validator/aggregate_attestation`: Submits aggregated attestation.
38. `POST /eth/v3/validator/blocks/{slot}`: Proposes and broadcasts a signed Beacon block.

### Category 7: Node Identity & Sync Status
39. `GET /eth/v1/node/identity`: P2P enode, ENR, and listening addresses.
40. `GET /eth/v1/node/peers`: Connected peer list with direction and client software.
41. `GET /eth/v1/node/peer_count`: Number of connected peers.
42. `GET /eth/v1/node/syncing`: CL sync status (`head_slot`, `sync_distance`, `is_syncing`).
43. `GET /eth/v1/node/version`: Consensus client software version string.

### Category 8: Genesis, Config & Debug
44. `GET /eth/v1/beacon/genesis`: Genesis time, genesis validators root, and fork version.
45. `GET /eth/v1/config/spec`: Protocol constants (slots per epoch, seconds per slot, max effective balance).
46. `GET /eth/v1/config/deposit_contract`: L1 deposit contract address and chain ID.
47. `GET /eth/v1/config/fork_schedule`: Fork activation epochs.
48. `GET /eth/v1/debug/fork_choice`: Internal fork choice tree state.
