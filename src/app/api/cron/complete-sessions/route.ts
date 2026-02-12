import { and, eq, lt, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs"
import { db } from "@/lib/db"
import { sessions } from "@/lib/db/schema"

async function handler() {
  const result = await db
    .update(sessions)
    .set({ status: "completed" })
    .where(
      and(
        eq(sessions.status, "scheduled"),
        lt(sessions.scheduledAt, sql`NOW() - INTERVAL '50 minutes'`)
      )
    )
    .returning({ id: sessions.id })

  if (result.length === 0) {
    console.log("[complete-sessions] No sessions to complete")
  } else {
    console.log(`[complete-sessions] Completed ${result.length} session(s): ${result.map((r) => r.id).join(", ")}`)
  }

  return NextResponse.json({
    completed: result.length,
    sessionIds: result.map((r) => r.id),
  })
}

export const POST = verifySignatureAppRouter(handler)
