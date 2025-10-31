---
**ADR**: 007
**Title**: Contract Event Listener Hook Extraction and Test Suite Organization
**Status**: ✅ Implemented
**Date**: 26 October 2025 (Implemented: 26 October 2025)
**Related**: ADR 005 (Event Sourcing), REAL_TIME_TOKEN_LIST_UPDATE_ANALYSIS.md, DELIVERY.md Milestone 2
**Purpose**: Evaluate extracting common event listener pattern into reusable hook and assess test file organization strategy
**Retain for**: Architecture decisions on code reusability, test suite organization guidelines
---

## Context

### Problem Statement

As we implement real-time token updates via `TransferAccepted` event listeners in `MyTokens.tsx`, we're adding a second event listener following the same pattern as the existing `TokenCreated` listener. This raises two architectural questions:

1. **Code Duplication**: Both event listeners share ~80% identical setup/cleanup logic (provider initialization, filter creation, handler registration, cleanup)
2. **Test Organization**: Should new real-time update tests be added to the existing `mytokens.test.tsx` (164 lines, 5 tests) or a new dedicated file `mytokens.realtime.test.tsx`?

### Current Implementation Pattern

**Existing `TokenCreated` Listener** (`MyTokens.tsx` lines 70-162):

```typescript
useEffect(() => {
  if (typeof window === "undefined" || !window.ethereum || !userAddress) return;

  let provider: ethers.BrowserProvider;
  let contract: any;
  let handler: ((...args: any[]) => Promise<void>) | null = null;
  let eventFilter: any = null;

  async function setupEventListener() {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      contract = SupplyChain__factory.connect(
        CONTRACT_CONFIG.address,
        provider
      );

      handler = async (...args: any[]) => {
        // Extract event args (ethers v6 format)
        // Business logic: filter by creator, deduplicate, update state
      };

      eventFilter = contract.filters.TokenCreated();
      contract.on(eventFilter, handler);
    } catch (e) {
      console.error("Error setting up event listener:", e);
    }
  }

  setupEventListener();

  return () => {
    // 20+ lines of cleanup logic with fallbacks
    if (contract && handler) {
      // Try contract.off, then removeListener, then removeAllListeners
    }
  };
}, [userAddress]);
```

**Proposed `TransferAccepted` Listener** (same structure, different business logic):

- Same provider/contract setup
- Same error handling
- Same cleanup pattern
- Different event name and handler logic

### Duplication Analysis

**Common code** (~80% overlap):

- Environment checks (`window.ethereum`, `userAddress`)
- Provider initialization
- Contract connection
- Filter creation pattern
- Event registration (`contract.on`)
- Cleanup logic with multiple fallback strategies
- Error logging

**Unique code** (~20% per listener):

- Event name (`TokenCreated` vs `TransferAccepted`)
- Event argument extraction logic
- Business logic (creator filter vs recipient filter)
- Data fetching calls

---

## Decision 1: Event Listener Hook Extraction

### Options Considered

#### Option A: Extract Reusable Hook `useContractEvent` (RECOMMENDED)

**Approach**: Create generic hook that handles provider/contract setup and cleanup; accept event name and handler as parameters.

**Proposed API**:

```typescript
// New file: web/src/hooks/useContractEvent.ts
export function useContractEvent(
  eventName: string,
  handler: (...args: any[]) => Promise<void> | void,
  options?: { enabled?: boolean }
) {
  useEffect(() => {
    if (!options?.enabled) return;

    // Common setup logic
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = SupplyChain__factory.connect(
      CONTRACT_CONFIG.address,
      provider
    );
    const eventFilter = contract.filters[eventName]();
    contract.on(eventFilter, handler);

    // Common cleanup
    return () => {
      contract.off(eventFilter, handler);
      // ... fallback cleanup
    };
  }, [eventName, handler, options?.enabled]);
}
```

**Usage in MyTokens.tsx**:

