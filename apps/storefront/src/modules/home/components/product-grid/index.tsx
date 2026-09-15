"use client"

import { HttpTypes } from "@medusajs/types"
import { motion } from "framer-motion"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import GradingPriceTag from "../grading-price-tag"

// Fallback thumb gradients — matches design-reference/mowy-homepage.html's
// .t1–.t4 product-card thumbnail gradients, cycled per card.
const FALLBACK_THUMBS = [
  "linear-gradient(150deg,#26314a,#12151d)",
  "linear-gradient(150deg,#3a2b45,#15111d)",
  "linear-gradient(150deg,#2b4030,#111a13)",
  "linear-gradient(150deg,#453321,#1a140d)",
]

export default function ProductGrid({
  products,
  emptyLabel,
}: {
  products: HttpTypes.StoreProduct[]
  emptyLabel: string
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-panel px-6 py-16 text-center">
        <p className="text-body text-chrome-dim">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  )
}

function ProductCard({
  product,
  index,
}: {
  product: HttpTypes.StoreProduct
  index: number
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const badge = product.subtitle?.toUpperCase()
  const setLine = (product.collection?.title ?? "MOWY").toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: (index % 4) * 0.05 }}
      whileHover={{ y: -5 }}
      className="group overflow-hidden rounded-[14px] border border-line bg-panel transition-colors duration-200 hover:border-cobalt/35"
    >
      <LocalizedClientLink href={`/products/${product.handle}`}>
        <div className="relative aspect-square overflow-hidden">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 45vw, 23vw"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: FALLBACK_THUMBS[index % FALLBACK_THUMBS.length],
              }}
            />
          )}
          {badge && (
            <span className="absolute left-2.5 top-2.5 rounded-[5px] border border-cobalt/40 bg-ink/75 px-2 py-1 font-mono text-[10px] text-cobalt-soft">
              {badge}
            </span>
          )}
        </div>

        <div className="px-4 pb-[18px] pt-4">
          <div className="mb-1.5 font-mono text-[10.5px] text-chrome-dim">
            {setLine}
          </div>
          <h4 className="mb-2.5 line-clamp-2 text-sm font-semibold leading-[1.3] text-chrome">
            {product.title}
          </h4>
          <div className="flex items-center justify-between">
            {cheapestPrice ? (
              <GradingPriceTag
                price={cheapestPrice.calculated_price}
                originalPrice={
                  cheapestPrice.price_type === "sale"
                    ? cheapestPrice.original_price
                    : undefined
                }
              />
            ) : (
              <span className="font-mono text-xs text-chrome-dim">
                Price on request
              </span>
            )}
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-chrome transition-colors duration-200 group-hover:border-chrome group-hover:bg-chrome group-hover:text-ink"
              aria-hidden
            >
              +
            </span>
          </div>
        </div>
      </LocalizedClientLink>
    </motion.div>
  )
}
