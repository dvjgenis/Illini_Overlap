"use client"

import { createContext, useContext, useState, type ReactNode, useEffect, useMemo, type Dispatch, type SetStateAction } from "react"
import { MOCK_PROGRAMS, MOCK_COURSE_CATALOG, type Course } from "@/lib/mock-data"
import { loadProgramsFromCSV } from "@/lib/csv-loader"

export type ProgramType = "Minor" | "Certificate" | "Certification" | "Other"
export type ProgramSourceQuality = "structured" | "extracted" | "text_only"

export interface Program {
  name: string
  programType: ProgramType
  requiredCourses: string[]
  electivePool: string[]
  electivesRequired: number | null
  totalCoursesRequired: number
  excludedMajors: string[]
  advisoryApprovalRequired?: boolean
  upToDate?: string
  creditHours?: string
  confidence: "high" | "medium" | "low"
  requirementsText?: string
  sourceQuality: ProgramSourceQuality
  detectedCourses?: string[]
  note?: string
  effectiveTerm?: string
}

interface ProgramContextType {
  programs: Program[]
  setPrograms: (programs: Program[]) => void
  savePrograms: (programs: Program[]) => void
  resetPrograms: () => void
  hasCustomPrograms: boolean
  isLoadingCSV: boolean
  csvLoadError: string | null
  userCourses: string[]
  setUserCourses: Dispatch<SetStateAction<string[]>>
  userMajors: string[]
  setUserMajors: Dispatch<SetStateAction<string[]>>
  courseCatalog: Course[]
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined)

const normalizeProgramType = (type: ProgramType): ProgramType => {
  if (type === "Certification") return "Certificate"
  return type
}

