"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  Lightbulb,
  ChevronDown,
  Info,
} from "lucide-react"
import type {
  GenEdAnalysis,
  GenEdParentProgress,
  CourseOverlap,
} from "@/lib/gen-ed-engine"
import type { GenEdParentCategory } from "@/lib/mock-data"

interface GenEdDisplayProps {
  analysis: GenEdAnalysis
}

// Colors for parent categories
const parentColors: Record<
  GenEdParentCategory,
  { bg: string; text: string; border: string; progressBg: string }
> = {
  COMP: {
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
    progressBg: "[&>div]:bg-purple-600",
  },
  HUM: {
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/30",
    progressBg: "[&>div]:bg-blue-600",
  },
  NAT: {
    bg: "bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-500/30",
    progressBg: "[&>div]:bg-green-600",
  },
  SBS: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-700 dark:text-cyan-400",
    border: "border-cyan-500/30",
    progressBg: "[&>div]:bg-cyan-600",
  },
  CS: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    progressBg: "[&>div]:bg-amber-600",
  },
  QR: {
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-500/30",
    progressBg: "[&>div]:bg-red-600",
  },
}

function ParentCategoryCard({ parentProgress }: { parentProgress: GenEdParentProgress }) {
  const [expanded, setExpanded] = useState(false)
  const colors = parentColors[parentProgress.parentCategory]
  const isComplete = parentProgress.percentComplete >= 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`relative overflow-hidden transition-all ${
          isComplete ? "border-green-500/50 bg-green-500/5" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                {parentProgress.parentCategory}
              </Badge>
              {isComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <span className="text-2xl font-bold text-foreground">
              {parentProgress.percentComplete}%
            </span>
          </div>
          <CardTitle className="text-base font-semibold">{parentProgress.name}</CardTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {parentProgress.note}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {parentProgress.totalHoursCompleted}/{parentProgress.totalHoursRequired} hrs
                </span>
              </div>
              <Progress
                value={parentProgress.percentComplete}
                className={`h-2 ${isComplete ? "[&>div]:bg-green-600" : colors.progressBg}`}
              />
            </div>

            {/* Subcategories */}
            {parentProgress.subcategories.length > 1 && (
              <div className="pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  aria-expanded={expanded}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                  {expanded ? "Hide" : "Show"} subcategories (
                  {parentProgress.subcategories.length})
                </button>

                {expanded && (
                  <div className="mt-3 space-y-2">
                    {parentProgress.subcategories.map((sub) => (
                      <div key={sub.category} className="p-2 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{sub.shortName}</span>
                            {sub.percentComplete >= 100 && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <span className="text-xs font-medium">
                            {sub.hoursCompleted}/{sub.hoursRequired} hrs
                          </span>
                        </div>
                        <Progress value={sub.percentComplete} className="h-1" />
                        {sub.coursesCompleted.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sub.coursesCompleted.map((course) => (
                              <Badge
                                key={course}
                                variant="secondary"
                                className="text-[10px] font-mono py-0 bg-secondary/80 text-foreground border border-border/50"
                              >
                                {course}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Single subcategory - show courses directly */}
            {parentProgress.subcategories.length === 1 &&
              parentProgress.subcategories[0].coursesCompleted.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completed:</p>
                  <div className="flex flex-wrap gap-1">
                    {parentProgress.subcategories[0].coursesCompleted.map((course) => (
                      <Badge key={course} variant="secondary" className="text-xs font-mono bg-secondary/80 text-foreground border border-border/50">
                        {course}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {!isComplete && (
              <p className="text-xs text-muted-foreground">
                Need {parentProgress.totalHoursRequired - parentProgress.totalHoursCompleted} more
                hours
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OverlapCard({ overlap }: { overlap: CourseOverlap }) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        overlap.isDoubleDipping ? "bg-primary/5 border-primary/30" : "bg-card border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-sm">{overlap.course}</span>
            {overlap.isDoubleDipping && (
              <Badge className="bg-primary/10 text-primary border-primary/30 border text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Double Dip
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {overlap.genEdNames.map((name, i) => (
              <Badge key={`${overlap.course}-${name}-${i}`} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      {overlap.programs.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium">Counts toward: </span>
          {overlap.programs.slice(0, 3).join(", ")}
          {overlap.programs.length > 3 && ` +${overlap.programs.length - 3} more`}
        </div>
      )}
    </div>
  )
}

export function GenEdDisplay({ analysis }: GenEdDisplayProps) {
  const [showAllOverlaps, setShowAllOverlaps] = useState(false)

  const doubleDips = analysis.overlaps.filter((o) => o.isDoubleDipping)
  const displayedOverlaps = showAllOverlaps ? analysis.overlaps : analysis.overlaps.slice(0, 6)

  const completedCategories = analysis.parentProgress.filter((p) => p.percentComplete >= 100).length

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Overall Gen Ed Progress</h3>
              <p className="text-sm text-muted-foreground">
                {analysis.totalHoursCompleted} of {analysis.totalHoursRequired} hours completed
                <span className="mx-2">|</span>
                {completedCategories}/6 categories complete
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-4xl font-bold text-primary">
                  {analysis.overallPercentage}%
                </span>
              </div>
            </div>
          </div>
          <Progress value={analysis.overallPercentage} className="mt-4 h-3 [&>div]:bg-primary" />
        </CardContent>
      </Card>

      {/* Parent Category Progress Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Gen Ed Categories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.parentProgress.map((progress) => (
            <ParentCategoryCard key={progress.parentCategory} parentProgress={progress} />
          ))}
        </div>
      </div>

      {/* Double-Dipping Opportunities */}
      {doubleDips.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Double-Dipping Courses
              <Badge variant="secondary" className="ml-2 bg-secondary/80 text-foreground border border-border/50">
                {doubleDips.length} courses
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These courses count toward both Gen Ed requirements AND minors/certificates -
              maximizing your progress!
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doubleDips.slice(0, 6).map((overlap) => (
                <OverlapCard key={overlap.course} overlap={overlap} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Courses */}
      {analysis.recommendedCourses.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="recommendations" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">Recommended Courses for Maximum Overlap</span>
                <Badge variant="outline" className="ml-2">
                  {analysis.recommendedCourses.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">
                These courses can help you complete Gen Ed requirements while also progressing
                toward minors and certificates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.recommendedCourses.map((rec) => (
                  <div
                    key={rec.course}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-semibold">{rec.course}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {rec.genEdNames.map((name, i) => (
                          <Badge key={`${rec.course}-${name}-${i}`} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                    {rec.programs.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                        <ArrowRight className="h-3 w-3" />
                        {rec.programs.slice(0, 2).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* All Course Overlaps */}
      {analysis.overlaps.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="all-overlaps" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">All Course Fulfillments</span>
                <Badge variant="outline" className="ml-2">
                  {analysis.overlaps.length} courses
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedOverlaps.map((overlap) => (
                  <OverlapCard key={overlap.course} overlap={overlap} />
                ))}
              </div>
              {analysis.overlaps.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllOverlaps(!showAllOverlaps)}
                  className="mt-4 text-sm text-primary hover:underline touch-manipulation min-h-[44px] px-2 py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showAllOverlaps ? "Show fewer courses" : `Show all ${analysis.overlaps.length} courses`}
                >
                  {showAllOverlaps ? "Show less" : `Show all ${analysis.overlaps.length} courses`}
                </button>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
