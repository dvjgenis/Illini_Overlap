"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <Card className="max-w-md w-full shadow-xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-9 w-9 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Something went wrong!</CardTitle>
            <CardDescription className="text-base">
              We encountered an unexpected error. Please try again.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-xs font-mono text-destructive break-all">{error.message}</p>
            </div>
          )}
          <Button onClick={reset} className="w-full" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
