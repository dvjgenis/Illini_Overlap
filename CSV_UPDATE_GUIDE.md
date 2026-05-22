# Program Data Update Guide (Excel-First)

## Overview
This app uses `Programs_Minors.xlsx` as the primary data source for minors and certificates. You can update this file without touching app code.

## File Location
The primary Excel file should be located at:
```
public/Programs_Minors.xlsx
```

Optional fallback file:
```
public/programs.csv
```

## Data Format

### Required Columns
- **program_type**: `"Minor"` or `"Certificate"` (used for filtering and labels)
- **name**: Program name (e.g., `"Computer Science Minor, UG"`)
- **required_courses**: Pipe-separated list of courses that are always required (e.g., `"CS 124|CS 128|CS 173|CS 225"`)
- **elective_courses**: Pipe-separated list of elective options (e.g., `"CS 233|CS 241|CS 374"`)
- **electives_required**: Integer pick count for the elective pool (e.g., `2` means “pick 2 from elective_courses”)
- **requirements_text**: A human-readable description of requirements (shown in the UI, and used for best-effort extraction if lists are missing)

### Optional Columns
- **credit_hours**: Total credit hours (e.g., "18", "18-21", "19-22")
- **excluded_majors**: Pipe-separated list of majors that make this minor/cert ineligible
- **advisory_approval_required**: "Yes" or "No" - indicates if advisor approval is needed
- **up_to_date**: Status like "Up to date" or "Outdated (from 2022)"
- **effective_catalog_term**: Catalog term (e.g., "120228", "2025-2026")
- **overlap_info**: Notes about major overlaps/exclusions
- **prerequisites**: Prerequisite requirements description
- **notes**: Additional notes about the program
- **status**: "Approved", "Deleted", etc. (Deleted programs are automatically skipped)
- **description**: Program description

### Course Code Format
- Use format: `DEPT ###` (e.g., "CS 124", "ANSC 100")
- Department codes: 2-5 uppercase letters
- Course numbers: 3-4 digits, optionally followed by a letter
- Separate multiple courses with `|` (pipe)

### Examples

#### Simple Minor
```csv
program_type,name,required_courses,elective_courses,electives_required,credit_hours,excluded_majors,requirements_text
Minor,"Computer Science Minor, UG","CS 124|CS 128|CS 173|CS 225","CS 233|CS 241|CS 374",2,16,"Computer Science|Computer Engineering","Required: CS 124, CS 128, CS 173, CS 225. Plus 2 electives from the list."
```

#### Minor with Prerequisites
```csv
program_type,name,required_courses,elective_courses,electives_required,prerequisites,advisory_approval_required,requirements_text
Minor,"Physics Minor","PHYS 211|PHYS 212","PHYS 213|PHYS 214",2,"MATH 220 or MATH 221 required",No,"Required: PHYS 211, PHYS 212. Plus 2 electives from the list. Verify prerequisites."
```

## How to Update

1. **Update the raw source Excel** at:
   `../rawdata/Programs_Minors.xlsx`
2. **Regenerate the app Excel**:
   ```bash
   cd uiuc-pre-req-detect
   python3 scripts/regenerate_refined.py
   ```
3. **Optional: regenerate CSV fallback**:
   ```bash
   cd uiuc-pre-req-detect
   python3 scripts/regenerate_refined_csv.py
   ```
4. **Refresh the app** - changes will be loaded automatically

## Notes

- The app computes completion using `required_courses` + `electives_required` (pick-N from `elective_courses`). If you omit `electives_required`, results will be marked as approximate.
- Programs with `status = "Deleted"` are automatically excluded
- Course codes are automatically normalized (uppercase, proper spacing)
- If course lists are missing, the app will try best-effort extraction from `requirements_text` / `notes` / `description` / `prerequisites` and label results accordingly.

## Admin Page

You can also upload a CSV or Excel file through the Admin page at `/admin`. The uploaded file overrides defaults in the current browser until reset.

## Troubleshooting

- **Programs not showing**: Check that `status` is not "Deleted"
- **Courses not recognized**: Ensure course codes follow the format `DEPT ###`
- **Default data not loading**: Verify `public/Programs_Minors.xlsx` exists and is readable
