"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResultsDisplay } from "@/components/results-display"
import { GenEdDisplay } from "@/components/gen-ed-display"
import { RotateCcw, Sparkles, TrendingUp, Trophy, Filter, GraduationCap, BookOpen, Pencil, User } from "lucide-react"
import type { ProgramResult } from "@/lib/calculation-engine"
import type { GenEdAnalysis } from "@/lib/gen-ed-engine"
import { useState, useMemo } from "react"

interface Step4ResultsProps {
  results: ProgramResult[]
  totalPrograms: number
  courseCount: number
  genEdAnalysis: GenEdAnalysis
  onStartOver: () => void
  onEditCourses?: () => void
  onEditMajor?: () => void
}

const getNormalizedType = (type?: ProgramResult["programType"]) => {
  if (type === "Certification") return "Certificate"
  return type || "Other"
}

export function Step4Results({
  results,
  totalPrograms,
  courseCount,
  genEdAnalysis,
  onStartOver,
  onEditCourses,
  onEditMajor,
}: Step4ResultsProps) {
  const [selectedConfidence, setSelectedConfidence] = useState<"all" | "high" | "medium" | "low">("all")
  const [selectedType, setSelectedType] = useState<"all" | "Minor" | "Certificate" | "Other">("all")
  const [selectedQuality, setSelectedQuality] = useState<"all" | "exact" | "approximate" | "manual">("all")
  const [programQuery, setProgramQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"minors" | "geneds">("minors")

  const eligibleCount = results.filter((r) => !r.isExcluded && r.completionPercentage === 100).length
  const excludedCount = results.filter((r) => r.isExcluded).length
  const manualReviewCount = results.filter((r) => (r.resultQuality || "exact") === "manual").length
  const actionableCount = results.filter((r) => !r.isExcluded && (r.resultQuality || "exact") !== "manual").length

  const filteredResults = useMemo(
    () =>
      results
        .filter((r) => {
          const q = programQuery.trim().toLowerCase()
          if (!q) return true
          return r.name.toLowerCase().includes(q)
        })
        .filter((r) => (selectedConfidence === "all" ? true : r.confidence === selectedConfidence))
        .filter((r) => {
          if (selectedType === "all") return true
          const type = getNormalizedType(r.programType)
          return type === selectedType
        })
        .filter((r) => (selectedQuality === "all" ? true : (r.resultQuality || "exact") === selectedQuality)),
    [results, programQuery, selectedConfidence, selectedType, selectedQuality],
  )

  const confidenceCounts = useMemo(() => ({
    high: results.filter((r) => r.confidence === "high").length,
    medium: results.filter((r) => r.confidence === "medium").length,
    low: results.filter((r) => r.confidence === "low").length,
  }), [results])

  const typeCounts = useMemo(() => ({
    Minor: results.filter((r) => getNormalizedType(r.programType) === "Minor").length,
    Certificate: results.filter((r) => getNormalizedType(r.programType) === "Certificate").length,
    Other: results.filter((r) => getNormalizedType(r.programType) === "Other").length,
  }), [results])

  const qualityCounts = useMemo(() => ({
    exact: results.filter((r) => (r.resultQuality || "exact") === "exact").length,
    approximate: results.filter((r) => (r.resultQuality || "exact") === "approximate").length,
    manual: results.filter((r) => (r.resultQuality || "exact") === "manual").length,
  }), [results])

  const genEdParentTotal = genEdAnalysis.parentProgress.length
  const genEdComplete = genEdAnalysis.parentProgress.filter((p) => p.percentComplete >= 100).length
  const doubleDipCount = genEdAnalysis.overlaps.filter((o) => o.isDoubleDipping).length
  const hasActiveFilters =
    selectedConfidence !== "all" ||
    selectedType !== "all" ||
    selectedQuality !== "all" ||
    programQuery.trim().length > 0

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Statistics Sidebar */}
        <div className="w-full lg:w-80 space-y-4">
          <Card className="shadow-lg border-2 bg-gradient-to-br from-card to-secondary/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${eligibleCount > 0 ? "bg-accent" : "bg-secondary"}`}
                >
                  {eligibleCount > 0 ? (
                    <Trophy className="h-5 w-5 text-accent-foreground" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-bold text-base sm:text-lg">Your Results</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/60 border border-border">
                  <span className="text-sm font-medium text-muted-foreground">Programs Analyzed</span>
                  <span className="font-bold text-lg text-foreground">{results.length || totalPrograms}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/60 border border-border">
                  <span className="text-sm font-medium text-muted-foreground">Courses Entered</span>
                  <span className="font-bold text-lg text-foreground">{courseCount}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-accent/10 border-2 border-accent/40">
                  <span className="text-sm font-semibold text-foreground">Eligible Programs</span>
                  <span className="font-bold text-2xl sm:text-3xl text-accent">{eligibleCount}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/60 border border-border">
                  <span className="text-xs font-medium text-muted-foreground">Actionable Program Matches</span>
                  <span className="font-bold text-foreground">{actionableCount}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background/60 border border-border">
                    <span className="text-xs font-medium text-muted-foreground">Excluded</span>
                    <span className="font-bold text-foreground">{excludedCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background/60 border border-border">
                    <span className="text-xs font-medium text-muted-foreground">Manual Review</span>
                    <span className="font-bold text-foreground">{manualReviewCount}</span>
                  </div>
                </div>
              </div>

              {/* Gen Ed Quick Stats */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Gen Ed Progress
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background/60 border border-border">
                    <span className="text-xs font-medium text-muted-foreground">Overall</span>
                    <span className="font-bold text-primary">{genEdAnalysis.overallPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-background/60 border border-border">
                    <span className="text-xs font-medium text-muted-foreground">Categories Complete</span>
                    <span className="font-bold text-foreground">{genEdComplete}/{genEdParentTotal}</span>
                  </div>
                  {doubleDipCount > 0 && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-primary/10 border border-primary/30">
                      <span className="text-xs font-medium text-foreground">Double-Dip Courses</span>
                      <span className="font-bold text-primary">{doubleDipCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {onEditCourses && (
                  <Button
                    onClick={onEditCourses}
                    variant="outline"
                    className="w-full bg-transparent touch-manipulation h-11"
                    size="lg"
                    data-step-nav="true"
                    aria-label="Edit your courses"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Courses
                  </Button>
                )}
                {onEditMajor && (
                  <Button
                    onClick={onEditMajor}
                    variant="ghost"
                    className="w-full touch-manipulation h-10 text-muted-foreground hover:text-foreground"
                    size="sm"
                    aria-label="Edit your major"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Edit Major
                  </Button>
                )}
                <Button
                  onClick={onStartOver}
                  variant="outline"
                  className="w-full bg-transparent touch-manipulation h-11 border-dashed"
                  size="lg"
                  data-step-nav="true"
                  aria-label="Start over and reset all data"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 bg-gradient-to-br from-accent/5 to-background">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Your Path Forward</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Look for courses that &quot;double-dip&quot; - they count toward both Gen Eds and minors, maximizing
                    your progress!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 text-balance">Discovery Complete!</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
              View your progress toward minors, certificates, and Gen Ed requirements - see where they overlap!
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "minors" | "geneds")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
              <TabsTrigger value="minors" className="flex items-center gap-2 touch-manipulation min-h-[44px] sm:min-h-[40px]">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Minors & Certificates</span>
                <span className="sm:hidden">Programs</span>
              </TabsTrigger>
              <TabsTrigger value="geneds" className="flex items-center gap-2 touch-manipulation min-h-[44px] sm:min-h-[40px]">
                <BookOpen className="h-4 w-4" />
                Gen Ed Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="minors" className="mt-0">
              <Card className="mb-6 shadow-md border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Filter className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-sm text-foreground">
                        Filters
                        {hasActiveFilters && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({filteredResults.length} of {results.length} shown)
                          </span>
                        )}
                      </h3>
                    </div>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 sm:h-7 text-xs text-muted-foreground hover:text-foreground touch-manipulation min-h-[32px]"
                        onClick={() => {
                          setProgramQuery("")
                          setSelectedConfidence("all")
                          setSelectedType("all")
                          setSelectedQuality("all")
                        }}
                        aria-label="Clear all filters"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Search Programs</p>
                      <Input
                        value={programQuery}
                        onChange={(e) => setProgramQuery(e.target.value)}
                        placeholder="Search by program name..."
                        className="h-9"
                        aria-label="Search programs by name"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Program Type</p>
                      <div className="flex flex-wrap gap-2 sm:gap-2 gap-y-2">
                        <Button
                          variant={selectedType === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedType("all")}
                          className="transition-all touch-manipulation min-h-[36px]"
                          aria-label="Show all program types"
                        >
                          All ({selectedType === "all" ? filteredResults.length : results.length})
                        </Button>
                        <Button
                          variant={selectedType === "Minor" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedType("Minor")}
                          className="transition-all touch-manipulation min-h-[36px]"
                          aria-label="Filter to minors only"
                        >
                          Minors ({selectedType === "Minor" ? filteredResults.filter((r) => getNormalizedType(r.programType) === "Minor").length : typeCounts.Minor})
                        </Button>
                        <Button
                          variant={selectedType === "Certificate" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedType("Certificate")}
                          className="transition-all touch-manipulation min-h-[36px]"
                          aria-label="Filter to certificates only"
                        >
                          Certificates ({selectedType === "Certificate" ? filteredResults.filter((r) => getNormalizedType(r.programType) === "Certificate").length : typeCounts.Certificate})
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Result Quality</p>
                      <div className="flex flex-wrap gap-2 sm:gap-2 gap-y-2">
                        <Button
                          variant={selectedQuality === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedQuality("all")}
                          className="transition-all touch-manipulation min-h-[36px]"
                          aria-label="Show all result qualities"
                        >
                          All ({selectedQuality === "all" ? filteredResults.length : results.length})
                        </Button>
                        <Button
                          variant={selectedQuality === "exact" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedQuality("exact")}
                          className="transition-all"
                        >
                          Exact ({selectedQuality === "exact" ? filteredResults.filter((r) => (r.resultQuality || "exact") === "exact").length : qualityCounts.exact})
                        </Button>
                        <Button
                          variant={selectedQuality === "approximate" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedQuality("approximate")}
                          className="transition-all"
                        >
                          Approx ({selectedQuality === "approximate" ? filteredResults.filter((r) => (r.resultQuality || "exact") === "approximate").length : qualityCounts.approximate})
                        </Button>
                        <Button
                          variant={selectedQuality === "manual" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedQuality("manual")}
                          className="transition-all"
                        >
                          Manual ({selectedQuality === "manual" ? filteredResults.filter((r) => (r.resultQuality || "exact") === "manual").length : qualityCounts.manual})
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Confidence</p>
                      <div className="flex flex-wrap gap-2 sm:gap-2 gap-y-2">
                        <Button
                          variant={selectedConfidence === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConfidence("all")}
                          className="transition-all touch-manipulation min-h-[36px]"
                          aria-label="Show all confidence levels"
                        >
                          All Programs ({selectedConfidence === "all" ? filteredResults.length : results.length})
                        </Button>
                        <Button
                          variant={selectedConfidence === "high" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConfidence("high")}
                          className="transition-all"
                        >
                          High Confidence ({selectedConfidence === "high" ? filteredResults.filter((r) => r.confidence === "high").length : confidenceCounts.high})
                        </Button>
                        <Button
                          variant={selectedConfidence === "medium" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConfidence("medium")}
                          className="transition-all"
                        >
                          Medium Confidence ({selectedConfidence === "medium" ? filteredResults.filter((r) => r.confidence === "medium").length : confidenceCounts.medium})
                        </Button>
                        <Button
                          variant={selectedConfidence === "low" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConfidence("low")}
                          className="transition-all"
                        >
                          Advisor Required ({selectedConfidence === "low" ? filteredResults.filter((r) => r.confidence === "low").length : confidenceCounts.low})
                        </Button>
                      </div>
                    </div>
                  </div>
                  {!hasActiveFilters && (
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      Use the filters above to narrow results by type, quality, or confidence level.
                    </p>
                  )}
                </CardContent>
              </Card>

              {filteredResults.length > 0 ? (
                <ResultsDisplay results={filteredResults} />
              ) : (
                <Card className="border-2 border-border">
                  <CardContent className="py-12 sm:py-10 text-center space-y-4">
                    <div className="flex flex-col items-center gap-3">
                      <Filter className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-base font-semibold text-foreground">No programs match your current filters</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Try broadening your filters or clearing the search query to see more results.
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProgramQuery("")
                            setSelectedConfidence("all")
                            setSelectedType("all")
                            setSelectedQuality("all")
                          }}
                          className="mt-2 touch-manipulation min-h-[40px]"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="geneds" className="mt-0">
              <GenEdDisplay analysis={genEdAnalysis} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  )
}
