"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

type Props = { children: ReactNode }

type State = { hasError: boolean; message?: string }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Try clearing site data for this site, or reload. If it keeps happening, remove{" "}
            <code className="text-xs bg-muted px-1 rounded">illini-overlap-programs</code> from local storage under
            Application → Local Storage.
          </p>
          {process.env.NODE_ENV === "development" && this.state.message ? (
            <pre className="text-xs max-w-lg overflow-auto p-2 bg-muted rounded border border-border">{this.state.message}</pre>
          ) : null}
          <Button type="button" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
