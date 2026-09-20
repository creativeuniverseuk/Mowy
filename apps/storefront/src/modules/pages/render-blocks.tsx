import type { Page } from "@/payload-types"
import HeroBanner from "./blocks/hero-banner"
import TextBlock from "./blocks/text-block"
import TeamGrid from "./blocks/team-grid"
import PhotoGallery from "./blocks/photo-gallery"
import FAQAccordion from "./blocks/faq-accordion"

type LayoutBlock = NonNullable<Page["layout"]>[number]

const blockComponents: {
  [K in LayoutBlock["blockType"]]: React.ComponentType<
    Extract<LayoutBlock, { blockType: K }>
  >
} = {
  heroBanner: HeroBanner,
  textBlock: TextBlock,
  teamGrid: TeamGrid,
  photoGallery: PhotoGallery,
  faqAccordion: FAQAccordion,
}

/**
 * Maps each block in a Page's `layout` (src/collections/Pages.ts) to its
 * MOWY-styled renderer. An unrecognised `blockType` (a block added in
 * Payload's config after this file was last updated) is skipped rather than
 * throwing — a missing renderer shouldn't take the whole page down.
 */
export default function RenderBlocks({ blocks }: { blocks: Page["layout"] }) {
  if (!blocks?.length) {
    return null
  }

  return (
    <>
      {blocks.map((block, index) => {
        const Block = blockComponents[block.blockType] as React.ComponentType<
          typeof block
        >

        if (!Block) {
          return null
        }

        return <Block key={block.id ?? index} {...block} />
      })}
    </>
  )
}
