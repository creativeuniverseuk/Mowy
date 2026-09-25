import { HttpTypes } from "@medusajs/types"

/**
 * A line item's current and pre-discount totals, with real fallbacks for
 * the fields Medusa's types leave optional.
 *
 * On `StoreCartLineItem`, `total` and `original_total` are optional — they're
 * only present when the cart was fetched with its totals — while
 * `unit_price` and `quantity` always are. So a missing `total` falls back to
 * `unit_price × quantity`, and a missing `original_total` falls back to the
 * current total, which means "no discount to show" rather than inventing
 * one. (`StoreOrderLineItem` always has both totals; the fallbacks never
 * apply there.)
 */
export function getLineItemTotals(
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
) {
  const total = item.total ?? item.unit_price * item.quantity
  const originalTotal = item.original_total ?? total

  return {
    total,
    originalTotal,
    hasReducedPrice: total < originalTotal,
  }
}
