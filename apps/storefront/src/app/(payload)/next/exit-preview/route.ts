import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

/**
 * Turns draft mode back off — the counterpart to next/preview. Without
 * this there's no way for a real visitor who followed a preview link to
 * ever get back to seeing published content in that browser.
 */
export async function GET(req: NextRequest) {
  const draft = await draftMode()
  draft.disable()

  const path = req.nextUrl.searchParams.get("path")
  redirect(path && path.startsWith("/") ? path : "/")
}
