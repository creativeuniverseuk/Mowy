import { completeCart, retrieveCart } from "@lib/data/cart"
import { getCartId } from "@lib/data/cookies"
import { hasMysteryPullProduct } from "@lib/data/mystery-pulls"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * SumUp Hosted Checkout redirects the customer's browser here after they
 * pay (or abandon/fail) on SumUp's page — this path matches the per-session
 * `redirect_url` set in modules/checkout/components/payment (falling back
 * to `redirectUrl` in the backend's SumUp provider config for any session
 * that didn't override it). The redirect itself proves nothing about
 * payment status — query params are trivially spoofable — so the actual
 * paid/not-paid decision always comes from Medusa re-checking the live
 * SumUp checkout status server-side (completeCart), never from anything on
 * this URL.
 *
 * The one thing we DO read off the URL is `cart_id`, as a fallback for
 * identifying *which* cart to check: `_medusa_cart_id` is SameSite=Lax,
 * Path=/, non-Secure in dev, which should survive this cross-site
 * top-level redirect — and empirically does in some environments — but was
 * confirmed (via direct testing) to be dropped by the browser on this
 * specific cross-site round trip in others, breaking the flow with no way
 * to identify the cart at all. Trusting a cart id from the URL to look up
 * a cart carries the same access model already used elsewhere in this app
 * for order ids (see the mystery-pull result route's doc comment) — it's
 * an unguessable ULID, not a capability, and the only thing it's used for
 * here is asking Medusa to check *that cart's own* real payment status.
 */
export async function GET(request: NextRequest) {
  const cookieCartId = await getCartId()
  const cartIdFromQuery = request.nextUrl.searchParams.get("cart_id") ?? undefined

  // Cookie stays primary; the query param is only consulted if the cookie
  // didn't make it back (confirmed via live testing: some browsers drop
  // _medusa_cart_id on the cross-site round trip to/from SumUp even with
  // SameSite=Lax).
  const cart = await retrieveCart(cookieCartId || cartIdFromQuery)

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

      // A mystery-pull order gets the pull-reveal overlay instead of the
      // standard confirmation page. Only checks the pull_pool *link*, not
      // whether the outcome is assigned yet — assignment runs
      // asynchronously on payment.captured, so the reveal page's own
      // polling (PullRevealOverlay) is what waits for that, backed by
      // apps/backend's src/jobs/reconcile-mystery-pull-assignments.ts if
      // that event never fires.
      const productIds = (result.order.items ?? [])
        .map((item) => item.product_id)
        .filter((id): id is string => Boolean(id))
      const isMysteryPull = await hasMysteryPullProduct(productIds)

      if (isMysteryPull) {
        return NextResponse.redirect(
          new URL(
            `/${countryCode}/mystery-pulls/reveal/${result.order.id}`,
            request.url
          )
        )
      }

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
