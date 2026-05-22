# ADR 0003 — Academic Advising Report PDF parsing

## Status

Accepted (2026-04-29)

## Context

Users upload degree audit / advising PDFs. The canonical export in `sample/` is the UIUC **Academic Advising Report**. Course rows appear in many sections; the authoritative **completed** list for total hours is under **Courses counting toward total hours**. Other PDFs (unofficial transcripts, exports) may not share that layout.

## Decision

1. **Classification:** Treat text as an Academic Advising Report when it contains `ACADEMIC ADVISING REPORT` plus at least one of `PREPARED:`, `CATALOG YEAR:`, or `THE UNIVERSITY OF ILLINOIS`.
2. **Extraction (advising reports):** Parse course codes only from the **Courses counting toward total hours** subsection; stop at `LEGEND`, `END OF ANALYSIS`, or standard footer markers. Include only lines with term tokens (`FA|SP|SU|WI` + two digits) and exclude in-progress markers (`IP`, `>I`, etc.).
3. **Other PDFs:** Run best-effort `extractCourseCodesFromAuditText` on the full extracted string and show a non-blocking note in the upload success message.
4. **Missing subsection:** If the report is classified as advising but the counting block is absent, fall back to term-marked, non-IP lines from the full text and warn the user to verify the list.
5. **Implementation:** Pure functions live in `lib/advising-report-parser.ts` (composition, no inheritance), with unit tests in `tests/lib/advising-report-parser.test.ts`.

## Consequences

- Parsing is deterministic for official advising exports aligned with `sample/`.
- Non-standard PDFs remain usable but are explicitly labeled as best-effort.
- Changes to Degree Navigator / report wording may require updating markers or section regexes.
