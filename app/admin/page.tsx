"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react"
import { useProgramContext, type Program } from "@/context/program-context"
import * as XLSX from "xlsx"

const TEMPLATE_CSV = `program_type,name,required_courses,elective_courses,electives_required,credit_hours,excluded_majors,advisory_approval_required,up_to_date,effective_catalog_term,requirements_text,notes,status
Minor,"Computer Science Minor, UG","CS 124|CS 128|CS 173|CS 225","CS 233|CS 241|CS 374|CS 410|CS 421|CS 427",2,16,"Computer Science|Computer Engineering",No,"Up to date",120218,"Required: CS 124, CS 128, CS 173, CS 225. Plus 2 upper-level CS electives (300/400).","Verify exclusions and substitutions in catalog.",Approved
Minor,"Business Minor, UG","ACCY 200|BADM 310|BADM 320|FIN 221","BADM 350|BADM 395",2,18,"Business Administration",No,"Up to date",120241,"Required: ACCY 200, BADM 310, BADM 320, FIN 221. Plus 2 business electives.","At least 6 hours advanced (300/400).",Approved
`

type UploadStatus = {
  type: "success" | "error" | "info" | null
  message: string
  warnings?: string[]
}

const COURSE_DEPT_PATTERN = /^[A-Z]{2,5}$/
const COURSE_NUM_PATTERN = /^\d{3,4}[A-Z]?$/

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

const normalizeCourseCode = (value: string): string => {
  const compact = value.replace(/\s+/g, "").toUpperCase()
  const deptMatch = compact.match(/^([A-Z]{2,5})(\d{3,4}[A-Z]?)$/)
  if (!deptMatch) {
    return ""
  }

  const dept = deptMatch[1]
  const num = deptMatch[2]

  if (!COURSE_DEPT_PATTERN.test(dept) || !COURSE_NUM_PATTERN.test(num)) {
    return ""
  }

  return `${dept} ${num}`
}

const extractCourseCodesFromText = (value: string): string[] => {
  if (!value) return []
  const cleaned = value.replace(/\u00A0/g, " ").replace(/\uFFFD/g, " ").replace(/[�]/g, " ").toUpperCase()
  const re = /\b([A-Z]{2,5})[^A-Z0-9]{0,3}(\d{3,4}[A-Z]?)\b/g
  const out: string[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(cleaned))) {
    const code = normalizeCourseCode(`${m[1]} ${m[2]}`)
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
}

const normalizeConfidence = (value: string): "high" | "medium" | "low" => {
  const normalized = value.trim().toLowerCase()
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized
  }
  return "medium"
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

const parsePrograms = (rows: Record<string, unknown>[]) => {
  const programs: Program[] = []
  const warnings: string[] = []
  const seenNames = new Set<string>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const name = pickField(row, ["name", "program_name", "program", "program_title"])

    if (!name) {
      warnings.push(`Row ${rowNumber}: missing program name, skipped.`)
      return
    }

    // Skip deleted programs
    const status = pickField(row, ["status"])
    if (status?.toLowerCase() === "deleted") {
      return
    }

    const programTypeRaw = pickField(row, ["program_type", "type", "programtype"]).toLowerCase()
    const programType = programTypeRaw === "minor"
      ? ("Minor" as const)
      : programTypeRaw === "certificate" || programTypeRaw === "certification"
        ? ("Certificate" as const)
        : ("Other" as const)

    const requiredCoursesRaw = splitList(
      pickField(row, ["required_courses", "requiredcourses", "required", "required_course_list"])
    ).map(normalizeCourseCode).filter(Boolean)

    const electivePoolRaw = splitList(
      pickField(row, ["elective_courses", "elective_pool", "electivepool", "electives"])
    ).map(normalizeCourseCode).filter(Boolean)

    const requirementsText = pickField(row, ["requirements_text", "requirements", "requirementsText"])
    const fallbackText = [requirementsText, pickField(row, ["notes"]), pickField(row, ["prerequisites"]), pickField(row, ["description"])]
      .filter(Boolean)
      .join(" | ")
    const extractedCourses = extractCourseCodesFromText(fallbackText)

    const requiredCourses = requiredCoursesRaw.length > 0 ? requiredCoursesRaw : extractedCourses.slice(0, Math.min(4, extractedCourses.length))
    const electivePool = electivePoolRaw.length > 0 ? electivePoolRaw : extractedCourses

    const creditHours = pickField(row, ["credit_hours", "credit_hours_total"])

    const electivesRequiredRaw = pickField(row, ["electives_required", "elective_required", "elective_count"])
    const electivesRequiredParsed = Number.parseInt(electivesRequiredRaw, 10)
    const electivesRequired = Number.isFinite(electivesRequiredParsed) && electivesRequiredParsed >= 0 ? electivesRequiredParsed : null

    if (electivePool.length > 0 && electivesRequired === null) {
      warnings.push(
        `Row ${rowNumber}: elective_courses provided but electives_required is missing. Results may be approximate until you set electives_required.`
      )
    }

    const totalCoursesRequired =
      electivesRequired !== null ? Math.max(1, requiredCourses.length + electivesRequired) : Math.max(1, requiredCourses.length)

    const excludedMajors = splitList(
      pickField(row, ["excluded_majors", "excludedmajors", "excluded", "excluded_major_list"])
    ).filter((m) => {
      const t = m.trim().toLowerCase()
      return t !== "total hours only" && t !== "only" && t !== "for" && t !== "course list"
    })

    const advisoryApproval = pickField(row, ["advisory_approval_required", "advisory_approval"])
    const upToDate = pickField(row, ["up_to_date", "up_to_date_status"])
    const hasCourses = requiredCourses.length > 0 || electivePool.length > 0
    
    let confidence: "high" | "medium" | "low" = "medium"
    if (advisoryApproval?.toLowerCase() === "yes") confidence = "low"
    else if (upToDate?.toLowerCase().includes("outdated")) confidence = "medium"
    else if (!hasCourses) confidence = "medium"
    else confidence = "high"

    // Build comprehensive note from multiple fields
    const noteFields = [pickField(row, ["notes"]), pickField(row, ["note"]), pickField(row, ["overlap_info"]), pickField(row, ["prerequisites"]), pickField(row, ["description"])].filter(Boolean)
    const combinedNotes = noteFields.length > 0 ? noteFields.join(" | ") : ""
    const note = combinedNotes || undefined
    
    const effectiveTerm = pickField(row, [
      "effective_term",
      "effectiveterm",
      "term",
      "effective_catalog_term",
    ])

    if (seenNames.has(name.trim().toLowerCase())) {
      warnings.push(`Row ${rowNumber}: duplicate program name "${name}" overridden by later row.`)
    }
    seenNames.add(name.trim().toLowerCase())

    programs.push({
      name: name.trim(),
      programType,
      requiredCourses,
      electivePool,
      electivesRequired,
      totalCoursesRequired,
      excludedMajors,
      advisoryApprovalRequired: advisoryApproval?.toLowerCase() === "yes",
      upToDate: upToDate || undefined,
      creditHours: creditHours || undefined,
      confidence,
      requirementsText: requirementsText || undefined,
      sourceQuality: requiredCoursesRaw.length > 0 || electivePoolRaw.length > 0 ? "structured" : extractedCourses.length > 0 ? "extracted" : "text_only",
      detectedCourses: extractedCourses.length > 0 ? extractedCourses : undefined,
      note: note || undefined,
      effectiveTerm: effectiveTerm || undefined,
    })
  })

  return { programs, warnings }
}

