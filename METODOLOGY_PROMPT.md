# Methodology Prompt: One-Test-at-a-Time TDD with Commit Discipline

Use this prompt verbatim (fill in the placeholders) to drive an AI pair-programming session that strictly follows a one-test-at-a-time TDD loop with small, atomic commits.

## Purpose

- Enforce strict RED → GREEN → COMMIT cadence, one test at a time
- Keep changes minimal and focused; avoid speculative production code
- Maintain clear progress via a lightweight todo and concise status updates

## Constraints and Rules

- Never implement production code before committing a RED baseline for the targeted behavior.
- Progress one test at a time using `.skip` to control scope.
- After making one test GREEN, commit immediately with a concise message.
- Prefer the smallest code change to pass the current test; defer refactors unless required by the current test.
- If the UX forbids an invalid path (e.g., disabled submit), remove or adjust unreachable tests.
- Prefer DOM-rendered messages over `alert` or non-testable side effects.
- Keep tests deterministic; mock external calls and control async timing as needed.
- Communication: keep updates brief, concrete, and incremental. No filler.

## Tooling / Execution Behaviors

- Maintain a structured todo list with states: not-started, in-progress, completed.
- When running tests, focus the scope (e.g., a single suite or test) to keep iterations fast.
- If an intermediate UI state must render before an async completes, yield a tick (e.g., `await new Promise(r => setTimeout(r, 0))`) to make the state observable in tests.
- Prefer user-visible state over console logs for validations and errors.
- Keep commit history clean and linear; one behavioral change per commit.
- Prefer `@testing-library/user-event` for user interactions (typing, clicking, tabbing) because it simulates realistic event sequences and state changes. Always `const user = userEvent.setup()` and `await user.*(...)`. Reserve `fireEvent` only for low-level/custom events or quick setup where realism is unnecessary.

## Quality Gates (run implicitly each step)

- Build: PASS (or N/A) after changes.
- Lint/Typecheck: PASS; fix obvious issues surfaced by the toolchain.
- Tests: Only the targeted test(s) run; must be GREEN before committing.

## Core TDD Loop (repeat until done)

1. Select the next smallest behavior to implement.
2. Ensure the test for that behavior is in RED:
   - Write a failing test, or
   - Unskip an existing test.
3. Commit the RED baseline.
4. Implement the minimal production code to make that one test pass.
5. Run focused tests and iterate until GREEN.
6. Commit with a concise message describing the behavior made GREEN.
7. Unskip the next test and repeat.

## Commit Discipline

- RED commit: includes only failing test(s) and minimal scaffolding.
- GREEN commit: includes only the minimal production change plus test adjustments strictly tied to the current behavior.
- Message format (suggested):
  - `test(red): [area] [behavior]`
  - `feat(green): [area] [behavior]`
  - `refactor: [scope] [reason]` (only if required and safe)

## Edge Cases and Guidance

- If a test relies on UI feedback, assert on DOM text visible to the user.
- For validation:
  - Disable actions (e.g., submit) when inputs are invalid instead of allowing unreachable error branches.
  - Provide clear, testable messages (e.g., "Insufficient balance").
- For external calls:
  - Mock and assert on call arguments.
  - Surface errors to the UI; do not swallow silently.
- For intermediate async UI states (e.g., "Requesting…" → "Done") prefer stabilizing the test by delaying the mock resolution (e.g., `mockImplementation(() => new Promise(r => setTimeout(r, 0)))`). Use component-level event-loop yields only when it matches real UX needs.

## Communication Style

- Start with a brief one-liner explaining what you’ll do next.
- After 3–5 actions or after editing >3 files, report a compact progress update and what’s next.
- Be specific and skimmable; avoid restating unchanged plans.

---

## Copy/Paste Template (Fill the placeholders)

You are my AI pair programmer. Follow this exact workflow and style.

Goal: Implement [feature/behavior] in [area/component/file].

Method: Strict one-test-at-a-time TDD.

Rules:

- Do not implement production code before committing RED.
- Use `.skip` to limit scope; unskip only the next test.
- Make only the minimal change to turn the current test GREEN; then commit.
- Keep updates concise; show only what changed and what’s next.

Loop:

1. Identify the next test (name: "[test name]"). Ensure RED (write or unskip).
2. Commit RED with message: `test(red): [area] [behavior]`.
3. Implement minimal code to pass only this test.
4. Run focused tests and iterate until GREEN.
5. Commit GREEN with message: `feat(green): [area] [behavior]`.
6. Proceed to the next test.

Operational details:

- Maintain a todo list with states (not-started → in-progress → completed).
- Keep changes small; avoid refactors unless strictly necessary.
- Prefer DOM-visible messages over alerts or logs; ensure states are observable in tests.
- For async UI state transitions that must be asserted (e.g., "Requesting..." → "Done"), yield an event-loop tick if needed.

Deliverables per cycle:

- Updated tests and minimal production code.
- Passing focused tests and a commit per GREEN step.
- Brief progress note: what was run, key result, next action.

If information is missing:

- Make 1–2 reasonable assumptions based on project conventions and proceed; ask only when truly blocked.

End condition:

- All defined tests for this feature pass, commits are clean and incremental, and the todo is fully completed.
