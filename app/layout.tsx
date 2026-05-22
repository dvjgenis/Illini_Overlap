import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ProgramProvider } from "@/context/program-context"
import { ThemeProvider } from "@/components/theme-provider"
import { AppErrorBoundary } from "@/components/app-error-boundary"
import { ClientToaster } from "@/components/client-toaster"
import { ChunkErrorRecovery } from "@/components/chunk-error-recovery"
import { getSiteUrl } from "@/lib/site-url"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const chunkRecoveryInlineScript = `
(function () {
  var key = "illini-overlap-chunk-reload-attempted";
  var shouldRecover = function (input) {
    var text = "";
    if (typeof input === "string") text = input;
    else if (input && typeof input.message === "string") text = input.message;
    text = String(text).toLowerCase();
    return text.indexOf("chunkloaderror") !== -1 ||
      (text.indexOf("loading chunk") !== -1 && text.indexOf("failed") !== -1) ||
      text.indexOf("invalid or unexpected token") !== -1;
  };
  var tryRecover = function () {
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
      location.reload();
    } catch (_) {}
  };
  window.addEventListener("error", function (event) {
    if (shouldRecover((event && (event.error || event.message)) || "")) tryRecover();
  });
  window.addEventListener("unhandledrejection", function (event) {
    if (shouldRecover(event && event.reason)) tryRecover();
  });
  setTimeout(function () {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }, 15000);
})();
`

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: "IlliniOverlap - UIUC Minor & Certification Finder",
  description:
    "Discover which UIUC Minors and Certifications you're eligible for based on your completed courses. Maximize course reuse and reduce extra credit hours.",
  keywords: ["UIUC", "minor", "certification", "course overlap", "Illinois", "degree planning"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "IlliniOverlap - Minor & Certification Finder",
    description:
      "Discover which UIUC Minors and Certifications you're eligible for based on your completed courses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "IlliniOverlap - UIUC Minor & Certification Finder",
    description:
      "See which UIUC minors and certifications overlap with your courses. Maximize reuse and plan smarter.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: chunkRecoveryInlineScript }} />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProgramProvider>
            <AppErrorBoundary>
              <ChunkErrorRecovery />
              {children}
              <ClientToaster />
            </AppErrorBoundary>
          </ProgramProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
