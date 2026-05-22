import {
  type GenEdCategory,
  type GenEdParentCategory,
  GEN_ED_REQUIREMENTS,
  GEN_ED_PARENT_REQUIREMENTS,
  COURSE_GEN_ED_MAP,
} from "./mock-data"
import type { Program } from "@/context/program-context"

export interface GenEdProgress {
  category: GenEdCategory
  parentCategory: GenEdParentCategory
  name: string
  shortName: string
  hoursRequired: number
  hoursCompleted: number
  coursesCompleted: string[]
  percentComplete: number
  note?: string
}

export interface GenEdParentProgress {
  parentCategory: GenEdParentCategory
  name: string
  totalHoursRequired: number
  totalHoursCompleted: number
  percentComplete: number
  subcategories: GenEdProgress[]
  note: string
}

export interface CourseOverlap {
  course: string
  genEds: GenEdCategory[]
  genEdNames: string[]
  programs: string[]
  isDoubleDipping: boolean // Course counts for both Gen Ed AND a minor/cert
}

export interface GenEdAnalysis {
  progress: GenEdProgress[]
  parentProgress: GenEdParentProgress[]
  totalHoursRequired: number
  totalHoursCompleted: number
  overallPercentage: number
  overlaps: CourseOverlap[]
  recommendedCourses: RecommendedGenEdCourse[]
}

export interface RecommendedGenEdCourse {
  course: string
  genEds: GenEdCategory[]
  genEdNames: string[]
  programs: string[]
  reason: string
}

// Credit hours per course (standard at UIUC)
const HOURS_PER_COURSE = 3
const COMP1_HOURS = 4 // Composition I is typically 4 hours

export function calculateGenEdProgress(userCourses: string[]): GenEdProgress[] {
  return GEN_ED_REQUIREMENTS.map((req) => {
    const coursesCompleted = userCourses.filter((course) => {
      const genEds = COURSE_GEN_ED_MAP[course]
      return genEds && genEds.includes(req.id)
    })

    // Composition I is 4 hours, others are 3
    const hoursPerCourse = req.id === "COMP1" ? COMP1_HOURS : HOURS_PER_COURSE
    const hoursCompleted = Math.min(
      coursesCompleted.length * hoursPerCourse,
      req.hoursRequired
    )

    return {
      category: req.id,
      parentCategory: req.parentCategory,
      name: req.name,
      shortName: req.shortName,
      hoursRequired: req.hoursRequired,
      hoursCompleted,
      coursesCompleted,
      percentComplete: Math.round((hoursCompleted / req.hoursRequired) * 100),
      note: req.note,
    }
  })
}

export function calculateParentProgress(
  progress: GenEdProgress[]
): GenEdParentProgress[] {
  const parentCategories: GenEdParentCategory[] = [
    "COMP",
    "HUM",
    "NAT",
    "SBS",
    "CS",
    "QR",
  ]

  return parentCategories.map((parent) => {
    const subcategories = progress.filter((p) => p.parentCategory === parent)
    const parentReq = GEN_ED_PARENT_REQUIREMENTS[parent]

    // Calculate total hours completed for this parent category
    const totalHoursCompleted = subcategories.reduce(
      (sum, sub) => sum + sub.hoursCompleted,
      0
    )

    // Cap at the parent's total required hours
    const cappedHours = Math.min(totalHoursCompleted, parentReq.totalHours)

    return {
      parentCategory: parent,
      name: parentReq.name,
      totalHoursRequired: parentReq.totalHours,
      totalHoursCompleted: cappedHours,
      percentComplete: Math.round((cappedHours / parentReq.totalHours) * 100),
      subcategories,
      note: parentReq.note,
    }
  })
}

export function findCourseOverlaps(userCourses: string[], programs: Program[]): CourseOverlap[] {
  const overlaps: CourseOverlap[] = []

  for (const course of userCourses) {
    const genEds = COURSE_GEN_ED_MAP[course] || []

    // Get friendly names for the Gen Eds
    const genEdNames = genEds.map((ge) => {
      const req = GEN_ED_REQUIREMENTS.find((r) => r.id === ge)
      return req?.shortName || ge
    })

    // Find which programs this course contributes to
    const contributingPrograms: string[] = []
    for (const program of programs) {
      const required = program.requiredCourses ?? []
      const elective = program.electivePool ?? []
      if (required.includes(course) || elective.includes(course)) {
        contributingPrograms.push(program.name)
      }
    }

    if (genEds.length > 0 || contributingPrograms.length > 0) {
      overlaps.push({
        course,
        genEds,
        genEdNames,
        programs: contributingPrograms,
        isDoubleDipping: genEds.length > 0 && contributingPrograms.length > 0,
      })
    }
  }

  return overlaps
}

