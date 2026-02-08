import { NextResponse } from "next/server"
import type { z } from "zod"

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

export function validateBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(body)

  if (!result.success) {
    const issues = result.error.issues
    const firstError = issues[0]
    const message = firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`.replace(
          /^:\s*/,
          ""
        )
      : "Invalid request body"

    return {
      success: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    }
  }

  return { success: true, data: result.data }
}
