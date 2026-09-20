import type { Block } from "payload"

const HeroBanner: Block = {
  slug: "heroBanner",
  labels: {
    singular: "Hero Banner",
    plural: "Hero Banners",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "subheading",
      type: "text",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "cta",
      type: "group",
      label: "Call to action",
      fields: [
        {
          name: "label",
          type: "text",
        },
        {
          name: "url",
          type: "text",
        },
      ],
    },
  ],
}

export default HeroBanner
