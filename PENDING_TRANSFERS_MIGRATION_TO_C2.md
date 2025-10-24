# 🚀 Migration Plan: Pending Transfers Strategy C2 (Indexed SC Getters + Pagination)

Date: 23 Oct 2025
Goal: Evolve from current C1 approach to C2 — smart-contract indexed getters with pagination — with tests-first across smart contract and frontend.

Status (23 Oct 2025): Smart contract phase completed (tests-first) and frontend integrated:

- Indexed structures and paginated getters implemented (`getPendingBySender`, `getPendingByRecipient`).
- Legacy non-paginated getters removed.
- All Solidity tests passing (27/27), including new pagination/indexing coverage.
- Web helpers implemented (`getPendingBySender/Recipient`), component `PendingTransfers` paginado, tests web 79/79 pasando.

---

## 1) Scope and Assumptions

- Scope: Producer/Factory pending transfers listing in dashboard(s).
- Assumptions:
  - We can change the smart contract and redeploy.
  - Frontend should use a clean, paginated API (offset/limit), avoid O(N) scans, and remain resilient to growth.
  - Existing features/tests must remain green; we’ll add new tests before implementation.

---

## 2) Current State (C1 recap)

- Smart contract has transfers storage and lifecycle:
  - `requestTransfer` → creates Transfer with `status = Pending`.
  - `acceptTransfer` / `rejectTransfer` mutate status.
  - `getTransfer(id)` returns a single Transfer.
- Frontend helper `getPendingTransfersBySender(address)` exists (C1 path) but relies on a SC function that we added; it returns entire lists without pagination.
- UI component `PendingTransfers.tsx` renders a basic table with empty state.

Limitations:

- No pagination; potential large payloads.
- No direct recipient view.
- Inefficient as data grows and not easily evolvable for filters.

---

## 3) Target State (C2 design)

### 3.1 Data Structures (Solidity)

Add indexed structures to maintain pending transfer IDs by address with O(1) updates:

```solidity
// Pending transfer indices
mapping(address => uint256[]) private pendingBySender;
mapping(address => uint256[]) private pendingByRecipient;

// For O(1) removal via swap-and-pop
mapping(uint256 => uint256) private senderPos;     // transferId -> index+1 in pendingBySender[from]
mapping(uint256 => uint256) private recipientPos;  // transferId -> index+1 in pendingByRecipient[to]

mapping(uint256 => bool) private isPending; // fast guard on status
```

Notes:

- We use index+1 to differentiate "missing" (0) from valid index 0.
- Alternative: `mapping(address => mapping(uint256 => uint256))` if you need per-address positions. Minimalistic option above uses single maps assuming `transferId` is unique enough; otherwise use nested maps to avoid collisions when a transfer could theoretically appear in multiple lists (not applicable here).

### 3.2 Public Read API (Solidity)

Provide paginated getters and totals:

```solidity
function getPendingBySender(address sender, uint256 offset, uint256 limit)
  public view returns (Transfer[] memory items, uint256 total);

function getPendingByRecipient(address recipient, uint256 offset, uint256 limit)
  public view returns (Transfer[] memory items, uint256 total);
```

Behavior:

- `total` returns `pendingBySender[sender].length` (or recipient).
- `items` returns slice `[offset, offset+limit)` clamped to total.
- Only returns transfers where `isPending[id]` is true (defensive against out-of-sync state).

### 3.3 Index Maintenance Hooks (Solidity)

- On `requestTransfer(tokenId, to, amount)`:

  - Create transfer (as today).
  - Set `isPending[id] = true`.
  - Push `id` to `pendingBySender[msg.sender]` and `pendingByRecipient[to]`.
  - Record positions:
    - `senderPos[id] = pendingBySender[msg.sender].length;` (index+1)
    - `recipientPos[id] = pendingByRecipient[to].length;`

- On `acceptTransfer(id)` and `rejectTransfer(id)`:

  - Set `isPending[id] = false`.
  - Remove from `pendingBySender[from]` and `pendingByRecipient[to]` with swap-and-pop:
    - Find last index and the index for `id` using `senderPos[id] - 1`.
    - Swap with last element if not last; update that element’s position map.
    - Pop; set `senderPos[id] = 0`.
  - Repeat for recipient side; set `recipientPos[id] = 0`.

- Safety:
  - Guard removal only if `isPending[id]` was true.
  - Keep storage minimal; no duplicates.

---

## 4) Tests-First Plan — Smart Contract

Add tests in `sc/test/SupplyChain.t.sol` before implementation.

### 4.1 Indexing on Request

- Arrange: producer + factory approved; create one token.
- Act: request 3 transfers → (factory, retailer, factory).
- Assert:
  - `getPendingBySender(producer, 0, 10)` returns 3; total == 3.
  - `getPendingByRecipient(factory, 0, 10)` returns 2; total == 2.

### 4.2 Removal on Accept/Reject

