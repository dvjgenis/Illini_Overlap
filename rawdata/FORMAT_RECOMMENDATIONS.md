# CSV Format Recommendations for PreReq Detect

## ✅ **OPTIMAL FORMAT SPECIFICATIONS**

### **1. Column Order (Recommended Priority Order)**

**Tier 1 - Critical (Must Have):**
1. `name` - Program name
2. `program_type` - "Minor" or "Certificate"
3. `required_courses` - Course codes only
4. `elective_courses` - Course codes only
5. `electives_required` - Number only
6. `requirements_text` - Human-readable description

**Tier 2 - Important (Highly Recommended):**
7. `credit_hours` - e.g., "18", "18-21"
8. `excluded_majors` - Major names
9. `advisory_approval_required` - "Yes" or "No"
10. `up_to_date` - Status text
11. `status` - "Approved", "Deleted", etc.

**Tier 3 - Metadata (Optional but Useful):**
12. `effective_catalog_term` - Catalog year
13. `prerequisites` - Prereq descriptions
14. `notes` - Additional notes
15. `overlap_info` - Overlap information
16. `description` - Full description
17. `courses_not_counted` - Excluded courses
18. `code`, `college`, `department`, `contact` - Admin metadata
19. `gen_ed_satisfied` - Gen Ed mappings

---

## **2. Course Code Format Rules**

### ✅ **CORRECT Formats:**
```
CS 124, CS 128, CS 173, CS 225
MATH 241, MATH 415
ECE 220, ECE 313
```

### ❌ **INCORRECT Formats:**
```
"Indigenous African Language (5 hrs)"  ← Description, not course code
"Area A: Race/Identities"              ← Category label, not course code
"Survey: AFST 210, 222"                ← Has descriptive prefix
"300-400 level ANSC"                   ← Range description, not specific codes
```

### **Rule:**
- **ONLY** put actual course codes in `required_courses` and `elective_courses`
- Put descriptions, categories, and ranges in `requirements_text` or `notes`

---

## **3. Separator Consistency**

### **Option A: Commas (Recommended for Excel compatibility)**
```csv
required_courses,elective_courses
"CS 124, CS 128, CS 173","CS 233, CS 241, CS 374"
```

### **Option B: Pipes (More explicit, less Excel-friendly)**
```csv
required_courses,elective_courses
"CS 124|CS 128|CS 173","CS 233|CS 241|CS 374"
```

### **⚠️ DO NOT MIX:**
```csv
"CS 124, CS 128|CS 173"  ← BAD: Mixed separators
```

**Recommendation:** Use **commas** consistently. The parser handles both, but consistency prevents confusion.

---

## **4. Empty Values vs "None"**

### ✅ **CORRECT:**
```csv
excluded_majors,prerequisites
,"MATH 220 required"
```

### ⚠️ **ACCEPTABLE (but not ideal):**
```csv
excluded_majors,prerequisites
None,"MATH 220 required"
```

### ❌ **INCORRECT:**
```csv
excluded_majors,prerequisites
"None","MATH 220 required"  ← Quoted "None" is treated as literal value
```

**Recommendation:** Leave empty cells blank rather than typing "None". The script handles "None" but empty is cleaner.

---

## **5. electives_required Format**

### ✅ **BEST (Simple number):**
```csv
electives_required
2
3
4
```

### ✅ **ACCEPTABLE (Number in text):**
```csv
electives_required
"3 (1 from Roles, 2 from Choices)"
"4 (1 Exploring, 3 Advanced)"
```

### ⚠️ **PARSABLE (but requires extraction):**
```csv
electives_required
"4 courses (12-16 hrs)"
"5 courses (15 hrs)"
```

**Recommendation:** Use simple numbers when possible. The parser extracts numbers from text, but numbers are more reliable.

---

## **6. Complex Requirements Handling**

### **Problem Pattern:**
Some programs have complex requirements that don't fit simple "required + electives" model.

