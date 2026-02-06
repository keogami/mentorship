import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) {
    return NextResponse.json({ subscription: null });
  }

  // Check for active subscription first
  const [activeSub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "active")
      )
    );

  if (activeSub) {
    return NextResponse.json({
      subscription: { status: activeSub.status },
    });
  }

  // Check for pending subscription
  const [pendingSub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, "pending")
      )
    );

  if (pendingSub) {
    return NextResponse.json({
      subscription: { status: pendingSub.status },
    });
  }

  return NextResponse.json({ subscription: null });
}
