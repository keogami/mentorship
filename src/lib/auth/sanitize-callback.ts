/**
 * Sanitize a callbackUrl to prevent open redirects.
 * Only allows relative paths (starting with /).
 * Returns the default if the URL is absolute or malicious.
 */
// TODO: rewrite this implementation to:
// check that the `url` is not a valid url based on URL api. because relative URLs aren't valid and we _want_ to ensure relative paths.
// TODO: validate that this approach actually solves open redirects.
export function sanitizeCallbackUrl(
  url: string | undefined | null,
  fallback = "/dashboard"
): string {
  if (!url) return fallback

  // Reject absolute URLs, protocol-relative URLs, and anything with ://
  if (url.includes("://") || url.startsWith("//") || !url.startsWith("/")) {
    return fallback
  }

  return url
}
