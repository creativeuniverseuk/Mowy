import type { Block } from "payload"
import { lexicalEditor } from "@payloadcms/richtext-lexical"

const TextBlock: Block = {
  slug: "textBlock",
  labels: {
    singular: "Text Block",
    plural: "Text Blocks",
  },
  fields: [
    {
      name: "richText",
      type: "richText",
      editor: lexicalEditor(),
      required: true,
    },
  ],
}

export default TextBlock
