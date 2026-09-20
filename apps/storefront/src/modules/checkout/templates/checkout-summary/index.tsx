import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div className="flex flex-col-reverse gap-y-8 py-8 small:flex-col small:py-0">
      <div className="w-full rounded-large border border-line bg-ink-2 flex flex-col">
        <div className="border-b border-dashed border-line px-6 py-5">
          <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-chrome-dim">
            MOWY &middot; Receipt
          </span>
          <Heading
            level="h2"
            className="mt-1 flex flex-row items-baseline font-headline text-h3 text-chrome"
          >
            In your Cart
          </Heading>
        </div>
        <div className="px-6 py-5">
          <CartTotals totals={cart} />
        </div>
        <Divider />
        <div className="px-6 py-5">
          <ItemsPreviewTemplate cart={cart} />
        </div>
        <Divider />
        <div className="px-6 py-5">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
