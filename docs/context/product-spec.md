# Product Spec — Minor/Certification Overlap App

Business logic and user requirements.

## Goal

Help students discover which **minors and certifications** overlap with classes they are taking, plan to take, or want to take. Maximize course reuse and reduce extra credit hours.

## User Journey

1. **Profile**: User enters their major(s). Excluded majors are used to filter out ineligible programs.
2. **Courses**: User adds courses they have taken, are taking, or plan to take.
3. **Verification**: User reviews their course list and can remove courses.
4. **Results**: App shows completion % per minor/certification, matched courses, remaining requirements, and Gen-Ed overlap.

## Core Concepts

- **Program**: A minor or certification with required courses, elective pools, and electives_required.
- **Overlap**: A course that satisfies both the user's major and a program requirement.
- **Completion %**: (Matched required + matched electives) / total required, capped by program rules (e.g., "6 unique advanced hours").

## Business Rules

- Programs may exclude certain majors (e.g., "Advertising" minor excludes "Advertising" major).
- Some programs require advisor approval; the app surfaces this but does not enforce it.
- Gen-Ed satisfaction is informational; the app shows which Gen-Eds are satisfied by user courses.
- Elective counting varies by program (pools, minimum hours, 300/400-level requirements).

## Out of Scope (Current)

- Prerequisite chains (future enhancement).
- Official degree audit integration.
- Multi-institution support.