- Arrange: as above; request 2 to factory.
- Act: factory accepts first; producer rejects second.
- Assert:
  - Both lists return total == 0; `isPending` guards false; positions cleared.

### 4.3 Pagination Slices

- Arrange: request 7 transfers to factory.
- Assert:
  - `(offset=0,limit=3)` → 3 items, total 7.
  - `(offset=3,limit=3)` → next 3.
  - `(offset=6,limit=3)` → last 1.
  - `(offset>=total)` → empty slice.

### 4.4 Defensive Consistency

- Force corner-case: create then set status to Accepted without index maintenance (simulate older state).
- Ensure getters only return where `isPending[id]==true`.

### 4.5 Backward Compatibility

- Ensure existing tests (token creation, role control, accept/reject logic) remain green.

---

## 5) Frontend Changes — Tests First

### 5.1 Contract Helpers (web/src/lib/contract.ts)

New helper APIs (tests first):

- `getPendingBySender(address: string, offset: number, limit: number): Promise<{ items: PendingTransfer[]; total: number }>`
- `getPendingByRecipient(address: string, offset: number, limit: number): Promise<{ items: PendingTransfer[]; total: number }>`

Behavior:

- Calls the SC paginated getters.
- Maps `Transfer` structs to `{ id, tokenId, tokenName?, amount, to, status, createdAt }`.
- Token name enrichment: keep current behavior (additional `getToken(tokenId)` calls) OR add a small cache to prevent re-fetching names in a single page.

Tests to add (RED):

- Contract helper returns `{ items, total }` shape.
- Pagination respected (2 pages aggregate to full set in mocks).
- Token name enrichment used once per unique tokenId per page (spy counts).

### 5.2 PendingTransfers Component

Enhancements (tests first):

- Accepts role perspective:
  - Producer dashboard uses `getPendingBySender(address)`.
  - Factory dashboard uses `getPendingByRecipient(address)` (future reuse).
- Adds pagination UI:
  - Initial load: `offset=0, limit=10`.
  - Show "Load more" if `items.length < total`.
  - On click: fetch next page and append rows.
- Maintains loading/error states per page.

Unit tests to add (RED):

- Renders first page and shows Load more when `total>items.length`.
- On clicking Load more, appends next page.
- Empty state when total==0.
- Works with both sender and recipient modes (param or inferred by role).

Integration tests:

- Dashboard renders PendingTransfers and paginates as expected when there are >10 transfers.

---

## 6) Implementation Steps (in order)

1. SC — Write tests (RED) for indexing and pagination (4.1–4.5). [DONE]
2. SC — Implement data structures and hooks (3.1, 3.3), then getters (3.2) (GREEN). [DONE]
3. SC — Run full test suite; fix regressions; minor gas audit (PASS). [DONE]
4. FE — Write helper tests (RED), implement helper calls to new getters (GREEN). [DONE]
5. FE — Write component tests (RED), implement pagination and role modes (GREEN). [DONE]
6. FE — Integration tests for dashboard (RED→GREEN). [DONE]
7. Tooling — Regenerate ABI/types; ensure build/test scripts green. [DONE]
8. Docs — Update `PENDING_TRANSFERS_DEBUG.md` with final state and `PROGRESS.md` entries. [IN-PROGRESS]

---

## 7) Deployment & Integration Checklist

- Deploy updated contract; capture address. [DONE]
- Regenerate `contracts.ts` via script "regen:contracts" of the web project (npm run regen:contracts); If npm script fails, ensure to fix it until it does the regeneration correctly; update ABI/types (typechain). [DONE]
- Verify env points to the correct network + address.
- Seed sample data: 15+ pending transfers for pagination test.
- Manual QA: Producer and Factory dashboards show expected rows; Load more works; statuses update after accept/reject.

---

## 8) Risks & Mitigations

- Array growth and gas: Paginated getters return slices; avoid returning massive arrays.
- Index consistency: Covered by tests; use `isPending` guard; ensure hooks update both indices atomically.
- Frontend cache staleness: Bust cache on accept/reject or on socket/event triggers (future enhancement).
- ABI drift: Lock ABI in config; regenerate types as part of CI.

---

## 9) Acceptance Criteria

- SC tests (new + existing) all pass; pagination and index maintenance verified.
- FE unit + integration tests pass; PendingTransfers supports pagination and correct totals.
- Producer dashboard shows sender-pending; (optionally) Factory dashboard shows incoming pending.
- Performance: First-page latency acceptable (<300ms locally; scalable to bundle pagination in prod).

---

## 10) Rollback Plan

- If regressions found, revert to C1 helper and existing SC version; keep Strategy A (logs) as a contingency if needed.
- Maintain tagged deployment of previous contract address for quick switch.

---

## 11) Timeline (est.)

- SC tests + implementation: 0.5–1 day
- FE helpers + component + tests: 0.5–1 day
- QA + documentation: 0.5 day

Total: ~1.5–2.5 days depending on reviews and environment.
