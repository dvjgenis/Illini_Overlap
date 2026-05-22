"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, CheckCircle2, X, Sparkles, PackageX, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Step3VerificationProps {
  userCourses: string[]
  onRemoveCourse: (course: string) => void
  onAnalyze: () => void
  onBack: () => void
  isAnalyzing?: boolean
}

export function Step3Verification({ userCourses, onRemoveCourse, onAnalyze, onBack, isAnalyzing }: Step3VerificationProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl"
    >
      <Card className="shadow-xl border-2">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">Review Your Courses</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Verify your {userCourses.length} courses before we analyze your eligibility
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border-2 border-border bg-secondary/30 p-6">
            <p className="text-sm font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Your Completed Courses ({userCourses.length})
            </p>
            {userCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <PackageX className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No courses added yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Go back to add your courses</p>
                <Button
                  onClick={onBack}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[200px] sm:h-[300px] pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {userCourses.map((course) => (
                    <Badge
                      key={course}
                      variant="secondary"
                      className="justify-between pl-3 pr-1 py-2 text-sm font-semibold bg-secondary/80 text-foreground border border-border/50 hover:bg-accent/10 transition-colors"
                    >
                      <span className="text-foreground">{course}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 ml-2 hover:bg-transparent hover:text-destructive touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
                        onClick={() => onRemoveCourse(course)}
                        aria-label={`Remove ${course}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-5">
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Ready to discover your opportunities?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We&apos;ll analyze your courses against all available minors and certifications to find your best matches.
            </p>
          </div>

          <div
            className="flex gap-3 pt-4 border-t border-border"
            role="status"
            aria-live="polite"
            aria-busy={isAnalyzing}
          >
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 sm:h-12 bg-transparent touch-manipulation"
              size="lg"
              data-step-nav="true"
              aria-label="Go back to course selection"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
            <Button
              onClick={onAnalyze}
              disabled={userCourses.length === 0 || isAnalyzing}
              className="flex-1 h-12 sm:h-12 bg-accent hover:bg-accent/90 touch-manipulation"
              size="lg"
              data-step-nav="true"
              aria-label={userCourses.length === 0 ? "Add courses to analyze" : isAnalyzing ? "Analyzing your eligibility" : "Analyze your eligibility"}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {userCourses.length === 0 ? "Add courses first" : "Analyze My Path"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
