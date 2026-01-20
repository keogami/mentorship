import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/sessions"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()
  const isAuthenticated = !!session?.user

  // Redirect unauthenticated users from protected routes to subscribe
  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) &&
    !isAuthenticated
  ) {
    const subscribeUrl = new URL("/subscribe", request.url)
    subscribeUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(subscribeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/sessions/:path*"],
}