// Build course catalog from programs - extracts all unique courses from requiredCourses and electivePool
const buildCourseCatalogFromPrograms = (programs: Program[], existingCatalog: Course[]): Course[] => {
  const courseSet = new Set<string>()
  const courseMap = new Map<string, Course>()
  
  // First, add all courses from existing catalog to preserve titles
  existingCatalog.forEach(course => {
    courseSet.add(course.code)
    courseMap.set(course.code, course)
  })
  
  // Extract all courses from programs (localStorage / imports may omit arrays)
  programs.forEach(program => {
    const required = program.requiredCourses ?? []
    const elective = program.electivePool ?? []
    ;[...required, ...elective].forEach((courseCode) => {
      if (courseCode && !courseSet.has(courseCode)) {
        courseSet.add(courseCode)
        // Use existing title if available, otherwise use code as title
        const existingCourse = courseMap.get(courseCode)
        courseMap.set(courseCode, {
          code: courseCode,
          title: existingCourse?.title || courseCode
        })
      }
    })
  })
  
  // Convert map to sorted array
  return Array.from(courseMap.values()).sort((a, b) => {
    // Sort by department first, then by course number
    const partsA = a.code.split(' ')
    const partsB = b.code.split(' ')
    if (partsA.length < 2 || partsB.length < 2) {
      // Fallback for malformed course codes
      return a.code.localeCompare(b.code)
    }
    const [deptA, numA] = partsA
    const [deptB, numB] = partsB
    if (deptA !== deptB) {
      return deptA.localeCompare(deptB)
    }
    // Compare numbers numerically if possible, otherwise lexicographically
    const numAInt = parseInt(numA, 10)
    const numBInt = parseInt(numB, 10)
    if (!isNaN(numAInt) && !isNaN(numBInt)) {
      return numAInt - numBInt
    }
    return numA.localeCompare(numB)
  })
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>(MOCK_PROGRAMS)
  const [userCourses, setUserCourses] = useState<string[]>([])
  const [userMajors, setUserMajors] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasCustomPrograms, setHasCustomPrograms] = useState(false)
  const [isLoadingCSV, setIsLoadingCSV] = useState(false)
  const [csvLoadError, setCsvLoadError] = useState<string | null>(null)
  
  // Build course catalog dynamically from programs
  const courseCatalog = useMemo(() => {
    return buildCourseCatalogFromPrograms(programs, MOCK_COURSE_CATALOG)
  }, [programs])

  const parseStoredStringArray = (raw: string | null, label: string): string[] | null => {
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return null
      return parsed.filter((item): item is string => typeof item === "string")
    } catch (e) {
      console.error(`Failed to parse saved ${label}:`, e)
      return null
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      // Load user data from localStorage (check both new and old keys for backward compatibility)
      const savedCourses = localStorage.getItem("illini-overlap-courses") || localStorage.getItem("uiuc-prereq-courses")
      const savedMajors = localStorage.getItem("illini-overlap-majors") || localStorage.getItem("uiuc-prereq-majors")
      const savedPrograms = localStorage.getItem("illini-overlap-programs") || localStorage.getItem("uiuc-prereq-programs")

      const parsedCourses = parseStoredStringArray(savedCourses, "courses")
      if (parsedCourses) setUserCourses(parsedCourses)
      const parsedMajors = parseStoredStringArray(savedMajors, "majors")
      if (parsedMajors) setUserMajors(parsedMajors)
      // Mark hydrated as soon as user-local state is loaded so early clicks are not later clobbered.
      setIsHydrated(true)

      // Load programs: prioritize saved programs, then CSV, then mock data
      let programsLoaded = false
      if (savedPrograms) {
        try {
          const parsed = JSON.parse(savedPrograms)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalizedPrograms = parsed.map((program) => ({
              ...program,
              programType: normalizeProgramType((program.programType as ProgramType) || "Other"),
            }))
            setPrograms(normalizedPrograms)
            setHasCustomPrograms(true)
            programsLoaded = true
          } else {
            console.warn("Saved programs is empty, loading from CSV")
          }
        } catch (e) {
          console.error("Failed to parse saved programs:", e)
          // Fall through to load CSV
        }
      }

      // If no saved programs or parsing failed, try loading from CSV
      if (!programsLoaded) {
        setIsLoadingCSV(true)
        try {
          const csvPrograms = await loadProgramsFromCSV()
          if (csvPrograms.length > 0) {
            setPrograms(csvPrograms)
            setCsvLoadError(null)
          } else {
            console.warn("⚠️ No programs found in CSV, using mock data")
            setPrograms(MOCK_PROGRAMS)
            setCsvLoadError("No programs found in CSV file")
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Unknown error"
          console.error("❌ Failed to load programs from CSV:", errorMessage)
          setCsvLoadError(`Failed to load CSV: ${errorMessage}`)
          setPrograms(MOCK_PROGRAMS)
        } finally {
          setIsLoadingCSV(false)
        }
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("illini-overlap-courses", JSON.stringify(userCourses))
      // Remove old key for migration
      localStorage.removeItem("uiuc-prereq-courses")
    }
  }, [userCourses, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("illini-overlap-majors", JSON.stringify(userMajors))
      // Remove old key for migration
      localStorage.removeItem("uiuc-prereq-majors")
    }
  }, [userMajors, isHydrated])

  useEffect(() => {
    if (isHydrated && hasCustomPrograms) {
      localStorage.setItem("illini-overlap-programs", JSON.stringify(programs))
      // Remove old key for migration
      localStorage.removeItem("uiuc-prereq-programs")
    }
  }, [programs, isHydrated, hasCustomPrograms])

  const savePrograms = (nextPrograms: Program[]) => {
    setPrograms(nextPrograms)
    setHasCustomPrograms(true)
    if (isHydrated) {
      localStorage.setItem("illini-overlap-programs", JSON.stringify(nextPrograms))
      // Remove old key for migration
      localStorage.removeItem("uiuc-prereq-programs")
    }
  }

  const resetPrograms = async () => {
    setHasCustomPrograms(false)
    if (isHydrated) {
      localStorage.removeItem("illini-overlap-programs")
      localStorage.removeItem("uiuc-prereq-programs")
    }
    setIsLoadingCSV(true)
    try {
      const csvPrograms = await loadProgramsFromCSV()
      if (csvPrograms.length > 0) {
        setPrograms(csvPrograms)
        return
      }
    } catch {
      // fall through to mock data
    } finally {
      setIsLoadingCSV(false)
    }
    setPrograms(MOCK_PROGRAMS)
  }

  return (
    <ProgramContext.Provider
      value={{
        programs,
        setPrograms,
        savePrograms,
        resetPrograms,
        hasCustomPrograms,
        isLoadingCSV,
        csvLoadError,
        userCourses,
        setUserCourses,
        userMajors,
        setUserMajors,
        courseCatalog,
      }}
    >
      {children}
    </ProgramContext.Provider>
  )
}

export function useProgramContext() {
  const context = useContext(ProgramContext)
  if (context === undefined) {
    throw new Error("useProgramContext must be used within a ProgramProvider")
  }
  return context
}
