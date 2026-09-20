import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * On-demand cache revalidation, hit by the backend's product subscribers
 * (apps/backend/src/subscribers/product-changed.ts) after a create/update/
 * delete in the admin, so listing pages stop serving stale data (thumbnail,
 * price, title, or a deleted product lingering) without waiting for a
 * server restart.
 *
 * GET /api/revalidate?secret=...&tags=products,categories
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  const tags = (request.nextUrl.searchParams.get("tags") ?? "products")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  if (!tags.length) {
    return NextResponse.json({ message: "No tags provided" }, { status: 400 })
  }

  tags.forEach((tag) => revalidateTag(tag))

  return NextResponse.json({ revalidated: true, tags, now: Date.now() })
}
