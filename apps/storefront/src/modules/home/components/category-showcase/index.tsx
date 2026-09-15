import { HttpTypes } from "@medusajs/types"

import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShowcaseGrid from "./showcase-grid"

// Canonical order from CLAUDE.md's confirmed catalogue — "CORE" vs "NEW"
// mirrors design-reference/mowy-homepage.html's .cat-tab .n badges.
const CATEGORY_ORDER = [
  { name: "Pokémon TCG", badge: "01 · CORE" },
  { name: "3D-Printed Figures", badge: "02 · CORE" },
  { name: "Lorcana", badge: "03 · NEW" },
  { name: "Riftbound", badge: "04 · NEW" },
  { name: "Cyberpunk", badge: "05 · NEW" },
  { name: "Palworld", badge: "06 · NEW" },
  { name: "Cataclysm: Arcade", badge: "07 · NEW" },
  { name: "Mystery Pulls", badge: "08 · NEW" },
]

export default async function CategoryShowcase({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const allCategories = await listCategories()
  const topLevel = allCategories.filter((c) => !c.parent_category)

  const orderedCategories = CATEGORY_ORDER.map((entry) =>
    topLevel.find((c) => c.name === entry.name)
  ).filter((c): c is HttpTypes.StoreProductCategory => Boolean(c))

  if (orderedCategories.length === 0) {
    return null
  }

  const productsByCategory = Object.fromEntries(
    await Promise.all(
      orderedCategories.map(async (category) => {
        const {
          response: { products },
        } = await listProducts({
          regionId: region.id,
          queryParams: { category_id: [category.id], limit: 8 },
        })
        return [category.id, products] as const
      })
    )
  )

  const tabs = orderedCategories.map((category) => ({
    id: category.id,
    name: category.name,
    handle: category.handle,
    badge:
      CATEGORY_ORDER.find((entry) => entry.name === category.name)?.badge ??
      "",
  }))

  return (
    <section id="find-your-set" className="content-container py-16 lg:py-[74px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <h2 className="text-h2 text-chrome">Find your set</h2>
        <LocalizedClientLink
          href="/store"
          className="whitespace-nowrap text-sm font-semibold text-cobalt-soft"
        >
          View all categories &rarr;
        </LocalizedClientLink>
      </div>

      <ShowcaseGrid tabs={tabs} productsByCategory={productsByCategory} />
    </section>
  )
}
