# INCOMING_TRANSFERS_ALL_STATUS_ANALYSIS.md — Feature Analysis

**Date:** 26 October 2025  
**Feature:** Incoming Transfers (All Statuses) for Factory Dashboard  
**Scope:** Display all incoming transfers (Pending, Accepted, Rejected) instead of only Pending

---

## Executive Summary

**Objective:**  
Update the Factory dashboard's Incoming Transfers section to display all incoming transfers regardless of status (currently only shows Pending transfers).

**Current State:**

- The `IncomingTransfers` component (recently renamed from `PendingTransfersReceived`) only lists transfers with status `Pending`
- Factory users cannot see historical transfers (Accepted/Rejected) in the dashboard
- This limits traceability and visibility of past actions

**Desired Outcome:**

- Incoming Transfers shows all transfers received by the Factory: Pending, Accepted, and Rejected
- Each transfer displays its current status clearly (badge, color, or icon)
- Pagination and existing actions (Accept/Reject) remain functional
- Accept/Reject buttons are disabled/hidden for non-Pending transfers

---

## 1. Document Analysis

### Relevant Documentation

- **`docs/DELIVERY.md`:** Current delivery tracking (supersedes old progress docs)
- **`docs/adr/002-pending-transfers-migration-to-c2.md`:** Pagination strategy for transfers
- **`docs/adr/005-frontend-event-sourcing-transfer-history.md`:** Event-based transfer history approach
- **Smart Contract:** `sc/src/SupplyChain.sol` - `TransferStatus` enum and transfer flow

### Functional Requirements

From existing documentation and smart contract:

- Transfer lifecycle: `requestTransfer()` → `acceptTransfer()/rejectTransfer()`
- Status enum: `Pending (0)`, `Accepted (1)`, `Rejected (2)`
- Only recipient can accept/reject
- Pagination via `getPendingByRecipient(offset, limit)` (currently returns only Pending)

### Architectural Considerations

- **Frontend hook:** `useTransfersList` exists with `showAllStatuses` parameter
- **Contract limitation:** `getPendingByRecipient` only returns Pending transfers by design
- **Event-sourcing approach:** ADR 005 proposes using events (`TransferRequested`, `TransferAccepted`, `TransferRejected`) to build full history in frontend

---

## 2. Code Audit

### Current Implementation

**Component:**

- `web/src/components/tokenOps/IncomingTransfers.tsx` (recently renamed)
- Uses `usePendingTransfersList` hook with `direction: 'received'`
- Renders table with Accept/Reject actions
- Only shows Pending transfers

**Hook:**

- `web/src/hooks/useTransfersList.ts` supports `showAllStatuses` flag
- When `true`, fetches events and builds full transfer list
- Maps events to transfer objects with current status

**Contract Integration:**

- `web/src/lib/contract.ts` has `getPendingByRecipient()` (Pending only)
- Event listeners: `TransferRequested`, `TransferAccepted`, `TransferRejected`

### Test Coverage

**Existing tests:**

- `transfers.received.list.test.tsx` — tests Pending-only list rendering
- `transfers.received.actions.test.tsx` — tests Accept/Reject actions
- `dashboard.test.tsx` — tests Factory dashboard rendering

**Gap:** No tests for all-status display in Incoming Transfers

---

## 3. Roadmap Alignment

### Feature Checklist

- [ ] **Incoming Transfers displays all statuses** (not implemented)
- [x] **Incoming Transfers displays Pending transfers** (currently implemented)
- [x] **Accept/Reject actions functional** (implemented)
- [x] **Pagination working** (implemented)
- [ ] **Status badges/indicators** (not implemented)
- [ ] **Tests for all-status display** (not implemented)

### Status Summary

- **✅ DONE:** Pending-only list, actions, pagination
- **⏳ IN PROGRESS:** Rename from PendingTransfersReceived → IncomingTransfers
- **❌ PENDING:** All-status display, status UI, tests

---

## 4. Implementation Plan

### Approach: Frontend-Only (Event Sourcing)

Following ADR 005, use existing `useTransfersList` hook with `showAllStatuses: true`:

- Fetch `TransferRequested` events where `to === currentAddress`
- For each event, query `getTransfer(id)` to get current status
- Build unified list with all statuses
- Existing pagination and actions remain unchanged

**No smart contract changes required.**

### Changes Required

1. **Component Update (`IncomingTransfers.tsx`):**

   - Pass `showAllStatuses: true` to `usePendingTransfersList`
   - Add status badge/indicator to table (use existing `TransferStatus` enum)
   - Conditionally disable Accept/Reject buttons for non-Pending transfers

2. **UI Enhancement:**

   - Create Badge component
   - Map status to color: Pending (yellow), Accepted (green), Rejected (red)
   - Use new Badge component in status column

3. **Tests:**
   - Update `transfers.received.list.test.tsx` to verify all statuses shown
   - Add test case with mixed statuses (Pending, Accepted, Rejected)
   - Verify actions disabled for non-Pending transfers

### TDD Cycle

**RED:**

- Write test: "Incoming Transfers displays all statuses (Pending, Accepted, Rejected)"
- Write test: "Accept/Reject buttons disabled for non-Pending transfers"

**GREEN:**

- Update `IncomingTransfers` to pass `showAllStatuses: true`
- Add status badge rendering
- Conditional button disable logic

**REFACTOR:**

- Extract status badge to reusable component if needed
- Optimize event queries if performance issue detected

---

## 5. Risks and Mitigations

### Risk 1: Performance (many transfers)

**Impact:** Event queries may be slow for users with many transfers  
**Mitigation:** Pagination already implemented; monitor performance and add caching if needed

### Risk 2: UI Clutter

**Impact:** All statuses may overwhelm the UI  
**Mitigation:** Clear status indicators (badges, colors); consider filters (Pending/All toggle)

### Risk 3: Existing Tests Break

**Impact:** Tests expect Pending-only behavior  
**Mitigation:** Update tests incrementally; ensure backward compatibility during TDD

---

## 6. Acceptance Criteria

- [ ] Incoming Transfers displays all incoming transfers (Pending, Accepted, Rejected)
- [ ] Each transfer shows its status via badge/color
- [ ] Accept/Reject buttons only enabled for Pending transfers
- [ ] Pagination works correctly with all statuses
- [ ] Tests pass: list rendering, actions, mixed statuses
- [ ] No smart contract changes required
- [ ] No performance degradation (verified manually with >10 transfers)

---

## 7. Next Steps

1. **Review this analysis** with project owner
2. **Write RED tests** for all-status display
3. **Implement GREEN solution** (component + UI changes)
4. **REFACTOR** for clarity and reusability
5. **Update `DELIVERY.md`** with milestone completion

---

## Notes

- This feature aligns with the overall goal of improved traceability and user visibility
- Event-sourcing approach (ADR 005) is already proven in `useTransfersList` for outgoing transfers
- No backend/contract changes simplify implementation and testing
