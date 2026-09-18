import { notFound } from "next/navigation"

import { HttpTypes } from "@medusajs/types"
import {
  ProductPullPool,
  getMysteryPullOdds,
} from "@lib/data/mystery-pulls"

import MysteryPullView from "./mystery-pull-view"

/**
 * Renders in place of the standard ProductTemplate whenever the product
 * page detects a pull_pool link (see the products/[handle] page route).
 * Per-pool differences below are limited to pool.themeKey/packArtUrl and
 * the live odds data — no pool-specific branching.
 */
export default async function MysteryPullPage({
  product,
  pool,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  pool: ProductPullPool
  countryCode: string
}) {
  if (!product || !product.id) {
    return notFound()
  }

  const initialOdds = await getMysteryPullOdds(pool.poolId)
  const setLine = (product.collection?.title ?? "MOWY").toUpperCase()

  return (
    <div className="content-container py-10 lg:py-14" data-testid="mystery-pull-container">
      <MysteryPullView
        product={product}
        poolId={pool.poolId}
        packArtUrl={pool.packArtUrl}
        setLine={setLine}
        countryCode={countryCode}
        initialOdds={initialOdds}
      />
    </div>
  )
}
