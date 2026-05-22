"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Upload, Trash2, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useProgramContext } from "@/context/program-context"
import { extractCourseCodesFromAuditText, extractPdfCourseCodes } from "@/lib/advising-report-parser"
import { cn } from "@/lib/utils"

const ALLOWED_UPLOAD_TYPES = {
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
} as const

const ALLOWED_UPLOAD_EXTENSIONS = Object.keys(ALLOWED_UPLOAD_TYPES) as Array<keyof typeof ALLOWED_UPLOAD_TYPES>
const ACCEPTED_UPLOAD_TYPES =
  ".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export function CourseInput() {
  const { userCourses, setUserCourses, courseCatalog } = useProgramContext()
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredCourses, setFilteredCourses] = useState<typeof courseCatalog>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [addedFlash, setAddedFlash] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLabel, setProcessingLabel] = useState("Parsing file...")
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const normalizeCourseInput = (input: string): string => {
    return input.replace(/\s+/g, "").toUpperCase()
  }

  const runFilter = useCallback((value: string, courses: string[], catalog: typeof courseCatalog) => {
    if (value.trim().length > 0) {
      const normalized = normalizeCourseInput(value)
      const searchTerm = value.toUpperCase().trim()

      const filtered = catalog.filter((course) => {
        const normalizedCode = normalizeCourseInput(course.code)
        return (
          (normalizedCode.includes(normalized) ||
            course.code.toUpperCase().includes(searchTerm) ||
            course.title.toUpperCase().includes(searchTerm)) &&
          !courses.includes(course.code)
        )
      }).slice(0, 8)

      setFilteredCourses(filtered)
      setSelectedIndex(0)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runFilter(inputValue, userCourses, courseCatalog), 120)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputValue, userCourses, courseCatalog, runFilter])
  
  // Update filtered courses when catalog changes (only if no input)
  useEffect(() => {
    if (inputValue.trim().length === 0 && courseCatalog.length > 0) {
      setFilteredCourses([])
    }
  }, [courseCatalog, inputValue])

  const handleSelectCourse = (courseCode: string) => {
    setUserCourses((prev) => {
      if (prev.includes(courseCode)) return prev
      setAddedFlash(courseCode)
      setTimeout(() => setAddedFlash(null), 1500)
      return [...prev, courseCode]
    })
    setInputValue("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleRemoveCourse = (courseToRemove: string) => {
    setUserCourses((prev) => prev.filter((course) => course !== courseToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < filteredCourses.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredCourses.length > 0 && selectedIndex < filteredCourses.length) {
          handleSelectCourse(filteredCourses[selectedIndex].code)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /** Extract course codes from text - catalog-filtered for manual paste */
  const extractCourseCodes = (text: string): string[] => {
    const raw = extractCourseCodesFromAuditText(text)
    const validCourseCodes = new Set(courseCatalog.map((c) => c.code))
    return [...new Set(raw.filter((code) => validCourseCodes.has(code)))]
  }

  const parsePDF = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist")

      if (typeof window !== "undefined") {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
      }

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ""

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()

        // Sort items by position for correct reading order (top-to-bottom, left-to-right)
        const items = textContent.items as Array<{ str?: string; transform?: number[] }>
        const sorted = [...items].sort((a, b) => {
          const yA = a.transform?.[5] ?? 0
          const yB = b.transform?.[5] ?? 0
          const xA = a.transform?.[4] ?? 0
          const xB = b.transform?.[4] ?? 0
          if (Math.abs(yA - yB) > 3) return yB - yA // Descending Y (top first)
          return xA - xB // Ascending X (left first)
        })

        const pageText = sorted
          .map((item) => (typeof item === "string" ? item : item.str || ""))
          .join(" ")
        fullText += pageText + "\n"
      }

      return fullText
    } catch (error) {
      console.error("PDF parsing error:", error)
      throw new Error("Failed to parse PDF. The file may be corrupted or password-protected.")
    }
  }

  const parseDOCX = async (file: File): Promise<string> => {
    try {
      const mammoth = await import("mammoth")
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value || ""
    } catch (error) {
      console.error("DOCX parsing error:", error)
      throw new Error("Failed to parse DOCX. Please export the file again and retry.")
    }
  }

  const parseXLSX = async (file: File): Promise<string> => {
    try {
      const XLSX = await import("xlsx")
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      return workbook.SheetNames.map((sheetName) => XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])).join("\n")
    } catch (error) {
      console.error("XLSX parsing error:", error)
      throw new Error("Failed to parse XLSX. Please verify the spreadsheet format.")
    }
  }

  const getFileExtension = (fileName: string): string => {
    const lower = fileName.toLowerCase().trim()
    if (lower.endsWith(".pdf")) return ".pdf"
    if (lower.endsWith(".docx")) return ".docx"
    if (lower.endsWith(".xlsx")) return ".xlsx"
    return ""
  }

  const isSupportedUploadFile = (file: File): boolean => {
    const ext = getFileExtension(file.name) as keyof typeof ALLOWED_UPLOAD_TYPES
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) return false

    // Some browsers provide empty/unknown MIME for drag-dropped files; extension check already passed.
    if (!file.type) return true
    return ALLOWED_UPLOAD_TYPES[ext].includes(file.type)
  }

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setUploadStatus({ type: null, message: "" })

    try {
      const ext = getFileExtension(file.name)
      if (!isSupportedUploadFile(file)) {
        throw new Error("Unsupported file type. Please upload one of: .pdf, .docx, .xlsx.")
      }

      const modeLabel = ext === ".pdf" ? "Parsing PDF..." : ext === ".docx" ? "Parsing DOCX..." : "Parsing XLSX..."
      setProcessingLabel(modeLabel)
      const allText = ext === ".pdf" ? await parsePDF(file) : ext === ".docx" ? await parseDOCX(file) : await parseXLSX(file)

      if (!allText || allText.trim().length === 0) {
        setUploadStatus({
          type: "error",
          message: "The PDF appears to be empty or unreadable. Try a different export or ensure the file isn't password-protected.",
        })
        return
      }

      let foundCourses: string[] = []
      let pdfExtraction: ReturnType<typeof extractPdfCourseCodes> | null = null
      if (ext === ".pdf") {
        pdfExtraction = extractPdfCourseCodes(allText)
        foundCourses = pdfExtraction.codes
      } else {
        foundCourses = extractCourseCodesFromAuditText(allText)
      }

      if (foundCourses.length === 0) {
        setUploadStatus({
          type: "error",
          message:
            ext === ".pdf"
              ? "No valid UIUC course codes found. For Academic Advising Report PDFs, ensure the export includes the \"Courses counting toward total hours\" section."
              : "No valid UIUC course codes found in the supported file.",
        })
        return
      }

      const newCourses = foundCourses.filter((course) => !userCourses.includes(course))
      const newCoursesCount = newCourses.length
      setUserCourses((prev) => [...new Set([...prev, ...foundCourses])])

      let successMessage = `Success! Found ${foundCourses.length} course${foundCourses.length !== 1 ? "s" : ""}, added ${newCoursesCount} new course${newCoursesCount !== 1 ? "s" : ""}.`
      if (ext === ".pdf" && pdfExtraction?.fallbackReason === "not_academic_advising_report") {
        successMessage +=
          " Note: This file was not recognized as a UIUC Academic Advising Report — results are best-effort and may be incomplete."
      } else if (ext === ".pdf" && pdfExtraction?.fallbackReason === "missing_courses_counting_section") {
        successMessage +=
          " Note: The \"Courses counting toward total hours\" block was missing — we used term-marked completed lines from the full report; verify your list."
      }

      setUploadStatus({
        type: "success",
        message: successMessage,
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "We couldn't read that file. Please upload a supported file type."
      setUploadStatus({
        type: "error",
        message: errorMessage,
      })
      console.error("File parsing error:", error)
    } finally {
      setIsProcessing(false)
      setProcessingLabel("Parsing file...")
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (!isSupportedUploadFile(file)) {
        setUploadStatus({ type: "error", message: "Unsupported file type. Please upload .pdf, .docx, or .xlsx." })
        return
      }
      handleFileUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleClearAll = () => {
    setUserCourses([])
    setUploadStatus({ type: null, message: "" })
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Search</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="course-input" className="block text-sm font-medium">
              Search & Add Courses
            </label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="course-input"
                placeholder="Type course code or name (e.g., cs225, CS 225, Data Structures)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData("text")
                  const extracted = extractCourseCodes(pastedText)
                  if (extracted.length > 0) {
                    e.preventDefault()
                    const newCourses = extracted.filter((c) => !userCourses.includes(c))
                    if (newCourses.length > 0) {
                      setUserCourses((prev) => [...new Set([...prev, ...newCourses])])
                      setAddedFlash(newCourses.length === 1 ? newCourses[0] : `${newCourses.length} courses`)
                      setTimeout(() => setAddedFlash(null), 2000)
                    }
                    setInputValue("")
                    setShowSuggestions(false)
                  }
                }}
                onFocus={() => inputValue.length > 0 && setShowSuggestions(filteredCourses.length > 0)}
                className="w-full"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="course-suggestions"
                aria-activedescendant={showSuggestions ? `course-option-${selectedIndex}` : undefined}
                autoComplete="off"
              />

              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  id="course-suggestions"
                  role="listbox"
                  aria-label="Course suggestions"
                  className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-64 overflow-y-auto"
                >
                  {filteredCourses.map((course, index) => (
                    <button
                      key={course.code}
                      id={`course-option-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      onClick={() => handleSelectCourse(course.code)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer border-b border-border last:border-b-0 touch-manipulation min-h-[44px]",
                        index === selectedIndex && "bg-accent text-accent-foreground",
                      )}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-sm">{course.code}</span>
                        <span className="text-xs text-muted-foreground">—</span>
                        <span className="text-xs text-muted-foreground flex-1">{course.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Click a suggestion, press Enter, or paste multiple course codes (e.g., &quot;CS 225, MATH 241, ECE 220&quot;)
            </p>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Upload Transcript / Audit File</label>
            <p className="text-xs text-muted-foreground">
              Accepted types: PDF, DOCX, XLSX.
            </p>

            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent hover:bg-accent/5",
                isProcessing && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_UPLOAD_TYPES}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />

              <div className="flex flex-col items-center gap-3">
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
                    <p className="text-sm font-medium">{processingLabel}</p>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-secondary">
                      {isDragging ? (
                        <FileText className="h-8 w-8 text-accent" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">
                        {isDragging ? "Drop your file here" : "Drag & drop your PDF, DOCX, or XLSX"}
                      </p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {uploadStatus.type && (
              <Alert variant={uploadStatus.type === "error" ? "destructive" : "default"}>
                {uploadStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{uploadStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="bg-secondary/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-background shrink-0">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold">Accepted formats</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload a transcript or audit file in PDF, DOCX, or XLSX. For{" "}
                    <span className="font-medium text-foreground">UIUC Academic Advising Report</span> PDFs, we only
                    extract courses listed under{" "}
                    <span className="font-medium text-foreground">Courses counting toward total hours</span> (completed),
                    not in-progress rows. Other PDFs are parsed in best-effort mode with an on-screen note.
                  </p>
                  <div className="bg-background rounded-md p-3 font-mono text-xs space-y-1 border border-border">
                    <div className="text-muted-foreground">Example: FA22 RHET 105 2 4.0 PS</div>
                    <div className="text-muted-foreground">Example: SP23 CS 124 AL1 3.0 B-</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Use export/download output directly from your source system when possible.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {addedFlash && (
        <div className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <CheckCircle className="h-3.5 w-3.5" />
          Added {addedFlash}
        </div>
      )}

      {userCourses.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Your Courses ({userCourses.length})</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 sm:h-8 text-xs text-muted-foreground hover:text-destructive touch-manipulation min-h-[36px]"
              aria-label="Clear all courses"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {userCourses.map((course) => (
              <Badge key={course} variant="secondary" className="pl-3 pr-1 py-1.5 bg-secondary/80 text-foreground border border-border/50 font-semibold">
                <span className="text-foreground">{course}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1.5 hover:bg-transparent hover:text-destructive touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
                  onClick={() => handleRemoveCourse(course)}
                  aria-label={`Remove ${course}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
