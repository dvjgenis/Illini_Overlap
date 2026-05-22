import { describe, it, expect } from "vitest"
import { analyzeGenEds, calculateGenEdProgress } from "@/lib/gen-ed-engine"
import { GEN_ED_REQUIREMENTS } from "@/lib/mock-data"
import type { Program } from "@/context/program-context"

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    name: "Test Minor",
    programType: "Minor",
    requiredCourses: ["CS 125"],
    electivePool: [],
    electivesRequired: null,
    totalCoursesRequired: 1,
    excludedMajors: [],
    confidence: "high",
    sourceQuality: "structured",
    ...overrides,
  }
}

describe("analyzeGenEds", () => {
  it("returns analysis shaped for the UI with empty inputs", () => {
    const analysis = analyzeGenEds([], [], [])
    expect(analysis.progress).toHaveLength(GEN_ED_REQUIREMENTS.length)
    expect(analysis.parentProgress.length).toBeGreaterThan(0)
    expect(analysis.totalHoursRequired).toBeGreaterThan(0)
    expect(analysis.totalHoursCompleted).toBe(0)
    expect(analysis.overallPercentage).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(analysis.overlaps)).toBe(true)
    expect(Array.isArray(analysis.recommendedCourses)).toBe(true)
  })

  it("includes overlaps when a course maps to gen ed and a program", () => {
    const programs = [makeProgram({ requiredCourses: ["RHET 105"], electivePool: [] })]
    const analysis = analyzeGenEds(["RHET 105"], [], programs)
    const overlap = analysis.overlaps.find((o) => o.course === "RHET 105")
    expect(overlap).toBeDefined()
    expect(overlap?.isDoubleDipping).toBe(true)
  })
})

describe("calculateGenEdProgress", () => {
  it("returns one entry per gen ed requirement", () => {
    const progress = calculateGenEdProgress([])
    expect(progress).toHaveLength(GEN_ED_REQUIREMENTS.length)
  })
})
