"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion } from "./regions"

export type MysteryPullOdds = {
  pool_id: string
  is_active: boolean
  total_remaining_qty: number
  outcomes: {
    id: string
    rarity_tier: string
    rarity_color: string
    remaining_qty: number
    percentage: number
  }[]
}

export type MysteryPullListing = {
  product: HttpTypes.StoreProduct
  poolId: string
  themeKey: string
  packArtUrl: string | null
  totalRemainingQty: number
  isAvailable: boolean
  // The rarest currently-pullable tier's colour, used as the pack's accent
  // — pull_pool itself has no colour field, only its outcomes do, so the
  // rarest available outcome's rarity_color stands in for a "theme colour".
  accentColor: string | null
}

const PRODUCTS_WITH_POOL_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+thumbnail,+pull_pool.id,+pull_pool.theme_key,+pull_pool.pack_art_url,+pull_pool.is_active"

/**
 * Live odds for a pool — always fetched fresh (no-store), since the
 * remaining-pull count changes with every purchase and a stale count here
 * would be actively misleading, unlike ordinary catalog data.
 */
export const getMysteryPullOdds = async (
  poolId: string
): Promise<MysteryPullOdds | null> => {
  try {
    return await sdk.client.fetch<MysteryPullOdds>(
      `/store/mystery-pulls/${poolId}/odds`,
      { method: "GET", cache: "no-store" }
    )
  } catch {
    return null
  }
}

/**
 * All products in the Mystery Pulls category, each paired with its pool's
 * live odds. Mirrors listProducts' field-fetching shape but adds the
 * pull_pool link (see allowPullPoolFields in apps/backend's
 * src/api/middlewares.ts) and hydrates every pool's current stock.
 */
export const listMysteryPullProducts = async ({
  categoryId,
  countryCode,
}: {
  categoryId: string
  countryCode: string
}): Promise<MysteryPullListing[]> => {
  const region = await getRegion(countryCode)
  if (!region) {
    return []
  }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")) }

  const { products } = await sdk.client.fetch<{
    products: (HttpTypes.StoreProduct & {
      pull_pool?: {
        id: string
        theme_key: string
        pack_art_url: string | null
        is_active: boolean
      } | null
    })[]
    count: number
  }>("/store/products", {
    method: "GET",
    query: {
      category_id: [categoryId],
      region_id: region.id,
      limit: 100,
      fields: PRODUCTS_WITH_POOL_FIELDS,
    },
    headers,
    next,
    cache: "force-cache",
  })

  const withPools = products.filter((product) => product.pull_pool?.id)

  return Promise.all(
    withPools.map(async (product) => {
      const pool = product.pull_pool!
      const odds = await getMysteryPullOdds(pool.id)

      const eligible = (odds?.outcomes ?? []).filter(
        (outcome) => outcome.remaining_qty > 0
      )
      const rarest = eligible.length
        ? eligible.reduce((min, outcome) =>
            outcome.percentage < min.percentage ? outcome : min
          )
        : null

      const isAvailable = Boolean(
        odds && odds.is_active && odds.total_remaining_qty > 0
      )

      return {
        product,
        poolId: pool.id,
        themeKey: pool.theme_key,
        packArtUrl: pool.pack_art_url,
        totalRemainingQty: odds?.total_remaining_qty ?? 0,
        isAvailable,
        accentColor: isAvailable ? rarest?.rarity_color ?? null : null,
      }
    })
  )
}
