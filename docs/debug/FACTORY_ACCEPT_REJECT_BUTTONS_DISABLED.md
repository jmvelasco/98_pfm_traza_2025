# 🐛 Debug Plan: Factory Accept/Reject Buttons Appear Disabled

**Date:** 24 octubre 2025  
**Issue:** Accept and Reject buttons in Incoming Transfers (Factory role) are visible but not clickable  
**Context:** Producer has successfully transferred tokens to Factory; transfers appear in Factory's incoming list

---

## 📋 Problem Summary

- **Observed:** Factory user sees pending incoming transfers with Accept/Reject buttons, but buttons are not clickable
- **Expected:** Buttons should be enabled and respond to clicks
- **Roles verified:** Producer → Factory transfer completed; accounts are correct
- **Visibility:** Buttons render (not hidden by guard logic), but appear disabled

---

## 🔍 Debug Plan

### Phase 0: Instrumentation (already added)

We added lightweight diagnostics in `PendingTransfersReceived` that log a single entry per render:

- Tag: `[IncomingTransfers][diagnostic]`
- Payload: `{ page, total, count, rows: [{ id, to, from, status, canAct, processingId, address }] }`
- Where: Browser DevTools console in development mode (not emitted in tests)

Action:

- Open Factory dashboard → Incoming Transfers
- Grab the latest console payload for a row that looks disabled/missing actions and paste it in this doc under “Findings”.

Expected:

- `canAct` is `true` when `address.toLowerCase() === String(t.to).toLowerCase()`
- `processingId` is `null` initially

### Phase 1: Frontend State Inspection

**Objective:** Verify component state and props at runtime

#### 1.1 Wallet Address Verification

- [ ] Add console.log in `PendingTransfersReceived` to log:
  - `address` from `useWallet()`
  - Each transfer's `t.to` field
  - Result of `canAct` guard condition
- [ ] Confirm wallet address matches transfer recipient (case-insensitive)

**Expected:** `canAct` should be `true` for all incoming transfers

#### 1.2 Processing State Check

- [ ] Log `processingId` state
- [ ] Log each transfer's `t.id` and type
- [ ] Verify `disabled={processingId === t.id}` evaluates to `false`

**Expected:** `processingId` should be `null` initially; `disabled` should be `false`

#### 1.3 Items Data Structure

- [ ] Log full `items` array from `usePendingTransfersList`
- [ ] Verify each item has:
  - `id` (number or string)
  - `to` (recipient address)
  - `from` (sender address)
  - `tokenId`, `amount`, `status`

**Expected:** All required fields present; `to` matches Factory address

---

### Phase 2: DOM and CSS Inspection

**Objective:** Rule out styling/DOM issues causing visual disability

#### 2.1 Browser DevTools Check

- [ ] Inspect button element in browser DevTools
- [ ] Verify `disabled` attribute is **not** present in DOM
- [ ] Check computed styles for:
  - `pointer-events` (should not be `none`)
  - `opacity` (should not indicate disabled state beyond `:disabled`)
  - `cursor` (should be `pointer`, not `not-allowed`)

**Expected:** No `disabled` attribute; no CSS blocking interaction

#### 2.2 Event Handler Verification

- [ ] Confirm `onClick` prop is attached to button elements
- [ ] Check browser console for any JavaScript errors on click attempt
- [ ] Verify no parent `<form>` or event capture blocking clicks

**Expected:** `onClick` handler present; no errors in console

---

### Phase 3: Contract Helper and Type Analysis

**Objective:** Ensure contract helpers and data types are correctly wired

#### 3.1 Transfer ID Type Consistency

- [ ] Verify `t.id` type returned by `getPendingByRecipient`
- [ ] Check if `t.id` is number vs string (potential strict equality issue)
- [ ] Confirm `onAccept(t.id)` and `onReject(t.id)` receive correct type

**Potential Issue:** If `t.id` is string but `processingId` comparison expects number, strict equality could fail silently

