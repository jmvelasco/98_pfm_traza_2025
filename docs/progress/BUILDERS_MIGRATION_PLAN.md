# Test Builders Full Consistency Migration Plan

**Date**: 25 October 2025  
**Status**: 🔄 Ready to Execute  
**ADR Reference**: [006-test-builders-full-consistency.md](../adr/006-test-builders-full-consistency.md)  
**Objective**: Achieve 100% builder consistency across all test files with transfer fixtures

---

## Executive Summary

**Decision**: Adopt builders in ALL remaining test files that use transfer fixtures (ADR 006)

**Scope**: 3 test files, 6 inline transfer objects  
**Estimated Effort**: 30-45 minutes  
**Expected Outcome**: 100% consistency (7/7 suites), ~15-20 additional lines saved  
**Risk Level**: LOW (proven pattern, mechanical changes)

---

## Current State

### Completed Migrations ✅

- `transfers.sent.list.test.tsx` — 3 tests, 53 lines saved
- `transfers.sent.pagination.test.tsx` — 6 tests, 59 lines saved
- `transfers.received.list.test.tsx` — 2 tests, ~30 lines saved
- `transfers.received.actions.test.tsx` — 6 tests, ~100 lines saved

**Total**: 4/7 suites (57% consistency), 242 lines saved, 107 tests passing

### Remaining Migrations 🎯

1. **`useTransfersList.test.tsx`** (Priority: HIGH)

   - 3 inline transfer objects (lines 63-75, 94-106, 134-141)
   - 1 array generation pattern (lines 121-141)
   - Estimated savings: 8-10 lines

2. **`dashboard.outgoing.all-status.test.tsx`** (Priority: MEDIUM)

   - 2 inline transfer objects (lines 22-30, 32-40)
   - Estimated savings: 4-6 lines

3. **`producer.dashboard.test.tsx`** (Priority: LOW)
   - 1 inline transfer object (lines 49-57)
   - Estimated savings: 3-4 lines

---

## Implementation Plan

### Phase 1: Priority 1 - `useTransfersList.test.tsx` (HIGH)

**File**: `supply-chain-tracker/web/src/__tests__/useTransfersList.test.tsx`  
**Estimated Time**: 15-20 minutes  
**Complexity**: Medium (array generation + multiple inline objects)

#### Changes Required

##### 1.1 Add Builder Import

```typescript
// After line 3
import { buildPendingSent } from "./utils/builders";
```

##### 1.2 Replace First Inline Object (lines 63-75)

**BEFORE:**

```typescript
{
  id: 't1',
  tokenId: 1,
  tokenName: 'Wheat',
  amount: 2,
  from: '0xsender',
  to: '0xA',
  status: 'Pending',
  createdAt: 1,
}
```

**AFTER:**

```typescript
buildPendingSent(1, {
  id: "t1",
  tokenId: 1,
  tokenName: "Wheat",
  amount: 2,
  to: "0xA",
  createdAt: 1,
});
```

**Note**: Override `id` and `from` is handled by builder defaults (sender mode)

##### 1.3 Replace Array Generation Pattern (lines 121-141)

**BEFORE:**

```typescript
const mockEvents = Array.from({ length: 7 }, (_, i) => ({
  args: {
    transferId: BigInt(i + 1),
    from: "0xsender",
    to: `0xrecipient${i}`,
  },
}));

// Mock getTransfer calls for all 7 transfers
for (let i = 0; i < 7; i++) {
  mockGetTransfer.mockResolvedValueOnce({
    tokenId: BigInt(100 + i),
    amount: BigInt(10 + i),
    from: "0xsender",
    to: `0xrecipient${i}`,
    status: BigInt(i % 3), // Mix of Pending/Accepted/Rejected
    dateCreated: BigInt(1000 + i * 1000),
  });
  mockGetToken.mockResolvedValueOnce({ name: `Token ${i + 1}` });
}
```

**AFTER:**

