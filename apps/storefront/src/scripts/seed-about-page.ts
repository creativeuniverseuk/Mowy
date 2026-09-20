import { getPayload } from "payload"
import config from "../payload.config"

/**
 * Seeds the "About Us" page referenced in the Payload CMS setup — a hero
 * banner, a text block, and an FAQ accordion, enough to exercise three of
 * the five block types end to end. Safe to run more than once: it updates
 * the existing "about-us" page instead of creating a duplicate.
 *
 * Run with `pnpm seed:pages` (see CLAUDE.md's Payload CMS note for the
 * Node-version caveat that command currently has).
 */
async function seed() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: "pages",
    where: { slug: { equals: "about-us" } },
    limit: 1,
  })

  const data = {
    title: "About Us",
    slug: "about-us",
    layout: [
      {
        blockType: "heroBanner" as const,
        heading: "About MOWY",
        subheading: "Family-run, Blackpool-based, card by card.",
        cta: {
          label: "Shop new drops",
          url: "/",
        },
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
              {
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
                    text: "MOWY started life as Snorlax and Mowy TCG, trading Pokémon cards face to face at Abingdon Street Market in Blackpool. We hand-check every card before it ships and are always adding new lines — 3D-printed figures, Lorcana, Riftbound and beyond.",
                    version: 1,
                  },
                ],
                direction: "ltr" as const,
              },
            ],
            direction: "ltr" as const,
          },
        },
      },
      {
        blockType: "faqAccordion" as const,
        items: [
          {
            question: "Where are you based?",
            answer: "Abingdon Street Market, Edward St, Blackpool FY1 1DR.",
          },
          {
            question: "Do you grade cards?",
            answer:
              "We hand-check condition on everything we sell; third-party grading (PSA, BGS, CGC) is noted on the listing where it applies.",
          },
        ],
      },
    ],
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: "pages",
      id: existing.docs[0].id,
      data,
      draft: false,
    })
    console.log(`Updated existing "about-us" page (${existing.docs[0].id}).`)
  } else {
    const created = await payload.create({
      collection: "pages",
      data,
      draft: false,
    })
    console.log(`Created "about-us" page (${created.id}).`)
  }

  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
