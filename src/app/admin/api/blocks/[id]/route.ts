import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin/auth"
import { checkCsrf } from "@/lib/csrf"
import { db } from "@/lib/db"
import { mentorBlocks, subscriptionCredits } from "@/lib/db/schema"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = checkCsrf(request)
  if (csrfError) return csrfError

  const adminCheck = await requireAdmin()
  if (!adminCheck.authorized) return adminCheck.response

  const { id } = await params

  // Check block exists
  const [block] = await db
    .select()
    .from(mentorBlocks)
    .where(eq(mentorBlocks.id, id))

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 })
  }

  // Revoke credits that were issued for this block
  await db
    .delete(subscriptionCredits)
    .where(eq(subscriptionCredits.blockId, id))

  // Delete the block
  await db.delete(mentorBlocks).where(eq(mentorBlocks.id, id))

  return NextResponse.json({ success: true })
}