export function getRecommendedGenEdCourses(
  userCourses: string[],
  userMajors: string[],
  programs: Program[]
): RecommendedGenEdCourse[] {
  const progress = calculateGenEdProgress(userCourses)
  const incompleteCategories = progress.filter((p) => p.percentComplete < 100)

  const recommendations: RecommendedGenEdCourse[] = []
  const addedCourses = new Set<string>()

  // Find courses that fulfill incomplete Gen Eds AND contribute to minors
  for (const [course, genEds] of Object.entries(COURSE_GEN_ED_MAP)) {
    if (userCourses.includes(course) || addedCourses.has(course)) continue

    // Check if this course helps with incomplete Gen Eds
    const helpfulGenEds = genEds.filter((ge) =>
      incompleteCategories.some((ic) => ic.category === ge)
    )

    if (helpfulGenEds.length === 0) continue

    // Get friendly names
    const genEdNames = helpfulGenEds.map((ge) => {
      const req = GEN_ED_REQUIREMENTS.find((r) => r.id === ge)
      return req?.shortName || ge
    })

    // Find programs this course contributes to
    const contributingPrograms: string[] = []
    for (const program of programs) {
      const normalizedExcluded = (program.excludedMajors ?? []).map((m) => m.trim().toLowerCase())
      const normalizedMajors = userMajors.map((m) => m.trim().toLowerCase())
      if (normalizedExcluded.some((ex) => normalizedMajors.some((um) => ex === um || (ex.length >= 6 && um.length >= 6 && (ex.includes(um) || um.includes(ex)))))) continue

      const required = program.requiredCourses ?? []
      const elective = program.electivePool ?? []
      if (required.includes(course) || elective.includes(course)) {
        contributingPrograms.push(program.name)
      }
    }

    // Prioritize courses that double-dip
    if (contributingPrograms.length > 0) {
      recommendations.push({
        course,
        genEds: helpfulGenEds,
        genEdNames,
        programs: contributingPrograms,
        reason: `Fulfills ${genEdNames.join(", ")} AND counts toward ${contributingPrograms.slice(0, 2).join(", ")}${contributingPrograms.length > 2 ? ` +${contributingPrograms.length - 2} more` : ""}`,
      })
      addedCourses.add(course)
    }
  }

  // Sort by number of benefits (Gen Eds + programs)
  recommendations.sort(
    (a, b) =>
      b.genEds.length + b.programs.length - (a.genEds.length + a.programs.length)
  )

  // Also add some courses that just fulfill Gen Eds if we don't have enough double-dippers
  if (recommendations.length < 5) {
    for (const [course, genEds] of Object.entries(COURSE_GEN_ED_MAP)) {
      if (userCourses.includes(course) || addedCourses.has(course)) continue
      if (recommendations.length >= 8) break

      const helpfulGenEds = genEds.filter((ge) =>
        incompleteCategories.some((ic) => ic.category === ge)
      )

      if (helpfulGenEds.length > 0) {
        const genEdNames = helpfulGenEds.map((ge) => {
          const req = GEN_ED_REQUIREMENTS.find((r) => r.id === ge)
          return req?.shortName || ge
        })

        recommendations.push({
          course,
          genEds: helpfulGenEds,
          genEdNames,
          programs: [],
          reason: `Fulfills ${genEdNames.join(", ")} requirement`,
        })
        addedCourses.add(course)
      }
    }
  }

  return recommendations.slice(0, 8)
}

export function analyzeGenEds(
  userCourses: string[],
  userMajors: string[],
  programs: Program[]
): GenEdAnalysis {
  const progress = calculateGenEdProgress(userCourses)
  const parentProgress = calculateParentProgress(progress)
  const overlaps = findCourseOverlaps(userCourses, programs)
  const recommendedCourses = getRecommendedGenEdCourses(userCourses, userMajors, programs)

  // Use parent category totals for overall calculation
  const totalHoursRequired = Object.values(GEN_ED_PARENT_REQUIREMENTS).reduce(
    (sum, req) => sum + req.totalHours,
    0
  )
  const totalHoursCompleted = parentProgress.reduce(
    (sum, p) => sum + p.totalHoursCompleted,
    0
  )

  return {
    progress,
    parentProgress,
    totalHoursRequired,
    totalHoursCompleted,
    overallPercentage: Math.round(
      (totalHoursCompleted / totalHoursRequired) * 100
    ),
    overlaps,
    recommendedCourses,
  }
}
