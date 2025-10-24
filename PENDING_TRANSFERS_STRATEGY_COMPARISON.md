# 🔄 Pending Transfers – Strategy Comparison & Recommendation

Date: 23 Oct 2025
Scope: Compare three strategies to show Pending Transfers in the frontend and decide the best option. For this comparison we assume we CAN request smart contract changes.

---

## Context

We want the Producer dashboard to show Pending Transfers. Today’s smart contract didn’t expose a listing API; the frontend mocked the helper and passed tests but real usage failed. We explored two frontend-only approaches and one smart contract change:

1. Event Logs Indexing (frontend-only)
2. State Scan via `nextTransferId` + `getTransfer` (frontend-only)
3. Smart Contract Getters (SC change) — add `getPendingTransfersBySender` / `getPendingTransfersByRecipient`

---

## Strategies at a glance

- Strategy A — Event Logs Indexing

  - Query `TransferRequested` logs filtered by `from` or `to`
  - For each log’s `transferId`, call `getTransfer(transferId)` and keep those with `status == Pending`

- Strategy B — State Scan (no logs)

  - Read `nextTransferId` (N) and iterate 1..N calling `getTransfer(i)`
  - Filter by `from` and `status == Pending`

- Strategy C — SC Getters
  - Add read-only view functions returning arrays of pending transfers by sender/recipient
  - Option C1: Simple scan inside Solidity (iterate 1..N)
  - Option C2: Optimized with secondary indices (mappings to IDs; maintain on request/accept/reject)

---

## Evaluation Criteria

- Correctness: Returns the right pending set now (reflects accept/reject changes)
- Performance & Scalability: Latency and request count with growing data
- UX: Time-to-first-byte and perceived speed on dashboard load
- Complexity: Frontend and contract complexity to implement/maintain
- Provider constraints: Reliance on `eth_getLogs` ranges, rate limits, pagination
- Evolvability: Ease of adding pagination, filters (date, token), sorting

---

## Comparison

| Dimension                      | A) Event Logs Indexing                              | B) State Scan (getTransfer) | C1) SC Getter (scan in Solidity)           | C2) SC Getter (indexed mappings)           |
| ------------------------------ | --------------------------------------------------- | --------------------------- | ------------------------------------------ | ------------------------------------------ |
| Correctness (current state)    | Good (requires confirming status via `getTransfer`) | Good                        | Good                                       | Excellent                                  |
| Performance (small data)       | Good                                                | Good                        | Good                                       | Excellent                                  |
| Performance (large data)       | Good (logs filter reduces set)                      | Poor (O(N) calls)           | Medium (one view call scans O(N) on-chain) | Excellent (O(K) fetch by index)            |
| Frontend complexity            | Medium (log filter, block ranges, decode)           | Low (simple loop)           | Low (single call)                          | Low (single call)                          |
| Provider limitations           | Moderate (log pagination / fromBlock required)      | Low                         | Low                                        | Low                                        |
| UX (TTFB)                      | Good (few calls + 1 call per match)                 | Poor (many calls)           | Good (one call)                            | Excellent (one call, fast)                 |
| Evolvability (filters, paging) | Medium (combine logs + calls)                       | Low                         | Medium (can add server-side paging)        | Excellent (design API for paging, filters) |
| Offline reorg sensitivity      | Medium (logs rarely reorg locally)                  | Low                         | Low                                        | Low                                        |
| Implementation effort now      | None (frontend only)                                | None (frontend only)        | Medium (contract change)                   | High (contract + data structure changes)   |

Notes:

- Event logs require careful block-range selection tied to the correct deployed contract address. After redeploys, history restarts at the new address.
- State scan is the simplest but becomes quickly infeasible as the number of transfers grows.
- SC getter (scan) returns data in a single call but still scales O(N) on-chain; large arrays can be heavy to return.
- SC getter (indexed) is the best long-term solution: maintain pending lists per sender/recipient during state transitions; support pagination.

---

## Scenarios

- Local/dev (frequent redeploys, small data):
  - A or B both acceptable; A preferred for lower call volume; C is nice-to-have.
- Testnet/prod (persistent address, growing data):
  - A scales better than B; but C2 (indexed getters) provides best performance and clean API.
- Strict API surface required (frontend teams want simple calls):
  - C1/C2 wins; C2 ideal for pagination and filters.

---

## Recommendation

- If smart contract changes ARE allowed (assumed for this comparison):

  - Adopt Strategy C2 — Add indexed getters:
    - Maintain `pendingBySender[address]` and `pendingByRecipient[address]` lists of transfer IDs.
    - Update indices at `requestTransfer` (add), `acceptTransfer`/`rejectTransfer` (remove or mark inactive).
    - Expose paginated getters: `getPendingBySender(address, offset, limit)` and `getPendingByRecipient(address, offset, limit)`.
    - Optionally add filters (by tokenId) and sorting by `dateCreated`.
  - Why: Best performance, simplest frontend, future-proof for pagination and filtering.

- If smart contract changes are NOT allowed:
  - Prefer Strategy A (Event Logs Indexing) for better scalability and fewer calls.
  - Always confirm current status via `getTransfer(id)` to avoid stale pending items.
  - Use a reasonable `fromBlock` (deployment block) and paginate ranges if needed.
  - Keep Strategy B as a fallback for small deployments or when logs are unavailable.

---

## Practical Next Steps

- Short term (no SC change): ship Strategy A in frontend with a thin helper and cache; verify on the current contract address.
- Mid term (with SC change): design and implement C2 indices and paginated getters; update ABI and frontend helper; add integration tests.
- Long term: add filters (by token, date) and, if needed, server-side indexing for analytics.

---

## Final Conclusion

- Best long-term option: Strategy C2 — Smart contract indexed getters with pagination.
- Best immediate option without SC changes: Strategy A — Event logs indexing + status confirmation.
- Strategy B is acceptable only for very small datasets or as a temporary fallback.
