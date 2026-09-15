import { notFound } from "next/navigation"

import { searchProducts } from "@lib/data/search"
import { CardFacets } from "@lib/util/card-facets"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryFilters from "@modules/categories/components/category-filters"
import CategoryPagination from "@modules/categories/components/category-pagination"
import ProductGrid from "@modules/home/components/product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const LIMIT = 12

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  query,
  facets,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  query?: string
  facets?: CardFacets
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const q = query || ""

  if (!category || !countryCode) notFound()

  const parents: HttpTypes.StoreProductCategory[] = []
  const getParents = (c: HttpTypes.StoreProductCategory) => {
    if (c.parent_category) {
      parents.push(c.parent_category)
      getParents(c.parent_category)
    }
  }
  getParents(category)

  const { products, count, facetDistribution } = await searchProducts({
    countryCode,
    categoryId: category.id,
    query: q,
    facets,
    sortBy: sort,
    page: pageNumber,
    limit: LIMIT,
  })

  const totalPages = Math.ceil(count / LIMIT)

  return (
    <div className="content-container py-10 lg:py-14" data-testid="category-container">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-chrome-dim">
        <LocalizedClientLink href="/store" className="hover:text-chrome">
          Store
        </LocalizedClientLink>
        {[...parents].reverse().map((parent) => (
          <span key={parent.id} className="flex items-center gap-2">
            <span>/</span>
            <LocalizedClientLink
              href={`/categories/${parent.handle}`}
              className="hover:text-chrome"
            >
              {parent.name}
            </LocalizedClientLink>
          </span>
        ))}
        <span>/</span>
        <span className="text-chrome">{category.name}</span>
      </div>

      <h1 className="mb-2 text-h1 text-chrome" data-testid="category-page-title">
        {category.name}
      </h1>

      {category.description && (
        <p className="mb-6 max-w-2xl text-body text-chrome-dim">
          {category.description}
        </p>
      )}

      {category.category_children && category.category_children.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2.5">
          {category.category_children.map((c) => (
            <LocalizedClientLink
              key={c.id}
              href={`/categories/${c.handle}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-chrome-dim transition-colors hover:border-cobalt-soft hover:text-chrome"
            >
              {c.name}
            </LocalizedClientLink>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-[240px]">
          <CategoryFilters facetDistribution={facetDistribution} />
        </aside>

        <div className="w-full">
          <p className="mb-4 font-mono text-xs text-chrome-dim">
            {count} {count === 1 ? "card" : "cards"}
          </p>

          <ProductGrid
            products={products}
            emptyLabel={
              q || Object.values(facets ?? {}).some((v) => v?.length)
                ? "No cards match those filters — try clearing a few."
                : "No cards sleeved here yet — check back soon."
            }
          />

          {totalPages > 1 && (
            <CategoryPagination page={pageNumber} totalPages={totalPages} />
          )}
        </div>
      </div>
    </div>
  )
}
