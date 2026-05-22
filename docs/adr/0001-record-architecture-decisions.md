# ADR 0001: Record Architecture Decisions

## Status

Accepted

## Context

We need a consistent way to capture important architectural decisions for the Minor/Certification Overlap app. Without records, future contributors (and AI agents) may repeat debates or make changes that contradict prior rationale.

## Decision

We will use **Architectural Decision Records (ADRs)** in `docs/adr/` with the naming convention `NNNN-short-title.md`. Each ADR will include:

- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: What prompted the decision
- **Decision**: What we decided
- **Consequences**: Trade-offs and follow-up actions

## Consequences

- Decisions are searchable and version-controlled.
- New sessions can quickly understand the "why" behind the codebase.
- Superseded ADRs can reference the new decision (e.g., "Superseded by ADR 0003").
