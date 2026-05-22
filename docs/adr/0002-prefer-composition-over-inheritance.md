# ADR 0002: Prefer Composition Over Inheritance

## Status

Accepted

## Context

The overlap calculation engine and program parsing logic may grow in complexity. We need a maintainable approach for extending behavior (e.g., different minor vs. certification rules, elective counting variations) without deep inheritance hierarchies.

## Decision

We will **prefer composition over inheritance** for domain logic:

- Use small, focused functions and modules that can be composed.
- Avoid abstract base classes for business rules; use plain functions and data structures.
- When shared behavior is needed, extract utilities or inject dependencies rather than extending classes.

## Consequences

- Easier to test: pure functions and small modules are straightforward to unit test.
- Less coupling: changes to one rule type do not ripple through a class hierarchy.
- AI agents and new contributors can reason about logic in isolation.
