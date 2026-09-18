"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HttpTypes } from "@medusajs/types"
import {
  MysteryPullOdds,
  buyMysteryPull,
  getMysteryPullOdds,
} from "@lib/data/mystery-pulls"
import { getProductPrice } from "@lib/util/get-product-price"
import { lightenHex } from "@modules/mystery-pulls/utils/theme"
import GradingPriceTag from "@modules/common/components/grading-price-tag"

// Same "amber below this count" cutoff as MysteryPullGrid — no backend
// threshold exists for this, it's a storefront-only display choice.
const LOW_STOCK_THRESHOLD = 10

// Odds are re-fetched on this interval so the box and the pack glow reflect
// stock changes from other customers buying the same pool while this page
// is open.
const ODDS_POLL_MS = 8000

const NEUTRAL_ACCENT = "#5a5a68"

export default function MysteryPullView({
  product,
  poolId,
  packArtUrl,
  setLine,
  countryCode,
  initialOdds,
}: {
  product: HttpTypes.StoreProduct
  poolId: string
  packArtUrl: string | null
  setLine: string
  countryCode: string
  initialOdds: MysteryPullOdds | null
}) {
  const [odds, setOdds] = useState(initialOdds)
  const [isBuying, setIsBuying] = useState(false)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const fresh = await getMysteryPullOdds(poolId)
      if (fresh && !cancelled) {
        setOdds(fresh)
      }
    }

    const interval = setInterval(poll, ODDS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [poolId])

  const eligible = (odds?.outcomes ?? []).filter((o) => o.remaining_qty > 0)
  const rarest = eligible.length
    ? eligible.reduce((min, o) => (o.percentage < min.percentage ? o : min))
    : null

  const isAvailable = Boolean(odds?.is_active && (odds?.total_remaining_qty ?? 0) > 0)
  const accentColor = isAvailable ? rarest?.rarity_color ?? NEUTRAL_ACCENT : NEUTRAL_ACCENT
  const accentSoft = lightenHex(accentColor, 0.35)

  const variant = product.variants?.[0]
  const price = getProductPrice({ product, variantId: variant?.id })
  const selectedPrice = price.variantPrice || price.cheapestPrice || null

  const thumbnailSrc = packArtUrl || product.thumbnail

  const handleBuy = async () => {
    if (!variant?.id || !isAvailable || isBuying) return
    setIsBuying(true)
    try {
      await buyMysteryPull({ variantId: variant.id, countryCode })
    } catch {
      // A redirect() throws internally too, but Next's client runtime
      // follows it as navigation rather than surfacing it here — this
      // catch only ever fires for a genuine failure, so re-enable the
      // button rather than leaving it stuck on "Starting checkout…".
      setIsBuying(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
      <div
        className="relative flex h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-line"
        style={{
          background: `radial-gradient(circle at 50% 38%, ${accentColor} -180%, #1a1a24 65%)`,
        }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-60 w-[170px] overflow-hidden rounded-[14px] border border-white/10"
          style={{
            background: `linear-gradient(165deg, ${accentColor} 0%, #0c0c10 75%)`,
            boxShadow: `0 0 70px -10px ${accentColor}`,
          }}
        >
          {thumbnailSrc && (
            <Image
              src={thumbnailSrc}
              alt={product.title}
              fill
              sizes="170px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-2.5">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-white/85">
              {setLine}
            </span>
          </div>
          <div
            className="absolute bottom-3 right-3 flex h-[18px] w-[18px] items-center justify-center bg-white/90 font-headline text-[9px] font-bold text-ink"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            M
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col">
        <h1 className="text-h1 text-chrome">{product.title}</h1>
        <p className="mt-2 text-sm text-chrome-dim">
          One card, sealed and unrevealed until you open it. Every pull is
          drawn from real in-stock inventory.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {selectedPrice ? (
            <GradingPriceTag
              price={selectedPrice.calculated_price}
              originalPrice={
                selectedPrice.price_type === "sale"
                  ? selectedPrice.original_price
                  : undefined
              }
            />
          ) : (
            <span className="font-mono text-xs text-chrome-dim">
              Price on request
            </span>
          )}

          {odds ? (
            isAvailable ? (
              <Badge
                variant={
                  odds.total_remaining_qty <= LOW_STOCK_THRESHOLD
                    ? "low-stock"
                    : "live"
                }
              >
                {odds.total_remaining_qty} pulls remaining
              </Badge>
            ) : (
              <Badge variant="out-of-stock">Sold out</Badge>
            )
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-panel px-[18px] py-4">
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-chrome-dim">
            Disclosed pull odds
          </div>
          {(odds?.outcomes ?? []).map((outcome, i) => (
            <div
              key={outcome.id}
              className={`flex items-center justify-between py-[7px] text-sm ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <span className="flex items-center text-chrome">
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: outcome.rarity_color }}
                />
                {outcome.rarity_tier}
              </span>
              <span className="text-chrome-dim">{outcome.percentage}%</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleBuy}
          disabled={!isAvailable || !variant?.id || isBuying}
          size="lg"
          className="mt-6 w-full text-ink hover:opacity-90"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentSoft})`,
          }}
          data-testid="buy-pull-button"
        >
          {isBuying
            ? "Starting checkout…"
            : !isAvailable
            ? "Sold out"
            : `Buy and open a pull${
                selectedPrice ? ` — ${selectedPrice.calculated_price}` : ""
              }`}
        </Button>

        <p className="mt-2.5 text-[11px] leading-relaxed text-chrome-dim">
          Odds shown reflect current pool contents and update automatically
          as stock changes. Your pull is assigned at the moment of payment.
        </p>
      </div>
    </div>
  )
}
