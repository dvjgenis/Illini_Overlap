# Plan — Implementation Blueprint

**Review and approve material changes before large refactors.** For small fixes, follow ADRs and update `docs/progress.md` when blockers appear.

---

## Active phase

**Phase: Stabilization + data pipeline consistency**

Core loop is stable. Latest pass completed **Excel-first program loading (`Programs_Minors.xlsx`)**, **script/docs/admin naming alignment**, **restored course substitution module**, and **Step 4 certificate-type filter unification**. Current baseline has passing lint, tests, and production build.

---

## Completed (checklist)

1. [x] Unit tests for `lib/calculation-engine` (overlap logic)
2. [x] Program loading from `public/Programs_Minors.xlsx` (sourced from `rawdata/Programs_Minors.xlsx`, with `public/programs.csv` fallback)
3. [x] ThemeProvider + dark mode toggle
4. [x] Plus Jakarta Sans typography
5. [x] Edit Courses / Edit Major from results (no full reset)
6. [x] Loading skeleton, header/footer polish, Admin link
7. [x] Dev stability: Watchpack polling env, chunk-error recovery, safe CSV fetch timeout
8. [x] Hydration/toaster: client-only toaster, error boundary placement
9. [x] Major/course state: functional updates, safer `localStorage` + hydration in `program-context`
10. [x] Step 1: keyboard/touch/Enter behavior for major selection
11. [x] Admin: 3–4 digit course numbers, safer program type mapping
12. [x] Step 4 dashboard: eligible/actionable/excluded/manual, Gen Ed parent categories, programs analyzed
13. [x] Step transition overlay: sleek full-screen mask, synced progress bar, 1.5s default / 2s for step 4
14. [x] Unit tests: `parseRefinedCSV`, `parseProgramsFromCSVString` ([`tests/lib/csv-loader.test.ts`](tests/lib/csv-loader.test.ts))
15. [x] Unit tests: `analyzeGenEds` / `calculateGenEdProgress` ([`tests/lib/gen-ed-engine.test.ts`](tests/lib/gen-ed-engine.test.ts))
16. [x] Analyze failure: Sonner toast; step transition respects `prefers-reduced-motion` (shorter holds + static decor)
17. [x] SEO: `getSiteUrl`, `metadataBase`, layout `robots` + `twitter`, [`app/robots.ts`](app/robots.ts), [`app/sitemap.ts`](app/sitemap.ts) (`NEXT_PUBLIC_SITE_URL` / `VERCEL_URL`)
18. [x] `package.json` name: `illini-overlap`; admin reviewed — client-only CSV tools, no secrets in bundle
19. [x] Canonical dataset migration to Excel-first source (`rawdata/Programs_Minors.xlsx` → `public/Programs_Minors.xlsx`) with CSV fallback retained
20. [x] Regeneration tooling + docs/admin copy aligned to canonical file naming (`Programs_Minors.xlsx`, `programs.csv`)
21. [x] Fixed missing `lib/course-substitutions.ts` (build/test blocker) and restored expected substitution behavior (`CS 125` satisfies `CS 124`)
22. [x] Fixed duplicate certificate filter UX by normalizing legacy `Certification` values to `Certificate`

---

## Next steps (when ready)

1. [ ] Consider API route or static generation strategy if program data grows very large
2. [ ] Prerequisite chain support (future / product decision)
3. [ ] Optional: tune transition `holdMs` per step via user testing; keep masking chunk paint for step 4
4. [ ] Optional: dedupe duplicate keys in `lib/mock-data.ts` `COURSE_GEN_ED_MAP` (Vitest/esbuild warnings)

---

## File change log (reference)

| Area | Typical paths |
|------|----------------|
| Wizard shell | `app/page.tsx`, `components/step-transition-screen.tsx`, `components/step-progress.tsx` |
| Steps | `components/steps/*` |
| State / data | `context/program-context.tsx`, `lib/csv-loader.ts`, `lib/calculation-engine.ts`, `lib/gen-ed-engine.ts` |
| Layout / stability / SEO | `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/site-url.ts`, `components/chunk-error-recovery.tsx` |
| Admin | `app/admin/page.tsx` |
| Styles | `app/globals.css` |

---

## Notes

- Always run **`make test`** and **`make lint`** (from repo root) before considering a task complete; use **`make build`** before release confidence checks.
- Update **`docs/progress.md`** when hitting blockers or changing direction.
- Check **`docs/adr/`** before architectural shortcuts.
