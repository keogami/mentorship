import { NextResponse } from "next/server"
import { auth } from "@/auth"

type AdminAuthResult =
  | { authorized: true; email: string }
  | { authorized: false; response: NextResponse }

export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth()
  const mentorEmail = process.env.MENTOR_EMAIL

  if (
    !session?.user?.email ||
    !mentorEmail ||
    session.user.email !== mentorEmail
  ) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    }
  }

  return { authorized: true, email: session.user.email }
}
