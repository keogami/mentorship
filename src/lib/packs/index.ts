import { addMonths, startOfMonth } from "date-fns"
import { and, eq, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { packs } from "@/lib/db/schema"
import type { Pack } from "@/lib/db/types"

export async function getActivePack(userId: string): Promise<Pack | null> {
  const [pack] = await db
    .select()
    .from(packs)
    .where(
      and(
        eq(packs.userId, userId),
        gt(packs.expiresAt, new Date()),
        gt(packs.sessionsRemaining, 0)
      )
    )
    .limit(1)

  return pack ?? null
}

export async function createOrAddToPack(
  userId: string,
  sessionsToAdd: number
): Promise<Pack> {
  // Check for an existing active pack (expired check only, not sessions remaining)
  const [existing] = await db
    .select()
    .from(packs)
    .where(and(eq(packs.userId, userId), gt(packs.expiresAt, new Date())))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(packs)
      .set({
        sessionsTotal: existing.sessionsTotal + sessionsToAdd,
        sessionsRemaining: existing.sessionsRemaining + sessionsToAdd,
      })
      .where(eq(packs.id, existing.id))
      .returning()

    return updated
  }

  const expiresAt = startOfMonth(addMonths(new Date(), 1))

  const [created] = await db
    .insert(packs)
    .values({
      userId,
      sessionsTotal: sessionsToAdd,
      sessionsRemaining: sessionsToAdd,
      expiresAt,
    })
    .returning()

  return created
}
