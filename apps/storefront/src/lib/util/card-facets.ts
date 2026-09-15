/**
 * Card facet helpers — kept out of lib/data/search.ts ("use server") since
 * a server-action module may only export async functions, not plain
 * values/types-at-runtime.
 */

/** Card-facetable fields — mirrors apps/backend/src/search/products.ts */
export const CARD_FACET_FIELDS = ["card_set", "rarity", "condition"] as const
export type CardFacetField = (typeof CARD_FACET_FIELDS)[number]
export type CardFacets = Partial<Record<CardFacetField, string[]>>

/**
 * Shape returned by /store/meilisearch/products-hits's `facets` field —
 * the Medusa search module's normalized facet-distribution envelope, not
 * Meilisearch's raw flat `{ field: { value: count } }` map.
 */
export type FacetDistribution = Partial<
  Record<
    CardFacetField,
    { type: string; values: { value: string; count: number }[] }
  >
>

function escapeMeiliValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

export function buildMeiliFilter({
  categoryId,
  facets,
}: {
  categoryId?: string
  facets?: CardFacets
}): string | undefined {
  const clauses: string[] = []

  if (categoryId) {
    clauses.push(`categories.id = "${escapeMeiliValue(categoryId)}"`)
  }

  for (const field of CARD_FACET_FIELDS) {
    const values = facets?.[field]
    if (values?.length) {
      const quoted = values.map((v) => `"${escapeMeiliValue(v)}"`).join(", ")
      clauses.push(`${field} IN [${quoted}]`)
    }
  }

  return clauses.length ? clauses.join(" AND ") : undefined
}

export function parseCsvParam(value: string | null | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : []
}