```typescript
// TokenCreated listener
useContractEvent(
  "TokenCreated",
  async (event) => {
    const { tokenId, creator } = event.args;
    if (creator.toLowerCase() === userAddress.toLowerCase()) {
      // Business logic
    }
  },
  { enabled: !!window.ethereum && !!userAddress }
);

// TransferAccepted listener
useContractEvent(
  "TransferAccepted",
  async (event) => {
    const { transferId } = event.args;
    const transfer = await contract.getTransfer(transferId);
    if (transfer.to.toLowerCase() === userAddress.toLowerCase()) {
      // Business logic
    }
  },
  { enabled: !!window.ethereum && !!userAddress }
);
```

**Pros**:

- ✅ **DRY**: Eliminates ~60 lines of duplicated setup/cleanup per listener
- ✅ **Testability**: Single hook to test/mock for all event listeners
- ✅ **Maintainability**: Cleanup logic centralized (easier to fix bugs)
- ✅ **Scalability**: Easy to add more event listeners (e.g., `UserStatusChanged`, `TransferRejected`)
- ✅ **Consistency**: Enforces uniform event listener pattern across codebase
- ✅ **Type safety**: Can add TypeScript generics for event args

**Cons**:

- ❌ **Abstraction overhead**: Adds one more layer (~80 lines for hook + tests)
- ❌ **Handler dependencies**: Requires careful memoization of handlers to avoid re-registration
- ❌ **Learning curve**: New developers must understand the hook API
- ❌ **Debugging complexity**: Stack traces have extra layer

**Implementation effort**: ~2 hours (1h hook + tests, 30m refactor MyTokens, 30m validation)

#### Option B: Keep Inline, Extract Cleanup Utility (PARTIAL REFACTOR)

**Approach**: Extract only the cleanup logic into a shared utility; keep setup inline.

```typescript
// utils/contractEventCleanup.ts
export function cleanupEventListener(contract: any, filter: any, handler: any) {
  if (!contract || !handler) return;
  // ... 20 lines of fallback cleanup
}
```

**Pros**:

- ✅ Simpler than full hook extraction
- ✅ Reduces cleanup duplication (~20 lines saved per listener)

**Cons**:

- ❌ Setup logic still duplicated (~40 lines per listener)
- ❌ Partial solution; still have 2 `useEffect` blocks with similar structure
- ❌ Less benefit for future event listeners

#### Option C: Keep Current Inline Pattern (NO REFACTOR)

**Approach**: Accept duplication as acceptable for 2 listeners; defer extraction until 3+ listeners exist.

**Pros**:

