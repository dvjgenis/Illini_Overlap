"use client"

import { motion } from "framer-motion"
import { useMemo, useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Search, X, User, Check } from "lucide-react"
import { UIUC_MAJORS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const EMPTY_LIST: string[] = []

interface Step1ProfileProps {
  userMajors: string[]
  onAddMajor: (major: string) => void
  onRemoveMajor: (major: string) => void
  onNext: () => void
}

export function Step1Profile({ userMajors, onAddMajor, onRemoveMajor, onNext }: Step1ProfileProps) {
  const [searchValue, setSearchValue] = useState("")
  const [browseAllMajors, setBrowseAllMajors] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const availableMajors = useMemo(
    () => UIUC_MAJORS.filter((major) => !userMajors.includes(major)),
    [userMajors],
  )

  const filteredMajors = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return availableMajors
    return availableMajors.filter((major) => major.toLowerCase().includes(query))
  }, [availableMajors, searchValue])

  const searchActive = searchValue.trim().length > 0
  const showMajorList = browseAllMajors || searchActive

  const majorsToShow = useMemo(() => {
    if (!showMajorList) return EMPTY_LIST
    return searchActive ? filteredMajors : availableMajors
  }, [showMajorList, searchActive, filteredMajors, availableMajors])

  const majorsListSignature = useMemo(
    () => (showMajorList ? majorsToShow.join("\u0001") : ""),
    [showMajorList, majorsToShow],
  )

  // Reset keyboard highlight only when the visible list contents actually change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [majorsListSignature])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (majorsToShow.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < majorsToShow.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (majorsToShow.length > 0) {
          const major = majorsToShow[selectedIndex >= 0 ? selectedIndex : 0]
          onAddMajor(major)
          setSearchValue("")
          setSelectedIndex(-1)
        }
        break
      case "Escape":
        e.preventDefault()
        setSearchValue("")
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectMajor = (major: string) => {
    onAddMajor(major)
    setSearchValue("")
    setSelectedIndex(-1)
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8 sm:py-4"
    >
      <Card className="max-w-2xl w-full shadow-xl border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <User className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-balance">Welcome to IlliniOverlap</CardTitle>
            <p className="text-sm sm:text-base font-medium text-primary italic">Major in your passion, Minor with precision.</p>
            <CardDescription className="text-base sm:text-lg leading-relaxed text-pretty">
              Let&apos;s start by learning about your academic background. This helps us filter out programs that
              aren&apos;t available to your major.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="major-search" className="text-sm font-semibold block">
              Select Your Major(s)
            </label>
            <div className="rounded-lg border border-border bg-background">
              <div className="relative border-b border-border">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="major-search"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    availableMajors.length > 0
                      ? "Search majors (e.g. Computer, Business)…"
                      : "All majors added"
                  }
                  className="h-12 w-full rounded-t-lg bg-transparent pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  autoComplete="off"
                />
              </div>
              {browseAllMajors && !searchActive && (
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Full list ({availableMajors.length})</span>
                  <button
                    type="button"
                    onClick={() => setBrowseAllMajors(false)}
                    className="text-xs font-medium text-primary hover:underline underline-offset-2"
                  >
                    Collapse
                  </button>
                </div>
              )}
              <div
                ref={listRef}
                className="max-h-[min(50vh,18rem)] sm:max-h-72 overflow-y-auto p-2 overscroll-contain"
              >
                {!showMajorList ? (
                  <div className="px-3 py-8 text-center space-y-4">
                    <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                      Start typing to find your major quickly, or open the full alphabetical list.
                    </p>
                    {availableMajors.length > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="touch-manipulation"
                        onClick={() => setBrowseAllMajors(true)}
                      >
                        Browse all majors
                      </Button>
                    ) : null}
                  </div>
                ) : majorsToShow.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">No major matches that search.</p>
                ) : (
                  <div className="space-y-1">
                    {majorsToShow.map((major, index) => (
                      <button
                        key={major}
                        type="button"
                        ref={(el) => {
                          itemRefs.current[index] = el
                        }}
                        onClick={() => handleSelectMajor(major)}
                        className={cn(
                          "flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors touch-manipulation min-h-[44px] cursor-pointer",
                          selectedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedIndex === index ? "opacity-100" : "opacity-0",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0">{major}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Have multiple majors? Add all of them!</p>
          </div>

          {userMajors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Your Major(s)</p>
              <div className="flex flex-wrap gap-2">
                {userMajors.map((major) => (
                  <Badge key={major} variant="secondary" className="text-sm py-2 px-4 bg-secondary/80 text-foreground border border-border/50 font-semibold">
                    <span className="text-foreground">{major}</span>
                    <button
                      onClick={() => onRemoveMajor(major)}
                      className="ml-2 hover:text-destructive transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
                      aria-label={`Remove ${major}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          <Button
            onClick={onNext}
            disabled={userMajors.length === 0}
            className="w-full h-12 sm:h-12 text-base touch-manipulation"
            size="lg"
            data-step-nav="true"
            aria-label={userMajors.length === 0 ? "Add at least one major to continue" : "Continue to course selection"}
          >
            Get Started
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
