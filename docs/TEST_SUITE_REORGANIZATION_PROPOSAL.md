# Test Suite Reorganization Proposal (Frontend)

Date: 2025-10-25
Scope: `supply-chain-tracker/web/src/__tests__`

## Executive Summary

The current frontend test suite is comprehensive and mostly green. However, there are naming inconsistencies and domain crossovers around Transfers that make discoverability and maintenance harder (e.g., `pending.transfers.*`, `transfers.pagination.no-reload.test.tsx`, and transfers tests embedded in role or dashboard suites).

This document proposes a domain-first, file-per-concern layout centered on a unified `transfers.*` filename pattern. It keeps all existing scenarios intact while reducing duplication and clarifying responsibilities. After the reorg, tests should remain green with minimal changes beyond file moves/renames and a few import updates.

## What You Already Do Well

- Clear, scenario-driven tests with realistic user interactions (Testing Library + user-event).
- Good separation for infra (web3, wallet, contract) vs UI.
- Strong coverage on pagination, role workflows, and dashboard integration.
- Defensive tests to avoid page reloads and to validate loading/success states.

## Pain Points Observed

- Transfers spread across multiple naming patterns: `pending.transfers.*`, `transfers.pagination.no-reload.*`, `factory.transfers.*`, and transfer-related scenarios inside `producer.roleactions.test.tsx` and `dashboard.*`.
- Mixed responsibilities in a single file (integration + component behavior + domain rules).
- Duplication: the same behavior tested in both component-level and page-level suites.
- Occasional noisy console errors from mocked ethers/contract calls pollute logs, hiding true regressions.

## Reorganization Principles

1. Domain-first filenames

   - Use `transfers.*` for any test whose primary subject is transfers (sent/received, list/form/hooks/pagination).
   - Keep role-centric suites (e.g., `producer.*`, `factory.*`) focused on role pages/containers, not underlying transfers component details.

2. One file = one clear responsibility

   - Prefer multiple small files over one large file with many unrelated describes.
   - Integration tests (page-level) should verify wiring; component tests verify behavior. Avoid verifying the same behavior at both layers unless it adds unique value.

3. Stable, explicit names

   - Use `sent` vs `received` consistently.
   - Encode the subject and aspect: `transfers.sent.list.test.tsx`, `transfers.sent.pagination.test.tsx`, `transfers.form.request.test.tsx`.

4. Mocks, fixtures, and utilities

   - Centralize builders (factories) for common data: `test/utils/builders.ts` (e.g., `buildPendingTransfer(overrides)`), and `test/utils/mocks.ts` for hook/contract mocks.
   - Reset mocks in `afterEach` and keep each test hermetic.

5. Keep the same coverage
   - All current scenarios remain, only moved or renamed.

## Proposed Target Layout

Keep as-is when not mentioned below (admin, routing, wallet, web3, generic dashboard sections).

Transfers domain files (new/renamed):

- transfers.sent.list.test.tsx

  - From: `pending.transfers.test.tsx`, parts of `dashboard.outgoing.all-status.test.tsx` (pure list concerns only)
  - Focus: rendering of outgoing list, empty states, show-all-status toggle effects for Sent

- transfers.sent.pagination.test.tsx

  - From: `pending.transfers.pagination.test.tsx` + `transfers.pagination.no-reload.test.tsx` (merge)
  - Focus: Prev/Next behavior, indicators, edge cases (5/7/12 items), no form submit/reload

- transfers.received.list.test.tsx

  - From: parts of `factory.transfers.test.tsx` that only verify listing/pagination of received transfers
  - Focus: rendering of incoming list, pagination for Received (without accept/reject flows)

- transfers.received.actions.test.tsx

  - From: `factory.transfers.test.tsx` accept/reject flows
  - Focus: business flows for Accept/Reject and correct list updates after actions

- transfers.hooks.useTransfersList.test.tsx

  - From: `useTransfersList.test.tsx` (rename only)
  - Focus: hook’s pagination state, mapping and refresh behavior

- transfers.pending.test.ts
  - From: `contract.pendingtransfers.test.ts` (rename only) if you prefer grouping under transfers, else keep as-is.

Dashboard and Role suites after extraction:

