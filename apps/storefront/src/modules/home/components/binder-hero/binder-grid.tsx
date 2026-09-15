"use client"

import { HttpTypes } from "@medusajs/types"
import { motion } from "framer-motion"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Fallback pocket art (used when a slot has no product thumbnail), matched
 * 1:1 to the per-pocket gradients in design-reference/mowy-homepage.html.
 */
const FALLBACK_ART = [
  "linear-gradient(135deg,#2b3a55,#101722)",
  "linear-gradient(135deg,#3a2b45,#171021)",
  "linear-gradient(135deg,#2b4535,#0f1a14)",
  "linear-gradient(135deg,#453a2b,#1a1610)",
  "linear-gradient(135deg,#452b39,#1a1015)",
  "linear-gradient(135deg,#2b3f45,#0f171a)",
  "linear-gradient(135deg,#3f452b,#171a0f)",
  "linear-gradient(135deg,#452b2b,#1a0f0f)",
  "linear-gradient(135deg,#2b3245,#0f121a)",
]

// Foil sheen sweep — chrome white to transparent, with a cobalt kicker, as
// specified in design-reference/mowy-homepage.html's .pocket .sheen rule.
const SHEEN_GRADIENT =
  "linear-gradient(115deg, transparent 30%, rgba(232,233,238,0.35) 45%, rgba(185,194,208,0.35) 55%, rgba(59,110,255,0.35) 65%, transparent 75%)"

// Decorative rarity dot — reference shows it on pockets 1, 3, 5, 8 (1-indexed).
const RARITY_DOT_SLOTS = new Set([0, 2, 4, 7])

const pocketVariants = {
  rest: { borderColor: "rgba(255,255,255,0.06)" },
  hover: { borderColor: "rgba(59,110,255,0.4)" },
}

const sheenVariants = {
  rest: { x: "-120%" },
  hover: { x: "120%" },
}

export default function BinderGrid({
  products,
}: {
  products: HttpTypes.StoreProduct[]
}) {
  const slots = Array.from({ length: 9 }, (_, i) => products[i])

  return (
    <div className="[perspective:1400px]">
      <div className="relative mx-auto max-w-[460px] [transform-style:preserve-3d] lg:mx-0 lg:max-w-none lg:[transform:rotateY(-9deg)_rotateX(4deg)]">
        <motion.div
          initial={{ opacity: 0, y: 18, rotateX: 4, rotateY: -7 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, rotateY: 0 }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative grid grid-cols-3 gap-3 rounded-[20px] border border-line bg-gradient-to-br from-panel-soft to-ink-2 p-[22px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          {slots.map((product, i) => (
            <Pocket key={product?.id ?? i} product={product} index={i} />
          ))}

          <div
            className="absolute -bottom-6 -left-6 hidden h-[104px] w-[104px] rotate-[-14deg] items-center justify-center rounded-full border-[1.5px] border-dashed border-cobalt/55 bg-ink text-center font-mono text-[9.5px] uppercase leading-[1.4] tracking-[0.04em] text-cobalt-soft shadow-[0_12px_30px_rgba(0,0,0,0.5)] lg:flex"
            aria-hidden
          >
            Hand
            <br />
            Checked
            <br />
            Stock
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function Pocket({
  product,
  index,
}: {
  product?: HttpTypes.StoreProduct
  index: number
}) {
  const tagLeft = product?.collection?.title?.toUpperCase() ?? "MOWY"
  const tagRight = String(index + 1).padStart(2, "0")

  const content = (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={pocketVariants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative aspect-[3/4.1] cursor-pointer overflow-hidden rounded-lg border bg-panel"
    >
      <div className="absolute inset-0">
        {product?.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title ?? "Featured card"}
            fill
            sizes="(max-width: 1024px) 30vw, 150px"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: FALLBACK_ART[index % FALLBACK_ART.length] }}
          />
        )}
      </div>

      <motion.div
        variants={sheenVariants}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 [mix-blend-mode:screen]"
        style={{ background: SHEEN_GRADIENT }}
      />

      {RARITY_DOT_SLOTS.has(index) && (
        <span
          className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full bg-cobalt-soft"
          style={{ boxShadow: "0 0 8px #6e93ff" }}
          aria-hidden
        />
      )}

      <div className="absolute inset-x-[7px] bottom-[7px] flex justify-between font-mono text-[9.5px] text-chrome/75">
        <span>{tagLeft}</span>
        <span>{tagRight}</span>
      </div>
    </motion.div>
  )

  if (!product?.handle) {
    return content
  }

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="block">
      {content}
    </LocalizedClientLink>
  )
}
