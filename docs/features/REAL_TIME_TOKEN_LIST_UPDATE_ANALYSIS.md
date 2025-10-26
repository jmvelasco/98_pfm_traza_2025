# Feature Analysis: Real-Time Token List Update on Transfer Acceptance

**Status**: 📝 Analysis Phase  
**Date**: 26 October 2025  
**Related ADRs**: ADR 005 (Event Sourcing), ADR 002 (Indexed Getters)  
**Related Components**: `MyTokens.tsx`, `IncomingTransfers.tsx`  
**User Story**: As a Factory/Retailer/Consumer, when I accept an incoming transfer, I want to see the newly acquired token immediately in my token list without needing to refresh the page.

---

## 1. Problem Statement

### Current Behavior

1. User receives an incoming transfer request (e.g., Factory receives raw material from Producer)
2. User navigates to Dashboard and sees the pending transfer in "Incoming Transfers" section
3. User clicks "Accept" button
4. Smart contract executes `acceptTransfer()`:
   - Moves token balance from sender to recipient: `tokenBalances[tokenId][from] -= amount; tokenBalances[tokenId][to] += amount`
   - Updates transfer status to `Accepted`
   - Removes transfer from pending indices
   - Emits `TransferAccepted(transferId)` event
5. Transfer disappears from "Incoming Transfers" list (✅ working via `refresh()` call)
6. **Problem**: "My Tokens" section does NOT update automatically
7. User must manually refresh the entire page to see the newly acquired token

### User Impact

- **Friction**: Breaks user flow; requires manual page reload
- **Confusion**: User sees transfer accepted but no token appears
- **Educational value**: Poor demonstration of blockchain real-time capabilities
- **Inconsistency**: Incoming Transfers updates in real-time, but My Tokens does not

### Root Cause Analysis

**MyTokens Component** (`web/src/components/tokenOps/MyTokens.tsx`):

```typescript
// ✅ Listens to TokenCreated events (lines 70-162)
useEffect(() => {
  // ... setup event listener for TokenCreated
  handler = async (...args: any[]) => {
    // Only handles NEW tokens created by the user
    if (creator && creator.toLowerCase() === userAddress.toLowerCase()) {
      // Fetch and append to state
    }
  };
  contract.on(eventFilter, handler);
}, [userAddress]);
```

**What's missing**:

- No listener for `TransferAccepted` events where `to === userAddress`
- When a transfer is accepted, the recipient gains balance but receives no notification
- Component only knows about tokens created by the user, not tokens received via transfers

---

## 2. Technical Context

### Smart Contract Events (SupplyChain.sol)

```solidity
event TransferAccepted(uint256 indexed transferId);
// Emitted in acceptTransfer() after balance transfer (line 540)
```

**Event data available**:

- `transferId`: uint256 (indexed)
- No tokenId, from, or to in event parameters
- Must fetch `transfers[transferId]` to get full transfer details

### Transfer Acceptance Flow

```solidity
function acceptTransfer(uint256 transferId) public onlyApprovedUser {
    Transfer storage t = transfers[transferId];
    // ... validations

    // Balance transfer
    tokenBalances[t.tokenId][t.from] -= t.amount;
    tokenBalances[t.tokenId][t.to] += t.amount;  // ← Recipient gains balance

    t.status = TransferStatus.Accepted;
    _unindexPending(transferId);

    emit TransferAccepted(transferId);  // ← Event we need to listen for
}
```

### Current MyTokens Data Flow

```
On Mount:
  getUserTokensWithBalance(userAddress)
    → Queries all tokenIds with balance > 0
    → Fetches token details for each ID
    → Sets state

Real-time (TokenCreated only):
  TokenCreated event (creator === userAddress)
    → Fetch token details
    → Append to state if not duplicate
```

**What we need to add**:

```
Real-time (TransferAccepted):
  TransferAccepted event
    → Fetch transfer details (getTransfer)
    → Check if transfer.to === userAddress
    → Fetch token details (getTokenDetails)
    → Append/update token in state if not duplicate
```

---

## 3. Solution Design

### Approach: Event Listener Extension (Recommended)

