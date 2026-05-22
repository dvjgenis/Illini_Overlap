"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

const STEP_LABELS: Record<number, string> = {
  1: "Your majors",
  2: "Your courses",
  3: "Verify & analyze",
  4: "Your overlap map",
}

type StepTransitionScreenProps = {
  fromStep: number
  toStep: number
  /** Matches parent hold duration so the progress bar finishes with the step swap */
  holdMs: number
  /** From parent `useReducedMotion()` — shorter motion and static decor */
  prefersReducedMotion?: boolean
}

export function StepTransitionScreen({
  fromStep,
  toStep,
  holdMs,
  prefersReducedMotion = false,
}: StepTransitionScreenProps) {
  const fromLabel = STEP_LABELS[fromStep] ?? `Step ${fromStep}`
  const toLabel = STEP_LABELS[toStep] ?? `Step ${toStep}`
  const progressDurationSec = prefersReducedMotion ? 0.12 : Math.max(0.6, holdMs / 1000)
  const ease = [0.22, 1, 0.36, 1] as const
  const overlayTransition = prefersReducedMotion ? { duration: 0.15 } : { duration: 0.35, ease }
  const cardTransition = prefersReducedMotion ? { duration: 0.15 } : { duration: 0.45, ease }

  return (
    <motion.div
      key={`transition-${fromStep}-${toStep}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Moving to step ${toStep}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={overlayTransition}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-background/95 backdrop-blur-xl"
    >
      {/* Ambient orbs — hide underlying UI, add depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {prefersReducedMotion ? (
          <>
            <div className="absolute -left-1/4 top-1/4 h-[min(80vw,480px)] w-[min(80vw,480px)] rounded-full bg-primary/25 blur-[100px]" />
            <div className="absolute -right-1/4 bottom-1/4 h-[min(70vw,420px)] w-[min(70vw,420px)] rounded-full bg-chart-2/20 blur-[90px]" />
          </>
        ) : (
          <>
            <motion.div
              className="absolute -left-1/4 top-1/4 h-[min(80vw,480px)] w-[min(80vw,480px)] rounded-full bg-primary/20 blur-[100px]"
              animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -right-1/4 bottom-1/4 h-[min(70vw,420px)] w-[min(70vw,420px)] rounded-full bg-chart-2/15 blur-[90px]"
              animate={{ opacity: [0.25, 0.45, 0.25], scale: [1.05, 1, 1.05] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent,hsl(var(--background)))]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8, scale: prefersReducedMotion ? 1 : 0.99 }}
        transition={cardTransition}
        className="relative z-10 mx-4 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-8 shadow-2xl shadow-primary/5 ring-1 ring-white/5 backdrop-blur-md dark:ring-white/10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary/80" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">IlliniOverlap</span>
          </div>

          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">Step {toStep} of 4</p>

          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <motion.span
              className="text-center text-sm text-muted-foreground line-through decoration-muted-foreground/40"
              initial={{ opacity: prefersReducedMotion ? 0.75 : 0, x: prefersReducedMotion ? 0 : -8 }}
              animate={{ opacity: 0.75, x: 0 }}
              transition={
                prefersReducedMotion ? { duration: 0.1 } : { delay: 0.08, duration: 0.35 }
              }
            >
              {fromLabel}
            </motion.span>
            <motion.span
              initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 0.15, duration: 0.35 }}
              className="hidden text-muted-foreground sm:inline"
              aria-hidden
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
            <motion.span
              className="text-center text-lg font-semibold tracking-tight text-foreground sm:text-xl"
              initial={{ opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0.1 } : { delay: 0.2, duration: 0.4 }}
            >
              {toLabel}
            </motion.span>
          </div>

          <div className="mt-8 space-y-2">
            <div className="h-1 overflow-hidden rounded-full bg-muted/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-chart-2"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: progressDurationSec,
                  ease: prefersReducedMotion ? "linear" : ease,
                }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">Preparing your workspace…</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