- dashboard.\*
  - Keep integration-level assertions that the dashboard renders the transfers sections and shows totals/headers.
  - Defer detailed list/pagination behavior to `transfers.*` files.

## Old → New Mapping (Overview)

- pending.transfers.test.tsx → transfers.sent.list.test.tsx
- pending.transfers.all-status.test.tsx → transfers.sent.list.test.tsx (merge into sent list suite)
- pending.transfers.pagination.test.tsx → transfers.sent.pagination.test.tsx
- transfers.pagination.no-reload.test.tsx → transfers.sent.pagination.test.tsx (merge)
- factory.transfers.test.tsx →
  - listing/pagination pieces → transfers.received.list.test.tsx
  - accept/reject flows → transfers.received.actions.test.tsx
- useTransfersList.test.tsx → transfers.hooks.useTransfersList.test.tsx
- contract.pendingtransfers.test.ts → transfers.pending.test

## Migration Status (2025-10-25)

Implementation completed for the first phase and cleanup finalized:

- New transfers.\* files created and GREEN:
  - transfers.sent.list.test.tsx
  - transfers.sent.pagination.test.tsx
  - transfers.received.list.test.tsx
  - transfers.received.actions.test.tsx
- Legacy files removed (no skipped placeholders remain):
  - factory.transfers.test.tsx → removed (content migrated into transfers.received.\*)
  - transfers.pagination.no-reload.test.tsx → removed (merged into transfers.sent.pagination.test.tsx)
  - pending.transfers.test.tsx → removed (merged into transfers.sent.list.test.tsx)
  - pending.transfers.all-status.test.tsx → removed (merged into transfers.sent.list.test.tsx)
  - pending.transfers.pagination.test.tsx → removed (merged into transfers.sent.pagination.test.tsx)

Suite state: Full run GREEN with 0 skipped. A shuffled run also passes, indicating low order-dependency risk.

Additionally, a CI job now runs a shuffled test pass on every push/PR to main and dev to continuously guard against order-dependent flakes.

No changes proposed:

- admin.users.test.tsx
- app.routes.test.tsx
- routing.layout.test.tsx
- web3.service.test.ts
- web3provider.persistence.events.test.tsx
- useWallet.test.tsx
- mytokens.test.tsx, dashboard.mytokens.test.tsx (though see consolidation guidance below)

## Describe Structure Guidelines (per file)

- Top-level describe: Subject + Aspect (e.g., `Transfers – Sent List`, `Transfers – Sent Pagination`, `Transfers – Received Actions`).
- 2–4 inner describes for scenario clusters (happy path, empty state, edge cases, error cases).
- Keep each test <20–30 lines when possible; extract helpers/builders for setup.

Example skeleton:

```
describe('Transfers – Sent Pagination', () => {
  describe('happy path', () => {
    it('navigates from page 1 → 2 and back');
  });
  describe('edge cases', () => {
    it('exactly 5 items (single page)');
    it('12 items (3 pages)');
  });
  describe('ux safeguards', () => {
    it('does not submit form on Prev/Next clicks');
  });
});
```

## Test Utilities and Builders

Create `src/__tests__/utils/` with:

- builders.ts

  - `buildTransfer(overrides?: Partial<Transfer>)`
  - `buildPendingSent(index: number, overrides?)`
  - `buildPendingReceived(index: number, overrides?)`

- mocks.ts

  - `mockUseTransfersList(returnValue)`
  - `mockContract(overrides)`
  - Common vi.spyOn/reset helpers

- setup.ts
  - Global afterEach: `vi.resetAllMocks()` and DOM cleanup
  - Common provider wrappers if needed

Benefits:

- Less duplication
- More readable tests
- Easier bulk updates to mocks

## Migration Plan (Low-Risk, Incremental)

1. Prepare utilities folder and extract 1–2 builders used by multiple tests.
2. Rename/move files using `git mv` (ensures history retained):
   - Start with simple renames (no merges): `useTransfersList.test.tsx` → `transfers.hooks.useTransfersList.test.tsx`.
3. Merge pagination files:
   - Move contents of `transfers.pagination.no-reload.test.tsx` into `transfers.sent.pagination.test.tsx`; delete the former.
