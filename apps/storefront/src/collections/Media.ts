import type { CollectionConfig } from "payload"
import path from "path"
import { fileURLToPath } from "url"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Backs every upload field used by Pages' blocks (hero image, team photos,
// gallery images). Local disk storage — self-hosted, no cloud file provider
// wired up for Payload yet (Medusa's own uploads go through Cloudinary; see
// CLAUDE.md — that's a separate concern from this CMS).
const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, "../../media"),
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: undefined,
        position: "centre",
      },
    ],
    mimeTypes: ["image/*"],
  },
}

export default Media
