"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, TrendingUp, AlertCircle, Lightbulb, ChevronDown, XCircle, Info, Flag } from "lucide-react"
import type { ProgramResult } from "@/lib/calculation-engine"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

interface ResultsDisplayProps {
  results: ProgramResult[]
}

function getGradientColor(percentage: number) {
  if (percentage >= 80) {
    return {
      cardBg: "bg-gradient-to-br from-accent/20 via-accent/10 to-background",
      border: "border-accent/60",
      textAccent: "text-accent",
      progressBg: "bg-accent",
      badge: "bg-accent text-foreground",
    }
  } else if (percentage >= 60) {
    return {
      cardBg: "bg-gradient-to-br from-accent/15 via-accent/8 to-background",
      border: "border-accent/50",
      textAccent: "text-accent/95",
      progressBg: "bg-accent/90",
      badge: "bg-accent/90 text-foreground",
    }
  } else if (percentage >= 40) {
    return {
      cardBg: "bg-gradient-to-br from-accent/10 via-accent/5 to-background",
      border: "border-accent/40",
      textAccent: "text-accent/80",
      progressBg: "bg-accent/75",
      badge: "bg-accent/75 text-foreground",
    }
  } else if (percentage >= 20) {
    return {
      cardBg: "bg-gradient-to-br from-accent/6 via-accent/3 to-background",
      border: "border-accent/30",
      textAccent: "text-accent/60",
      progressBg: "bg-accent/60",
      badge: "bg-accent/60 text-foreground",
    }
  } else {
    return {
      cardBg: "bg-gradient-to-br from-muted/40 via-muted/20 to-background",
      border: "border-muted-foreground/25",
      textAccent: "text-muted-foreground",
      progressBg: "bg-muted-foreground/50",
      badge: "bg-muted text-foreground",
    }
  }
}

function getConfidenceBadge(confidence?: "high" | "medium" | "low") {
  if (!confidence) return null

  switch (confidence) {
    case "high":
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400 bg-green-500/10 font-medium shadow-sm">
          High Confidence
        </Badge>
      )
    case "medium":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 font-medium shadow-sm">
          Check Catalog
        </Badge>
      )
    case "low":
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-500/10 font-medium shadow-sm">
          Advisor Required
        </Badge>
      )
  }
}

function getTypeBadge(programType?: string) {
  const type = programType || "Other"
  if (type === "Minor") return <Badge variant="secondary">Minor</Badge>
  if (type === "Certificate" || type === "Certification") return <Badge variant="secondary">Certificate</Badge>
  return <Badge variant="secondary">Other</Badge>
}