Extend the existing event-driven pattern in `MyTokens.tsx` to listen for `TransferAccepted` events, following the same architecture as the `TokenCreated` listener.

**Key principle**: Reuse the proven pattern from ADR 005 (event sourcing) already working in `IncomingTransfers.tsx`.

### Implementation Strategy

#### Option A: Listen to TransferAccepted + Filter by Recipient (SELECTED)

**Approach**:

1. Add second `useEffect` in `MyTokens.tsx` to listen for `TransferAccepted` events
2. When event fires, fetch transfer details via `contract.getTransfer(transferId)`
3. Check if `transfer.to === userAddress` (recipient is current user)
4. If match, fetch token details and append to state (same as `TokenCreated` handler)
5. Use existing `seenIdsRef` to prevent duplicates

**Pros**:

- ✅ Minimal code changes (~40-50 lines)
- ✅ Reuses existing deduplication logic (`seenIdsRef`)
- ✅ Consistent with `TokenCreated` event listener pattern
- ✅ No smart contract changes (zero gas cost, no redeploy)
- ✅ Works for any transfer acceptance, not just in current session

**Cons**:

- ❌ Receives ALL `TransferAccepted` events (filter client-side)
- ❌ Extra RPC call to fetch transfer details per event
- ❌ Minor performance overhead on busy networks (negligible for local/testnet)

**Data flow**:

```
TransferAccepted(transferId)
  → const transfer = await contract.getTransfer(transferId)
  → if (transfer.to.toLowerCase() === userAddress.toLowerCase())
  →   const tokenDetails = await getTokenDetails(transfer.tokenId, userAddress)
  →   if (!seenIdsRef.current.has(tokenDetails.id))
  →     setTokens(prev => [...prev, tokenDetails])
```

#### Option B: Propagate Event from IncomingTransfers (NOT SELECTED)

**Approach**: After `acceptTransfer()` succeeds in `IncomingTransfers.tsx`, emit a custom React event or use a shared state manager to notify `MyTokens`.

**Pros**:

- ✅ No extra contract queries (already know tokenId from transfer data)

**Cons**:

- ❌ Tight coupling between components
- ❌ Only works when acceptance happens via UI (misses external acceptances)
- ❌ Violates single-responsibility principle
- ❌ Requires shared state mechanism (Context/Redux)

#### Option C: Poll for Balance Changes (NOT SELECTED)

**Approach**: Periodically call `getUserTokensWithBalance()` every N seconds.

**Pros**:

- ✅ Simple implementation

**Cons**:

- ❌ High RPC overhead
- ❌ Delayed updates (polling interval)
- ❌ Wasteful when no changes occur
- ❌ Not aligned with event-driven architecture established in ADR 005

---

## 4. Implementation Plan (TDD)

### Phase 1: RED — Write Failing Test

**File**: `web/src/__tests__/mytokens.test.tsx` (extend existing file)

**Changes required**:

1. **Extend mock** to support `TransferAccepted` events (~10 lines):

   - Add `TransferAccepted` to `contract.filters`
   - Add listener registry for `TransferAccepted` handler
   - Add `getTransfer` method to mock contract

2. **Add 3 new test cases** to existing describe block (~75 lines):

```typescript
describe("MyTokens", () => {
  // ... 5 existing tests for render and TokenCreated events

  it("updates UI when TransferAccepted event fires for recipient", async () => {
    // Arrange
    const userAddress = "0xfactory";
    vi.mocked(contractModule.getUserTokensWithBalance).mockResolvedValue([]);
    factoryMock.contract.getTransfer.mockResolvedValue({
      id: 1,
      transferId: 1,
      tokenId: 42,
      from: "0xproducer",
      to: "0xfactory",
      amount: 10,
      status: "Accepted",
    });
    vi.mocked(contractModule.getTokenDetails).mockResolvedValue(
      mockTokenDetails
    );

    render(<MyTokens userAddress={userAddress} />);
    expect(await screen.findByText(/no tokens yet/i)).toBeInTheDocument();

    // Act: Simulate TransferAccepted event
    const listener = factoryMock.getListener("TransferAccepted");
    await act(async () => {
      await listener({ args: { transferId: 1 } });
    });

    // Assert
    expect(await screen.findByText(/Wheat/i)).toBeInTheDocument();
  });

  it("ignores TransferAccepted events where recipient is not current user", async () => {
    // Arrange: user is 0xfactory
    factoryMock.contract.getTransfer.mockResolvedValue({
      tokenId: 42,
      to: "0xretailer", // Different user
    });
    // Act: emit TransferAccepted
    // Assert: no new token appears
  });

  it("prevents duplicate tokens when TransferAccepted fires multiple times", async () => {
    // Arrange: user already has token #10 from initial load
    // Act: emit TransferAccepted for transfer of token #10 to user
    // Assert: only one instance of token #10 in list (seenIdsRef working)
  });
});
```

