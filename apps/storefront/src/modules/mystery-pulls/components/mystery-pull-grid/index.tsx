"use client"

import { motion } from "framer-motion"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { MysteryPullListing } from "@lib/data/mystery-pulls"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import GradingPriceTag from "@modules/common/components/grading-price-tag"

// Same fallback thumb gradients as the standard product grid
// (src/modules/home/components/product-grid), cycled per card, for a
// consistent look when a pool has no pack art yet.
const FALLBACK_THUMBS = [
  "linear-gradient(150deg,#26314a,#12151d)",
  "linear-gradient(150deg,#3a2b45,#15111d)",
  "linear-gradient(150deg,#2b4030,#111a13)",
  "linear-gradient(150deg,#453321,#1a140d)",
]

// A pool below this remaining count reads as "low-stock" (amber) rather
// than "live" (green) — no backend threshold exists for this, it's a
// storefront-only display choice.
const LOW_STOCK_THRESHOLD = 10

export default function MysteryPullGrid({
  listings,
  emptyLabel,
}: {
  listings: MysteryPullListing[]
  emptyLabel: string
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-panel px-6 py-16 text-center">
        <p className="text-body text-chrome-dim">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing, i) => (
        <MysteryPullCard key={listing.product.id} listing={listing} index={i} />
      ))}
    </div>
  )
}

function MysteryPullCard({
  listing,
  index,
}: {
  listing: MysteryPullListing
  index: number
}) {
  const { product, packArtUrl, totalRemainingQty, isAvailable, accentColor } =
    listing
  const { cheapestPrice } = getProductPrice({ product })
  const setLine = (product.collection?.title ?? "MOWY").toUpperCase()
  const thumbnailSrc = packArtUrl || product.thumbnail

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: (index % 4) * 0.05 }}
      whileHover={isAvailable ? { y: -5 } : undefined}
      className={`group overflow-hidden rounded-[14px] border bg-panel transition-colors duration-200 ${
        isAvailable
          ? "border-line hover:border-cobalt/35"
          : "border-line opacity-70"
      }`}
      style={
        isAvailable && accentColor
          ? { borderTopWidth: 2, borderTopColor: accentColor }
          : undefined
      }
    >
      <LocalizedClientLink href={`/products/${product.handle}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-panel">
          {thumbnailSrc ? (
            <Image
              src={thumbnailSrc}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 45vw, 23vw"
              className={`object-contain ${!isAvailable ? "grayscale" : ""}`}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: FALLBACK_THUMBS[index % FALLBACK_THUMBS.length],
                filter: isAvailable ? undefined : "grayscale(1)",
              }}
            />
          )}

          <span className="absolute left-2.5 top-2.5">
            {isAvailable ? (
              <Badge
                variant={
                  totalRemainingQty <= LOW_STOCK_THRESHOLD ? "low-stock" : "live"
                }
              >
                {totalRemainingQty} pulls remaining
              </Badge>
            ) : (
              <Badge variant="out-of-stock">Sold out</Badge>
            )}
          </span>
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
            {isAvailable ? (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-chrome transition-colors duration-200 group-hover:border-chrome group-hover:bg-chrome group-hover:text-ink"
                aria-hidden
              >
                +
              </span>
            ) : (
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-chrome-dim"
                aria-hidden
              >
                &times;
              </span>
            )}
          </div>
        </div>
      </LocalizedClientLink>
    </motion.div>
  )
}
