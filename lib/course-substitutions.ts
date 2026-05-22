/**
 * Canonical course substitutions used by overlap matching.
 * Keys and values should be normalized as "DEPT NNN".
 */
export const COURSE_SUBSTITUTIONS: Record<string, string> = {
  "CS 125": "CS 124",
  "STAT 100": "STAT 107",
  "STAT 200": "STAT 107",
  "MATH 220": "MATH 221",
}

/**
 * One-way expansion map used during user-course matching.
 * If user has key course, matcher also counts the mapped value.
 */
export const COURSE_SUBSTITUTION_EXPANSION: Record<string, string> = {
  ...COURSE_SUBSTITUTIONS,
}