### **Example - African Studies:**
```
required_courses: "Indigenous African Language (5 hrs), Continental Survey course"
elective_courses: "Survey: AFST 210, 222, 254, HIST 111, 112; Advanced Core: 300/400-level AFST-approved"
```

### **✅ BETTER Format:**
```csv
required_courses,"AFST 101, AFST 102, AFST 210"
elective_courses,"AFST 222, AFST 254, HIST 111, HIST 112, AFST 300, AFST 400"
electives_required,"5"
requirements_text,"5 hrs African language + 3 hrs Survey + 6 hrs advanced core + 6 hrs additional core. Courses must come from at least 3 separate departments."
notes,"Language selection is the primary entry point. Core courses must contain 50% minimum African content."
```

**Key Principle:** Extract actual course codes into the course fields. Put descriptions, rules, and constraints in `requirements_text` and `notes`.

---

## **7. Excel-Specific Best Practices**

### **Quoting:**
- Excel automatically quotes fields with commas
- Manual quotes are fine: `"CS 124, CS 128"`
- Both work: `CS 124, CS 128` (if no commas in other fields)

### **Line Breaks:**
- Avoid line breaks within cells
- Use semicolons if you need to separate complex lists: `"Area A; Area B; Area C"`

### **Special Characters:**
- Avoid: `"`, `'`, `\n`, `\r` in course codes
- Safe: Letters, numbers, spaces, hyphens

---

## **8. Complete Example Row (Optimal Format)**

```csv
name,program_type,required_courses,elective_courses,electives_required,requirements_text,credit_hours,excluded_majors,advisory_approval_required,up_to_date,status,effective_catalog_term,prerequisites,notes,overlap_info,description,courses_not_counted
"Computer Science Minor, UG","Minor","CS 124, CS 128, CS 173, CS 225","CS 233, CS 241, CS 374, CS 410, CS 421, CS 427",2,"Required: CS 124, CS 128, CS 173, CS 225. Plus 2 upper-level CS electives (300/400).",16,"Computer Science, Computer Engineering",No,"Up to date",Approved,120228,"MATH 220 or MATH 221 recommended","Verify exclusions and substitutions in catalog.","Cannot double-count with CS major requirements.","Knowledge of programming, algorithms, and data structures.",,"277",Media,Computer Science,cs-advising@illinois.edu,
```

---

## **9. Validation Checklist**

Before saving your CSV, verify:

- [ ] All course codes follow format: `DEPT ###` (e.g., `CS 124`)
- [ ] No descriptive text in `required_courses` or `elective_courses`
- [ ] Consistent separator (commas OR pipes, not mixed)
- [ ] Empty cells are blank (not "None")
- [ ] `electives_required` contains a number (or text with number)
- [ ] `program_type` is exactly "Minor" or "Certificate"
- [ ] `advisory_approval_required` is "Yes" or "No"
- [ ] `status` is "Approved", "Deleted", "Edited", or "Added"
- [ ] No duplicate program names
- [ ] All required fields have values

---

## **10. Current Format Assessment**

**Your new format is GOOD, but could be improved:**

✅ **Strengths:**
- Logical column order
- Mostly consistent separators
- Proper CSV quoting
- Complete data

⚠️ **Areas for Improvement:**
1. Extract course codes from descriptive text (rows 4, 5)
2. Use consistent separators (all commas OR all pipes)
3. Replace "None" with empty cells where possible
4. Simplify `electives_required` to numbers when possible

**Overall Grade: B+** (Good structure, minor data quality issues)

---

## **11. Quick Fix Script**

If you want to clean up your current CSV:

```python
# This would normalize separators, extract course codes, etc.
# But your current format is already quite good!
```

**Recommendation:** Your current format is **good enough** for parsing. The script handles the minor inconsistencies. Focus on extracting actual course codes from descriptive text for better accuracy.