export default function AdminProgramsPage() {
  const { programs, savePrograms, resetPrograms, hasCustomPrograms } = useProgramContext()
  const [status, setStatus] = useState<UploadStatus>({ type: null, message: "" })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "programs-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setStatus({ type: null, message: "" })

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error("No sheets found in the file.")
      }

      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })

      if (rows.length === 0) {
        throw new Error("No rows found. Ensure the first row contains headers.")
      }

      const { programs: parsedPrograms, warnings } = parsePrograms(rows)

      if (parsedPrograms.length === 0) {
        throw new Error("No valid programs found. Check required columns and try again.")
      }

      savePrograms(parsedPrograms)
      setStatus({
        type: "success",
        message: `Imported ${parsedPrograms.length} programs successfully.`,
        warnings: warnings.length > 0 ? warnings : undefined,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Upload failed. Please verify the file format and try again."
      setStatus({ type: "error", message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <Card className="border-2 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Program Data Admin
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file to update minors/certificates without touching code. Changes are saved in this
            browser. The app automatically loads from <code className="text-xs bg-muted px-1 py-0.5 rounded">public/Programs_Minors.xlsx</code> on startup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Current programs: {programs.length}</Badge>
            {hasCustomPrograms ? (
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Custom data active</Badge>
            ) : (
              <Badge variant="outline">Using defaults</Badge>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Required columns</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">program_type</Badge>
              <Badge variant="outline">name</Badge>
              <Badge variant="outline">required_courses</Badge>
              <Badge variant="outline">elective_courses</Badge>
              <Badge variant="outline">electives_required</Badge>
              <Badge variant="outline">requirements_text</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional columns: credit_hours, excluded_majors, advisory_approval_required, up_to_date, effective_catalog_term, notes, status
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template CSV
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={isProcessing}
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (window.confirm("Reset all custom programs and reload default data? This cannot be undone.")) {
                  resetPrograms()
                }
              }}
              disabled={!hasCustomPrograms}
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>

          {isProcessing && (
            <Alert>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <AlertDescription>Processing file...</AlertDescription>
              </div>
            </Alert>
          )}

          {status.type && (
            <Alert variant={status.type === "error" ? "destructive" : "default"}>
              {status.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : status.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : null}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          {status.warnings && status.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Warnings</p>
              <div className="bg-muted/40 border border-border rounded-md p-3 text-xs space-y-1">
                {status.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted/40 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Formatting tips</p>
            <p>Use |, ;, or new lines to separate course lists inside a cell.</p>
            <p>Example: &quot;CS 124|CS 128|CS 173|CS 225&quot;</p>
            <p>Course codes are normalized to uppercase with a space (e.g., CS 225).</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            CSV Upload Summary
          </CardTitle>
          <CardDescription>After upload, program matches update instantly for all users in this browser.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            If you need shared storage for multiple admins, we can connect this to a database (e.g., Postgres or Airtable)
            and secure the admin route with login.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
