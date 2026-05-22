"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, BookOpen } from "lucide-react"
import { CourseInput } from "@/components/course-input"

interface Step2CoursesProps {
  courseCount: number
  onNext: () => void
  onBack: () => void
}

export function Step2Courses({ courseCount, onNext, onBack }: Step2CoursesProps) {
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
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">Add Your Courses</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {courseCount > 0 ? (
                  <span className="font-semibold text-accent">{courseCount} {courseCount === 1 ? "course" : "courses"} added</span>
                ) : (
                  "Search for courses or upload your transcript"
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <CourseInput />

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button onClick={onBack} variant="outline" className="flex-1 h-12 sm:h-12 bg-transparent touch-manipulation" size="lg" data-step-nav="true" aria-label="Go back to major selection">
              <ChevronLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
            <Button onClick={onNext} disabled={courseCount === 0} className="flex-1 h-12 sm:h-12 touch-manipulation" size="lg" data-step-nav="true" aria-label={courseCount === 0 ? "Add at least one course to continue" : "Continue to review"}>
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