**Expected outcome**: Tests fail because `MyTokens` does not listen to `TransferAccepted` events.

**Note**: See ADR 007 for rationale on extending existing test file vs creating new one.

### Phase 2: GREEN — Implement Listener

**File**: `web/src/components/tokenOps/MyTokens.tsx`

**Changes**:

1. Add new `useEffect` after existing `TokenCreated` listener (around line 163)
2. Setup `TransferAccepted` event listener
3. Handler logic:
   - Extract `transferId` from event args
   - Fetch transfer via `contract.getTransfer(transferId)`
   - Check `transfer.to === userAddress`
   - If match, fetch token details and append to state
   - Use `seenIdsRef` for deduplication

**Pseudo-code**:

```typescript
useEffect(() => {
  if (typeof window === "undefined" || !window.ethereum || !userAddress) return;

  let provider: ethers.BrowserProvider;
  let contract: any;
  let handler: ((...args: any[]) => Promise<void>) | null = null;

  async function setupListener() {
    provider = new ethers.BrowserProvider(window.ethereum);
    contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);

    handler = async (...args: any[]) => {
      // Extract transferId (ethers v6 event object)
      let transferId;
      if (args.length === 1 && args[0]?.args) {
        transferId = args[0].args?.transferId ?? args[0].args?.[0];
      } else return;

      // Fetch transfer details
      const transfer = await contract.getTransfer(transferId);

      // Check if current user is recipient
      if (transfer.to.toLowerCase() !== userAddress.toLowerCase()) return;

      // Fetch token details and append
      const tokenIdNum = Number(transfer.tokenId);
      const idStr = String(tokenIdNum);
      if (seenIdsRef.current.has(idStr)) return;

      const details = await getTokenDetails(tokenIdNum, userAddress);
      if (details) {
        seenIdsRef.current.add(String(details.id));
        setTokens((prev) => {
          if (prev.some((t) => String(t.id) === String(details.id)))
            return prev;
          return [...prev, details];
        });
      }
    };

    const eventFilter = contract.filters.TransferAccepted();
    contract.on(eventFilter, handler);
  }

  setupListener();

  return () => {
    // Cleanup (same pattern as TokenCreated)
    if (contract && handler) {
      // ... remove listener
    }
  };
}, [userAddress]);
```

### Phase 3: REFACTOR — Extract Event Listener Hook (MANDATORY)

**This phase is required** (not optional) to eliminate code duplication and establish reusable pattern. See **ADR 007** for detailed rationale.

**Objective**: Extract common event listener setup/cleanup logic into reusable `useContractEvent` hook.

**Deliverables**:

1. **Create Hook**: `web/src/hooks/useContractEvent.ts` (~80 lines)

```typescript
export function useContractEvent(
  eventName: string,
  handler: (...args: any[]) => Promise<void> | void,
  deps: any[] = []
) {
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    let contract: any;

    async function setup() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        contract = SupplyChain__factory.connect(
          CONTRACT_CONFIG.address,
          provider
        );
        const filter = contract.filters[eventName]?.();
        if (filter) contract.on(filter, memoizedHandler);
      } catch (e) {
        console.error(`Error setting up ${eventName} listener:`, e);
      }
    }

    setup();

    return () => {
      if (contract && memoizedHandler) {
        try {
          contract.off(eventName, memoizedHandler);
        } catch {
          contract.removeAllListeners?.(eventName);
        }
      }
    };
  }, [eventName, memoizedHandler]);
}
```

