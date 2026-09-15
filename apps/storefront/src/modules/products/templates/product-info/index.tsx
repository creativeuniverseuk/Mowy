import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function ProductInfo({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  return (
    <div id="product-info" className="flex flex-col gap-3">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="font-mono text-xs uppercase tracking-[0.1em] text-cobalt-soft hover:underline"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}

      <h1 className="text-h2 text-chrome" data-testid="product-title">
        {product.title}
      </h1>

      {product.description && (
        <p
          className="whitespace-pre-line text-body text-chrome-dim"
          data-testid="product-description"
        >
          {product.description}
        </p>
      )}
    </div>
  )
}
