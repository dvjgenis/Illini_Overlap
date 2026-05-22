/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://illinioverlap.example).
 * VERCEL_URL is used on Vercel when the public URL is not set.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/+$/, "")
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    return `https://${host}`
  }
  return "http://localhost:3000"
}