#### 3.2 Contract Helper Smoke Test

- [ ] Add console.log inside `onAccept` to confirm function is called
- [ ] Log parameters passed to `contract.acceptTransfer(Number(id))`
- [ ] Verify `contract` import and function existence

**Expected:** Function should be callable; contract helpers imported correctly

---

### Phase 4: Hook and Pagination State

**Objective:** Verify `usePendingTransfersList` returns correct data

#### 4.1 Hook Return Values

- [ ] Log `loading`, `error`, `items`, `total` from hook
- [ ] Confirm `loading` is `false` when buttons render
- [ ] Check if `error` state blocks rendering unexpectedly

**Expected:** `loading=false`, `error=null`, `items` array populated

#### 4.2 Conditional Rendering Logic

- [ ] Verify `{!loading && <table>...}` block renders (we inlined tables, no shared component)
- [ ] Confirm the Actions column renders only when `canAct === true`
- [ ] Ensure buttons are conditionally disabled only when `processingId === t.id`

**Expected:** Table renders; Actions cell is present when appropriate; buttons enabled when `processingId` is not the row id

---

### Phase 5: Test vs Production Discrepancy

**Objective:** Identify why tests pass but production fails

#### 5.1 Test Mock Comparison

- [ ] Review `factory.transfers.test.tsx` mock setup
- [ ] Compare mock data structure with actual contract return
- [ ] Check if test uses different `t.id` types or guard logic

**Potential Gap:** Tests may mock simplified data; production contract might return different shape

#### 5.2 Integration Test

- [ ] Run web app with browser console open
- [ ] Attempt to click button and capture any warnings/errors
- [ ] Compare behavior with test assertions (e.g., `userEvent.click(acceptBtn)`)

**Expected:** Should match test behavior; if not, identify discrepancy

---

## 🎯 Diagnostic Checkpoints

After each phase, evaluate:

1. **Is the guard condition (`canAct`) passing?**  
   → If no, address matching or wallet state issue

2. **Is `disabled` attribute actually false in DOM?**  
   → If no, check state or conditional logic

3. **Are event handlers attached?**  
   → If no, check component rendering or prop passing

4. **Is there a type mismatch in `t.id` vs `processingId`?**  
   → If yes, normalize types or ensure both are compared as the same type (we cast to Number on call already)

5. **Is there a CSS rule preventing clicks?**  
   → If yes, look for `pointer-events: none`, covering overlays, z-index, or parent wrappers applying it. Remove or scope it.

---

## 📝 Implementation Notes

- **Logging Strategy:** Add console.logs temporarily; remove after diagnosis
- **Browser:** Test in Chrome/Firefox DevTools with React DevTools extension
- **Rollback Plan:** All logging changes are non-breaking; can be removed in single commit after fix

---

## ✅ Success Criteria

- Factory user can click Accept/Reject buttons
- Buttons trigger `onAccept`/`onReject` handlers
- Contract calls execute successfully
- UI updates after accept/reject (item removed from list)
- No console errors

---

## 📚 Related Files

- `web/src/components/tokenOps/PendingTransfersReceived.tsx`
- `web/src/hooks/usePendingTransfersList.ts`
- `web/src/lib/contract.ts` (acceptTransfer, rejectTransfer, getPendingByRecipient)
- `web/src/__tests__/factory.transfers.test.tsx`

---

## 🧪 Findings (to fill during session)

Paste the latest diagnostic payload here for 1–2 affected rows:

```
[IncomingTransfers][diagnostic] { page, total, count, rows: [
  { id, to, from, status, canAct, processingId, address },
]}
```

- Row id: **_ | canAct: _** | processingId: **_ | address: _** | to: \_\_\_
- DOM button.disabled: **_ | pointer-events: _** | overlay present?: \_\_\_

---

**Next Steps:**

- Start with Phase 0 (capture diagnostics), then Phase 2 (DOM/CSS) if `canAct=true` but UI still looks disabled. Move to Phase 3 if type/handlers are suspect.
