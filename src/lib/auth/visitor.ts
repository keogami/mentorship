import { cookies } from "next/headers"

const VISITOR_COOKIE_NAME = "visitor_id"
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function generateVisitorId(): string {
  return crypto.randomUUID()
}

export async function getOrCreateVisitorId(): Promise<string> {
  const cookieStore = await cookies()
  const existingId = cookieStore.get(VISITOR_COOKIE_NAME)?.value

  if (existingId) {
    return existingId
  }

  const newId = generateVisitorId()

  cookieStore.set(VISITOR_COOKIE_NAME, newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: "/",
  })

  return newId
}

export async function getVisitorId(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(VISITOR_COOKIE_NAME)?.value
}
