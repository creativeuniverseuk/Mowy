"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const { currency_code, item_subtotal, discount_total, total } = cart

  return (
    <div
      className="rounded-large border border-line bg-ink-2 p-6"
      data-testid="cart-summary"
    >
      <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-chrome-dim">
        MOWY &middot; Receipt
      </span>
      <h2 className="mt-1 font-headline text-h3 text-chrome">Summary</h2>

      <div className="my-5 border-t border-dashed border-line" />

      <div className="flex flex-col gap-y-2 font-mono text-mono-sku text-chrome-dim">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!discount_total && (
          <div className="flex items-center justify-between text-cobalt-soft">
            <span>Discount</span>
            <span data-testid="cart-discount" data-value={discount_total || 0}>
              -{" "}
              {convertToLocale({ amount: discount_total ?? 0, currency_code })}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Taxes</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      <div className="my-5 border-t border-dashed border-line" />

      <div className="flex items-center justify-between">
        <span className="text-body-sm font-medium uppercase tracking-[0.08em] text-chrome">
          Total
        </span>
        <span
          className="font-mono text-mono-price text-cobalt-soft"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>

      <div className="mt-6">
        <DiscountCode cart={cart} />
      </div>

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <button className="mt-6 w-full rounded-base bg-cobalt-deep py-3 text-body-sm font-medium uppercase tracking-[0.08em] text-chrome transition-colors hover:bg-cobalt-deep/90">
          Go to checkout
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
