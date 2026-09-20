import { convertToLocale } from "@lib/util/money"
import { paymentInfoMap } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import { cookies as nextCookies } from "next/headers"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

const perforation = {
  backgroundImage:
    "radial-gradient(circle at 10px 0, transparent 10px, #14141c 11px)",
  backgroundSize: "20px 10px",
  backgroundRepeat: "repeat-x",
} as const

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  const payment = order.payment_collections?.[0]?.payments?.[0]
  const shippingMethod = (order as any).shipping_methods?.[0]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-ink py-12">
      <div className="content-container flex flex-col items-center gap-y-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        <div className="w-full max-w-[480px] text-center">
          <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-cobalt-soft">
            Order confirmed
          </span>
          <h1 className="mt-2 font-headline text-h1 text-chrome">
            Thank you!
          </h1>
          <p className="mt-2 text-body text-chrome-dim">
            We&apos;ve sent a confirmation to{" "}
            <span className="text-chrome">{order.email}</span>.
          </p>
        </div>

        <div
          className="w-full max-w-[480px] overflow-hidden rounded-large bg-chrome text-ink shadow-2xl"
          data-testid="order-complete-container"
        >
          <div aria-hidden className="h-2.5 w-full" style={perforation} />

          <div className="px-7 py-6">
            <div className="flex items-baseline justify-between">
              <span className="font-headline text-h4">MOWY</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/60">
                Play &middot; Protect &middot; Collect
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-ink/60">
              Abingdon Street Market, Edward St, Blackpool FY1 1DR
            </p>

            <div className="my-5 border-t border-dashed border-ink/20" />

            <div className="flex items-center justify-between font-mono text-mono-sku">
              <span className="text-ink/60">Order no.</span>
              <span data-testid="order-id">{order.display_id}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-mono-sku">
              <span className="text-ink/60">Date</span>
              <span data-testid="order-date">
                {new Date(order.created_at).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="my-5 border-t border-dashed border-ink/20" />

            <div className="flex flex-col">
              {order.items
                ?.sort((a, b) =>
                  (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                )
                .map((item) => {
                  const variantTitle =
                    item.variant?.title &&
                    item.variant.title !== "Default Variant"
                      ? item.variant.title
                      : null

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 border-b border-dashed border-ink/15 py-3 last:border-b-0"
                      data-testid="product-row"
                    >
                      <div className="w-12 shrink-0">
                        <Thumbnail thumbnail={item.thumbnail} size="square" />
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="line-clamp-2 text-body-sm font-medium"
                            data-testid="product-name"
                          >
                            {item.product_title}
                          </p>
                          {variantTitle && (
                            <p className="font-mono text-[11px] text-ink/60">
                              {variantTitle}
                            </p>
                          )}
                          <p className="font-mono text-[11px] text-ink/60">
                            <span data-testid="product-quantity">
                              {item.quantity}
                            </span>{" "}
                            &times;{" "}
                            {convertToLocale({
                              amount: item.total / item.quantity,
                              currency_code: order.currency_code,
                            })}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-mono-sku">
                          {convertToLocale({
                            amount: item.total,
                            currency_code: order.currency_code,
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="my-5 border-t border-dashed border-ink/20" />

            <div className="flex flex-col gap-y-1.5 font-mono text-mono-sku text-ink/70">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span data-testid="order-subtotal">
                  {convertToLocale({
                    amount: order.item_subtotal ?? 0,
                    currency_code: order.currency_code,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping{shippingMethod ? ` (${shippingMethod.name})` : ""}</span>
                <span>
                  {convertToLocale({
                    amount: order.shipping_subtotal ?? 0,
                    currency_code: order.currency_code,
                  })}
                </span>
              </div>
              {!!order.discount_total && (
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>
                    -{" "}
                    {convertToLocale({
                      amount: order.discount_total,
                      currency_code: order.currency_code,
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Taxes</span>
                <span data-testid="order-tax">
                  {convertToLocale({
                    amount: order.tax_total ?? 0,
                    currency_code: order.currency_code,
                  })}
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-dashed border-ink/20" />

            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold uppercase tracking-[0.06em]">
                Total
              </span>
              <span
                className="font-mono text-mono-price"
                data-testid="order-total"
              >
                {convertToLocale({
                  amount: order.total ?? 0,
                  currency_code: order.currency_code,
                })}
              </span>
            </div>

            {payment && (
              <p className="mt-2 font-mono text-[11px] text-ink/60">
                Paid via{" "}
                {paymentInfoMap[payment.provider_id]?.title ??
                  payment.provider_id}{" "}
                &middot;{" "}
                {new Date(payment.created_at ?? "").toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}

            {order.shipping_address && (
              <>
                <div className="my-5 border-t border-dashed border-ink/20" />
                <div className="font-mono text-[11px] text-ink/70">
                  <p className="mb-1 uppercase tracking-[0.1em] text-ink/50">
                    Shipping to
                  </p>
                  <p>
                    {order.shipping_address.first_name}{" "}
                    {order.shipping_address.last_name}
                  </p>
                  <p>
                    {order.shipping_address.address_1}
                    {order.shipping_address.address_2
                      ? `, ${order.shipping_address.address_2}`
                      : ""}
                  </p>
                  <p>
                    {order.shipping_address.city},{" "}
                    {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country_code?.toUpperCase()}</p>
                </div>
              </>
            )}
          </div>

          <div aria-hidden className="h-2.5 w-full rotate-180" style={perforation} />
        </div>

        <div className="w-full max-w-[480px] text-center">
          <p className="font-mono text-mono-sku text-chrome-dim">
            Need help with this order?
          </p>
          <div className="mt-2 flex items-center justify-center gap-x-6 font-mono text-mono-sku uppercase tracking-[0.06em] text-cobalt-soft">
            <LocalizedClientLink href="/account/orders" className="hover:text-chrome">
              Track order
            </LocalizedClientLink>
            <a href="mailto:Snorlaxandmowytcg@gmail.com" className="hover:text-chrome">
              Contact us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
