"use client"

import dynamic from "next/dynamic"

/** Sonner + next-themes must not SSR/hydrate; failures here were blanking the whole app (Toaster sat outside the error boundary). */
export const ClientToaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false },
)
