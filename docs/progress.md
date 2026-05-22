# Progress — RALPH Loop State Tracker

Living document. Audit regularly so sessions know the goal, what shipped, and what is still broken.

---

## End goal (product)

**IlliniOverlap / PreReq Detect** helps students see which **minors and certifications** overlap courses they already take, plan to take, or want to take—so they maximize reuse across degree requirements.

Success looks like: trustworthy program data, a smooth wizard (majors → courses → verify → results), accurate completion and Gen Ed signals in the results dashboard, and a dev experience that does not flake (hydration, chunks, file watchers).

---

## Approach (engineering)

1. **Single source of truth** for programs: Excel in `rawdata/Programs_Minors.xlsx` → copied/served as `public/Programs_Minors.xlsx` → parsed in `lib/` → `program-context` (CSV remains a fallback at `public/programs.csv`).
2. **Client wizard** on `app/page.tsx` with dynamic imports for heavier steps to keep initial load smaller.
3. **Reliability first** for interactions: functional React updates for majors/courses, safe `localStorage` hydration, and guards for dev-time chunk/runtime errors.
4. **Makefile-only commands** from repo root: `make dev`, `make build`, `make start`, `make lint`, `make test` (see `Makefile`).
5. **Docs hygiene**: this file + `docs/plan.md` for handover; ADRs in `docs/adr/` for constraints.

---

## Steps completed so far (chronological themes)

### Dev runtime and blank / unstable UI

- **`package.json` dev script:** `WATCHPACK_POLLING=true` and interval to reduce `EMFILE` / Watchpack failures on macOS.
- **Chunk and hydration recovery:** `components/chunk-error-recovery.tsx` plus inline script in `app/layout.tsx` to reload once on chunk/runtime parse errors; **ClientToaster** via `next/dynamic` with `ssr: false`, inside **AppErrorBoundary**.
- **`lib/csv-loader.ts`:** `fetchWithTimeout` uses `AbortController` + `setTimeout` instead of `AbortSignal.timeout` for broader runtime support.

### Lint and styling

- **ESLint** with `eslint-config-next`, `.eslintrc.json`, `npm run lint` → `next lint`.
- **`app/globals.css`:** hex fallbacks under `@supports not (color: oklch(...))` for CSS variables.

### Major / course state and Step 1 UX

- **`context/program-context.tsx`:** Safer JSON parsing for user keys from `localStorage`; `setUserCourses` / `setUserMajors` as `Dispatch<SetStateAction<string[]>>`; earlier `isHydrated` after loading user keys.
- **`app/page.tsx`:** `handleAddMajor`, `handleRemoveMajor`, `handleRemoveCourse` use **functional** `setState`.
- **`components/course-input.tsx`:** Functional updates for add/remove/paste/upload.
- **`components/steps/step1-profile.tsx`:** Enter selects first filtered row when none highlighted; touch targets, cursor, row interaction fixes.

### Admin and results accuracy

- **`app/admin/page.tsx`:** Course number regex allows **3–4 digits**; program type mapping handles minor / certificate / other more safely.
- **`components/steps/step4-results.tsx`:** Sidebar metrics: eligible excludes `isExcluded`; counts for actionable / excluded / manual; programs analyzed from `results.length`; Gen Ed “categories complete” uses `parentProgress` length (not a hardcoded `/6`).

### Wizard transition overlay (latest)

- **`components/step-transition-screen.tsx`:** Full-screen overlay (`bg-background/95`, `backdrop-blur-xl`), ambient motion, glass card, step labels, progress bar duration synced to parent hold.
- **`app/page.tsx`:** `transitionToStep(next, { holdMs? })`; default hold **1500 ms**, **2000 ms** when entering step 4 (results + dynamic chunk); exit fade **420 ms**.

### Docs / QA

- Full-app QA themes: major picker, admin edge cases, dashboard numbers, transitions.
- **`make lint`** clean after the above; tests and build should be run before releases (see plan).

### App-wide quality sweep (2026-04-10)

- **`lib/csv-loader.ts`:** Exported **`parseProgramsFromCSVString`** (shared with fetch path); Vitest covers `parseRefinedCSV` and CSV tokenizer edge cases (quotes, CRLF, doubled quotes).
- **`tests/lib/gen-ed-engine.test.ts`:** Smoke tests for `analyzeGenEds` and `calculateGenEdProgress`.
- **`app/page.tsx`:** **`toast.error`** on analyze failure (Sonner); **`useReducedMotion`** shortens transition holds and exit delay; passes **`prefersReducedMotion`** to the transition screen.
- **`components/step-transition-screen.tsx`:** Static orbs and minimal motion when reduced motion is requested.
- **`lib/site-url.ts`**, **`app/robots.ts`** (disallow `/admin`), **`app/sitemap.ts`**, **`app/layout.tsx`:** `metadataBase`, `robots`, `twitter`, Open Graph `type`/`url`.
- **`package.json`:** `name` → **`illini-overlap`**. Admin route sanity: no API keys; larger bundle is expected (xlsx client upload).