2. **Add Hook Tests**: `web/src/__tests__/useContractEvent.test.ts` (~60 lines, 4 tests)

   - Test: listener registration on mount
   - Test: listener cleanup on unmount
   - Test: re-registration when eventName changes
   - Test: error handling

3. **Refactor MyTokens.tsx** to use hook:

```typescript
// Replace 2 inline useEffect blocks with 2 hook calls
useContractEvent("TokenCreated", handleTokenCreated, [userAddress]);
useContractEvent("TransferAccepted", handleTransferAccepted, [userAddress]);

// Where handlers are:
const handleTokenCreated = useCallback(
  async (event: any) => {
    const { tokenId, creator } = event.args;
    if (creator?.toLowerCase() === userAddress.toLowerCase()) {
      // ... business logic
    }
  },
  [userAddress]
);

const handleTransferAccepted = useCallback(
  async (event: any) => {
    const { transferId } = event.args;
    const transfer = await contract.getTransfer(transferId);
    if (transfer.to.toLowerCase() === userAddress.toLowerCase()) {
      // ... business logic
    }
  },
  [userAddress]
);
```

**Benefits** (per ADR 007):

- Eliminates ~124 lines of duplicated setup/cleanup code
- Centralizes event listener infrastructure for easier maintenance
- Simplifies component tests (can mock the hook)
- Establishes reusable pattern for future event listeners (e.g., `TransferRejected`)

**Additional improvements**:

4. **Error handling**: Add try/catch around `getTransfer()` and `getTokenDetails()` calls in handlers
5. **Loading states**: Consider showing temporary "updating..." indicator during token fetch (out of scope for MVP)
6. **Balance merging**: If token already exists (different balance), merge instead of append (out of scope for MVP)

### Phase 4: Integration Testing

**Test scenarios**:

1. **Happy path**: Accept transfer → token appears in list
2. **Wrong recipient**: Transfer accepted by another user → no update
3. **Duplicate prevention**: Multiple events for same token → single entry
4. **Balance update**: Existing token receives more balance → balance refreshes
5. **Cross-component**: Accept in `IncomingTransfers`, verify update in `MyTokens`

**File**: `web/src/__tests__/integration/transfer-acceptance.test.tsx` (optional)

---

## 5. Technical Decisions

### Event Filtering Strategy

**Decision**: Listen to ALL `TransferAccepted` events, filter client-side by `transfer.to`.

**Rationale**:

- Ethers v6 does not support indexed filtering on non-indexed parameters (`to` is not indexed in event)
- Alternative would require SC change to make `to` indexed in event (unnecessary for scope)
- Client-side filtering is acceptable given dataset size (educational project, local/testnet)
- Consistent with ADR 005 approach for `TransferRequested` events

### State Update Strategy

**Decision**: Append new token to state array; rely on existing deduplication via `seenIdsRef`.

**Rationale**:

- Reuses proven pattern from `TokenCreated` listener
- `seenIdsRef` prevents duplicates from React StrictMode double-invocation
- State merge logic already exists in initial fetch (lines 45-50)
- Simple, testable, consistent

### Error Handling

**Decision**: Catch and log errors; do not show user-facing alerts for event listener failures.

**Rationale**:

- Event listener failures are non-critical (user can still refresh page)
- Component continues to function if listener setup fails
- Console errors provide debugging info for developers
- Consistent with existing `TokenCreated` listener behavior (line 157)

---

## 6. Testing Strategy

### Unit Tests (MyTokens component)

**File**: `web/src/__tests__/mytokens.test.tsx` (extend existing, not create new)

**Coverage**:

- ✅ Renders new token when `TransferAccepted` event fires for current user
- ✅ Ignores events where `transfer.to !== userAddress`
- ✅ Prevents duplicate tokens via `seenIdsRef`
- ✅ Handles errors gracefully (mock `getTransfer` failure)
- ✅ Cleans up event listeners on unmount

**Total tests in file**: 8 (5 existing + 3 new)

**Projected file size**: ~240 lines (within acceptable 300-line threshold)

