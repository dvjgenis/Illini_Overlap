# IlliniOverlap — Minor & Certification Overlap Tool

An app for students to see which **minors and certifications** overlap with classes they are taking, plan to take, or want to take. Maximize course reuse and reduce extra credit hours.

## Quick Start

```bash
make dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
.
├── .cursor/rules/       # Cursor rule-based prompts (.mdc)
├── docs/
│   ├── adr/             # Architectural Decision Records
│   ├── context/         # system-map.md, product-spec.md
│   ├── plan.md         # Implementation blueprint (review first!)
│   └── progress.md     # RALPH loop state tracker
├── rawdata/            # CSV source data for minors/certifications
├──  # Next.js app
├── Makefile            # Standardized commands (make dev, make lint, make test)
├── .cursorrules        # Minimal global rules, links to /docs
└── README.md
```

## Commands

| Command      | Description          |
|--------------|----------------------|
| `make dev`   | Start dev server     |
| `make build` | Production build     |
| `make start` | Start production     |
| `make lint`  | Run ESLint           |
| `make test`  | Run tests            |

## For AI Agents

1. Read `docs/plan.md` before implementing.
2. Pin `@docs/plan.md` and `@docs/progress.md` for major tasks.
3. Use `make test` and `make lint` — do not guess flags.
4. Update `docs/progress.md` when hitting blockers or changing direction.

## For Humans

- **Onboarding**: Start with `docs/context/system-map.md` and `docs/context/product-spec.md`.
- **Architecture**: See `docs/adr/` for decision rationale.
- **Context reset**: When chat gets noisy, run a State Handover (see `.cursorrules`).

---

Built for Illini by Illini. University of Illinois Urbana-Champaign.
