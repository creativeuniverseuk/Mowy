import { HttpTypes } from "@medusajs/types"

import { getProductPrice } from "@lib/util/get-product-price"
import { getBaseURL } from "@lib/util/env"
import { toJsonLdScript } from "@lib/util/json-ld"

/**
 * Product JSON-LD for a standard (non-Mystery-Pull) product page. Stock is
 * "in stock" if any variant is unmanaged, backorderable, or has quantity —
 * same rule as ProductActions' `inStock` (see
 * src/modules/products/components/product-actions/index.tsx).
 */
export default function ProductJsonLd({
  product,
  countryCode,
  selectedVariantId,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
  selectedVariantId?: string
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariantId,
  })
  const price = selectedVariantId ? variantPrice ?? cheapestPrice : cheapestPrice

  const variants = product.variants ?? []
  const inStock = variants.some((v) => {
    if (!v.manage_inventory) return true
    if (v.allow_backorder) return true
    return (v.inventory_quantity ?? 0) > 0
  })

  const baseUrl = getBaseURL()
  const url = `${baseUrl}/${countryCode}/products/${product.handle}`
  const sku = variants.find((v) => v.sku)?.sku ?? undefined
  const images = product.thumbnail
    ? [product.thumbnail]
    : product.images?.map((i) => i.url) ?? []

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    image: images,
    url,
    ...(sku ? { sku } : {}),
  }

  if (price) {
    data.offers = {
      "@type": "Offer",
      url,
      priceCurrency: price.currency_code?.toUpperCase() || "GBP",
      price: price.calculated_price_number,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLdScript(data) }}
    />
  )
}
