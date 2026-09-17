import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="bg-ink py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 small:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-y-6">
              {!customer && <SignInPrompt />}

              <div className="rounded-large border border-line bg-ink-2">
                <div className="border-b border-dashed border-line px-6 py-5">
                  <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-chrome-dim">
                    MOWY &middot; Trading Cards
                  </span>
                  <h1 className="mt-1 font-headline text-h2 text-chrome">
                    Your bag
                  </h1>
                </div>
                <div className="px-6">
                  <ItemsTemplate cart={cart} />
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="sticky top-12 flex flex-col gap-y-8">
                {cart && cart.region && <Summary cart={cart as any} />}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
