"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface StepProgressProps {
  currentStep: number
  totalSteps: number
}

export function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  const steps = [
    { number: 1, label: "Profile" },
    { number: 2, label: "Courses" },
    { number: 3, label: "Review" },
    { number: 4, label: "Results" },
  ]

  return (
    <nav aria-label="Wizard progress" className="w-full bg-card border-b border-border py-3 sm:py-6 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-1 sm:gap-2 relative pt-1" role="list">
          {/* Progress line — aligned to step circles on all breakpoints */}
          <div className="absolute top-[calc(0.25rem+1rem)] sm:top-[calc(0.25rem+1.25rem)] left-[12%] right-[12%] sm:left-0 sm:right-0 h-1 bg-secondary rounded-full">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {steps.map((step) => {
            const isCompleted = currentStep > step.number
            const isCurrent = currentStep === step.number

            return (
              <div
                key={step.number}
                role="listitem"
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.number}: ${step.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                className="flex flex-1 min-w-0 flex-col items-center gap-1.5 sm:gap-2 relative z-10"
              >
                <motion.div
                  className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-sm transition-all touch-manipulation ${
                    isCompleted
                      ? "bg-accent text-accent-foreground"
                      : isCurrent
                        ? "bg-accent text-accent-foreground shadow-lg"
                        : "bg-secondary text-muted-foreground"
                  }`}
                  animate={{
                    scale: isCurrent ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden /> : step.number}
                </motion.div>
                <span
                  className={`text-[10px] sm:text-xs font-medium text-center leading-tight px-0.5 max-w-[4.75rem] sm:max-w-none ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
