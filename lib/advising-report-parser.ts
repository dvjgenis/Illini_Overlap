/**
 * UIUC Academic Advising Report (PDF text) — classification and course extraction.
 * Pure functions; safe to unit test without the browser.
 */

export type PdfCourseExtractionKind = "advising_report" | "other_pdf"

export type PdfCourseExtractionFallbackReason =
  | "not_academic_advising_report"
  | "missing_courses_counting_section"

export type PdfCourseExtractionResult = {
  codes: string[]
  kind: PdfCourseExtractionKind
  /** Present when extraction used full-document fallback or non-audit PDFs. */
  fallbackReason?: PdfCourseExtractionFallbackReason
  /** Markers observed in text (for debugging / future UI). */
  markersMatched: string[]
}

const ADVISING_TITLE = /ACADEMIC\s+ADVISING\s+REPORT/i
const PREPARED = /\bPREPARED:/i
const CATALOG_YEAR = /\bCATALOG\s+YEAR:/i
const UNIVERSITY_ILLINOIS = /THE\s+UNIVERSITY\s+OF\s+ILLINOIS/i
const COURSES_COUNTING = /COURSES\s+COUNTING\s+TOWARD\s+TOTAL\s+HOURS/i

/**
 * Heuristic: same family as sample `sample/*.PDF` exports.
 * Requires the report title plus at least one other stable header signal.
 */
export function classifyPdfText(text: string): {
  kind: PdfCourseExtractionKind
  markersMatched: string[]
} {
  const markersMatched: string[] = []
  if (ADVISING_TITLE.test(text)) markersMatched.push("ACADEMIC_ADVISING_REPORT")
  if (PREPARED.test(text)) markersMatched.push("PREPARED")
  if (CATALOG_YEAR.test(text)) markersMatched.push("CATALOG_YEAR")
  if (UNIVERSITY_ILLINOIS.test(text)) markersMatched.push("UNIVERSITY_OF_ILLINOIS")
  if (COURSES_COUNTING.test(text)) markersMatched.push("COURSES_COUNTING_TOWARD_TOTAL_HOURS")

  const isAdvising =
    ADVISING_TITLE.test(text) &&
    (PREPARED.test(text) || CATALOG_YEAR.test(text) || UNIVERSITY_ILLINOIS.test(text))

  return {
    kind: isAdvising ? "advising_report" : "other_pdf",
    markersMatched,
  }
}

/**
 * Extract only UIUC course codes (e.g., RHET 105, CS 124) from audit-like text.
 * Excludes terms coded as FA 2022, placeholders (HIST 1--), and common false positives.
 */
export function extractCourseCodesFromAuditText(text: string): string[] {
  const courseRegex = /\b([A-Z]{2,5})\s+(\d{3,4})\b/gi
  const matches = [...text.matchAll(courseRegex)]

  const normalized = matches.map((match) => {
    const dept = match[1].toUpperCase()
    const num = match[2]
    return `${dept} ${num}`
  })

  const termPrefixes = new Set(["FA", "SP", "SU", "WI"])
  const otherFalsePositives = new Set([
    "FALL",
    "SPRING",
    "SUMMER",
    "WINTER",
    "RING",
    "GPA",
    "SELECT",
    "NEEDS",
    "EARNED",
    "HOURS",
    "TAKEN",
    "FROM",
    "NOT",
    "ADD",
    "OR",
  ])

  const filtered = normalized.filter((code) => {
    const [dept, num] = code.split(" ")
    if (otherFalsePositives.has(dept)) return false
    if (termPrefixes.has(dept) && /^20\d{2}$/.test(num)) return false
    if (/\d--/.test(code)) return false
    return true
  })

  return [...new Set(filtered)]
}

/**
 * Narrow window used for completed-only extraction on official advising reports:
 * lines after "COURSES COUNTING TOWARD TOTAL HOURS" until legend / end / footer.
 */
export function extractCoursesCountingTowardTotalHoursSection(text: string): string {
  const normalized = text.replace(/\r/g, "")
  const lines = normalized.split("\n")
  const idx = lines.findIndex((line) => COURSES_COUNTING.test(line))
  if (idx === -1) return ""

  const out: string[] = []
  for (let i = idx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/END\s+OF\s+ANALYSIS/i.test(line)) break
    if (/\*{3,}\s*LEGEND\s*\*{3,}/i.test(line) || /\*+\s*LEGEND\s*\*+/i.test(line)) break
    if (/\*\s+REPORT\s+PRODUCED\s+FOR:/i.test(line)) break
    out.push(line)
  }
  return out.join("\n")
}

/**
 * Keep lines that look like a term + course row; drop in-progress markers.
 */
export function filterCompletedCourseLines(sectionText: string): string {
  return sectionText
    .split("\n")
    .filter((line) => {
      if (!/\b(?:FA|SP|SU|WI)\d{2}\b/i.test(line)) return false
      if (/\bIP\b|>I|IP>|IP>I|IN\s+PROGRESS\b/i.test(line)) return false
      return true
    })
    .join("\n")
}

/**
 * Main entry: classify PDF text, then extract courses (completed-only for advising reports).
 */
export function extractPdfCourseCodes(text: string): PdfCourseExtractionResult {
  const { kind, markersMatched } = classifyPdfText(text)

  if (kind === "advising_report") {
    const section = extractCoursesCountingTowardTotalHoursSection(text)
    if (section.trim().length > 0) {
      const completedLines = filterCompletedCourseLines(section)
      const codes = extractCourseCodesFromAuditText(completedLines)
      return { codes, kind, markersMatched }
    }

    const fallbackBody = filterCompletedCourseLines(text.replace(/\r/g, ""))
    const codes = extractCourseCodesFromAuditText(fallbackBody)
    return {
      codes,
      kind,
      markersMatched,
      fallbackReason: "missing_courses_counting_section",
    }
  }

  const codes = extractCourseCodesFromAuditText(text)
  return {
    codes,
    kind,
    markersMatched,
    fallbackReason: "not_academic_advising_report",
  }
}
