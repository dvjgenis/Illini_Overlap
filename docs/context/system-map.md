# System Map — Minor/Certification Overlap App

Technical overview for AI agents and developers.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI | Radix UI, Framer Motion, Lucide icons |
| Data | Excel in `rawdata/Programs_Minors.xlsx` (CSV fallback supported), parsed at runtime |

## Data Flow

```
rawdata/Programs_Minors.xlsx
    → parsePrograms() / XLSX loader
    → Program[] in program-context
    → User selects majors + courses
    → calculateProgramEligibility(userCourses, programs, userMajors)
    → ProgramResult[] (completion %, matched courses, remaining)
    → analyzeGenEds() for Gen-Ed overlap
    → Step4Results UI

public/programs.csv (fallback)
    → parsePrograms() / CSV loader
    → Program[] in program-context
    → User selects majors + courses
    → calculateProgramEligibility(userCourses, programs, userMajors)
    → ProgramResult[] (completion %, matched courses, remaining)
    → analyzeGenEds() for Gen-Ed overlap
    → Step4Results UI
```

## Key Modules

| Path | Responsibility |
|------|----------------|
| `lib/calculation-engine` | Overlap logic, elective counting, completion % |
| `lib/gen-ed-engine` | Gen-Ed requirement analysis |
| `context/program-context` | Programs, user courses, majors, CSV load state |
| `components/steps/*` | Step1Profile, Step2Courses, Step3Verification, Step4Results |
| `components/step-transition-screen.tsx` | Full-screen overlay between wizard steps; hold timing driven by `app/page.tsx` (longer for step 4 / dynamic chunk) |
| `components/chunk-error-recovery.tsx` | Client recovery for stale chunk / runtime parse errors (paired with layout inline script) |
| `lib/site-url.ts` | `getSiteUrl()` for `metadataBase`, `robots.ts`, `sitemap.ts` (`NEXT_PUBLIC_SITE_URL`, `VERCEL_URL`, localhost) |
| `lib/csv-loader.ts` | `loadProgramsFromCSV`, `parseRefinedCSV`, `parseProgramsFromCSVString` (CSV string → `Program[]`) |
| `lib/advising-report-parser.ts` | Classify Academic Advising Report PDF text; extract completed course codes from the “courses counting toward total hours” block; best-effort fallback for other PDFs |

## CSV Schema (rawdata)

- `name`, `program_type`, `required_courses`, `elective_courses`, `electives_required`
- `requirements_text`, `credit_hours`, `excluded_majors`, `gen_ed_satisfied`, etc.
- Course lists are comma-separated (e.g., `"HDFS 105, HDFS 120, HDFS 310"`).

## Execution

- `make dev` — start Next.js dev server
- `make build` — production build
- `make lint` — run ESLint

If the UI looks like unstyled HTML (default fonts, underlined purple titles), see [troubleshooting-styling.md](../troubleshooting-styling.md).
