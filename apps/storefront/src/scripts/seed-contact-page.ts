import { getPayload } from "payload"
import config from "../payload.config"

/**
 * Seeds the "Contact Us" page — a hero banner, a text block with the
 * market stall's details, and the Contact Form block — as a working
 * example of the form end to end. Once seeded it's an ordinary Page:
 * edit it from the Pages editor in /admin like any other. Safe to run more
 * than once: it updates the existing "contact-us" page instead of creating
 * a duplicate (which also resets any edits made in the admin since).
 *
 * Run with the esbuild+node workaround documented in CLAUDE.md's Payload
 * CLI gotcha (the `payload run` CLI itself is broken on this project's
 * Node version).
 */
function paragraph(text: string) {
  return {
    type: "paragraph",
    format: "" as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: "text",
        format: 0,
        detail: 0,
        mode: "normal" as const,
        style: "",
        text,
        version: 1,
      },
    ],
    direction: "ltr" as const,
  }
}

async function seed() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: "contact-us" } },
    limit: 1,
  })

  const data = {
    title: "Contact Us",
    slug: "contact-us",
    layout: [
      {
        blockType: "heroBanner" as const,
        heading: "Get in touch",
        subheading:
          "Questions about an order, a card, or a Mystery Pull? Drop us a message and we'll reply by email.",
      },
      {
        blockType: "textBlock" as const,
        richText: {
          root: {
            type: "root",
            format: "" as const,
            indent: 0,
            version: 1,
            children: [
              paragraph(
                "Prefer to talk in person? Find us at Abingdon Street Market, Edward St, Blackpool FY1 1DR."
              ),
            ],
            direction: "ltr" as const,
          },
        },
      },
      {
        blockType: "contactForm" as const,
        heading: "Send us a message",
        intro: "We usually reply within one working day.",
        submitLabel: "Send message",
        successMessage:
          "Thanks — your message is on its way. We'll get back to you by email.",
      },
    ],
    meta: {
      title: "Contact MOWY",
      description:
        "Get in touch with MOWY — trading cards, 3D-printed figures and Mystery Pulls from Abingdon Street Market, Blackpool.",
    },
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: "pages",
      id: existing.docs[0].id,
      data,
      draft: false,
    })
    console.log(`Updated existing "contact-us" page (${existing.docs[0].id}).`)
  } else {
    const created = await payload.create({
      collection: "pages",
      data,
      draft: false,
    })
    console.log(`Created "contact-us" page (${created.id}).`)
  }

  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
