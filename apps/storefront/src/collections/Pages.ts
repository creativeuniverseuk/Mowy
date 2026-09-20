import type { CollectionConfig } from "payload"
import HeroBanner from "../blocks/HeroBanner"
import TextBlock from "../blocks/TextBlock"
import TeamGrid from "../blocks/TeamGrid"
import PhotoGallery from "../blocks/PhotoGallery"
import FAQAccordion from "../blocks/FAQAccordion"

const getBaseURL = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"

const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    // Points at the (not-yet-built) public page-rendering route for this
    // slug — see CLAUDE.md's Payload CMS note. The generator only needs to
    // produce a URL string; it doesn't require that route to exist for the
    // collection config itself to be valid.
    livePreview: {
      url: ({ data }) =>
        `${getBaseURL()}/pages/${typeof data?.slug === "string" ? data.slug : ""}`,
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
  ],
}

export default Pages
