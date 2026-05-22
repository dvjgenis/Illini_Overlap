import type { Program } from "@/context/program-context"
import { COURSE_SUBSTITUTION_EXPANSION } from "@/lib/course-substitutions"

// Majors by college for special exclusion rules (e.g., "All non-Gies College students")
const GIES_MAJORS = [
  "accountancy",
  "business administration",
  "finance",
  "management",
  "marketing",
  "supply chain management",
]
const MEDIA_MAJORS = ["advertising", "journalism", "media & cinema studies", "media"]
const CS_DS_MAJORS = ["computer science", "data science"]

export interface ProgramResult {
  name: string
  programType?: Program["programType"]
  completionPercentage: number
  coursesCompleted: number
  coursesRemaining: number
  matchedRequired: string[]
  matchedElectives: string[]
  missingRequired: string[]
  suggestedNextCourses: string[]
  totalCoursesRequired: number
  isExcluded?: boolean
  exclusionReason?: string
  confidence?: "high" | "medium" | "low"
  note?: string
  requirementsText?: string
  detectedCourses?: string[]
  effectiveTerm?: string
  electivesNeeded?: number
  resultQuality?: "exact" | "approximate" | "manual"
}

export function calculateProgramEligibility(
  userCourses: string[],
  programs: Program[],
  userMajors: string[] = [],
): ProgramResult[] {
  const expandedUserCourses = expandCoursesWithSubstitutions(userCourses)
  const normalizedUserCourses = expandedUserCourses.map((course) => course.trim().toUpperCase().replace(/\s+/g, " "))
  const normalizedUserMajors = userMajors.map((m) => m.trim().toLowerCase().replace(/\s+/g, " "))

  const majorConflicts = (program: Program): string[] => {
    const excluded = (program.excludedMajors || []).map((m) => m.trim().toLowerCase().replace(/\s+/g, " ")).filter(Boolean)
    if (excluded.length === 0 || normalizedUserMajors.length === 0) return []

    const conflicts: string[] = []
    for (let i = 0; i < userMajors.length; i++) {
      const rawMajor = userMajors[i]
      const major = normalizedUserMajors[i]
      let hit = false

      // Special exclusion: "All non-Gies College students" = only Gies majors can pursue
      if (excluded.some((ex) => ex.includes("all non-gies") || ex.includes("non-gies college"))) {
        const hasGiesMajor = normalizedUserMajors.some((m) => GIES_MAJORS.some((g) => m.includes(g) || g.includes(m)))
        if (!hasGiesMajor) {
          hit = true
        }
      }
      // Special exclusion: "All College of Media majors" = Media majors cannot pursue
      else if (excluded.some((ex) => ex.includes("all college of media") || ex.includes("all media"))) {
        hit = MEDIA_MAJORS.some((m) => major.includes(m) || m.includes(major))
      }
      // Special exclusion: "CS+DS Majors" = Computer Science / Data Science majors cannot pursue
      else if (excluded.some((ex) => ex.includes("cs+ds") || ex.includes("cs+ds majors"))) {
        hit = CS_DS_MAJORS.some((m) => major.includes(m) || m.includes(major))
      }
      // Standard exclusion matching
      else {
        hit = excluded.some((ex) => {
          if (ex === major) return true
          if (ex.length >= 6 && major.length >= 6 && (ex.includes(major) || major.includes(ex))) return true
          return false
        })
      }
      if (hit) conflicts.push(rawMajor)
    }
    return conflicts
  }

  const results: ProgramResult[] = programs.map((program) => {
    const requiredCourses = program.requiredCourses ?? []
    const electivePool = program.electivePool ?? []
    const totalCoursesRequiredRaw = program.totalCoursesRequired
    const totalCoursesRequiredSafe =
      typeof totalCoursesRequiredRaw === "number" && Number.isFinite(totalCoursesRequiredRaw)
        ? totalCoursesRequiredRaw
        : 1

    const conflictingMajors = majorConflicts(program)
    const excludedFromAnyMajor = conflictingMajors.length > 0

    if (excludedFromAnyMajor) {
      const majorsList =
        conflictingMajors.length === 1
          ? conflictingMajors[0]
          : conflictingMajors.slice(0, -1).join(", ") + " or " + conflictingMajors[conflictingMajors.length - 1]

      return {
        name: program.name,
        programType: program.programType,
        completionPercentage: 0,
        coursesCompleted: 0,
        coursesRemaining: totalCoursesRequiredSafe,
        matchedRequired: [],
        matchedElectives: [],
        missingRequired: requiredCourses,
        suggestedNextCourses: [],
        totalCoursesRequired: totalCoursesRequiredSafe,
        isExcluded: true,
        exclusionReason: `Not available for ${majorsList} majors`,
        confidence: program.confidence,
        note: program.note,
        requirementsText: program.requirementsText,
        detectedCourses: program.detectedCourses,
        effectiveTerm: program.effectiveTerm,
        electivesNeeded: 0,
        resultQuality: "exact",
      }
    }

    const normalizedRequired = requiredCourses.map((c) => c.trim().toUpperCase().replace(/\s+/g, " "))
    const normalizedElectives = electivePool.map((c) => c.trim().toUpperCase().replace(/\s+/g, " "))

    const isComputable = normalizedRequired.length > 0 || normalizedElectives.length > 0
    const resultQuality: "exact" | "approximate" | "manual" =
      !isComputable || program.sourceQuality === "text_only" ? "manual" : program.sourceQuality === "structured" ? "exact" : "approximate"

    // Find matched required courses
    const matchedRequired = normalizedRequired.filter((reqCourse) => normalizedUserCourses.includes(reqCourse))
    const requiredSet = new Set(normalizedRequired)

    // Find matched elective courses, excluding anything that is also a required course.
    // If a course appears in both lists, it should only satisfy required credit.
    const matchedElectivesAll = normalizedUserCourses.filter(
      (userCourse) => normalizedElectives.includes(userCourse) && !requiredSet.has(userCourse),
    )

    // Calculate missing
    const missingRequired = normalizedRequired.filter((reqCourse) => !normalizedUserCourses.includes(reqCourse))

    // Determine how many electives are actually required.
    // If electivesRequired is missing but we have an elective pool, we compute an approximate conservative estimate.
    let electivesRequiredEffective = program.electivesRequired
    let effectiveQuality = resultQuality

    if (effectiveQuality !== "manual" && electivesRequiredEffective === null && normalizedElectives.length > 0) {
      // Conservative default: assume 1-2 electives unless CSV provides explicit pick-N.
      let estimated = Math.min(2, normalizedElectives.length)

      const creditHours = program.creditHours || ""
      const match = creditHours.match(/(\d+)(?:-(\d+))?/)
      if (match) {
        const minHours = Number.parseInt(match[1], 10)
        if (Number.isFinite(minHours) && minHours > 0) {
          const estimatedTotalCourses = Math.max(1, Math.ceil(minHours / 3))
          const byHours = Math.max(0, estimatedTotalCourses - normalizedRequired.length)
          estimated = Math.max(estimated, Math.min(2, byHours, normalizedElectives.length))
        }
      }

      electivesRequiredEffective = estimated
      effectiveQuality = "approximate"
    }

    const electivesRequiredCount = electivesRequiredEffective ?? 0
    const matchedElectives = matchedElectivesAll.slice(0, electivesRequiredCount)

    const totalCoursesRequired =
      effectiveQuality === "manual"
        ? 0
        : Math.max(1, normalizedRequired.length + (normalizedElectives.length > 0 ? electivesRequiredCount : 0))

    const coursesCompleted = effectiveQuality === "manual" ? 0 : matchedRequired.length + matchedElectives.length
    const electivesRemaining = Math.max(0, electivesRequiredCount - matchedElectives.length)
    const coursesRemaining = effectiveQuality === "manual" ? 0 : missingRequired.length + electivesRemaining

    // Calculate how many more electives are needed
    const electivesNeeded = effectiveQuality === "manual" ? 0 : electivesRemaining

    const completionPercentage =
      effectiveQuality === "manual" || totalCoursesRequired <= 0 ? 0 : Math.round((coursesCompleted / totalCoursesRequired) * 100)

    const suggestedNextCourses: string[] = []

    // First, suggest missing required courses
    if (missingRequired.length > 0) {
      suggestedNextCourses.push(...missingRequired.slice(0, 2))
    }

    // Then suggest electives if needed
    if (suggestedNextCourses.length < 3 && electivesNeeded > 0) {
      const need = Math.min(3 - suggestedNextCourses.length, electivesNeeded)
      const availableElectives = normalizedElectives.filter((elective) => !normalizedUserCourses.includes(elective))
      suggestedNextCourses.push(...availableElectives.slice(0, need))
    }

    return {
      name: program.name,
      programType: program.programType,
      completionPercentage,
      coursesCompleted,
      coursesRemaining: Math.max(0, coursesRemaining),
      matchedRequired,
      matchedElectives,
      missingRequired,
      suggestedNextCourses: suggestedNextCourses.slice(0, 3),
      totalCoursesRequired,
      isExcluded: false,
      confidence: program.confidence,
      note: program.note,
      requirementsText: program.requirementsText,
      detectedCourses: program.detectedCourses,
      effectiveTerm: program.effectiveTerm,
      electivesNeeded,
      resultQuality: effectiveQuality,
    }
  })

  return results.sort((a, b) => {
    if (a.isExcluded && !b.isExcluded) return 1
    if (!a.isExcluded && b.isExcluded) return -1
    return b.completionPercentage - a.completionPercentage
  })
}

function expandCoursesWithSubstitutions(userCourses: string[]): string[] {
  const expanded = [...userCourses]

  userCourses.forEach((course) => {
    const normalized = course.trim().toUpperCase().replace(/\s+/g, " ")
    if (COURSE_SUBSTITUTION_EXPANSION[normalized]) {
      const substitute = COURSE_SUBSTITUTION_EXPANSION[normalized]
      if (!expanded.includes(substitute)) {
        expanded.push(substitute)
      }
    }
  })

  return expanded
}
