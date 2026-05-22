"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AnimatePresence, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import { useProgramContext } from "@/context/program-context"
import { calculateProgramEligibility } from "@/lib/calculation-engine"
import type { GenEdAnalysis } from "@/lib/gen-ed-engine"
import { GraduationCap } from "lucide-react"
import type { ProgramResult } from "@/lib/calculation-engine"
import { StepProgress } from "@/components/step-progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { Step1Profile } from "@/components/steps/step1-profile"
import { StepTransitionScreen } from "@/components/step-transition-screen"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useWindowSize } from "@/hooks/use-window-size"

const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
})

function StepChunkLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-4" aria-busy="true" aria-label="Loading step">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-12 w-3/4 rounded-lg" />
    </div>
  )
}

const Step2Courses = dynamic(
  () => import("@/components/steps/step2-courses").then((m) => ({ default: m.Step2Courses })),
  { loading: () => <StepChunkLoading /> },
)

const Step3Verification = dynamic(
  () => import("@/components/steps/step3-verification").then((m) => ({ default: m.Step3Verification })),
  { loading: () => <StepChunkLoading /> },
)

const Step4Results = dynamic(
  () => import("@/components/steps/step4-results").then((m) => ({ default: m.Step4Results })),
  { loading: () => <StepChunkLoading /> },
)

/** Overlay stays up long enough to mask step swaps and Step 4 chunk paint */
const STEP_TRANSITION_DEFAULT_HOLD_MS = 1500
const STEP_TRANSITION_RESULTS_HOLD_MS = 2000
const STEP_TRANSITION_EXIT_MS = 420
const STEP_TRANSITION_REDUCED_DEFAULT_MS = 400
const STEP_TRANSITION_REDUCED_RESULTS_MS = 550
const STEP_TRANSITION_REDUCED_EXIT_MS = 200

