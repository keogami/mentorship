export { proxy as middleware } from "@/proxy"

export const config = {
  matcher: ["/dashboard/:path*", "/sessions/:path*", "/admin/:path*"],
}
