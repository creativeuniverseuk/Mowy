import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import BinderHero from "@modules/home/components/binder-hero"
import { listCollections } from "@lib/data/collections"
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

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <BinderHero region={region} />
      <div id="featured" className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