### Programs dataset migration + stabilization (2026-04-29)

- **Excel-first source of truth implemented:** App now loads `public/Programs_Minors.xlsx` first, with low-cost Excel legacy fallbacks and `public/programs.csv` fallback in `lib/csv-loader.ts`.
- **Canonical public data artifact:** Copied and aligned `rawdata/Programs_Minors.xlsx` to `public/Programs_Minors.xlsx` for runtime loading.
- **Regeneration scripts aligned to canonical naming:**
  - `scripts/regenerate_refined.py` outputs `public/Programs_Minors.xlsx`
  - `scripts/regenerate_refined_csv.py` outputs `public/programs.csv` and can read latest Excel or CSV from `rawdata/`
- **Admin/docs source-of-truth consistency pass:** Updated startup source copy and guidance in `app/admin/page.tsx`, `CSV_UPDATE_GUIDE.md`, `docs/plan.md`, `docs/progress.md`, and `docs/context/system-map.md`.
- **Build blocker fixed:** Restored missing substitutions module by adding `lib/course-substitutions.ts` with `COURSE_SUBSTITUTIONS` and `COURSE_SUBSTITUTION_EXPANSION`.
- **Regression fix for test expectation:** Added `CS 125 -> CS 124` substitution to satisfy overlap matching behavior in existing tests.
- **UI bug fixed (duplicate certificate filter buttons):**
  - Normalized legacy `Certification` values to `Certificate` in parser fallback and saved-program hydration.
  - Removed duplicate Step 4 type bucket and unified counts/filters under a single certificate bucket in `components/steps/step4-results.tsx`.
- **Validation status:** `make lint`, `make test`, and `make build` all pass after these fixes.

### Academic Advising Report PDF parsing (2026-04-29)

- **Module:** `lib/advising-report-parser.ts` — classifies extracted PDF text as UIUC **Academic Advising Report** vs other PDFs; for advising reports, pulls course codes only from the **Courses counting toward total hours** block (completed rows with term codes, excluding in-progress markers).
- **UI:** `components/course-input.tsx` uses `extractPdfCourseCodes` for `.pdf` uploads; non-advising PDFs still get **best-effort** full-text extraction with an on-screen **Note** in the success message.
- **Edge case:** If the advising report is detected but that block is missing, extraction falls back to term-marked, non-IP lines across the document (with a warning to verify the list).
- **Tests:** `tests/lib/advising-report-parser.test.ts` (included in `make test`).
- **Verified:** `make test` (33 tests), `make lint`, `make build` clean after the change.

---

## RALPH snapshot (quick)

| | |
|--|--|
| **Reasoning** | Stabilize dev + hydration, fix state bugs that felt like “UI not clicking,” make results honest, polish transitions so heavy steps feel intentional. |
| **Action** | Implemented items in “Steps completed” above. |
| **Learning** | “Non-clicking” often couples bad closures/hydration with chunk or duplicate `next dev` issues; dashboard clarity needs definitions tied to real result objects. |
| **Progression** | Parser/gen-ed covered by tests; analyze errors surface in UI; SEO metadata and crawlers configured; reduced-motion path shortens transitions. |
| **History** | Scaffold → polish → runtime stability → interaction + QA → transition UX → quality sweep (tests, toast, reduced motion, SEO). |

---

## Blockers / snags

| Date | Blocker | Resolution |
|------|---------|------------|
| 2026-04-08 | Step 1 major picker felt non-responsive; dev unstable (duplicate Next dev, chunk/hydration). | Single dev server discipline, watch polling, chunk recovery + client-only toaster, functional updates, context hydration fixes. |
| 2026-04-08 | Stale `/_next/static` → ChunkLoadError | Recovery reload + avoid multiple dev servers on same port. |

---

## Current failure / active issue

**No active failure at this time (updated 2026-04-29).**

Latest verification after Excel migration + UI fixes:

- `make lint` passes
- `make test` passes (24/24)
- `make build` passes

**Residual risks (not active failures, but watch):**

- Running **multiple** `next dev` instances or stale browser cache can still surface chunk mismatches until one reload (mitigated by recovery script).
- Very large `ulimit` / file watcher pressure may still need polling env vars on some machines.
- **Production URL:** set **`NEXT_PUBLIC_SITE_URL`** so `metadataBase`, sitemap, and robots use the real origin (falls back to `VERCEL_URL` or localhost).
- **Backlog** (see `docs/plan.md`): optional API for very large program datasets, prerequisite chains, optional dedupe of duplicate keys in `COURSE_GEN_ED_MAP` (esbuild warnings during tests).

---

## Context handover

For a fresh chat, pin:

1. `@docs/plan.md` — backlog and phase
2. `@docs/progress.md` — this file
3. `@docs/context/system-map.md` — modules and data flow
4. `@docs/context/product-spec.md` — business rules (if present)
5. `@docs/adr/` — architectural constraints
