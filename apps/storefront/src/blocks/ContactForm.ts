import type { Block } from "payload"

// Only the copy around the form is editable here — the form's own fields
// (name, email, message) are fixed, since the API route that receives them
// (src/app/(storefront)/api/contact/route.ts) expects exactly those.
const ContactForm: Block = {
  slug: "contactForm",
  labels: {
    singular: "Contact Form",
    plural: "Contact Forms",
  },
  fields: [
    {
      name: "heading",
      type: "text",
      defaultValue: "Send us a message",
    },
    {
      name: "intro",
      type: "textarea",
    },
    {
      name: "submitLabel",
      type: "text",
      label: "Submit button label",
      defaultValue: "Send message",
    },
    {
      name: "successMessage",
      type: "textarea",
      label: "Message shown after sending",
      defaultValue: "Thanks — your message is on its way. We'll get back to you by email.",
    },
  ],
}

export default ContactForm
