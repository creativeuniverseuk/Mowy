import { searchProducts } from "@lib/data/search"
import ProductGrid from "@modules/home/components/product-grid"
import { ProductWithCardDetail } from "types/card-detail"

export default async function RelatedProducts({
  product,
  countryCode,
}: {
  product: ProductWithCardDetail
  countryCode: string
}) {
  const cardSet = product.card_detail?.card_set
  const categoryId = product.categories?.[0]?.id

  if (!cardSet && !categoryId) {
    return null
  }

  const { products } = await searchProducts({
    countryCode,
    categoryId: cardSet ? undefined : categoryId,
    facets: cardSet ? { card_set: [cardSet] } : undefined,
    limit: 5,
  })

  const related = products.filter((p) => p.id !== product.id).slice(0, 4)

  if (!related.length) {
    return null
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-2 font-mono text-xs uppercase tracking-[0.1em] text-cobalt-soft">
          {cardSet ? cardSet : "You might also like"}
        </span>
        <h2 className="text-h2 text-chrome">More from this set</h2>
      </div>

      <ProductGrid products={related} emptyLabel="" />
    </div>
  )
}