```typescript
// Generate 7 transfers with builders for cleaner test data
const mockTransfers = Array.from({ length: 7 }, (_, i) => {
  const statusMap = ["Pending", "Accepted", "Rejected"] as const;
  return buildPendingSent(i + 1, {
    tokenId: 100 + i,
    amount: 10 + i,
    to: `0xrecipient${i}`,
    status: statusMap[i % 3],
    createdAt: 1000 + i * 1000,
  });
});

const mockEvents = mockTransfers.map((t, i) => ({
  args: {
    transferId: BigInt(i + 1),
    from: t.from,
    to: t.to,
  },
}));

mockQueryFilter.mockResolvedValueOnce(mockEvents);

// Mock getTransfer calls using builder data
mockTransfers.forEach((transfer) => {
  mockGetTransfer.mockResolvedValueOnce({
    tokenId: BigInt(transfer.tokenId),
    amount: BigInt(transfer.amount),
    from: transfer.from,
    to: transfer.to,
    status: BigInt(
      ["Pending", "Accepted", "Rejected"].indexOf(transfer.status)
    ),
    dateCreated: BigInt(transfer.createdAt),
  });
  mockGetToken.mockResolvedValueOnce({
    name: transfer.tokenName || `Token ${transfer.tokenId}`,
  });
});
```

**Benefits**:

- Single source of truth for test data
- Clear mapping between builder data and mocks
- Easier to modify test scenarios

#### Validation Steps

```bash
# Run specific test file
cd supply-chain-tracker/web
npm test -- useTransfersList.test.tsx

# Verify all 3 tests pass
# Expected: ✓ pending-only mode delegates to SC paginated getter
#          ✓ all-statuses mode queries events and enriches
#          ✓ all-statuses mode handles pagination correctly with 7 items
```

---

### Phase 2: Priority 2 - `dashboard.outgoing.all-status.test.tsx` (MEDIUM)

**File**: `supply-chain-tracker/web/src/__tests__/dashboard.outgoing.all-status.test.tsx`  
**Estimated Time**: 8-12 minutes  
**Complexity**: Low (simple inline objects with status variations)

#### Changes Required

##### 2.1 Add Builder Import

```typescript
// After line 2
import { buildPendingSent } from "./utils/builders";
```

##### 2.2 Replace Mock Data (lines 22-40)

**BEFORE:**

```typescript
items: [
  {
    id: 't1',
    tokenId: 1,
    tokenName: 'Wheat',
    amount: 4,
    from: '0xprod',
    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    status: 'Accepted',
    createdAt: 1700000000,
  },
  {
    id: 't2',
    tokenId: 2,
    tokenName: null,
    amount: 1,
    from: '0xprod',
    to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    status: 'Rejected',
    createdAt: 1700000100,
  },
],
```

**AFTER:**

```typescript
items: [
  buildPendingSent(1, {
    id: 't1',
    tokenId: 1,
    tokenName: 'Wheat',
    amount: 4,
    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    status: 'Accepted',
    createdAt: 1700000000,
  }),
  buildPendingSent(2, {
    id: 't2',
    tokenId: 2,
    tokenName: null,
    amount: 1,
    to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    status: 'Rejected',
    createdAt: 1700000100,
  }),
],
```

**Note**: Builder handles `from: '0xprod'` via index pattern; override if different address needed

#### Validation Steps

```bash
# Run specific test file
npm test -- dashboard.outgoing.all-status.test.tsx

# Expected: ✓ shows Accepted and Rejected items in Outgoing Transfers
```

---

### Phase 3: Priority 3 - `producer.dashboard.test.tsx` (LOW)

**File**: `supply-chain-tracker/web/src/__tests__/producer.dashboard.test.tsx`  
**Estimated Time**: 5-8 minutes  
**Complexity**: Low (single inline object)

#### Changes Required

##### 3.1 Add Builder Import

```typescript
// After line 2
import { buildPendingSent } from "./utils/builders";
```

##### 3.2 Replace Mock Data (lines 49-57)

**BEFORE:**

```typescript
items: [
  {
    id: 'tx1',
    tokenId: 1,
    tokenName: 'Wheat',
    amount: 10,
    from: '0x123',
    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    status: 'Pending',
    createdAt: 1700000000,
  },
],
```

**AFTER:**