- ✅ No immediate refactoring cost
- ✅ Simpler to understand (no abstraction)
- ✅ YAGNI principle (You Aren't Gonna Need It until proven otherwise)

**Cons**:

- ❌ ~90 lines of duplicated code after adding `TransferAccepted` listener
- ❌ Bug fixes must be applied in 2 places
- ❌ Inconsistency risk if patterns diverge over time
- ❌ Harder to test event listener setup/cleanup

### Recommendation: Option A (Extract Hook)

**Rationale**:

1. **Two listeners is threshold**: With `TokenCreated` + `TransferAccepted`, we've crossed the "Rule of Three" refactoring threshold (duplicate twice → extract)
2. **Known future use case**: `TransferRejected` events for sender notifications are mentioned in analysis (Future Enhancements)
3. **Testing benefit**: Current test setup requires complex mocking of `SupplyChain__factory`; hook allows simpler unit tests
4. **Educational value**: Demonstrates React best practices (custom hooks, separation of concerns)
5. **Low risk**: If hook proves problematic, can inline again with minimal cost

### Implementation Plan for Hook Extraction

**Phase 1: Create Hook**

```typescript
// web/src/hooks/useContractEvent.ts
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

**Phase 2: Add Hook Tests**

```typescript
// web/src/__tests__/useContractEvent.test.ts
describe("useContractEvent", () => {
  it("registers event listener on mount", () => {
    /* ... */
  });
  it("cleans up listener on unmount", () => {
    /* ... */
  });
  it("re-registers when eventName changes", () => {
    /* ... */
  });
  it("handles setup errors gracefully", () => {
    /* ... */
  });
});
```

**Phase 3: Refactor MyTokens**

- Replace 2 inline `useEffect` blocks with 2 `useContractEvent` calls
- Verify existing tests still pass

---

## Decision 2: Test File Organization

### Options Considered

#### Option A: Add to Existing `mytokens.test.tsx` (RECOMMENDED)

**Approach**: Append 3 new test cases (TransferAccepted scenarios) to existing file.

**Projected file size**: 164 lines → ~240 lines (3 tests × ~25 lines each)

**Current file structure** (`mytokens.test.tsx`):

```typescript
// Mocks (50 lines)
vi.mock('../lib/contract', ...);
vi.mock('../contexts/Web3Provider', ...);
vi.mock('ethers', ...);
vi.mock('../types/factories/SupplyChain__factory', ...); // ← Can extend for TransferAccepted

// Test suite (114 lines, 5 tests)
describe('MyTokens (TDD RED)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows empty state if user owns no tokens', ...);
  it('shows list of owned tokens with metadata', ...);
  it('updates UI in real time when TokenCreated event is emitted', ...);
  it('does not update UI for TokenCreated events from other users', ...);
  it('avoids duplicate appends when the same TokenCreated fires', ...);
});
```

**Proposed additions**:

```typescript
describe('MyTokens (TDD RED)', () => {
  // ... existing tests

  // ↓ New tests appended
  it('updates UI when TransferAccepted event is emitted for recipient', ...);
  it('ignores TransferAccepted events where user is not recipient', ...);
  it('prevents duplicates when TransferAccepted fires multiple times', ...);
});
```

**Pros**:

- ✅ **Single source**: All MyTokens behavior in one test file
- ✅ **Shared mocks**: Reuse existing `SupplyChain__factory` mock (just extend to handle TransferAccepted)
- ✅ **Context preservation**: New tests alongside related TokenCreated tests (same component, same pattern)
- ✅ **Test discovery**: Developers find all MyTokens tests in one place
- ✅ **Mock consistency**: Single mock setup ensures both event listeners tested uniformly
- ✅ **File count**: Avoids test file proliferation (21 files → stays at 21)

**Cons**:

- ❌ **File size**: ~240 lines approaches threshold for single file (mitigated by clear test grouping)
- ❌ **Test suite naming**: "TDD RED" describe block name is legacy/misleading (all tests are green now)

**Mock extension required**:

```typescript
// Current mock supports TokenCreated only
vi.mock("../types/factories/SupplyChain__factory", () => {
  let tokenCreatedHandler: any = null;
  // ↓ Add support for TransferAccepted
  let transferAcceptedHandler: any = null;

  const contract = {
    filters: {
      TokenCreated: () => "TokenCreated",
      TransferAccepted: () => "TransferAccepted", // ← Add
    },
    on: (filter: any, handler: any) => {
      if (filter === "TokenCreated") tokenCreatedHandler = handler;
      if (filter === "TransferAccepted") transferAcceptedHandler = handler; // ← Add
    },
    // ... off, removeAllListeners (same pattern)
    getTransfer: vi.fn(), // ← Add for TransferAccepted tests
  };

  return {
    SupplyChain__factory: { connect: vi.fn(() => contract) },
    __mock: {
      getTokenCreatedListener: () => tokenCreatedHandler,
      getTransferAcceptedListener: () => transferAcceptedHandler, // ← Add
      contract,
    },
  };
});
```

#### Option B: Create New `mytokens.realtime.test.tsx` (NOT RECOMMENDED)

**Approach**: Separate file for real-time event scenarios.

**Pros**:

- ✅ Isolates new feature tests
- ✅ Smaller file sizes (~160 lines each)
- ✅ Clear filename signals "real-time" focus

**Cons**:

- ❌ **Mock duplication**: Must duplicate ~50 lines of SupplyChain\_\_factory mock setup
- ❌ **Maintenance burden**: Changes to event listener pattern require updates in 2 test files
- ❌ **Fragmentation**: Related tests (TokenCreated vs TransferAccepted) live in different files
- ❌ **Test count inflation**: 21 files → 22 files for marginal organization benefit
- ❌ **Inconsistency**: Other components (e.g., `IncomingTransfers`) test multiple events in one file

**When this approach makes sense**:

- If MyTokens had 10+ tests (current: 5)
- If real-time tests required significantly different mock setup
- If file was already >300 lines

#### Option C: Split by Feature Group (OVER-ENGINEERED)

**Approach**: Split into `mytokens.render.test.tsx`, `mytokens.events.test.tsx`, `mytokens.fetch.test.tsx`.

**Pros**:

- ✅ Extreme modularity

**Cons**:

- ❌ Overkill for 8 tests total
- ❌ High file count for small component
- ❌ Mock setup triplication

### Recommendation: Option A (Extend Existing File)

**Rationale**:

1. **File size acceptable**: 240 lines is well below 300-line threshold for splitting
2. **Mock reuse**: Existing SupplyChain\_\_factory mock can be extended (not duplicated)
3. **Test cohesion**: Both TokenCreated and TransferAccepted test same event listener pattern in same component
4. **Project consistency**: Other test files (e.g., `transfers.received.actions.test.tsx` at 300+ lines) test multiple scenarios in single file
5. **Low refactor cost**: If file grows to 400+ lines in future, can split then

### Implementation Plan for Test Organization

**Step 1**: Update mock to support both event types (5-10 lines):

```typescript
vi.mock("../types/factories/SupplyChain__factory", () => {
  const listeners = { TokenCreated: null, TransferAccepted: null };
  const contract = {
    filters: {
      TokenCreated: () => "TokenCreated",
      TransferAccepted: () => "TransferAccepted",
    },
    on: (filter, handler) => {
      listeners[filter] = handler;
    },
    // ... cleanup methods
    getTransfer: vi.fn(), // For TransferAccepted tests
  };
  return {
    SupplyChain__factory: { connect: () => contract },
    __mock: {
      getListener: (eventName) => listeners[eventName],
      contract,
    },
  };
});
```

**Step 2**: Add 3 new test cases (~75 lines):

```typescript
describe("MyTokens (TDD RED)", () => {
  // ... 5 existing tests

  it("updates UI when TransferAccepted event fires for recipient", async () => {
    // Mock: getUserTokensWithBalance returns []
    // Mock: getTransfer returns transfer with to=userAddress
    // Mock: getTokenDetails returns token details
    // Act: emit TransferAccepted event
    // Assert: token appears in UI
  });

  it("ignores TransferAccepted where user is not recipient", async () => {
    // Mock: getTransfer returns transfer with to=otherAddress
    // Act: emit TransferAccepted
    // Assert: no new token appears
  });

  it("prevents duplicate tokens on multiple TransferAccepted", async () => {
    // Mock: user already has token from initial load
    // Act: emit TransferAccepted for same token
    // Assert: token appears only once
  });
});
```

**Step 3**: Rename describe block to remove "TDD RED" (legacy name):

```typescript
describe("MyTokens", () => {
  /* ... */
});
```

---

## Testing Strategy Comparison

### Separate File Approach (Option B)

**Test count**: 3 files × 5 tests each = 15 tests (after splitting)

**Lines of code**:

- `mytokens.render.test.tsx`: 80 lines (2 tests + mock)
- `mytokens.events.tokencreated.test.tsx`: 120 lines (3 tests + mock)
- `mytokens.events.transferaccepted.test.tsx`: 120 lines (3 tests + mock)
- **Total**: 320 lines (60 lines of duplicated mocks)

**Maintenance cost**: HIGH (3 files to update when mock structure changes)

### Single File Approach (Option A)

**Test count**: 1 file × 8 tests = 8 tests

**Lines of code**:

- `mytokens.test.tsx`: 240 lines (8 tests + shared mock)
- **Total**: 240 lines (zero duplication)

**Maintenance cost**: LOW (1 file to update)

**Savings**: 80 lines, 2 fewer files, single mock to maintain

---

## Hook Extraction Benefits Analysis

### Without Hook (Current + Proposed)

**MyTokens.tsx**:

- TokenCreated listener: 92 lines (70-162)
- TransferAccepted listener: ~92 lines (new)
- **Total**: 184 lines of event listener code

**Complexity**: 2 large `useEffect` blocks with nested async functions and cleanup logic

**Test mocking**: Complex `SupplyChain__factory` mock required in every test file using events

### With Hook Extraction

**MyTokens.tsx**:

```typescript
useContractEvent("TokenCreated", handleTokenCreated, [userAddress]);
useContractEvent("TransferAccepted", handleTransferAccepted, [userAddress]);
```

- **Total**: ~60 lines (2 hook calls + 2 handler functions)

**useContractEvent.ts**:

- ~80 lines (generic hook implementation)

**Net savings**: 184 - (60 + 80) = 44 lines

**Complexity reduction**: Event listener setup/cleanup centralized; component only contains business logic

**Test benefits**:

- Hook tested once in isolation (`useContractEvent.test.ts`)
- Component tests focus on business logic, not event infrastructure
- Simpler mocks in component tests (can mock the hook instead of factory)

---

## Decision Summary

### Decision 1: Extract Event Listener Hook ✅

**Adopt `useContractEvent` custom hook** to eliminate duplication and improve testability.

**Timeline**: Include in Phase 3 (REFACTOR) of feature implementation (not optional)

**Deliverables**:

1. `web/src/hooks/useContractEvent.ts` (80 lines)
2. `web/src/__tests__/useContractEvent.test.ts` (60 lines, 4 tests)
3. Refactored `MyTokens.tsx` to use hook (net -124 lines)

### Decision 2: Extend Existing Test File ✅

**Add TransferAccepted tests to existing `mytokens.test.tsx`** instead of creating new file.

**Timeline**: Phase 1 (RED) of TDD cycle

**Changes**:

1. Extend `SupplyChain__factory` mock to handle both events (~10 lines)
2. Add 3 new test cases (~75 lines)
3. Rename describe block to remove legacy "TDD RED" name

**Final file size**: ~240 lines (acceptable; well below 300-line threshold)

---

## Success Criteria

### Code Quality Metrics

- ✅ **DRY compliance**: Zero duplicated event listener setup/cleanup code
- ✅ **Test coverage**: 100% coverage of hook (4 tests) + 100% coverage of component event handling (8 tests)
- ✅ **File count**: No new test files added (stays at 21)
- ✅ **Line count**: Net reduction of ~44 lines across MyTokens.tsx and hook

### Maintainability Improvements

- ✅ **Single responsibility**: Hook handles event infrastructure; component handles business logic
- ✅ **Testability**: Hook tested in isolation; component tests simplified
- ✅ **Extensibility**: Adding `TransferRejected` listener in future requires only 1 new hook call (not 92 lines)
- ✅ **Consistency**: All event listeners use same hook pattern

---

## Risks and Mitigations

### Risk 1: Hook Abstraction Too Generic

**Risk**: Hook API may not fit all future event listener needs (e.g., events requiring different cleanup strategies)

**Mitigation**:

- Start with simple API; extend with options parameter if needed
- Keep inline pattern available for edge cases
- Monitor first 3 usages; refactor hook if pattern breaks

### Risk 2: Test File Size Growth

**Risk**: `mytokens.test.tsx` may exceed 300 lines if component gains more features

**Mitigation**:

- Set 300-line threshold for splitting
- If exceeded, split by feature area (render/events/integration)
- Current projection: 240 lines leaves 60-line buffer

### Risk 3: Mock Complexity Increase

**Risk**: Supporting multiple event types in single mock may become unwieldy

**Mitigation**:

- Current mock design uses dynamic listener registry (scales well)
- If mock exceeds 80 lines, extract to `__tests__/utils/mockSupplyChainFactory.ts`

---

## Alternative Considered: Event Bus Pattern

An alternative architecture using an event bus (e.g., EventEmitter) to decouple event listeners from components was considered but rejected:

**Pros**: Maximum decoupling; easy to add listeners from any component

**Cons**:

- Over-engineering for current scope (2 listeners)
- Adds dependency and complexity
- Harder to test (global state)
- Not aligned with React patterns

**Conclusion**: Custom hook provides sufficient abstraction without introducing global state or third-party dependencies.

---

## References

### Related Patterns

- **ADR 005**: Established event sourcing pattern for transfer history
- **MyTokens.tsx** (lines 70-162): Reference implementation of TokenCreated listener
- **React Custom Hooks**: https://react.dev/learn/reusing-logic-with-custom-hooks

### Similar Patterns in Codebase

- `useTransfersList` hook: Abstracts transfer fetching logic (similar abstraction level)
- `useWallet` hook: Abstracts wallet connection logic

### Code Examples from Other Projects

This pattern (custom hook for contract events) is common in Web3 UIs:

```typescript
// Example from wagmi library
useContractEvent({
  address: "0x...",
  abi: ABI,
  eventName: "Transfer",
  listener: (logs) => {
    /* ... */
  },
});
```

Our design is simpler (no ABI parsing, single contract) but follows same principle.

---

## Implementation Checklist

### Phase 1: Hook Creation (45 minutes)

- [ ] Create `web/src/hooks/useContractEvent.ts`
- [ ] Implement hook with TypeScript types
- [ ] Add JSDoc comments

### Phase 2: Hook Testing (30 minutes)

- [ ] Create `web/src/__tests__/useContractEvent.test.ts`
- [ ] Test: listener registration
- [ ] Test: listener cleanup
- [ ] Test: error handling
- [ ] Test: re-registration on dependency change

### Phase 3: Component Refactor (30 minutes)

- [ ] Refactor `MyTokens.tsx` to use hook
- [ ] Extract handler functions for readability
- [ ] Verify existing tests still pass (may need minor mock adjustments)

### Phase 4: Test Extension (45 minutes)

- [ ] Update `mytokens.test.tsx` mock to support TransferAccepted
- [ ] Add 3 new test cases for TransferAccepted scenarios
- [ ] Rename describe block (remove "TDD RED")
- [ ] Verify all 8 tests pass

---

## Conclusion

**Adopt both recommendations**:

1. **Extract `useContractEvent` hook** to eliminate duplication and establish reusable pattern
2. **Extend `mytokens.test.tsx`** to consolidate all MyTokens tests in single file

**Total effort**: ~2.5 hours (hook + tests + refactor)

**Benefits**:

- 44 lines removed (net)
- Improved maintainability
- Easier future event listener additions
- Unified test suite for component

**Risk level**: LOW (incremental refactor, well-established patterns)

---

**Migración y sincronización (31/10/2025):**

- Los componentes PackageProducts y TransferToConsumer están documentados como stubs y preparados para integrar el patrón de event listeners (`useContractEvent`) en la siguiente fase.
- Se recomienda extender la abstracción de eventos a estos componentes una vez implementados, siguiendo el patrón ya aplicado en MyTokens y Transfer forms.

**Status**: Ready for review and approval before proceeding with feature implementation.
