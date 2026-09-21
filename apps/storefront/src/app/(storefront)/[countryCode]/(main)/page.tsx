import { Metadata } from "next"

import BinderHero from "@modules/home/components/binder-hero"
import CategoryShowcase from "@modules/home/components/category-showcase"
import HomepageBanner from "@modules/home/components/homepage-banner"
import NewsletterBand from "@modules/home/components/newsletter-band"
import StoryBand from "@modules/home/components/story-band"
import { getRegion } from "@lib/data/regions"

const DESCRIPTION =
  "Hand-checked Pokémon TCG, 3D-printed figures, and a growing shelf of Lorcana, Riftbound and beyond."

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const canonicalPath = `/${countryCode}`

  return {
    description: DESCRIPTION,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      description: DESCRIPTION,
      url: canonicalPath,
    },
  }
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
