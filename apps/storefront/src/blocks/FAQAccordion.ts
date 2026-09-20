import type { Block } from "payload"

const FAQAccordion: Block = {
  slug: "faqAccordion",
  labels: {
    singular: "FAQ Accordion",
    plural: "FAQ Accordions",
  },
  fields: [
    {
      name: "items",
      type: "array",
      labels: {
        singular: "Question",
        plural: "Questions",
      },
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
        },
        {
          name: "answer",
          type: "textarea",
          required: true,
        },
      ],
    },
  ],
}

export default FAQAccordion
