"use client"

import { useEffect } from "react"

const RELOAD_GUARD_KEY = "illini-overlap-chunk-reload-attempted"
const RESET_DELAY_MS = 15_000

const shouldRecoverFrom = (value: unknown): boolean => {
  const text =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? value.message
        : ""
  const normalized = text.toLowerCase()
  return (
    normalized.includes("chunkloaderror") ||
    (normalized.includes("loading chunk") && normalized.includes("failed")) ||
    normalized.includes("invalid or unexpected token")
  )
}

export function ChunkErrorRecovery() {
  useEffect(() => {
    const tryRecover = () => {
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1")
      window.location.reload()
    }

    const onError = (event: ErrorEvent) => {
      if (shouldRecoverFrom(event.error ?? event.message)) {
        tryRecover()
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (shouldRecoverFrom(event.reason)) {
        tryRecover()
      }
    }

    const clearGuard = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_GUARD_KEY)
    }, RESET_DELAY_MS)

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
      window.clearTimeout(clearGuard)
    }
  }, [])

  return null
}
