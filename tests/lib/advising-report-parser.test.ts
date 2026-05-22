import { describe, it, expect } from "vitest"
import {
  classifyPdfText,
  extractCourseCodesFromAuditText,
  extractCoursesCountingTowardTotalHoursSection,
  extractPdfCourseCodes,
  filterCompletedCourseLines,
} from "@/lib/advising-report-parser"

const advisingHeader = [
  "PREPARED: 02/07/24 - 10:02 ACADEMIC ADVISING REPORT THE UNIVERSITY OF ILLINOIS",
  "CATALOG YEAR: 202401",
].join("\n")

describe("classifyPdfText", () => {
  it("classifies UIUC Academic Advising Report text", () => {
    const { kind, markersMatched } = classifyPdfText(
      `${advisingHeader}\nOTHER BOILERPLATE`,
    )
    expect(kind).toBe("advising_report")
    expect(markersMatched).toContain("ACADEMIC_ADVISING_REPORT")
    expect(markersMatched).toContain("CATALOG_YEAR")
  })

  it("does not classify random PDFs as advising reports", () => {
    const { kind } = classifyPdfText("ACADEMIC ADVISING REPORT without other headers")
    expect(kind).toBe("other_pdf")
  })
})

describe("extractPdfCourseCodes", () => {
  it("uses only Courses counting toward total hours for advising PDFs", () => {
    const text = `${advisingHeader}

SUMMARY OF COURSES IN PROGRESS
SP24 GS 299 A 12.0 IP>I SP24 LAS 292 SAA 2.0 IP>I

COURSES COUNTING TOWARD TOTAL HOURS (SP2022 TO SP2024)
FA22 RHET 105 2 4.0 PS
FA22 CHEM 101 CL1 3.0 B FA22 CHEM 199 CG2 1.0 A
SP23 CS 124 AL1 3.0 B-
`

    const result = extractPdfCourseCodes(text)
    expect(result.kind).toBe("advising_report")
    expect(result.fallbackReason).toBeUndefined()
    expect(result.codes.sort()).toEqual(["CHEM 101", "CHEM 199", "CS 124", "RHET 105"].sort())
    expect(result.codes).not.toContain("GS 299")
    expect(result.codes).not.toContain("LAS 292")
  })

  it("dedupes repeated codes", () => {
    const text = `${advisingHeader}
COURSES COUNTING TOWARD TOTAL HOURS
FA22 CS 101 3 3.0 A
SP23 CS 101 AL1 3.0 B
`
    const { codes } = extractPdfCourseCodes(text)
    expect(codes.filter((c) => c === "CS 101")).toHaveLength(1)
  })

  it("best-effort parses non-advising PDFs and flags fallback", () => {
    const text = `Some export without the official header.
FA22 CS 225 B 3.0 A
MATH 241 lecture notes
`
    const result = extractPdfCourseCodes(text)
    expect(result.kind).toBe("other_pdf")
    expect(result.fallbackReason).toBe("not_academic_advising_report")
    expect(result.codes).toContain("CS 225")
    expect(result.codes).toContain("MATH 241")
  })

  it("when counting section is missing, uses term-marked non-IP lines and warns", () => {
    const text = `${advisingHeader}
FA22 CS 361 AL1 3.0 A
SP24 GS 299 A 12.0 IP>I
`
    const result = extractPdfCourseCodes(text)
    expect(result.kind).toBe("advising_report")
    expect(result.fallbackReason).toBe("missing_courses_counting_section")
    expect(result.codes).toContain("CS 361")
    expect(result.codes).not.toContain("GS 299")
  })
})

describe("extractCoursesCountingTowardTotalHoursSection", () => {
  it("stops before LEGEND / end-of-analysis markers", () => {
    const text = `${advisingHeader}
COURSES COUNTING TOWARD TOTAL HOURS
FA22 STAT 107 L2 4.0 A
**** LEGEND ****
FA23 SHOULD 999 XX 1.0 X
END OF ANALYSIS
`
    const section = extractCoursesCountingTowardTotalHoursSection(text)
    expect(section).toContain("STAT 107")
    expect(section).not.toContain("SHOULD 999")
  })
})

describe("extractCourseCodesFromAuditText", () => {
  it("excludes placeholder course numbers", () => {
    expect(extractCourseCodesFromAuditText("FA22 HIST 1-- 4 3.0 PS")).toHaveLength(0)
  })
})

describe("filterCompletedCourseLines", () => {
  it("drops in-progress markers", () => {
    const raw = "FA22 OK 101 3 3.0 A\nSP24 Nope 102 2.0 IP>I"
    expect(filterCompletedCourseLines(raw)).toContain("OK 101")
    expect(filterCompletedCourseLines(raw)).not.toContain("Nope 102")
  })
})
