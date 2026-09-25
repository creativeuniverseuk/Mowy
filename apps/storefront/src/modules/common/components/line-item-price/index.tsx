import { getPercentageDiff } from "@lib/util/get-percentage-diff"
import { getLineItemTotals } from "@lib/util/line-item-totals"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemPriceProps) => {
  const {
    total: currentPrice,
    originalTotal: originalPrice,
    hasReducedPrice,
  } = getLineItemTotals(item)

  return (
    <div className="flex flex-col gap-x-2 text-chrome-dim items-end">
      <div className="text-left">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-chrome-dim">Original: </span>
              )}
              <span
                className="line-through text-chrome-dim"
                data-testid="product-original-price"
              >
                {convertToLocale({
                  amount: originalPrice,
                  currency_code: currencyCode,
                })}
              </span>
            </p>
            {style === "default" && (
              <span className="text-cobalt-soft">
                -{getPercentageDiff(originalPrice, currentPrice)}%
              </span>
            )}
          </>
        )}
        <span
          className={clx("font-mono text-mono-sku text-chrome", {
            "text-cobalt-soft": hasReducedPrice,
          })}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice
