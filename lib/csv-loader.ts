import type { Program, ProgramType, ProgramSourceQuality } from "@/context/program-context"

const parseCSVText = (csvText: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(current)
      current = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1
      row.push(current)
      current = ""
      if (row.some((v) => v.trim() !== "")) rows.push(row)
      row = []
      continue
    }

    current += char
  }

  // flush trailing value
  row.push(current)
  if (row.some((v) => v.trim() !== "")) rows.push(row)
  return rows
}

const splitList = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  const raw = String(value).trim()
  if (!raw) return []

  const hasPrimaryDelimiter = /[|;\n]/.test(raw)
  const baseSplit = raw
    .split(/[|;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (hasPrimaryDelimiter) return baseSplit

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const parseCourseCodesFromField = (value: string): string[] => {
  const tokens = splitList(value)
  const results: string[] = []
  const seen = new Set<string>()
  let lastDept = ""

  const pushCourse = (candidate: string) => {
    const normalized = normalizeCourseCode(candidate)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    results.push(normalized)
  }

  for (const token of tokens) {
    const cleaned = token
      .replace(/\u00A0/g, " ")
      .replace(/\uFFFD/g, " ")
      .replace(/[�]/g, " ")
      .trim()

    if (!cleaned) continue

    // Handles explicit forms and slash shorthand in the same token.
    // Examples: "REL 214", "REL214", "HIST 111/112", "Survey: AFST 210"
    const explicit = [...cleaned.toUpperCase().matchAll(/([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)(?:\s*\/\s*(\d{3,4}[A-Z]?))?/g)]
    if (explicit.length > 0) {
      for (const m of explicit) {
        const dept = m[1]
        const first = m[2]
        const second = m[3]
        pushCourse(`${dept} ${first}`)
        if (second) pushCourse(`${dept} ${second}`)
        lastDept = dept
      }
      continue
    }

    // Handles shorthand tokens after an explicit course, e.g. "REL 214, 223, 260"
    if (/^\d{3,4}[A-Z]?$/.test(cleaned.toUpperCase()) && lastDept) {
      pushCourse(`${lastDept} ${cleaned.toUpperCase()}`)
    }
  }

  return results
}

const normalizeCourseCode = (value: string): string => {
  if (!value || typeof value !== 'string') {
    return ""
  }
  
  // Remove any non-breaking spaces and normalize whitespace
  let cleaned = value.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim().toUpperCase()
  
  // Handle patterns like "CS 124", "CS124", "CS-124", "CS_124"
  const patterns = [
    /^([A-Z]{2,5})\s*[-_]?\s*(\d{3,4}[A-Z]?)$/,  // CS 124, CS-124, CS_124
    /^([A-Z]{2,5})(\d{3,4}[A-Z]?)$/,              // CS124
  ]
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match) {
      const dept = match[1]
      const num = match[2]
      // Validate department (2-5 letters) and number (3-4 digits)
      if (dept.length >= 2 && dept.length <= 5 && /^\d{3,4}[A-Z]?$/.test(num)) {
        return `${dept} ${num}`
      }
    }
  }
  
  // Not a course code
  return ""
}

const extractCourseCodesFromText = (value: string): string[] => {
  if (!value) return []

  const cleaned = value
    .replace(/\u00A0/g, " ")
    .replace(/\uFFFD/g, " ")
    .replace(/[�]/g, " ")
    .toUpperCase()

  const results: string[] = []
  const seen = new Set<string>()

  // Matches CS 124, CS-124, CS124, CS�124, etc.
  const re = /\b([A-Z]{2,5})[^A-Z0-9]{0,3}(\d{3,4}[A-Z]?)\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cleaned))) {
    const code = normalizeCourseCode(`${m[1]} ${m[2]}`)
    if (!code) continue
    if (!seen.has(code)) {
      seen.add(code)
      results.push(code)
    }
  }

  return results
}

const normalizeConfidence = (
  advisoryApproval: string,
  upToDate: string,
  hasCourses: boolean
): "high" | "medium" | "low" => {
  // If advisory approval required, mark as low confidence
  if (advisoryApproval?.toLowerCase() === "yes") {
    return "low"
  }
  
  // If outdated, mark as medium
  if (upToDate?.toLowerCase().includes("outdated")) {
    return "medium"
  }
  
  // If no courses extracted, mark as medium
  if (!hasCourses) {
    return "medium"
  }
  
  // Otherwise high confidence
  return "high"
}

