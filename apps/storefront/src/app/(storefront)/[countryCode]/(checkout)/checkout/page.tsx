import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 content-container gap-x-10 gap-y-8 py-12 small:grid-cols-[1fr_416px]">
      <div className="rounded-large border border-line bg-ink-2">
        <div className="border-b border-dashed border-line px-6 py-5 small:px-10">
          <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-chrome-dim">
            MOWY &middot; Checkout
          </span>
          <h1 className="mt-1 font-headline text-h2 text-chrome">
            Checkout
          </h1>
        </div>
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
      </div>
      <div className="relative">
        <div className="sticky top-12">
          <CheckoutSummary cart={cart} />
        </div>
      </div>
    </div>
  )
}