4. Extract from role/page suites:
   - Split `factory.transfers.test.tsx` into `transfers.received.list.test.tsx` and `transfers.received.actions.test.tsx`.
   - Trim `dashboard.*` to integration smoke for transfers sections; remove detailed list/pagination cases now covered in `transfers.*`.
5. Run the full suite after each step; fix import paths and mocks.
6. Silence expected console noise in specific tests by mocking console.error where appropriate, to keep output signal high.

## Risks and Mitigations

- Risk: Over-merge leading to large files.

  - Mitigation: Use “one responsibility per file”; if a file grows >300 lines, split by scenario cluster.

- Risk: Hidden duplication between page and component tests.

  - Mitigation: Keep page tests focused on presence/wiring; move behavior coverage to component domain.

- Risk: Flaky timing on async UI states (loading → success).
  - Mitigation: Prefer `await screen.findBy*` with realistic mocks; consider `vi.useFakeTimers()` plus `advanceTimersByTime(…)` for deterministic interim states when needed.

## Acceptance Criteria

- All existing scenarios are preserved and still GREEN.
- All transfer-related tests use the `transfers.*` pattern and are grouped by Sent/Received/Hooks.
- Role and dashboard suites focus on integration/wiring, not component behavior already covered elsewhere.
- Reduced console noise in test output.

# Shuffled test execution (anti-flake)

Date: 2025-10-25

## Why shuffle?

- Detect order-dependent tests and hidden global state leaks.
- Increase confidence that mocks and module state are reset per test/suite.

## How to run

- Random order:
  - `npm run test:shuffle`
- Reproducible order with seed:
  - `npm run test:shuffle -- --sequence.seed=12345`

Vitest prints the seed it used. Reuse that seed to reproduce the exact order when investigating failures.

## Seed 12345 failure and fix

- Symptoms (before fix):

  - Failing tests in `Transfers – Sent List (pending only)` when running with `--sequence.seed=12345`.
  - The UI stayed on the empty state after emitting `TransferRequested` even though the mock sequence should have produced a list with one item.

- Root cause:

  1. Component-side race: the component re-rendered (via a local tick) immediately after calling `refresh()`, but before the mocked `useTransfersList` updated its internal state. This caused queries to still see the empty state.
  2. Test-side ordering: the controlled mock for `useTransfersList` did not perform an initial fetch, so the test’s first `mockResolvedValueOnce` result (empty) was not consumed until the event-triggered `refresh`, leading to sequence mismatches in certain suite orders.

- Implementation details of the fix:

  - Component (`PendingTransfersSent.tsx`):
    - Await `refresh()` inside event handlers before ticking a re-render:
      - `void Promise.resolve(refresh()).finally(() => setTick(t => t + 1))` for `TransferRequested`, `TransferAccepted`, and `TransferRejected`.
  - Tests (`transfers.sent.list.test.tsx`):
    - Controlled `useTransfersList` mock now performs a one-time initial fetch to consume the first `getPendingBySender` result, aligning with real hook behavior.
    - `refresh()` in the mock fetches the page and updates internal state used by the component.

- Verification:
  - Seeded shuffle run (12345): PASS – 21 files, 107 tests.
  - Standard run: PASS – 21 files, 107 tests.

## Notes and guidance

- Prefer hermetic suites: `vi.resetModules()` at suite boundaries and avoid global state in mocks.
- If using stateful test-only mocks, ensure they mirror the real hook/contract flow closely (initial fetch, async refresh, etc.).
- When reacting to events, either await the refresh or design your UI/tests to tolerate eventual consistency.

## Appendix: Current Inventory (post-cleanup)

- admin.users.test.tsx
- app.routes.test.tsx
- contract.balance.test.ts
- contract.pendingtransfers.test.ts
- dashboard.mytokens.test.tsx
- dashboard.outgoing.all-status.test.tsx
- dashboard.test.tsx
- home.registration.test.tsx
- mytokens.test.tsx
- producer.dashboard.test.tsx
- producer.roleactions.test.tsx
- producer.transfer.test.tsx
- routing.layout.test.tsx
- transfers.received.actions.test.tsx
- transfers.received.list.test.tsx
- transfers.sent.list.test.tsx
- transfers.sent.pagination.test.tsx
- useTransfersList.test.tsx
- useWallet.test.tsx
- web3.service.test.ts
- web3provider.persistence.events.test.tsx