const pickField = (row: Record<string, unknown>, keys: string[]): string => {
  const normalizedRow: Record<string, unknown> = {}
  Object.entries(row).forEach(([key, value]) => {
    normalizedRow[key.trim().toLowerCase()] = value
  })

  for (const key of keys) {
    const value = normalizedRow[key.toLowerCase()]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim()
    }
  }

  return ""
}

const parseProgramType = (value: string, fallbackName: string): ProgramType => {
  const v = (value || "").trim().toLowerCase()
  if (v === "minor") return "Minor"
  if (v === "certificate" || v === "certification") return "Certificate"

  const name = (fallbackName || "").toLowerCase()
  if (name.includes("certificate")) return "Certificate"
  if (name.includes("certification")) return "Certificate"
  if (name.includes("minor")) return "Minor"
  return "Other"
}

const parseElectivesRequired = (value: string): number | null => {
  const raw = (value || "").trim()
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const buildRequirementsText = (row: Record<string, unknown>): string => {
  const parts = [
    pickField(row, ["requirements_text", "requirements", "requirementstext"]),
    pickField(row, ["notes", "note"]),
    pickField(row, ["overlap_info"]),
    pickField(row, ["prerequisites"]),
    pickField(row, ["prerequisites_courses"]),
    pickField(row, ["description"]),
  ]
    .map((p) => (p || "").trim())
    .filter(Boolean)

  return parts.join(" | ")
}

const cleanExcludedMajors = (raw: string): string[] => {
  const bad = [
    /^total\s*hours/i,
    /^total\s*hours\s*only$/i,
    /^course\s*list$/i,
    /^only$/i,
    /^for$/i,
    /^none$/i,
    /^n\/a$/i,
    /^na$/i,
  ]
  return splitList(raw)
    .map((m) => m.replace(/\u00A0/g, " ").replace(/\uFFFD/g, " ").replace(/[�]/g, " ").trim())
    .filter(Boolean)
    .filter((m) => !bad.some((re) => re.test(m)))
}

export const parseRefinedCSV = (rows: Record<string, unknown>[]): Program[] => {
  const programs: Program[] = []
  const seenKeys = new Set<string>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const name = pickField(row, ["name", "program_name", "program", "program_title"])

    if (!name) {
      return // Skip rows without names
    }

    // Skip deleted programs
    const status = pickField(row, ["status"])
    if (status?.toLowerCase() === "deleted") {
      return
    }

    const programType = parseProgramType(pickField(row, ["program_type", "type"]), name)
    const dedupKey = `${name.trim().toLowerCase()}::${programType}`

    const requiredCourses = parseCourseCodesFromField(
      pickField(row, ["required_courses", "requiredcourses", "required", "required_course_list"])
    )

    const electivePoolFromCSV = parseCourseCodesFromField(
      pickField(row, ["elective_courses", "elective_pool", "electivepool", "electives"])
    )

    const electivesRequired = parseElectivesRequired(pickField(row, ["electives_required", "elective_required", "elective_count"]))

    const requirementsText = buildRequirementsText(row)
    const extractedCourses = extractCourseCodesFromText(requirementsText)

    // Use extracted courses only to fill gaps, do not override explicit structured fields.
    const requiredFromExtraction = requiredCourses.length === 0 ? extractedCourses.slice(0, Math.min(4, extractedCourses.length)) : []
    const electivePool = electivePoolFromCSV.length > 0 ? electivePoolFromCSV : extractedCourses
    const finalRequiredCourses = requiredCourses.length > 0 ? requiredCourses : requiredFromExtraction

    const sourceQuality: ProgramSourceQuality =
      finalRequiredCourses.length > 0 || electivePoolFromCSV.length > 0
        ? "structured"
        : extractedCourses.length > 0
          ? "extracted"
          : "text_only"

    // Calculate totalCoursesRequired from credit_hours or course counts
    const creditHours = pickField(row, ["credit_hours", "credit_hours_total"])
    let totalCoursesRequired = 0
    
    if (creditHours) {
      // Try to parse credit hours (e.g., "18", "18-21", "19-22")
      const match = creditHours.match(/(\d+)(?:-(\d+))?/)
      if (match) {
        const minHours = parseInt(match[1], 10)
        // Estimate: assume 3 credit hours per course on average
        // But be conservative - if we have course lists, use those instead
        if (finalRequiredCourses.length === 0 && electivePool.length === 0) {
          totalCoursesRequired = Math.max(1, Math.ceil(minHours / 3))
        }
      }
    }
    
    // If we have courses listed, calculate from those
    if (totalCoursesRequired === 0) {
      if (finalRequiredCourses.length > 0 || electivePool.length > 0) {
        if (electivesRequired !== null) {
          totalCoursesRequired = finalRequiredCourses.length + electivesRequired
        } else {
          // We don't know the pick-N; keep total conservative and let the UI label as approximate.
          const estimatedElectives = electivePool.length > 0 ? Math.min(2, electivePool.length) : 0
          totalCoursesRequired = Math.max(1, finalRequiredCourses.length + estimatedElectives)
        }
      } else {
        // No courses listed, use credit hours estimate or default
        totalCoursesRequired = creditHours ? Math.max(1, Math.ceil(parseInt(creditHours.match(/\d+/)?.[0] || "18", 10) / 3)) : 1
      }
    }
    
    // Ensure minimum of 1
    totalCoursesRequired = Math.max(1, totalCoursesRequired)

    const excludedMajors = cleanExcludedMajors(pickField(row, ["excluded_majors", "excludedmajors", "excluded", "excluded_major_list"]))

    const advisoryApproval = pickField(row, ["advisory_approval_required", "advisory_approval"])
    const upToDate = pickField(row, ["up_to_date", "up_to_date_status"])
    const hasCourses = finalRequiredCourses.length > 0 || electivePool.length > 0
    
    const confidence = normalizeConfidence(advisoryApproval, upToDate, hasCourses)

    const effectiveTerm = pickField(row, [
      "effective_term",
      "effectiveterm",
      "term",
      "effective_catalog_term",
    ])

    // Skip duplicates (same name + program type)
    if (seenKeys.has(dedupKey)) {
      return
    }
    seenKeys.add(dedupKey)

    programs.push({
      name: name.trim(),
      programType,
      requiredCourses: finalRequiredCourses,
      electivePool,
      electivesRequired,
      totalCoursesRequired,
      excludedMajors,
      advisoryApprovalRequired: advisoryApproval?.toLowerCase() === "yes",
      upToDate: upToDate || undefined,
      creditHours: creditHours || undefined,
      confidence,
      requirementsText: requirementsText || undefined,
      sourceQuality,
      detectedCourses: extractedCourses.length > 0 ? extractedCourses : undefined,
      note: pickField(row, ["notes", "note"]) || undefined,
      effectiveTerm: effectiveTerm || undefined,
    })
  })

  return programs
}

