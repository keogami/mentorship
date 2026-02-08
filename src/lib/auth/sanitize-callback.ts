/**
 * Sanitize a callbackUrl to prevent open redirects.
 * Only allows relative paths (starting with /).
 * Uses the URL API to parse and normalize, returning only the pathname
 * portion so tricks like "//evil.com" or "javascript:" are stripped.
 */
export function sanitizeCallbackUrl(
  url: string | undefined | null,
  fallback = "/dashboard"
): string {
  if (!url || !url.startsWith("/")) return fallback

  try {
    // Resolve against a dummy base — relative paths like "/dashboard" become
    // "http://n/dashboard". Absolute URLs like "//evil.com" resolve to their
    // own host, which we discard by only returning the pathname.
    const parsed = new URL(url, "http://n")
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return fallback
  }
}
