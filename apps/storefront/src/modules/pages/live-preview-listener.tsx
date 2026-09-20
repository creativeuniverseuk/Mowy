"use client"

import { useRouter } from "next/navigation"
import { RefreshRouteOnSave } from "@payloadcms/live-preview-react"

/**
 * Only rendered while draft mode is on (see [slug]/page.tsx) — it's the
 * client-side half of live preview. Payload's admin panel posts a message
 * into this iframe on every form change; this listens for it and calls
 * `router.refresh()`, which re-runs the page's server component (the same
 * `draft: true` fetch getPage() already does) so the iframe shows the
 * unsaved edit without a manual reload. A real visitor never renders this —
 * draft mode is never on for them.
 */
export default function LivePreviewListener({
  serverURL,
}: {
  serverURL: string
}) {
  const router = useRouter()

  return (
    <RefreshRouteOnSave
      serverURL={serverURL}
      depth={2}
      refresh={() => router.refresh()}
    />
  )
}
