"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getLocale } from "@lib/data/locale-actions"
import medusaError from "@lib/util/medusa-error"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  setCartId,
} from "./cookies"
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

export type ProductPullPool = {
  poolId: string
  themeKey: string
  packArtUrl: string | null
  isActive: boolean
}

/**
 * Looks up the pull_pool linked to a single product, if any — used by the
 * product page to decide whether to render the standard ProductTemplate or
 * MysteryPullPage. A plain products fetch (not listMysteryPullProducts)
 * since it's keyed by product id, needs no region/pricing, and only cares
 * whether the link exists.
 */
export const getProductPullPool = async (
  productId: string
): Promise<ProductPullPool | null> => {
  try {
    const { products } = await sdk.client.fetch<{
      products: (HttpTypes.StoreProduct & {
        pull_pool?: {
          id: string
          theme_key: string
          pack_art_url: string | null
          is_active: boolean
        } | null
      })[]
    }>("/store/products", {
      method: "GET",
      query: {
        id: [productId],
        fields: "id,+pull_pool.id,+pull_pool.theme_key,+pull_pool.pack_art_url,+pull_pool.is_active",
        limit: 1,
      },
      cache: "no-store",
    })

    const pool = products[0]?.pull_pool
    if (!pool?.id) {
      return null
    }

    return {
      poolId: pool.id,
      themeKey: pool.theme_key,
      packArtUrl: pool.pack_art_url,
      isActive: pool.is_active,
    }
  } catch {
    return null
  }
}

/**
 * Whether any of the given product ids is a mystery-pull pack — used by the
 * SumUp checkout return route to decide whether a just-completed order
 * should route to the pull-reveal overlay instead of the standard order
 * confirmation page. Only checks link existence, never assignment state:
 * assignment happens later (asynchronously, on payment.captured — see
 * apps/backend's src/subscribers/mystery-pull-assign-on-capture.ts), so an
 * order can be a mystery-pull order well before its result is ready.
 */
export const hasMysteryPullProduct = async (
  productIds: string[]
): Promise<boolean> => {
  const ids = productIds.filter(Boolean)
  if (!ids.length) {
    return false
  }

  try {
    const { products } = await sdk.client.fetch<{
      products: { id: string; pull_pool?: { id: string } | null }[]
    }>("/store/products", {
      method: "GET",
      query: {
        id: ids,
        fields: "id,+pull_pool.id",
        limit: ids.length,
      },
      cache: "no-store",
    })

    return products.some((product) => Boolean(product.pull_pool?.id))
  } catch {
    return false
  }
}

export type MysteryPullResult = {
  order_id: string
  line_item_id: string
  won_product_id: string
  won_variant_id: string | null
  rarity_tier: string
  rarity_color: string
  card_name: string | null
  image: string | null
}

/**
 * The real, already-drawn outcome for a customer's mystery-pull order —
 * never generated client-side. Returns null only for a 404, which means
 * "assignment hasn't run yet" (see the result route's doc comment) — the
 * normal, expected state while PullRevealOverlay is still polling. This
 * route is deliberately unauthenticated (the order id is the access
 * secret, same as core Medusa's GET /store/orders/:id), so no auth headers
 * are needed here.
 *
 * Any other failure (network error, 5xx, etc.) is a real problem and is
 * rethrown rather than swallowed into the same null — collapsing "not
 * ready yet" and "something is actually broken" into one signal is
 * exactly what left a previous version of this stuck silently shaking
 * forever on a genuine failure (a 401, back when this route required
 * auth) with no way to tell the difference. See CLAUDE.md's Mystery Pull
 * module note.
 */
export const getMysteryPullResult = async (
  orderId: string
): Promise<MysteryPullResult | null> => {
  try {
    return await sdk.client.fetch<MysteryPullResult>(
      `/store/mystery-pulls/orders/${orderId}/result`,
      { method: "GET", cache: "no-store" }
    )
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as any).status === 404) {
      return null
    }
    throw err
  }
}

/**
 * Starts a dedicated single-item checkout for one mystery-pull pack. A pull
 * purchase always gets its own fresh cart rather than joining whatever the
 * customer already has in their cart — mixing it in would make "the order
 * this pull came from" ambiguous for the reveal-routing check in the SumUp
 * return route, and conceptually a pull is a standalone "buy and open"
 * action, not an add-to-cart-and-keep-shopping one.
 */
export const buyMysteryPull = async ({
  variantId,
  countryCode,
}: {
  variantId: string
  countryCode: string
}) => {
  const region = await getRegion(countryCode)
  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  const headers = { ...(await getAuthHeaders()) }
  const locale = await getLocale()

  const { cart } = await sdk.store.cart
    .create({ region_id: region.id, locale: locale || undefined }, {}, headers)
    .catch(medusaError)
  await setCartId(cart.id)

  await sdk.store.cart
    .createLineItem(cart.id, { variant_id: variantId, quantity: 1 }, {}, headers)
    .catch(medusaError)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/checkout`)
}