```typescript
items: [
  buildPendingSent(1, {
    id: 'tx1',
    tokenId: 1,
    tokenName: 'Wheat',
    amount: 10,
    from: '0x123',
    to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    createdAt: 1700000000,
  }),
],
```

**Note**: Status defaults to 'Pending' in builder, no override needed

#### Validation Steps

```bash
# Run specific test file
npm test -- producer.dashboard.test.tsx

# Expected: ✓ shows dashboard with the required actions for Producer role
#          ✓ renders pending transfers list when there are items
```

---

## Quality Gates & Validation

### Pre-Flight Checklist

- [ ] Current test suite passing (107 tests)
- [ ] Builder utilities exist in `__tests__/utils/builders.ts`
- [ ] Git working directory clean (commit or stash changes)

### Per-File Validation

After each file migration:

```bash
# 1. Run specific test file
npm test -- <filename>

# 2. Verify tests pass
# 3. Check git diff for expected changes
git diff src/__tests__/<filename>

# 4. Commit incremental progress
git add src/__tests__/<filename>
git commit -m "test: migrate <filename> to builders (ADR 006)"
```

### Final Validation (All Files)

```bash
# 1. Run full test suite
npm test

# 2. Run shuffle test
npm test -- --sequence.seed=12345

# 3. Verify no test coverage regression
npm run test:coverage

# 4. Grep validation: No inline transfer objects remain
grep -rn "tokenId.*tokenName.*amount.*from.*to.*status.*createdAt" src/__tests__/*.test.tsx --include="*.test.tsx"
# Expected: Only results in utils/builders.ts

# 5. Measure final savings
git diff --stat dev...HEAD src/__tests__/
```

### Success Criteria

- [x] All 107 tests pass (normal run)
- [x] All 107 tests pass (shuffle seed 12345)
- [ ] No test coverage regression (maintain current %)
- [ ] Git diff confirms 15-20 line reduction across 3 files
- [ ] Zero inline transfer objects in test files (grep validation)
- [ ] Builders imported in all 7 transfer-related test files

---

## Known Gotchas & Solutions

### Issue 1: ID Type Mismatch

**Problem**: Builders generate string IDs (`txS_001`), some components expect numeric strings  
**Solution**: Override `id` field explicitly: `buildPendingSent(1, { id: '1', ... })`  
**Affected Files**: All 3 (already handled in examples above)

### Issue 2: `from` Address Variation

**Problem**: Some tests use specific sender addresses (`'0x123'`, `'0xprod'`)  
**Solution**: Builder defaults use index-based addresses; override when needed  
**Example**: `buildPendingSent(1, { from: '0x123', ... })`

### Issue 3: Status Mapping in useTransfersList

**Problem**: Test mocks use BigInt status, builders use string status  
**Solution**: Map builder status to BigInt index when mocking SC calls  
**Example**: `status: BigInt(['Pending', 'Accepted', 'Rejected'].indexOf(transfer.status))`

### Issue 4: Null tokenName

**Problem**: Some tests explicitly use `tokenName: null`  
**Solution**: Builders allow null, pass override: `buildPendingSent(1, { tokenName: null, ... })`  
**Affected**: `dashboard.outgoing.all-status.test.tsx` (transfer 2)

---

## Rollback Plan

If any phase fails validation:

1. **Immediate Rollback**:

   ```bash
   git reset --hard HEAD
   # or
   git checkout -- src/__tests__/<filename>
   ```

2. **Investigate Failure**:

   - Review test output for specific error
   - Check if builder signature matches test expectations
   - Verify override fields are correct

3. **Iterative Fix**:

   - Fix specific issue in isolated commit
   - Re-run validation
   - Document gotcha in this plan if new issue discovered

4. **Abort Criteria**:
   - If migration introduces 3+ new test failures
   - If coverage drops >2%
   - If unknown builder limitations discovered

---

## Post-Migration Tasks

### 1. Update Team Guidelines

Add to project README or CONTRIBUTING.md:

````markdown
### Test Fixture Patterns

**Always use builders for transfer fixtures:**

```typescript
import { buildPendingSent, buildPendingReceived } from './utils/builders';

// ✅ DO: Use builders with overrides
const transfer = buildPendingSent(1, { tokenName: 'Wheat', amount: 10 });

// ❌ DON'T: Inline transfer objects
const transfer = { id: 'tx1', tokenId: 1, tokenName: 'Wheat', ... };
```
````