function getQualityBadge(quality?: "exact" | "approximate" | "manual") {
  const q = quality || "exact"
  if (q === "exact") return <Badge variant="outline">Exact</Badge>
  if (q === "approximate") return <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-500/10">Approx</Badge>
  return <Badge variant="outline" className="border-slate-500 text-slate-700 dark:text-slate-400 bg-slate-500/10">Manual Review</Badge>
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  if (results.length === 0) {
    return null
  }

  // Find the highest completion percentage among non-excluded results
  const eligibleResults = results.filter((r) => !r.isExcluded)
  const topCompletionPercentage = eligibleResults.length > 0 ? Math.max(...eligibleResults.map((r) => r.completionPercentage)) : 0

  return (
    <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-1">
      {results.map((result, index) => {
        const colors = getGradientColor(result.completionPercentage)
        const topSuggestions = (result.suggestedNextCourses ?? []).slice(0, 3)
        const isTopMatch = !result.isExcluded && result.completionPercentage === topCompletionPercentage && result.completionPercentage < 100 && index === results.findIndex((r) => !r.isExcluded && r.completionPercentage === topCompletionPercentage)

        if (result.isExcluded) {
          return (
            <Card
              key={result.name}
              className="bg-gradient-to-br from-muted/60 to-muted/30 border-2 border-destructive/30 shadow-lg opacity-75"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="flex items-center gap-2.5 flex-wrap text-lg sm:text-xl opacity-75">
                      <span className="text-balance">{result.name}</span>
                      <Badge className="bg-destructive/80 text-destructive-foreground font-semibold shadow-sm text-xs sm:text-sm">
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Not Eligible
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base font-semibold text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {result.exclusionReason}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This program has major restrictions. Please consult your academic advisor for alternative options.
                </p>
              </CardContent>
            </Card>
          )
        }

        if (result.resultQuality === "manual") {
          return (
            <Card
              key={result.name}
              className="bg-gradient-to-br from-muted/50 to-background border-2 border-muted-foreground/25 shadow-lg"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="flex items-center gap-2.5 flex-wrap text-xl">
                      <span className="text-balance">{result.name}</span>
                      {getTypeBadge(result.programType)}
                      {getQualityBadge(result.resultQuality)}
                      {getConfidenceBadge(result.confidence)}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                      We can’t compute eligibility for this program from the current CSV row yet.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(result.requirementsText || result.note) && (
                  <div className="p-4 bg-background/60 border border-border rounded-lg">
                    <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Requirements (catalog text)
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {result.requirementsText || result.note}
                    </p>
                  </div>
                )}

                {result.detectedCourses && result.detectedCourses.length > 0 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Detected course codes</p>
                    <div className="flex flex-wrap gap-2">
                      {result.detectedCourses.slice(0, 16).map((c) => (
                        <Badge key={c} variant="outline" className="border-blue-500/40 text-blue-800 dark:text-blue-300 bg-background">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[11px] text-blue-800/70 dark:text-blue-400/70 mt-2 leading-relaxed">
                      These were extracted from free-text. Add structured `required_courses`, `elective_courses`, and `electives_required`
                      to make results exact.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        }

        return (
          <Card
            key={result.name}
            className={`${colors.cardBg} ${colors.border} shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] duration-300`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <CardTitle className="flex items-center gap-2.5 flex-wrap text-lg sm:text-xl">
                      <span className="text-balance">{result.name}</span>
                      {getTypeBadge(result.programType)}
                      {getQualityBadge(result.resultQuality)}
                      {result.completionPercentage === 100 && (
                        <Badge className={`${colors.badge} font-semibold shadow-sm text-xs sm:text-sm`}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Eligible!
                        </Badge>
                      )}
                      {isTopMatch && (
                        <Badge className={`${colors.badge} font-semibold shadow-sm text-xs sm:text-sm`}>
                          <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                          Top Match
                        </Badge>
                      )}
                    </CardTitle>
                  <CardDescription className={`text-sm sm:text-base font-semibold ${colors.textAccent}`}>
                    {result.coursesRemaining === 0 ? (
                      <span className="text-accent flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        All requirements met!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {result.coursesRemaining} {result.coursesRemaining === 1 ? "course" : "courses"} remaining
                      </span>
                    )}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getConfidenceBadge(result.confidence)}
                    {result.effectiveTerm && (
                      <span className="text-xs text-muted-foreground self-center bg-muted px-2 py-1 rounded-md">
                        Rules from: {result.effectiveTerm}
                      </span>
                    )}
                  </div>
                  {result.note && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{result.note}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-3xl sm:text-4xl font-bold ${colors.textAccent} leading-none`}>
                    {result.completionPercentage}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {result.coursesCompleted}/{result.totalCoursesRequired} complete
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Progress value={result.completionPercentage} className="h-3 shadow-sm" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {topSuggestions.length > 0 && result.coursesRemaining > 0 && (
                <div className="p-5 bg-accent/15 border-2 border-accent/40 rounded-xl shadow-sm">
                  <p className="text-sm font-bold mb-3 flex items-center gap-2.5 text-foreground">
                    <Lightbulb className="h-5 w-5 text-accent" />
                    Suggested Next Courses
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {topSuggestions.map((course) => (
                      <Badge 
                        key={course}
                        variant="secondary"
                        className="bg-secondary text-foreground text-sm px-4 py-1.5 font-semibold shadow-sm border border-border"
                      >
                        <span className="text-foreground">{course}</span>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Taking {topSuggestions.length === 1 ? "this course" : "these courses"} will bring you closer to
                    completion
                  </p>
                </div>
              )}

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details" className="border-2 border-border rounded-xl px-4 sm:px-5 shadow-sm">
                  <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline group touch-manipulation min-h-[48px]">
                    <span className="flex items-center gap-2.5">
                      View Full Requirements
                      <span className="text-xs text-muted-foreground font-normal">(all matched & missing courses)</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-5 pt-2 pb-5">
                    {result.matchedRequired.length > 0 && (
                      <div>
                        <p className="text-sm font-bold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span className="text-foreground">
                            Completed Required{" "}
                            <span className="text-muted-foreground font-normal">({result.matchedRequired.length})</span>
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.matchedRequired.map((course) => (
                            <Badge
                              key={course}
                              variant="outline"
                              className="text-xs border-accent/60 bg-accent/10 text-foreground font-semibold"
                            >
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.matchedElectives.length > 0 && (
                      <div>
                        <p className="text-sm font-bold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          <span className="text-foreground">
                            Completed Electives{" "}
                            <span className="text-muted-foreground font-normal">
                              ({result.matchedElectives.length})
                            </span>
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.matchedElectives.map((course) => (
                            <Badge
                              key={course}
                              variant="outline"
                              className="text-xs border-accent/60 bg-accent/10 text-foreground font-semibold"
                            >
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.missingRequired.length > 0 && (
                      <div>
                        <p className="text-sm font-bold mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            Missing Required{" "}
                            <span className="text-muted-foreground font-normal">({result.missingRequired.length})</span>
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.missingRequired.map((course) => (
                            <Badge key={course} variant="secondary" className="text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.coursesRemaining > 0 &&
                      result.missingRequired.length === 0 &&
                      result.electivesNeeded > 0 && (
                        <div>
                          <p className="text-sm font-bold mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              Additional Electives Needed{" "}
                              <span className="text-muted-foreground font-normal">({result.electivesNeeded})</span>
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Choose {result.electivesNeeded} more {result.electivesNeeded === 1 ? "course" : "courses"}{" "}
                            from the elective pool to complete this program
                          </p>
                        </div>
                      )}
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground text-sm">Is this result inaccurate?</p>
                        <p className="leading-relaxed">Help your fellow Illini by reporting outdated requirements.</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 h-9 sm:h-9 shrink-0 bg-transparent touch-manipulation min-h-[36px]" asChild>
                        <a
                          href={`mailto:support@illinois.edu?subject=Issue with ${encodeURIComponent(result.name)}&body=The requirements for ${encodeURIComponent(result.name)} seem wrong because...`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Report issue with ${result.name}`}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Report Issue
                        </a>
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
