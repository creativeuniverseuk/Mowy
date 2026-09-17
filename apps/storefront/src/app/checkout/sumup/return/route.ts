import { completeCart, retrieveCart } from "@lib/data/cart"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * SumUp Hosted Checkout redirects the customer's browser here after they
 * pay (or abandon/fail) on SumUp's page — this path matches `redirectUrl`
 * in the backend's SumUp provider config (medusa-config.ts). The redirect
 * itself proves nothing: query params on a redirect are trivially spoofable
 * by the customer. So we ignore them and ask Medusa to complete the cart,
 * which re-checks the live SumUp checkout status server-side before an
 * order is created. Only that backend-confirmed result decides where the
 * customer ends up next.
 */
export async function GET(request: NextRequest) {
  const cart = await retrieveCart()

  const fallbackCountryCode =
    cart?.shipping_address?.country_code?.toLowerCase() ||
    cart?.region?.countries?.[0]?.iso_2?.toLowerCase() ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    "gb"

  if (!cart) {
    return NextResponse.redirect(new URL(`/${fallbackCountryCode}/cart`, request.url))
  }

  try {
    const result = await completeCart(cart.id)

    if (result?.type === "order") {
      const countryCode =
        result.order.shipping_address?.country_code?.toLowerCase() ||
        fallbackCountryCode

      return NextResponse.redirect(
        new URL(`/${countryCode}/order/${result.order.id}/confirmed`, request.url)
      )
    }

    // Backend re-checked SumUp and the checkout isn't paid (declined,
    // abandoned, still pending, etc). Send the customer back to retry —
    // the cart is left intact.
    return NextResponse.redirect(
      new URL(
        `/${fallbackCountryCode}/checkout?step=payment&payment_error=1`,
        request.url
      )
    )
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/${fallbackCountryCode}/checkout?step=payment&payment_error=1`,
        request.url
      )
    )
  }
}