**Rationale**: See ADR 006 for full consistency benefits

````

### 2. PR Template Checklist
Add to `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
- [ ] New transfer fixtures use builders (see ADR 006)
````

### 3. Update Documentation

- [ ] Add entry to `docs/progress/PROGRESS.md`
- [ ] Update `TEST_UTILITIES_AND_BUILDERS_ANALYSIS.md` with completion status
- [ ] Cross-reference ADR 006 in relevant docs

### 4. Metrics Tracking

Document final results in `docs/progress/STATUS_16.md`:

```markdown
## Test Builder Migration Completion

**Outcome**: 100% consistency achieved (ADR 006)
**Files migrated**: 7/7 (sent: 4, received: 2, dashboard/hook: 3)
**Total lines saved**: ~257-262 lines
**Test stability**: 107/107 tests passing (normal + shuffle)
**Zero regressions**: All quality gates passed
```

---

## Timeline & Checkpoints

| Phase                | Task                                             | Estimated Time | Checkpoint                        |
| -------------------- | ------------------------------------------------ | -------------- | --------------------------------- |
| **Pre-flight**       | Verify current state                             | 5 min          | Tests passing, git clean          |
| **Phase 1**          | Migrate `useTransfersList.test.tsx`              | 15-20 min      | 3 tests pass, incremental commit  |
| **Phase 2**          | Migrate `dashboard.outgoing.all-status.test.tsx` | 8-12 min       | 1 test passes, incremental commit |
| **Phase 3**          | Migrate `producer.dashboard.test.tsx`            | 5-8 min        | 2 tests pass, incremental commit  |
| **Final Validation** | Full suite + shuffle + coverage                  | 10 min         | All gates passed                  |
| **Post-Migration**   | Update docs + guidelines                         | 10 min         | Team onboarding materials updated |
| **TOTAL**            |                                                  | **30-45 min**  | 100% consistency achieved         |

---

## Risk Assessment

| Risk                               | Likelihood | Impact | Mitigation                                                |
| ---------------------------------- | ---------- | ------ | --------------------------------------------------------- |
| Test failures due to type mismatch | Low        | Medium | Follow proven override patterns from Phase 1-4 migrations |
| Coverage regression                | Very Low   | Low    | No logic changes, only data structure                     |
| Team confusion during migration    | Very Low   | Low    | Incremental commits + clear PR description                |
| Merge conflicts                    | Medium     | Low    | Complete within single session, communicate with team     |

**Overall Risk**: LOW ✅  
**Confidence Level**: HIGH (proven pattern, 242 lines already migrated successfully)

---

## Success Metrics

### Quantitative

- **Consistency**: 57% → 100% (4/7 → 7/7 suites)
- **LOC Saved**: 242 → 257-262 lines
- **Test Stability**: Maintain 107/107 passing tests
- **Migration Time**: Target 30-45 min, actual: _[TBD]_

### Qualitative

- **Decision Fatigue**: Zero "when do I use builders?" questions
- **Onboarding**: Single pattern for all transfer fixtures
- **Maintenance**: Schema changes require 1 file update (builders.ts)
- **Type Safety**: All fixtures enforce TransferLike shape

---

## References

- **ADR 006**: [Test Fixture Builders — Full Consistency](../adr/006-test-builders-full-consistency.md)
- **Analysis Doc**: [TEST_UTILITIES_AND_BUILDERS_ANALYSIS.md](../features/TEST_UTILITIES_AND_BUILDERS_ANALYSIS.md)
- **Test Reorganization**: [TEST_SUITE_REORGANIZATION_ANALYSIS.md](../features/TEST_SUITE_REORGANIZATION_ANALYSIS.md)
- **Builder Implementation**: `supply-chain-tracker/web/src/__tests__/utils/builders.ts`

---

**Plan Status**: 🟢 Ready to Execute  
**Next Action**: Begin Phase 1 - `useTransfersList.test.tsx` migration  
**Expected Completion**: Within current work session (30-45 min)
