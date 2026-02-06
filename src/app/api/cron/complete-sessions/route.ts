import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, lt, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function verifyQStashSignature(request: Request): Promise<boolean> {
  const { Receiver } = await import("@upstash/qstash");

  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!signingKey || !nextSigningKey) {
    return false;
  }

  const receiver = new Receiver({
    currentSigningKey: signingKey,
    nextSigningKey: nextSigningKey,
  });

  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    return false;
  }

  const body = await request.text();
  try {
    await receiver.verify({
      signature,
      body,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mark sessions as completed if they are past their end time (scheduled_at + 50 minutes)
  const result = await db
    .update(sessions)
    .set({ status: "completed" })
    .where(
      and(
        eq(sessions.status, "scheduled"),
        lt(
          sessions.scheduledAt,
          sql`NOW() - INTERVAL '50 minutes'`
        )
      )
    )
    .returning({ id: sessions.id });

  return NextResponse.json({
    completed: result.length,
    sessionIds: result.map((r) => r.id),
  });
}
