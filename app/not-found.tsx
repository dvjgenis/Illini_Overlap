import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="h-9 w-9 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">404 - Page Not Found</CardTitle>
            <CardDescription className="text-base">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
        </CardContent>
      </Card>
      </div>
      <footer className="w-full py-4 text-center border-t border-border bg-card/50">
        <p className="text-xs text-muted-foreground">Built for Illini by Illini</p>
      </footer>
    </div>
  )
}
