import { describe, it, expect } from "vitest"
import { calculateProgramEligibility } from "@/lib/calculation-engine"
import type { Program } from "@/context/program-context"

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    name: "Test Minor",
    programType: "Minor",
    requiredCourses: [],
    electivePool: [],
    electivesRequired: null,
    totalCoursesRequired: 0,
    excludedMajors: [],
    confidence: "high",
    sourceQuality: "structured",
    ...overrides,
  }
}

describe("calculateProgramEligibility", () => {
  it("returns 100% completion when all required and elective courses are matched", () => {
    const program = makeProgram({
      name: "Chemistry Minor",
      requiredCourses: ["CHEM 102", "CHEM 232"],
      electivePool: ["CHEM 312", "CHEM 360"],
      electivesRequired: 1,
      totalCoursesRequired: 3,
    })
    const userCourses = ["CHEM 102", "CHEM 232", "CHEM 312"]
    const results = calculateProgramEligibility(userCourses, [program], [])
    const result = results[0]
    expect(result.completionPercentage).toBe(100)
    expect(result.matchedRequired).toContain("CHEM 102")
    expect(result.matchedRequired).toContain("CHEM 232")
    expect(result.matchedElectives).toContain("CHEM 312")
    expect(result.coursesRemaining).toBe(0)
  })

  it("excludes programs when user major is in excluded list", () => {
    const program = makeProgram({
      name: "Advertising Minor",
      requiredCourses: ["ADV 150"],
      electivePool: ["ADV 175"],
      electivesRequired: 1,
      totalCoursesRequired: 2,
      excludedMajors: ["Advertising"],
    })
    const results = calculateProgramEligibility(["ADV 150", "ADV 175"], [program], ["Advertising"])
    const result = results[0]
    expect(result.isExcluded).toBe(true)
    expect(result.exclusionReason).toContain("Advertising")
    expect(result.completionPercentage).toBe(0)
  })

  it("normalizes course codes (handles spacing variations)", () => {
    const program = makeProgram({
      name: "CS Minor",
      requiredCourses: ["CS 124", "CS 225"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 2,
    })
    const results = calculateProgramEligibility(["cs 124", "CS  225"], [program], [])
    const result = results[0]
    expect(result.matchedRequired).toHaveLength(2)
    expect(result.completionPercentage).toBe(100)
  })

  it("sorts results: non-excluded first, then by completion % descending", () => {
    const programA = makeProgram({
      name: "Low Completion",
      requiredCourses: ["A 101", "A 102"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 2,
    })
    const programB = makeProgram({
      name: "High Completion",
      requiredCourses: ["B 101"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 1,
    })
    const excluded = makeProgram({
      name: "Excluded",
      requiredCourses: ["C 101"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 1,
      excludedMajors: ["Test Major"],
    })
    const results = calculateProgramEligibility(
      ["B 101", "A 101"],
      [programA, programB, excluded],
      ["Test Major"],
    )
    expect(results[0].name).toBe("High Completion")
    expect(results[1].name).toBe("Low Completion")
    expect(results[2].name).toBe("Excluded")
  })

  it("excludes non-Gies students when program requires Gies College majors only (non-Gies rule)", () => {
    const program = makeProgram({
      name: "Gies-Only Program",
      requiredCourses: ["BADM 100"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 1,
      excludedMajors: ["All non-Gies College students are excluded"],
    })
    const results = calculateProgramEligibility(["BADM 100"], [program], ["Computer Science"])
    expect(results[0].isExcluded).toBe(true)
    expect(results[0].exclusionReason).toBeDefined()
  })

  it("excludes College of Media majors when program blocks all media majors", () => {
    const program = makeProgram({
      name: "Not for Media",
      requiredCourses: ["JOUR 200"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 1,
      excludedMajors: ["All College of Media majors"],
    })
    const results = calculateProgramEligibility(["JOUR 200"], [program], ["Journalism"])
    expect(results[0].isExcluded).toBe(true)
  })

  it("excludes CS/DS majors when program blocks CS+DS cohort", () => {
    const program = makeProgram({
      name: "Not for CS+DS",
      requiredCourses: ["ART 100"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 1,
      excludedMajors: ["Enrolled in CS+DS Majors may not add this"],
    })
    const results = calculateProgramEligibility(["ART 100"], [program], ["Computer Science"])
    expect(results[0].isExcluded).toBe(true)
  })

  it("treats CS 125 as satisfying CS 124 when substitution applies", () => {
    const program = makeProgram({
      name: "CS track",
      requiredCourses: ["CS 124", "CS 128"],
      electivePool: [],
      electivesRequired: 0,
      totalCoursesRequired: 2,
    })
    const results = calculateProgramEligibility(["CS 125", "CS 128"], [program], [])
    const r = results[0]
    expect(r.matchedRequired).toEqual(expect.arrayContaining(["CS 124", "CS 128"]))
    expect(r.completionPercentage).toBe(100)
  })
})
