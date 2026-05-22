import { describe, it, expect } from "vitest"
import { parseProgramsFromCSVString, parseRefinedCSV } from "@/lib/csv-loader"

describe("parseRefinedCSV", () => {
  it("skips rows without a name", () => {
    const programs = parseRefinedCSV([
      { name: "", program_type: "minor", required_courses: "CS 125" },
      { name: "Real Minor", program_type: "minor", required_courses: "CS 225" },
    ])
    expect(programs).toHaveLength(1)
    expect(programs[0].name).toBe("Real Minor")
  })

  it("skips deleted status rows", () => {
    const programs = parseRefinedCSV([
      { name: "Gone", status: "deleted", required_courses: "CS 125" },
      { name: "Active", program_type: "minor", required_courses: "CS 225" },
    ])
    expect(programs.map((p) => p.name)).toEqual(["Active"])
  })

  it("dedupes same name and program type", () => {
    const programs = parseRefinedCSV([
      { name: "Dup Minor", program_type: "minor", required_courses: "CS 125" },
      { name: "Dup Minor", program_type: "minor", required_courses: "CS 225" },
    ])
    expect(programs).toHaveLength(1)
  })

  it("keeps same name with different program types", () => {
    const programs = parseRefinedCSV([
      { name: "Thing", program_type: "minor", required_courses: "CS 125" },
      { name: "Thing", program_type: "certificate", required_courses: "CS 225" },
    ])
    expect(programs).toHaveLength(2)
    expect(new Set(programs.map((p) => p.programType))).toEqual(new Set(["Minor", "Certificate"]))
  })

  it("parses required_courses with slash and shorthand numbers", () => {
    const programs = parseRefinedCSV([
      {
        name: "History-ish",
        program_type: "minor",
        required_courses: "HIST 111/112, 114",
      },
    ])
    const req = programs[0].requiredCourses
    expect(req).toContain("HIST 111")
    expect(req).toContain("HIST 112")
    expect(req).toContain("HIST 114")
  })

  it("maps certificate and certification program_type", () => {
    const a = parseRefinedCSV([
      { name: "Cert A", program_type: "certificate", required_courses: "ECE 110" },
    ])
    expect(a[0].programType).toBe("Certificate")

    const b = parseRefinedCSV([
      { name: "Cert B", program_type: "certification", required_courses: "ECE 120" },
    ])
    expect(b[0].programType).toBe("Certificate")
  })

  it("infers Certificate from name when type missing", () => {
    const programs = parseRefinedCSV([
      { name: "Data Science Certificate", required_courses: "STAT 107" },
    ])
    expect(programs[0].programType).toBe("Certificate")
  })

  it("cleans junk tokens from excluded_majors", () => {
    const programs = parseRefinedCSV([
      {
        name: "Ex Minor",
        program_type: "minor",
        required_courses: "CS 125",
        excluded_majors: "Computer Science, N/A, total hours only",
      },
    ])
    expect(programs[0].excludedMajors).toContain("Computer Science")
    expect(programs[0].excludedMajors.some((m) => /n\/a|total hours/i.test(m))).toBe(false)
  })

  it("marks low confidence when advisory approval required", () => {
    const programs = parseRefinedCSV([
      {
        name: "Advisory Minor",
        program_type: "minor",
        required_courses: "CS 125",
        advisory_approval_required: "yes",
      },
    ])
    expect(programs[0].confidence).toBe("low")
  })
})

describe("parseProgramsFromCSVString", () => {
  it("handles CRLF line endings", () => {
    const csv = "name,program_type,required_courses\r\nTest Minor,minor,CS 125\r\n"
    const programs = parseProgramsFromCSVString(csv)
    expect(programs).toHaveLength(1)
    expect(programs[0].name).toBe("Test Minor")
    expect(programs[0].requiredCourses).toContain("CS 125")
  })

  it("handles quoted fields containing commas", () => {
    const csv =
      'name,program_type,required_courses\n"Advertising, B.S. Minor",minor,"ADV 150, ADV 175"\n'
    const programs = parseProgramsFromCSVString(csv)
    expect(programs).toHaveLength(1)
    expect(programs[0].name).toBe("Advertising, B.S. Minor")
    expect(programs[0].requiredCourses).toContain("ADV 150")
    expect(programs[0].requiredCourses).toContain("ADV 175")
  })

  it("returns empty array for header-only CSV", () => {
    expect(parseProgramsFromCSVString("name,program_type\n")).toEqual([])
  })

  it("escapes doubled quotes inside quoted field", () => {
    const csv = 'name,program_type,required_courses\n"A ""Quoted"" Minor",minor,CS 125\n'
    const programs = parseProgramsFromCSVString(csv)
    expect(programs).toHaveLength(1)
    expect(programs[0].name).toBe('A "Quoted" Minor')
  })
})
