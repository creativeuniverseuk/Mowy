import React, { Suspense } from "react"
import { notFound } from "next/navigation"

import { HttpTypes } from "@medusajs/types"
import CardDetailsPanel from "@modules/products/components/card-details-panel"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import { ProductWithCardDetail } from "types/card-detail"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: ProductWithCardDetail
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container py-10 lg:py-14"
        data-testid="product-container"
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <ImageGallery images={images} title={product.title} />

          <div className="flex flex-col gap-8">
            <ProductInfo product={product} />

            {product.card_detail && (
              <CardDetailsPanel cardDetail={product.card_detail} />
            )}

            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            <p className="border-t border-line pt-5 text-sm text-chrome-dim">
              Hand-checked before it ships &middot; Tracked UK &amp;
              international shipping
            </p>
          </div>
        </div>
      </div>

      <div
        className="content-container my-16 lg:my-28"
        data-testid="related-products-container"
      >
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-[14px] border border-line bg-panel"
                />
              ))}
            </div>
          }
        >
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