**Mocking strategy** (extend existing mock):

```typescript
// Extend existing SupplyChain__factory mock
vi.mock("../types/factories/SupplyChain__factory", () => {
  const listeners = { TokenCreated: null, TransferAccepted: null };
  const contract = {
    filters: {
      TokenCreated: () => "TokenCreated",
      TransferAccepted: () => "TransferAccepted", // ← Add
    },
    on: (filter, handler) => {
      listeners[filter] = handler;
    },
    off: (filter, handler) => {
      /* ... */
    },
    removeAllListeners: () => {
      /* ... */
    },
    getTransfer: vi.fn(), // ← Add for TransferAccepted tests
  };
  return {
    SupplyChain__factory: { connect: () => contract },
    __mock: {
      getListener: (eventName) => listeners[eventName], // ← Modified
      contract,
    },
  };
});
```

**Rationale for single file** (per ADR 007):

- Shared mock setup (no duplication)
- Related tests in one place (both event listeners in same component)
- Acceptable file size after additions
- Consistent with project patterns

### Hook Tests (MANDATORY)

**File**: `web/src/__tests__/useContractEvent.test.ts` (new)

**Coverage** (4 tests required):

- ✅ Registers event listener on mount
- ✅ Cleans up listener on unmount
- ✅ Re-registers when eventName changes
- ✅ Handles setup errors gracefully

**Why mandatory**: See ADR 007 — hook is core infrastructure that must be tested in isolation.

### Integration Tests (optional)

**File**: `web/src/__tests__/integration/accept-transfer-updates-tokens.test.tsx`

**Scenario**: Render both `IncomingTransfers` and `MyTokens` in Dashboard context; accept a transfer; verify token appears in both sections.

**Note**: This is optional; unit tests provide sufficient coverage for MVP.

---

## 7. Rollout Plan

### Development Steps

1. **Commit 1**: RED — Extend `mytokens.test.tsx` with failing TransferAccepted tests
   - Update mock to support both TokenCreated and TransferAccepted
   - Add 3 new test cases (expect failures)
2. **Commit 2**: GREEN — Implement `TransferAccepted` listener in `MyTokens.tsx`
   - Add second `useEffect` for TransferAccepted event
   - Verify all 8 tests pass
3. **Commit 3**: REFACTOR — Extract `useContractEvent` hook (MANDATORY, per ADR 007)
   - Create hook and tests
   - Refactor MyTokens to use hook
   - Verify all tests still pass (may need minor mock adjustments)
4. **Commit 4**: Update `DELIVERY.md` with Milestone 2 completion
   - Document deliverables, technical details, impact

### Testing Checklist

- [ ] Component unit tests pass (8 tests in `mytokens.test.tsx`: 5 existing + 3 new)
- [ ] Hook unit tests pass (4 tests in `useContractEvent.test.ts`)
- [ ] Existing tests remain green (108 total tests: 107 existing + 1 new test file)
- [ ] Manual test: Start Anvil → Deploy → Create transfer → Accept → Verify token appears
- [ ] Manual test: Verify no duplicate tokens on page reload
- [ ] Manual test: Verify existing `TokenCreated` listener still works
- [ ] Code review: Verify hook eliminates duplication (net -124 lines in MyTokens.tsx)

### Documentation Updates

- [ ] Update `docs/DELIVERY.md` — add Milestone 2: "Real-time Token List Update"
- [x] Create ADR 007 documenting event listener hook extraction decision (completed)
- [ ] Update ADR 007 status from "Analysis Phase" to "Implemented" after Phase 3 completion

---

## 8. Success Criteria

### Functional Requirements

- ✅ When user accepts an incoming transfer, the received token appears in "My Tokens" section within 1-2 seconds
- ✅ No page refresh required
- ✅ No duplicate tokens appear
- ✅ Works for all roles (Factory, Retailer, Consumer)
- ✅ Existing functionality (manual refresh, initial load) continues to work

### Non-Functional Requirements

- ✅ No smart contract changes (zero gas cost)
- ✅ No additional RPC polling overhead
- ✅ Event listener setup completes without blocking UI
- ✅ Performance acceptable for 100+ transfers (local/testnet scope)

