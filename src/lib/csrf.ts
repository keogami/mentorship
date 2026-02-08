import { NextResponse } from "next/server"

/**
 * Lightweight CSRF protection via Origin header check.
 * Returns null if the request is safe, or a 403 response if it's a potential CSRF attack.
 *
 * Only checks POST/PUT/PATCH/DELETE requests with an Origin header.
 * Requests without an Origin header are allowed (direct API calls, curl, etc.)
 */

export function checkCsrf(request: Request): NextResponse | null {
  const method = request.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null
  }

  const origin = request.headers.get("origin")
  if (!origin) {
    // No Origin header — likely a server-to-server call or curl.
    // SameSite cookies still protect against cross-site browser requests.
    return null
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return null
  }

  try {
    const originHost = new URL(origin).host
    const siteHost = new URL(siteUrl).host

    if (originHost !== siteHost) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}
