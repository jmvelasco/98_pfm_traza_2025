---
**ADR**: 003
**Title**: Pending Transfers Frontend-Only Strategy (Alternative)
**Status**: ⚠️ Not Selected (Explored but not implemented)
**Date**: 23 October 2025
**Decision**: Rejected in favor of Strategy C2 (Smart Contract indexed getters)
**Purpose**: Analysis of frontend-only approaches without SC changes
**Retain for**: Future reference if SC modifications become restricted, architectural context
---


Date: 23 Oct 2025
Scope: Show Producer pending transfers in the frontend using current SupplyChain.sol, assuming we cannot modify or redeploy the contract.

---

## TL;DR (Executive Summary)

Yes, it’s feasible to show pending transfers in the frontend without changing the smart contract, by leveraging:

- Event logs: Filter `TransferRequested` events by sender (Producer) or recipient (Factory) and enrich with `getTransfer(transferId)` to confirm current status is Pending.
- State scan: Read `nextTransferId` and iterate `1..N` calling `getTransfer(i)` to filter by `from == address` and `status == Pending`.

Both approaches are read-only (`eth_call` or `eth_getLogs`) and require no Solidity changes. Event logs are generally more scalable; state scan is simpler but O(N) calls.

---

## Constraints and Goal

- Constraint: Cannot change or redeploy `SupplyChain.sol`.
- Goal: Populate Producer dashboard’s Pending Transfers for a given address (e.g., Producer as sender, Factory as recipient) using current on-chain surface.

---

## Current Smart Contract Surface (relevant parts)

- Storage
  - `mapping(uint256 => Transfer) public transfers;` (single Transfer by ID)
  - `uint256 public nextTransferId;` (upper bound for known transfers)
- Functions
  - `requestTransfer(tokenId, to, amount)` — creates a transfer in Pending
  - `acceptTransfer(transferId)` / `rejectTransfer(transferId)` — mutate status
  - `getTransfer(transferId)` — returns full Transfer struct
  - `getUserTokens(address)` — not useful for transfers listing
- Events
  - `TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount)`
  - `TransferAccepted(uint256 indexed transferId)`
  - `TransferRejected(uint256 indexed transferId)`

Implication: There is no native listing by sender/recipient, but we can reconstruct via either logs or iteration.

---

## Strategy A — Event Logs Indexing (Recommended)

Use provider log filtering against `TransferRequested`:

- Filter logs by:
  - `address`: SupplyChain contract address
  - `topics[0]`: keccak256("TransferRequested(uint256,address,address,uint256,uint256)")
  - `topics[1]` (indexed `transferId`) — optional if scanning ranges
  - `topics[2]` (indexed `from`) — for Producer “sent” view
  - `topics[3]` (indexed `to`) — for Factory “incoming” view
- For each matched log:
  - Decode `transferId` (from topics[1])
  - Call `getTransfer(transferId)` to get current status (Pending/Accepted/Rejected)
  - Keep only `status == Pending`
- Sort by `dateCreated` if needed (requires reading it from `getTransfer`)

Pros:

- Efficient filtering by `from`/`to` via indexed topics
- Scales better than scanning every transfer ID
- Naturally incremental: you can remember the last block scanned

Cons:

- Requires choosing a block range (from deployment block to latest)
- On some providers, large ranges may need pagination
- After contract redeploys, previous logs are not in the new address (must align with current address)

Operational notes:

- Use the exact deployed address configured in `contracts.ts`; mismatch yields no logs
- Persist `fromBlock` (deployment block) in config or derive from recent broadcast artifacts
- After collecting candidate IDs from logs, always confirm status via `getTransfer(id)` to reflect latest state (e.g., Accepted and no longer pending)

---

## Strategy B — State Scan via `nextTransferId`

Use public getters only:

- Read `nextTransferId` (N)
- Loop i from 1 to N - 1
  - Read `getTransfer(i)`
  - Filter: `t.from == address` and `t.status == Pending`

Pros:

- Simple, minimal moving parts
- No need to manage log topics or block ranges

Cons:

- O(N) contract calls (one per transfer ID) — can be slow and rate-limited
- Needs batching/throttling; consider early exits or caching
- Includes all historical transfers, requires client-side filtering

Mitigations:

- Cache results and only re-scan tail range since the last seen `nextTransferId`
- Paginate (scan last K IDs first) to give fast initial paint

---

## Which Address View?

- Producer Dashboard (sender view): filter where `from == producerAddress`
- Factory Dashboard (incoming view): filter where `to == factoryAddress`

Note: In tests, `0x3C44...93BC` is the Factory address. For Producer dashboard you’ll typically filter by `from == producer` not by this Factory address. For an incoming view (Factory dashboard), filter `to == 0x3C44...93BC`.

---

## Why You Might See “No Data” Right Now

- Contract address mismatch: Frontend points to a different address than the one with state/events.
- Fresh deployment: New address has empty state and no logs.
- Wrong role perspective: Looking for producer-sent transfers using a Factory address (or vice versa).
- Missing block range or incorrect `fromBlock` when querying logs.

Diagnostics to try (read-only):

- Read `nextTransferId` — if 1, there are no transfers yet on this deployment.
- Filter `TransferRequested` logs for the configured address; confirm any results exist.
- For any candidate `transferId`, read `getTransfer(transferId)` and check fields.

---

## UX and Performance Considerations

- Start with Event Logs for better scalability; fall back to State Scan if logs are constrained.
- Make queries incremental/paged; show a spinner and "Load more" for long histories.
- Always confirm current status via `getTransfer` to avoid showing accepted/rejected as pending.
- Cache results in-memory and invalidate on relevant actions (accept/reject/submit).

---

## Test Plan (no SC changes)

- Seed: Use Producer account to call `requestTransfer` to the Factory address; repeat 2–3 times.
- Event path:
  - Query logs filtered by Producer (from) — expect 2–3 transferIds
  - For each, call `getTransfer` — confirm `status == Pending`
  - Verify UI table shows Token/Amount/Recipient/Status
- State scan path:
  - Read `nextTransferId` and iterate
  - Filter by `from` and `Pending`
  - Cross-check counts match logs path

---

## Risks and Trade-offs

- Event log queries depend on provider capabilities and accurate block ranges
- Full state scan can be slow with many transfers; consider batching or server-side indexing later
- After contract redeploy, history resets — expected in local/dev

---

## Conclusion

- It is not strictly necessary to add new smart contract getters to show pending transfers in the frontend.
- Viable, no-contract-change solutions exist:
  1. Event Logs Indexing (preferred)
  2. State Scan using `nextTransferId` + `getTransfer`
- Adding explicit listing getters in the contract remains a good long-term improvement for performance and simplicity, but it is not a hard requirement under this constraint.
