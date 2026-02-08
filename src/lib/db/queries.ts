import { MENTOR_CONFIG } from "@/lib/constants"
import { db } from "@/lib/db"
import { mentorConfig } from "@/lib/db/schema"

export async function getMentorConfig() {
  const [config] = await db.select().from(mentorConfig).limit(1)

  return config || MENTOR_CONFIG
}