/** Convert raw CSV rows (from parseCSVText) to Record[] using first row as headers */
const csvRowsToRecords = (rows: string[][]): Record<string, unknown>[] => {
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((row) => {
    const record: Record<string, unknown> = {}
    headers.forEach((h, i) => {
      record[h] = row[i] ?? ""
    })
    return record
  })
}

/** Parse raw CSV text into programs (same path as `loadProgramsFromCSV` for CSV). Exported for tests and tooling. */
export const parseProgramsFromCSVString = (csvText: string): Program[] => {
  const rows = parseCSVText(csvText)
  if (rows.length < 2) return []
  const records = csvRowsToRecords(rows)
  if (records.length === 0) return []
  return parseRefinedCSV(records)
}

const FETCH_TIMEOUT_MS = 15_000

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id))
}

const XLSX_SOURCE_FILES = [
  "/Programs_Minors.xlsx",
  "/Programs_Minors_Certificates.xlsx",
  "/Programs_Minors_Certificates_Refined.xlsx",
]

/** Load programs from Excel first (canonical), then CSV fallback. */
export const loadProgramsFromCSV = async (): Promise<Program[]> => {
  try {
    const XLSX = await import("xlsx")

    // Canonical path first, then low-cost legacy fallbacks.
    for (const xlsxPath of XLSX_SOURCE_FILES) {
      const response = await fetchWithTimeout(xlsxPath)
      if (!response.ok) continue

      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
      if (rows && rows.length > 0) {
        const programs = parseRefinedCSV(rows)
        if (programs.length > 0) return programs
      }
    }
  } catch {
    // Fall through to CSV fallback (timeout, network error, or empty parse)
  }

  try {
    const csvResponse = await fetchWithTimeout("/programs.csv")
    if (csvResponse.ok) {
      const text = await csvResponse.text()
      const programs = parseProgramsFromCSVString(text)
      if (programs.length > 0) return programs
    }
  } catch (error) {
    console.error("Failed to load programs:", error)
  }

  return []
}
