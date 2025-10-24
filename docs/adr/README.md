# Architecture Decision Records (ADR)

This directory contains architectural decision records for the Supply Chain Tracker project. These documents capture important technical decisions, their context, and rationale.

## What are ADRs?

Architecture Decision Records document significant architectural decisions made during the project. They serve as:

- **Historical context** for understanding why certain approaches were chosen
- **Onboarding material** for new team members
- **Audit trail** for traceability in blockchain projects
- **Reference documentation** for similar future decisions

## ADR Index

### Pending Transfers Feature (Oct 2025)

| ADR                                                      | Title                                             | Status           | Date        |
| -------------------------------------------------------- | ------------------------------------------------- | ---------------- | ----------- |
| [001](./001-pending-transfers-strategy-comparison.md)    | Pending Transfers Strategy Comparison             | ✅ Accepted (C2) | 23 Oct 2025 |
| [002](./002-pending-transfers-migration-to-c2.md)        | Migration to C2 (Indexed SC Getters + Pagination) | ✅ Implemented   | 23 Oct 2025 |
| [003](./003-pending-transfers-frontend-only-strategy.md) | Frontend-Only Strategy (Alternative)              | ⚠️ Not Selected  | 23 Oct 2025 |
| [004](./004-pending-transfers-debug-analysis.md)         | Debug Analysis - Pending Transfers Not Showing    | ✅ Resolved      | 23 Oct 2025 |

## ADR Status Legend

- ✅ **Accepted/Implemented**: Decision made and implemented
- ⚠️ **Not Selected**: Explored but rejected in favor of another approach
- ✅ **Resolved**: Issue resolved, solution documented
- 📝 **Proposed**: Under consideration
- ❌ **Deprecated**: No longer applicable

## Related Documentation

- **PROGRESS.md** (Fase 8): Complete implementation details of Strategy C2
- **STATUS_13.md**: Current project status including pending transfers feature
- **ROADMAP.md**: Overall project roadmap and checklist

## ADR Template

When creating new ADRs, include:

```markdown
---
**ADR**: [Number]
**Title**: [Short title]
**Status**: [Status with emoji]
**Date**: [Date]
**Implementation**: [Where/when implemented, if applicable]
**Purpose**: [Why this ADR exists]
**Retain for**: [Why we keep this document]
---

# [Full Title]

## Context

[What's the issue we're addressing?]

## Decision

[What did we decide?]

## Consequences

[What are the trade-offs?]

## Alternatives Considered

[What else did we look at?]
```

---

_Last updated: 24 October 2025_
