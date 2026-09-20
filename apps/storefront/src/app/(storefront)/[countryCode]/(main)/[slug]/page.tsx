import { Metadata } from "next"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"
import { getPayload } from "payload"
import config from "@payload-config"
import RenderBlocks from "@/modules/pages/render-blocks"
import LivePreviewListener from "@/modules/pages/live-preview-listener"

const getBaseURL = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

/**
 * Fetches a Payload Page by slug through the local API (in-process — no
 * HTTP round trip, and the only way to pass `draft`, which the REST API
 * doesn't expose). `draft: true` returns the latest autosaved version
 * instead of the last published one; see src/app/(payload)/next/preview
 * for what turns that on for a given browser session.
 */
async function getPage(slug: string, draft: boolean) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    draft,
    limit: 1,
  })

  return docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { isEnabled: isDraftMode } = await draftMode()
  const page = await getPage(slug, isDraftMode)

  if (!page) {
    return {}
  }

  const title = page.meta?.title || page.title
  const description = page.meta?.description || undefined
  const imageUrl =
    typeof page.meta?.image === "object" && page.meta.image?.url
      ? page.meta.image.url
      : undefined

  return {
    title: `${title} | MOWY`,
    description,
    openGraph: {
      title: `${title} | MOWY`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params
  const { isEnabled: isDraftMode } = await draftMode()
  const page = await getPage(slug, isDraftMode)

  if (!page) {
    notFound()
  }

  return (
    <>
      {isDraftMode && <LivePreviewListener serverURL={getBaseURL()} />}
      <RenderBlocks blocks={page.layout} />
    </>
  )
}
