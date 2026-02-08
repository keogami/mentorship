/**
 * Middleware for route protection using Auth.js v5 recommended pattern.
 * This file exports the middleware function and config.
 * Import and re-export from middleware.ts at project root.
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { adminRoutes, protectedRoutes } from "@/lib/auth/routes"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()
  const isAuthenticated = !!session?.user

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes to sign-in
  if ((isProtectedRoute || isAdminRoute) && !isAuthenticated) {
    const signinUrl = new URL("/signin", request.url)
    // Only pass the pathname as callbackUrl (not full URL) to prevent open redirects
    signinUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signinUrl)
  }

  // Admin route protection: only MENTOR_EMAIL can access
  if (isAdminRoute && isAuthenticated) {
    const mentorEmail = process.env.MENTOR_EMAIL
    if (!mentorEmail || session.user?.email !== mentorEmail) {
      const dashboardUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return NextResponse.next()
}
