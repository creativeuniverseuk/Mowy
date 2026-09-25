"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-6 py-5 small:px-10">
        <Heading
          level="h2"
          className="flex flex-row items-baseline gap-x-2 font-headline text-h3 text-chrome"
        >
          Shipping Address
          {!isOpen && <CheckCircleSolid className="text-cobalt-soft" />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="font-mono text-mono-sku uppercase tracking-[0.08em] text-cobalt-soft hover:text-chrome"
              data-testid="edit-address-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <div className="px-6 pb-8 small:px-10">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="gap-x-4 pb-6 pt-8 font-headline text-h4 text-chrome"
                >
                  Billing address
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}
            <SubmitButton
              className="mt-6 w-full rounded-base bg-cobalt-deep py-3 text-body-sm font-medium uppercase tracking-[0.08em] text-chrome transition-colors hover:bg-cobalt-deep/90"
              data-testid="submit-address-button"
            >
              Continue to delivery
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div className="px-6 pb-8 small:px-10">
          <div className="text-body-sm">
            {cart && cart.shipping_address ? (
              <div className="flex flex-col gap-y-6 small:flex-row small:items-start small:gap-x-8 small:gap-y-0">
                <div className="flex flex-col gap-y-6 small:flex-row small:items-start small:gap-x-1 w-full">
                  <div
                    className="flex min-w-0 flex-col small:w-1/3"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="mb-1 font-medium text-chrome">
                      Shipping Address
                    </Text>
                    <Text className="break-words text-chrome-dim">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="break-words text-chrome-dim">
                      {cart.shipping_address.address_1}{" "}
                      {cart.shipping_address.address_2}
                    </Text>
                    <Text className="break-words text-chrome-dim">
                      {cart.shipping_address.postal_code},{" "}
                      {cart.shipping_address.city}
                    </Text>
                    <Text className="text-chrome-dim">
                      {cart.shipping_address.country_code?.toUpperCase()}
                    </Text>
                  </div>

                  <div
                    className="flex min-w-0 flex-col small:w-1/3"
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="mb-1 font-medium text-chrome">
                      Contact
                    </Text>
                    <Text className="break-words text-chrome-dim">
                      {cart.shipping_address.phone}
                    </Text>
                    <Text className="break-words text-chrome-dim">
                      {cart.email}
                    </Text>
                  </div>

                  <div
                    className="flex min-w-0 flex-col small:w-1/3"
                    data-testid="billing-address-summary"
                  >
                    <Text className="mb-1 font-medium text-chrome">
                      Billing Address
                    </Text>

                    {sameAsBilling ? (
                      <Text className="text-chrome-dim">
                        Billing and delivery address are the same.
                      </Text>
                    ) : (
                      <>
                        <Text className="break-words text-chrome-dim">
                          {cart.billing_address?.first_name}{" "}
                          {cart.billing_address?.last_name}
                        </Text>
                        <Text className="break-words text-chrome-dim">
                          {cart.billing_address?.address_1}{" "}
                          {cart.billing_address?.address_2}
                        </Text>
                        <Text className="break-words text-chrome-dim">
                          {cart.billing_address?.postal_code},{" "}
                          {cart.billing_address?.city}
                        </Text>
                        <Text className="text-chrome-dim">
                          {cart.billing_address?.country_code?.toUpperCase()}
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider />
    </div>
  )
}

export default Addresses
