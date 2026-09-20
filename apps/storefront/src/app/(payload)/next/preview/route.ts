import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

/**
 * Turns on Next.js draft mode, then redirects into the real page — this is
 * what `admin.livePreview.url` (src/collections/Pages.ts) actually points
 * at, not the page directly. The iframe hits this once, gets the draft-mode
 * cookie set for its session, and every render after that (including the
 * ones the [slug] page itself does) reads the unpublished draft instead of
 * whatever's currently published. See src/app/(storefront)/[countryCode]/
 * (main)/[slug]/page.tsx for the read side.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const secret = searchParams.get("secret")
  const path = searchParams.get("path")

  if (!process.env.PAYLOAD_PREVIEW_SECRET || secret !== process.env.PAYLOAD_PREVIEW_SECRET) {
    return new Response("Invalid preview secret.", { status: 401 })
  }

  if (!path || !path.startsWith("/")) {
    return new Response("Missing or invalid `path` parameter.", { status: 400 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
