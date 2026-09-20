import { Metadata } from "next"

import BinderHero from "@modules/home/components/binder-hero"
import CategoryShowcase from "@modules/home/components/category-showcase"
import HomepageBanner from "@modules/home/components/homepage-banner"
import NewsletterBand from "@modules/home/components/newsletter-band"
import StoryBand from "@modules/home/components/story-band"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "MOWY — Trading Cards & Collectibles",
  description:
    "Hand-checked Pokémon TCG, 3D-printed figures, and a growing shelf of Lorcana, Riftbound and beyond.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  return (
    <>
      <HomepageBanner />
      <BinderHero region={region} />
      <CategoryShowcase region={region} />
      <StoryBand />
      <NewsletterBand />
    </>
  )
}