export default function Home() {
  const prefersReducedMotion = useReducedMotion()
  const { programs, userCourses, setUserCourses, userMajors, setUserMajors, csvLoadError, isLoadingCSV } =
    useProgramContext()
  const [currentStep, setCurrentStep] = useState(1)
  const [results, setResults] = useState<ProgramResult[]>([])
  const [genEdAnalysis, setGenEdAnalysis] = useState<GenEdAnalysis | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()
  const [isMounted, setIsMounted] = useState(false)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false)
  const [transitionTargetStep, setTransitionTargetStep] = useState<number | null>(null)
  const [transitionHoldMs, setTransitionHoldMs] = useState(STEP_TRANSITION_DEFAULT_HOLD_MS)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleAddMajor = (major: string) => {
    if (major) {
      setUserMajors((prev) => (prev.includes(major) ? prev : [...prev, major]))
    }
  }

  const handleRemoveMajor = (major: string) => {
    setUserMajors((prev) => prev.filter((m) => m !== major))
  }

  const handleRemoveCourse = (course: string) => {
    setUserCourses((prev) => prev.filter((c) => c !== course))
  }

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const transitionEnterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transitionExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTransitionTimers = useCallback(() => {
    if (transitionEnterTimerRef.current !== null) {
      clearTimeout(transitionEnterTimerRef.current)
      transitionEnterTimerRef.current = null
    }
    if (transitionExitTimerRef.current !== null) {
      clearTimeout(transitionExitTimerRef.current)
      transitionExitTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTransitionTimers(), [clearTransitionTimers])

  const transitionToStep = (nextStep: number, options?: { holdMs?: number }) => {
    if (nextStep === currentStep) return
    clearTransitionTimers()
    let holdMs =
      options?.holdMs ?? (nextStep === 4 ? STEP_TRANSITION_RESULTS_HOLD_MS : STEP_TRANSITION_DEFAULT_HOLD_MS)
    if (prefersReducedMotion) {
      holdMs = Math.min(
        holdMs,
        nextStep === 4 ? STEP_TRANSITION_REDUCED_RESULTS_MS : STEP_TRANSITION_REDUCED_DEFAULT_MS,
      )
    }
    const exitMs = prefersReducedMotion ? STEP_TRANSITION_REDUCED_EXIT_MS : STEP_TRANSITION_EXIT_MS
    setTransitionHoldMs(holdMs)
    setTransitionTargetStep(nextStep)
    setIsStepTransitioning(true)
    transitionEnterTimerRef.current = window.setTimeout(() => {
      setCurrentStep(nextStep)
      transitionExitTimerRef.current = window.setTimeout(() => {
        setIsStepTransitioning(false)
        setTransitionTargetStep(null)
        transitionExitTimerRef.current = null
      }, exitMs)
      transitionEnterTimerRef.current = null
    }, holdMs)
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    queueMicrotask(async () => {
      try {
        const calculatedResults = calculateProgramEligibility(userCourses, programs, userMajors)
        const { analyzeGenEds } = await import("@/lib/gen-ed-engine")
        const genEds = analyzeGenEds(userCourses, userMajors, programs)
        setResults(calculatedResults)
        setGenEdAnalysis(genEds)
        transitionToStep(4)

        const hasCompleteProgram = calculatedResults.some((result) => result.completionPercentage === 100)
        if (hasCompleteProgram) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }
      } catch (e) {
        console.error("Analyze failed:", e)
        toast.error("Something went wrong while analyzing. Try again, or refresh if the problem continues.")
      } finally {
        setIsAnalyzing(false)
      }
    })
  }

  const handleStartOver = () => {
    transitionToStep(1)
    setUserCourses([])
    setUserMajors([])
    setResults([])
    localStorage.removeItem("illini-overlap-courses")
    localStorage.removeItem("illini-overlap-majors")
    localStorage.removeItem("uiuc-prereq-courses")
    localStorage.removeItem("uiuc-prereq-majors")
  }

  const handleEditCourses = () => transitionToStep(2)
  const handleEditMajor = () => transitionToStep(1)

  useEffect(() => {
    // Step 1: primary CTA is disabled until a major is chosen — autofocus steals attention from search/browse.
    if (currentStep === 1) return
    const buttons = document.querySelectorAll('button[data-step-nav="true"]')
    if (buttons.length === 0) return
    const last = buttons[buttons.length - 1] as HTMLButtonElement
    if (!last.disabled) {
      last.focus()
    }
  }, [currentStep])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {isMounted && showConfetti && width > 0 && height > 0 && (
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
      )}
      <AnimatePresence>
        {isStepTransitioning && transitionTargetStep !== null && (
          <StepTransitionScreen
            fromStep={currentStep}
            toStep={transitionTargetStep}
            holdMs={transitionHoldMs}
            prefersReducedMotion={!!prefersReducedMotion}
          />
        )}
      </AnimatePresence>

      <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-50" role="banner">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 group no-underline hover:no-underline rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <GraduationCap className="h-5 w-5 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight no-underline">
                  IlliniOverlap
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block no-underline">
                  Major in your passion, Minor with precision.
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              <ThemeToggle />
              <a
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-secondary/80"
              >
                Admin
              </a>
            </nav>
          </div>
        </div>
      </header>

      <StepProgress currentStep={currentStep} totalSteps={4} />

      <main id="main-content" className="pb-16" role="main">
        {isLoadingCSV && (
          <div className="container mx-auto px-4 pt-4">
            <div
              className="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              Loading program data…
            </div>
          </div>
        )}
        {csvLoadError && (
          <div className="container mx-auto px-4 pt-4">
            <div
              className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-foreground"
              role="status"
              aria-live="polite"
            >
              CSV data issue detected: {csvLoadError}. The app is using fallback data for now.
            </div>
          </div>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {currentStep === 1 && (
            <Step1Profile
              key="step1"
              userMajors={userMajors}
              onAddMajor={handleAddMajor}
              onRemoveMajor={handleRemoveMajor}
              onNext={() => transitionToStep(2)}
            />
          )}
          {currentStep === 2 && (
            <Step2Courses
              key="step2"
              courseCount={userCourses.length}
              onNext={() => transitionToStep(3)}
              onBack={() => transitionToStep(1)}
            />
          )}
          {currentStep === 3 && (
            <Step3Verification
              key="step3"
              userCourses={userCourses}
              onRemoveCourse={handleRemoveCourse}
              onAnalyze={handleAnalyze}
              onBack={() => transitionToStep(2)}
              isAnalyzing={isAnalyzing}
            />
          )}
          {currentStep === 4 && (
            <Step4Results
              key="step4"
              results={results}
              totalPrograms={programs.length}
              courseCount={userCourses.length}
              genEdAnalysis={genEdAnalysis ?? {
                progress: [],
                parentProgress: [],
                totalHoursRequired: 0,
                totalHoursCompleted: 0,
                overallPercentage: 0,
                overlaps: [],
                recommendedCourses: [],
              }}
              onStartOver={handleStartOver}
              onEditCourses={handleEditCourses}
              onEditMajor={handleEditMajor}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-border mt-auto py-8 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-sm font-semibold text-foreground">University of Illinois Urbana-Champaign</p>
              <p className="text-xs text-muted-foreground mt-1">Built for Illini by Illini</p>
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <a href="/" className="hover:text-foreground transition-colors">Home</a>
              <a href="/admin" className="hover:text-foreground transition-colors">Admin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
