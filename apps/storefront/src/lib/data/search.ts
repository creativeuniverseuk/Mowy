"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import {
  CARD_FACET_FIELDS,
  CardFacets,
  FacetDistribution,
  buildMeiliFilter,
} from "@lib/util/card-facets"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { listProducts } from "./products"

type ProductsHitsResponse = {
  hits: { id: string }[]
  estimatedTotalHits: number
  facets?: FacetDistribution
}

/**
 * Faceted product search — filters/facets card_set/rarity/condition via
 * Meilisearch (apps/backend's /store/meilisearch/products-hits, see
 * apps/backend/src/search/products.ts), then hydrates the matching ids
 * with real pricing via the native /store/products route and sorts
 * in-memory (same approach as listProductsWithSort, since price isn't a
 * sortable Meilisearch attribute).
 */
export const searchProducts = async ({
  countryCode,
  regionId,
  categoryId,
  query = "",
  facets,
  sortBy = "created_at",
  page = 1,
  limit = 12,
}: {
  countryCode?: string
  regionId?: string
  categoryId?: string
  query?: string
  facets?: CardFacets
  sortBy?: SortOptions
  page?: number
  limit?: number
}): Promise<{
  products: Awaited<ReturnType<typeof listProducts>>["response"]["products"]
  count: number
  facetDistribution: FacetDistribution
  nextPage: number | null
}> => {
  const region = countryCode
    ? await getRegion(countryCode)
    : await retrieveRegion(regionId!)

  if (!region) {
    return { products: [], count: 0, facetDistribution: {}, nextPage: null }
  }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")) }

  const filter = buildMeiliFilter({ categoryId, facets })

  let hits: ProductsHitsResponse
  try {
    hits = await sdk.client.fetch<ProductsHitsResponse>(
      "/store/meilisearch/products-hits",
      {
        method: "GET",
        query: {
          query,
          ...(filter ? { filter } : {}),
          facets: CARD_FACET_FIELDS.join(","),
          limit: 100,
          offset: 0,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
  } catch {
    // Meilisearch unreachable — fall back to a plain category listing with
    // no facets rather than taking the whole page down.
    if (!categoryId) {
      return { products: [], count: 0, facetDistribution: {}, nextPage: null }
    }
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: { category_id: [categoryId], limit: 100 },
    })
    const sorted = sortProducts(response.products, sortBy)
    const start = (page - 1) * limit
    const paginated = sorted.slice(start, start + limit)
    return {
      products: paginated,
      count: sorted.length,
      facetDistribution: {},
      nextPage: start + limit < sorted.length ? page + 1 : null,
    }
  }

  const ids = hits.hits.map((h) => h.id).filter(Boolean)

  if (ids.length === 0) {
    return {
      products: [],
      count: 0,
      facetDistribution: hits.facets ?? {},
      nextPage: null,
    }
  }

  const { response } = await listProducts({
    regionId: region.id,
    queryParams: { id: ids, limit: ids.length },
  })

  const sorted = sortProducts(response.products, sortBy)
  const start = (page - 1) * limit
  const paginated = sorted.slice(start, start + limit)

  return {
    products: paginated,
    count: sorted.length,
    facetDistribution: hits.facets ?? {},
    nextPage: start + limit < sorted.length ? page + 1 : null,
  }
}