### User Experience

- ✅ User sees immediate feedback: transfer accepted → token appears
- ✅ UI remains responsive during token fetch (~100-200ms)
- ✅ No flash of empty state or loading spinner for existing tokens

---

## 9. Known Limitations

### Scope Exclusions

**Not included in this milestone**:

- ❌ Real-time balance updates for EXISTING tokens (requires more complex merge logic)
- ❌ Optimistic UI updates (show token immediately before contract confirmation)
- ❌ Event listener auto-reconnection on network changes
- ❌ Historical event catch-up (if user was offline during acceptance)

**Rationale**: These features add complexity without significant value for educational project scope. Can be addressed in future milestones if needed.

### Technical Constraints

- **Network dependency**: Requires MetaMask/provider to be connected
- **Event availability**: Relies on RPC node storing recent events (safe assumption for Anvil/testnet)
- **Filter limitations**: Cannot filter by `to` address at contract level (not indexed)
- **React StrictMode**: Double-invocation mitigated by `seenIdsRef` but adds minimal overhead

---

## 10. Future Enhancements (Out of Scope)

### V2 Features (If Time Permits)

1. **Balance Merge Logic**: Update balance of existing tokens instead of only appending new ones
2. **Rejected Transfer Notification**: Show toast/alert when sender's transfer is rejected
3. **Event Persistence**: Store events in localStorage for offline-first experience
4. **Custom Event Hook**: Extract `useContractEvent(eventName, handler)` utility

### Performance Optimizations (Mainnet Considerations)

- Implement event query caching (see ADR 005 TODOs)
- Add debouncing for rapid event bursts
- Use indexed recipient address (requires SC event signature change)

---

## 11. References

### Related Documentation

- **ADR 007**: Contract Event Listener Hook Extraction (THIS FEATURE)
  - Decision: Extract `useContractEvent` hook (mandatory in Phase 3)
  - Rationale: Eliminate duplication, establish reusable pattern
  - Test strategy: Extend existing `mytokens.test.tsx` vs new file
- **ADR 005**: Frontend Event Sourcing for Transfer History
  - Pattern: Event listeners + client-side state updates
  - Proven in `IncomingTransfers` component
- **ADR 002**: Indexed SC Getters with Pagination
  - Context: Why we use events vs polling
- **MyTokens.tsx** (lines 70-162): Existing `TokenCreated` listener implementation
- **SupplyChain.sol** (lines 516-541): `acceptTransfer()` function and event emission

### Code Patterns to Reuse

```typescript
// Event listener setup (from MyTokens.tsx lines 82-95)
provider = new ethers.BrowserProvider(window.ethereum);
contract = SupplyChain__factory.connect(CONTRACT_CONFIG.address, provider);
handler = async (...args: any[]) => {
  /* ... */
};
const eventFilter = contract.filters.EventName();
contract.on(eventFilter, handler);

// Cleanup (lines 129-162)
contract.off(eventFilter, handler);

// Deduplication (lines 107-115)
if (seenIdsRef.current.has(idStr)) return;
seenIdsRef.current.add(String(details.id));
```

---

## 12. Decision

**Adopt Option A**: Extend `MyTokens.tsx` with `TransferAccepted` event listener, following the proven pattern from `TokenCreated` listener and ADR 005 event sourcing strategy.

**PLUS mandatory refactor**: Extract `useContractEvent` hook to eliminate code duplication (per ADR 007).

**Timeline**: 2-3 hours (TDD cycle: 30min RED + 45min GREEN + 90min REFACTOR including hook creation and tests)

**Risk level**: LOW (reuses established patterns, zero SC changes, hook well-scoped)

**Deliverables**:

1. Extended `mytokens.test.tsx` with 3 new tests (total 8 tests, ~240 lines)
2. `TransferAccepted` listener in `MyTokens.tsx`
3. `useContractEvent` hook with tests (new files)
4. Refactored `MyTokens.tsx` to use hook (net -124 lines)
5. Updated `DELIVERY.md` with Milestone 2

---

**Ready for Review**: This analysis document is complete and ready for user approval before proceeding to implementation phase.
