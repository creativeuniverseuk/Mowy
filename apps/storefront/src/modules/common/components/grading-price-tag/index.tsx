/**
 * A price tag styled like a trading-card grading slab's label strip —
 * bordered, monospace, with a small "authenticated" caption above the
 * price (see CLAUDE.md: JetBrains Mono is the price-tag/SKU typeface).
 */
export default function GradingPriceTag({
  price,
  originalPrice,
  className,
}: {
  price: string
  originalPrice?: string
  className?: string
}) {
  return (
    <div
      className={`inline-flex flex-col items-start gap-0.5 rounded-md border border-line border-t-2 border-t-cobalt bg-ink-2 px-2.5 py-1.5 ${className ?? ""}`}
    >
      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-chrome-dim">
        MOWY &middot; Checked
      </span>
      <span className="flex items-baseline gap-1.5">
        {originalPrice && (
          <span className="font-mono text-xs text-chrome-dim line-through">
            {originalPrice}
          </span>
        )}
        <span className="text-mono-price text-cobalt-soft">{price}</span>
      </span>
    </div>
  )
}
