import { getLineItemTotals } from "@lib/util/line-item-totals"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const { total, originalTotal: original_total, hasReducedPrice } =
    getLineItemTotals(item)

  // Only rendered when hasReducedPrice, which guarantees original_total > 0.
  const percentage_diff = hasReducedPrice
    ? Math.round(((original_total - total) / original_total) * 100)
    : 0

  return (
    <div className="flex flex-col text-chrome-dim justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-chrome-dim">Original: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: original_total / item.quantity,
                currency_code: currencyCode,
              })}
            </span>
          </p>
          {style === "default" && (
            <span className="text-cobalt-soft">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("font-mono text-mono-sku text-chrome-dim", {
          "text-cobalt-soft": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: total / item.quantity,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
