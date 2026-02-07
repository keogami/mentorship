/**
 * Sanitize a callbackUrl to prevent open redirects.
 * Only allows relative paths (starting with /).
 * Returns the default if the URL is absolute or malicious.
 */
export function sanitizeCallbackUrl(
  url: string | undefined | null,
  fallback = "/dashboard"
): string {
  if (!url) return fallback;

  // Reject absolute URLs, protocol-relative URLs, and anything with ://
  if (
    url.includes("://") ||
    url.startsWith("//") ||
    !url.startsWith("/")
  ) {
    return fallback;
  }

  return url;
}
