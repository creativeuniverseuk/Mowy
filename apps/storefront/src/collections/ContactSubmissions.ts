import type { CollectionConfig } from "payload"

const isLoggedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

/**
 * Every message sent through a Contact Form block (src/blocks/ContactForm.ts).
 * Written only by the storefront's /api/contact route through Payload's local
 * API, which bypasses access control — so create/update are closed off to
 * everyone else, including the public REST API Payload mounts at
 * /api/contact-submissions. Logged-in CMS users can read and delete.
 *
 * The admin already gets the full message by email; this is the record of
 * it, and the fallback when that email fails (see `emailStatus`).
 */
const ContactSubmissions: CollectionConfig = {
  slug: "contact-submissions",
  labels: {
    singular: "Contact Submission",
    plural: "Contact Submissions",
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "emailStatus", "createdAt"],
    description:
      "Messages sent through the website contact form. Each one is also emailed to the shop inbox — check Email status for any that didn't arrive.",
  },
  defaultSort: "-createdAt",
  access: {
    create: () => false,
    update: () => false,
    read: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
    },
    {
      name: "emailStatus",
      type: "select",
      label: "Email status",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      // SHA-256 of the sender's IP plus PAYLOAD_SECRET, never the raw IP —
      // only needed to count recent submissions per sender for the route's
      // rate limit.
      name: "ipHash",
      type: "text",
      index: true,
      admin: {
        hidden: true,
      },
    },
  ],
}

export default ContactSubmissions
