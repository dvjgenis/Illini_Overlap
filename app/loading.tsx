import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm py-4 px-4">
        <div className="container mx-auto flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </header>

      <nav className="w-full bg-card border-b border-border py-4 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-12 w-3/4 rounded-lg" />
        </div>
      </main>
    </div>
  )
}
