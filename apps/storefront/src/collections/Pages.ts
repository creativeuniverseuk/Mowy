import type { CollectionConfig } from "payload"
import HeroBanner from "../blocks/HeroBanner"
import TextBlock from "../blocks/TextBlock"
import TeamGrid from "../blocks/TeamGrid"
import PhotoGallery from "../blocks/PhotoGallery"
import FAQAccordion from "../blocks/FAQAccordion"

const getBaseURL = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const DEFAULT_COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb"

const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    // Routes through the preview handler (src/app/(payload)/next/preview)
    // rather than straight at the public page — that's what turns on
    // Next.js draft mode for the iframe's session before it lands on the
    // real page, so the preview actually shows the unpublished draft
    // instead of whatever's live. See src/app/(storefront)/[countryCode]/
    // (main)/[slug]/page.tsx, which reads draft mode to decide which
    // version to fetch.
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === "string" ? data.slug : ""
        const params = new URLSearchParams({
          secret: process.env.PAYLOAD_PREVIEW_SECRET || "",
          slug,
          path: `/${DEFAULT_COUNTRY_CODE}/${slug}`,
        })
        return `${getBaseURL()}/next/preview?${params.toString()}`
      },
    },
  },
  versions: {
    drafts: {
      autosave: {
        interval: 800,
      },
    },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "layout",
      type: "blocks",
      blocks: [HeroBanner, TextBlock, TeamGrid, PhotoGallery, FAQAccordion],
    },
    {
      name: "meta",
      type: "group",
      label: "SEO",
      admin: {
        position: "sidebar",
      },
      fields: [
        {
          name: "title",
          type: "text",
          admin: {
            description: "Falls back to the page Title if left blank.",
          },
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Social share image",
        },
      ],
    },
  ],
}

export default Pages
